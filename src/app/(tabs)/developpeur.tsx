import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import {
  adminFetchUsers, adminUpdateUser, adminFetchClubs, adminCreateClub, adminUpdateClub, adminUploadClubLogo, createNotification,
  adminFetchPBs, adminUpsertPB, adminUpdatePB, adminDeletePB,
  API_BASE_URL,
  type ApiProfile, type ApiClub, type ApiPB,
} from '@/lib/api';

type TabName = 'users' | 'clubs' | 'notif' | 'test';

const TABS: { key: TabName; icon: string; label: string }[] = [
  { key: 'users', icon: 'people-outline', label: 'Utilisateurs' },
  { key: 'clubs', icon: 'business-outline', label: 'Clubs' },
  { key: 'notif', icon: 'megaphone-outline', label: 'Notification' },
  { key: 'test', icon: 'flask-outline', label: 'Test' },
];

const STORAGE_KEY_SCANNED_COMPS = 'bancalais_scanned_comps';
const COMP_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in ms

type ScannedCompetition = {
  id: number;
  addedAt: number; // timestamp
};

function TabBar({ active, onSelect }: { active: TabName; onSelect: (t: TabName) => void }) {
  const theme = useTheme();
  const indicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === active);
    Animated.spring(indicator, {
      toValue: idx,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [active, indicator]);

  return (
    <View style={tabStyles.outer}>
      <View style={[tabStyles.inner, { backgroundColor: theme.background }]}>
        {TABS.map((tab, i) => {
          const isActive = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              style={tabStyles.tab}
            >
              <Animated.View style={[tabStyles.tabContent, isActive && { opacity: 1 }]}>
                <Ionicons
                  name={(isActive ? tab.icon.replace('-outline', '') : tab.icon) as any}
                  size={14}
                  color={isActive ? Accent : theme.textSecondary}
                />
                <ThemedText style={[tabStyles.tabLabel, { color: isActive ? Accent : theme.textSecondary }]}>
                  {tab.label}
                </ThemedText>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  outer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  inner: {
    flexDirection: 'row',
    borderRadius: Radii.xl,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.lg,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default function DeveloppeurScreen() {
  const theme = useTheme();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<TabName>('users');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<ApiProfile[]>([]);
  const [clubs, setClubs] = useState<ApiClub[]>([]);
  const [editUser, setEditUser] = useState<ApiProfile | null>(null);
  const [editUserData, setEditUserData] = useState<Record<string, string | number | boolean | null>>({});
  const [editClub, setEditClub] = useState<ApiClub | null>(null);
  const [editClubData, setEditClubData] = useState<Record<string, string | boolean>>({});
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [createClubData, setCreateClubData] = useState({ name: '', city: '', referral_code: '' });
  const [sysNotifTitle, setSysNotifTitle] = useState('');
  const [sysNotifBody, setSysNotifBody] = useState('');
  const [sendingSysNotif, setSendingSysNotif] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [clubSearch, setClubSearch] = useState('');
  const [userPBs, setUserPBs] = useState<ApiPB[]>([]);
  const [newPBNage, setNewPBNage] = useState('');
  const [newPBType, setNewPBType] = useState<'crawl' | 'dos' | 'brass' | 'pap'>('crawl');
  const [newPBTemps, setNewPBTemps] = useState('');
  const [editingPBId, setEditingPBId] = useState<number | null>(null);
  const [editPBData, setEditPBData] = useState<{ nage: string; type_nage: 'crawl' | 'dos' | 'brass' | 'pap'; temps: string }>({ nage: '', type_nage: 'crawl', temps: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ─── Test tab state ─────────────────────────────────────────────
  const [reveilTime, setReveilTime] = useState('07:30');
  const [scanCompId, setScanCompId] = useState('');
  const [scannedComps, setScannedComps] = useState<ScannedCompetition[]>([]);
  const [timeLeft, setTimeLeft] = useState<Record<number, string>>({});

  // Load scanned competitions from storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_SCANNED_COMPS);
        if (raw) {
          const all: ScannedCompetition[] = JSON.parse(raw);
          const now = Date.now();
          // Filter out expired ones
          const valid = all.filter(c => now - c.addedAt < COMP_EXPIRY_MS);
          if (valid.length !== all.length) {
            await AsyncStorage.setItem(STORAGE_KEY_SCANNED_COMPS, JSON.stringify(valid));
          }
          setScannedComps(valid);
        }
      } catch {}
    })();
  }, []);

  // Update countdown every 30s
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const map: Record<number, string> = {};
      for (const c of scannedComps) {
        const remaining = COMP_EXPIRY_MS - (now - c.addedAt);
        if (remaining <= 0) {
          map[c.id] = 'Expirée';
        } else {
          const days = Math.floor(remaining / 86400000);
          const hrs = Math.floor((remaining % 86400000) / 3600000);
          map[c.id] = `${days}j ${hrs}h`;
        }
      }
      setTimeLeft(map);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [scannedComps]);

  const handleAddScannedComp = async () => {
    const id = parseInt(scanCompId.trim(), 10);
    if (isNaN(id)) { Alert.alert('Erreur', 'ID de compétition invalide'); return; }
    if (scannedComps.some(c => c.id === id)) { Alert.alert('Info', 'Compétition déjà scannée'); return; }
    const newComp: ScannedCompetition = { id, addedAt: Date.now() };
    const updated = [...scannedComps, newComp];
    setScannedComps(updated);
    setScanCompId('');
    try { await AsyncStorage.setItem(STORAGE_KEY_SCANNED_COMPS, JSON.stringify(updated)); } catch {}
  };

  const handleRemoveScannedComp = async (id: number) => {
    const updated = scannedComps.filter(c => c.id !== id);
    setScannedComps(updated);
    try { await AsyncStorage.setItem(STORAGE_KEY_SCANNED_COMPS, JSON.stringify(updated)); } catch {}
  };

  const handleReveilConfirm = async () => {
    Alert.alert(
      'Confirmation réveil',
      `Un réveil sera programmé à ${reveilTime}.\nVoulez-vous continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const { error } = await createNotification({
              type: 'reminder',
              title: '⏰ Réveil compétition',
              body: `C'est l'heure de se préparer ! Réveil programmé à ${reveilTime}.`,
              target_role: null,
            });
            if (error) {
              Alert.alert('Erreur', error);
            } else {
              Alert.alert('✅ Réveil programmé', `Notification de réveil à ${reveilTime}.`);
            }
          },
        },
      ],
    );
  };

  const filteredUsers = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase()),
  );
  const filteredClubs = clubs.filter(c =>
    `${c.name} ${c.city} ${c.referral_code}`.toLowerCase().includes(clubSearch.toLowerCase()),
  );

  const loadPBs = useCallback(async (userId: number) => {
    const res = await adminFetchPBs(userId);
    if (res.data?.pbs) setUserPBs(res.data.pbs);
  }, []);

  const handleAddPB = async () => {
    if (!editUser || !newPBNage.trim() || !newPBTemps.trim()) return;
    const { error } = await adminUpsertPB(editUser.id, {
      nage: newPBNage.trim(), type_nage: newPBType, temps: newPBTemps.trim(),
    });
    if (error) { Alert.alert('Erreur', error); return; }
    setNewPBNage(''); setNewPBTemps('');
    loadPBs(editUser.id);
  };

  const handleDeletePB = async (pbId: number) => {
    await adminDeletePB(pbId);
    if (editUser) loadPBs(editUser.id);
    if (editingPBId === pbId) setEditingPBId(null);
  };

  const startEditPB = (pb: ApiPB) => {
    if (editingPBId === pb.id) { setEditingPBId(null); return; }
    setEditingPBId(pb.id);
    setEditPBData({ nage: pb.nage, type_nage: pb.type_nage, temps: pb.temps });
  };

  const handleSaveEditPB = async () => {
    if (!editingPBId || !editUser) return;
    const { error } = await adminUpdatePB(editingPBId, editPBData);
    if (error) { Alert.alert('Erreur', error); return; }
    setEditingPBId(null);
    loadPBs(editUser.id);
  };

  const handleSendSystemNotification = async () => {
    if (!sysNotifTitle.trim() || !sysNotifBody.trim()) {
      Alert.alert('Erreur', 'Titre et message requis');
      return;
    }
    setSendingSysNotif(true);
    const { error } = await createNotification({
      type: 'system', title: sysNotifTitle.trim(), body: sysNotifBody.trim(),
    });
    setSendingSysNotif(false);
    if (error) { Alert.alert('Erreur', error); return; }
    Alert.alert('Envoyé', 'Notification système publiée.');
    setSysNotifTitle(''); setSysNotifBody('');
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [uRes, cRes] = await Promise.all([adminFetchUsers(), adminFetchClubs()]);
    if (uRes.error) {
      Alert.alert('Erreur', `Utilisateurs : ${uRes.error}`);
    } else if (uRes.data?.users) {
      setUsers(uRes.data.users);
    }
    if (cRes.error) {
      Alert.alert('Erreur', `Clubs : ${cRes.error}`);
    } else if (cRes.data?.clubs) {
      setClubs(cRes.data.clubs);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openEditUser = (u: ApiProfile) => {
    setEditUser(u);
    setEditUserData({
      prenom: u.prenom, nom: u.nom, email: u.email,
      role: u.role, club_id: u.club_id ?? '', avatar: u.avatar ?? '',
    });
    loadPBs(u.id);
  };

  const saveUser = async () => {
    if (!editUser) return;
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(editUserData)) {
      const orig = (editUser as any)[k];
      if (k === 'club_id') {
        const newVal = v === '' ? null : Number(v);
        if (newVal !== orig) payload[k] = newVal;
      } else if (k === 'avatar') {
        const newVal = String(v || '');
        if (newVal !== String(orig || '')) payload[k] = newVal;
      } else if (v !== orig) {
        payload[k] = v;
      }
    }
    if (Object.keys(payload).length === 0) { setEditUser(null); return; }
    const { error } = await adminUpdateUser(editUser.id, payload);
    if (error) { Alert.alert('Erreur', error); return; }
    setEditUser(null);
    fetchAll();
  };

  const openEditClub = (c: ApiClub) => {
    setEditClub(c);
    setEditClubData({ name: c.name, city: c.city, referral_code: c.referral_code, referral_active: c.referral_active });
  };

  const saveClub = async () => {
    if (!editClub) return;
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(editClubData)) {
      if (v !== (editClub as any)[k]) payload[k] = v;
    }
    if (Object.keys(payload).length === 0) { setEditClub(null); return; }
    const { error } = await adminUpdateClub(editClub.id, payload);
    if (error) { Alert.alert('Erreur', error); return; }
    setEditClub(null);
    fetchAll();
  };

  const toggleReferralActive = () => {
    setEditClubData(d => ({ ...d, referral_active: !d.referral_active }));
  };

  const handleCreateClub = async () => {
    if (!createClubData.name || !createClubData.city || !createClubData.referral_code) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }
    const { error } = await adminCreateClub(createClubData);
    if (error) { Alert.alert('Erreur', error); return; }
    setShowCreateClub(false);
    setCreateClubData({ name: '', city: '', referral_code: '' });
    fetchAll();
  };

  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]?.uri || !editClub) return;
    setUploadingLogo(true);
    const { error } = await adminUploadClubLogo(editClub.id, result.assets[0].uri);
    setUploadingLogo(false);
    if (error) { Alert.alert('Erreur', error); return; }
    fetchAll();
  };

  const logoUrl = (club: ApiClub) => club.logo_url ? `${API_BASE_URL}${club.logo_url}` : null;

  const pbColors: Record<string, string> = { crawl: '#2563EB', dos: '#059669', brass: '#D97706', pap: '#DB2777' };

  const fieldLabels: Record<string, string> = {
    prenom: 'Prénom', nom: 'Nom', email: 'Email', role: 'Rôle',
    avatar: 'Avatar (URL)', club_id: 'Club',
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'coach': return 'Entraîneur';
      default: return 'Nageur';
    }
  };

  const clubName = (id: number | null) => {
    if (id == null) return 'Aucun club';
    return clubs.find(c => c.id === id)?.name ?? `Club #${id}`;
  };

  if (!isAdmin) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerTitle}>Administration</ThemedText>
            <ThemedText style={styles.headerSub}>API : {API_BASE_URL}</ThemedText>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={32} color={theme.textSecondary} />
          <ThemedText style={styles.emptyText}>Accès réservé aux administrateurs</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerTitle}>Administration</ThemedText>
          <ThemedText style={styles.headerSub}>API : {API_BASE_URL}</ThemedText>
        </View>
        <Pressable onPress={fetchAll} style={styles.refreshBtn}>
          {loading ? (
            <ActivityIndicator size="small" color={Accent} />
          ) : (
            <Ionicons name="refresh" size={18} color={Accent} />
          )}
        </Pressable>
      </View>

      <TabBar active={activeTab} onSelect={setActiveTab} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---- TAB USERS ---- */}
        {activeTab === 'users' && (
          <DoubleBezelCard accent style={Shadows.medium as any}>
            <View style={styles.sectionHead}>
              <Ionicons name="people-outline" size={15} color={Accent} />
              <ThemedText style={styles.sectionTitle}>
                Tous les utilisateurs
              </ThemedText>
              <View style={styles.sectionCount}>
                <ThemedText style={styles.countText}>{users.length}</ThemedText>
              </View>
            </View>

            <TextInput
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Rechercher par nom, prénom ou email…"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
            />

            <View style={styles.listGap}>
              {filteredUsers.map(u => (
                <Pressable
                  key={u.id}
                  onPress={() => openEditUser(u)}
                  style={({ pressed }) => [
                    styles.listItem,
                    { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={styles.avatarMini}>
                    <Ionicons
                      name={u.role === 'admin' ? 'settings' : u.role === 'coach' ? 'shield-checkmark' : 'person'}
                      size={13}
                      color={u.role === 'admin' ? '#F59E0B' : u.role === 'coach' ? Accent : theme.textSecondary}
                    />
                  </View>
                  <View style={styles.listItemBody}>
                    <View style={styles.listItemTop}>
                      <ThemedText style={styles.listItemName}>{u.prenom} {u.nom}</ThemedText>
                      <View style={[styles.roleBadge, {
                        backgroundColor: u.role === 'admin' ? '#F59E0B20' : u.role === 'coach' ? Accent + '15' : theme.hairline + '40',
                      }]}>
                        <ThemedText style={[styles.roleText, {
                          color: u.role === 'admin' ? '#F59E0B' : u.role === 'coach' ? Accent : theme.textSecondary,
                        }]}>
                          {roleLabel(u.role)}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.listItemSub}>{u.email} · ID {u.id}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                </Pressable>
              ))}
              {filteredUsers.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
                  <ThemedText style={styles.emptyText}>Aucun utilisateur trouvé</ThemedText>
                </View>
              )}
            </View>
          </DoubleBezelCard>
        )}

        {/* ---- TAB CLUBS ---- */}
        {activeTab === 'clubs' && (
          <DoubleBezelCard accent style={Shadows.medium as any}>
            <View style={styles.sectionHead}>
              <Ionicons name="business-outline" size={15} color={Accent} />
              <ThemedText style={styles.sectionTitle}>
                Tous les clubs
              </ThemedText>
              <View style={styles.sectionCount}>
                <ThemedText style={styles.countText}>{clubs.length}</ThemedText>
              </View>
            </View>

            <TextInput
              value={clubSearch}
              onChangeText={setClubSearch}
              placeholder="Rechercher par nom, ville ou code…"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
            />

            <View style={styles.listGap}>
              {filteredClubs.map(c => (
                <Pressable
                  key={c.id}
                  onPress={() => openEditClub(c)}
                  style={({ pressed }) => [
                    styles.listItem,
                    { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  {logoUrl(c) ? (
                    <Image source={{ uri: logoUrl(c)! }} style={styles.clubAvatar} />
                  ) : (
                    <View style={[styles.avatarMini, { backgroundColor: Accent + '15' }]}>
                      <Ionicons name="water" size={14} color={Accent} />
                    </View>
                  )}
                  <View style={styles.listItemBody}>
                    <View style={styles.listItemTop}>
                      <ThemedText style={styles.listItemName}>{c.name}</ThemedText>
                      <View style={[styles.referralBadge, {
                        backgroundColor: c.referral_active ? '#05966920' : '#DC262620',
                      }]}>
                        <ThemedText style={[styles.referralText, {
                          color: c.referral_active ? '#059669' : '#DC2626',
                        }]}>
                          {c.referral_active ? 'ACTIF' : 'SUSPENDU'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.listItemSub}>{c.city} · {c.referral_code}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                </Pressable>
              ))}
              {filteredClubs.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
                  <ThemedText style={styles.emptyText}>Aucun club trouvé</ThemedText>
                </View>
              )}
            </View>

            <Pressable
              onPress={() => setShowCreateClub(true)}
              style={({ pressed }) => [styles.createBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="add-circle-outline" size={16} color={Accent} />
              <ThemedText style={styles.createBtnText}>Ajouter un club</ThemedText>
            </Pressable>
          </DoubleBezelCard>
        )}

        {/* ---- TAB NOTIFICATION ---- */}
        {activeTab === 'notif' && (
          <DoubleBezelCard accent style={Shadows.medium as any}>
            <View style={styles.sectionHead}>
              <Ionicons name="megaphone-outline" size={15} color={Accent} />
              <ThemedText style={styles.sectionTitle}>
                Notification système
              </ThemedText>
            </View>

            <ThemedText style={styles.notifDesc}>
              Envoyez une notification visible par tous les utilisateurs de l'application.
            </ThemedText>

            <TextInput
              value={sysNotifTitle}
              onChangeText={setSysNotifTitle}
              placeholder="Titre de la notification"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
            />

            <View style={{ height: 8 }} />

            <TextInput
              value={sysNotifBody}
              onChangeText={setSysNotifBody}
              placeholder="Message détaillé…"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, styles.notifInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
            />

            <View style={{ height: 12 }} />

            <Pressable
              onPress={handleSendSystemNotification}
              disabled={sendingSysNotif}
              style={({ pressed }) => [styles.sendBtn, {
                backgroundColor: Accent,
                opacity: sendingSysNotif ? 0.5 : pressed ? 0.9 : 1,
              }]}
            >
              {sendingSysNotif ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={14} color="#fff" />
                  <ThemedText style={styles.sendBtnText}>Publier la notification</ThemedText>
                </>
              )}
            </Pressable>
          </DoubleBezelCard>
        )}

        {/* ---- TAB TEST ---- */}
        {activeTab === 'test' && (
          <>
            {/* ── Réveil ── */}
            <DoubleBezelCard accent style={Shadows.medium as any}>
              <View style={styles.sectionHead}>
                <Ionicons name="alarm-outline" size={15} color={Accent} />
                <ThemedText style={styles.sectionTitle}>
                  ⏰ Réveil
                </ThemedText>
              </View>

              <ThemedText style={styles.notifDesc}>
                Programmez une alarme de réveil basée sur l'heure d'ouverture des portes.
              </ThemedText>

              <View style={styles.reveilRow}>
                <ThemedText style={styles.reveilLabel}>Heure du réveil</ThemedText>
                <TextInput
                  value={reveilTime}
                  onChangeText={setReveilTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.reveilInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                />
              </View>

              <Pressable
                onPress={handleReveilConfirm}
                style={({ pressed }) => [styles.sendBtn, {
                  backgroundColor: Accent,
                  opacity: pressed ? 0.9 : 1,
                  marginTop: Spacing.three,
                }]}
              >
                <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                <ThemedText style={styles.sendBtnText}>Confirmer le réveil</ThemedText>
              </Pressable>
            </DoubleBezelCard>

            {/* ── Notes avancées (coming soon) ── */}
            <DoubleBezelCard accent style={Shadows.medium as any}>
              <View style={styles.sectionHead}>
                <Ionicons name="document-text-outline" size={15} color={Accent} />
                <ThemedText style={styles.sectionTitle}>
                  📝 Notes avancées
                </ThemedText>
              </View>
              <View style={styles.comingSoon}>
                <Ionicons name="construct-outline" size={28} color={theme.textSecondary} />
                <ThemedText style={styles.comingSoonText}>
                  Fonctionnalité à venir…
                </ThemedText>
              </View>
            </DoubleBezelCard>

            {/* ── Scan compétition ── */}
            <DoubleBezelCard accent style={Shadows.medium as any}>
              <View style={styles.sectionHead}>
                <Ionicons name="scan-outline" size={15} color={Accent} />
                <ThemedText style={styles.sectionTitle}>
                  Scan compétition
                </ThemedText>
              </View>

              <ThemedText style={styles.notifDesc}>
                Ajoutez une compétition par son ID LiveFFN. Elle sera disponible pendant 1 semaine.
              </ThemedText>

              <View style={styles.scanRow}>
                <TextInput
                  value={scanCompId}
                  onChangeText={setScanCompId}
                  placeholder="ID compétition"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  style={[styles.scanInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                />
                <Pressable
                  onPress={handleAddScannedComp}
                  style={({ pressed }) => [styles.scanAddBtn, {
                    backgroundColor: Accent,
                    opacity: pressed ? 0.8 : 1,
                  }]}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </Pressable>
              </View>

              {scannedComps.length > 0 && (
                <View style={styles.scanList}>
                  {scannedComps.map(c => (
                    <View key={c.id} style={[styles.scanItem, { backgroundColor: theme.backgroundElement }]}>
                      <View style={styles.scanItemLeft}>
                        <Ionicons name="flag-outline" size={14} color={Accent} />
                        <ThemedText style={styles.scanItemId}>#{c.id}</ThemedText>
                        <ThemedText style={[styles.scanItemExpiry, { color: theme.textSecondary }]}>
                          {timeLeft[c.id] ?? '…'}
                        </ThemedText>
                      </View>
                      <Pressable onPress={() => handleRemoveScannedComp(c.id)} style={styles.scanItemDel}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </DoubleBezelCard>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit User Modal ── */}
      <Modal visible={editUser != null} transparent animationType="fade" onRequestClose={() => setEditUser(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>Modifier l'utilisateur</ThemedText>
                {editUser && <ThemedText style={styles.modalSub}>{editUser.prenom} {editUser.nom}</ThemedText>}
              </View>
              <Pressable onPress={() => setEditUser(null)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Section: Identité */}
              <View style={styles.sectionBlock}>
                <ThemedText style={styles.sectionLabel}>Identité</ThemedText>
                <View style={styles.rowTwo}>
                  <View style={styles.fieldHalf}>
                    <ThemedText style={styles.fieldLabel}>Prénom</ThemedText>
                    <TextInput
                      value={String(editUserData.prenom ?? '')}
                      onChangeText={t => setEditUserData(d => ({ ...d, prenom: t }))}
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.modalInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <ThemedText style={styles.fieldLabel}>Nom</ThemedText>
                    <TextInput
                      value={String(editUserData.nom ?? '')}
                      onChangeText={t => setEditUserData(d => ({ ...d, nom: t }))}
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.modalInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                    />
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Email</ThemedText>
                  <TextInput
                    value={String(editUserData.email ?? '')}
                    onChangeText={t => setEditUserData(d => ({ ...d, email: t }))}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.modalInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                  />
                </View>
              </View>

              {/* Section: Rôle & Club */}
              <View style={styles.sectionBlock}>
                <ThemedText style={styles.sectionLabel}>Rôle & Club</ThemedText>
                <View style={styles.rolePicker}>
                  {(['swimmer', 'coach', 'admin'] as const).map(r => (
                    <Pressable
                      key={r}
                      onPress={() => setEditUserData(d => ({ ...d, role: r }))}
                      style={[styles.roleOption, {
                        backgroundColor: editUserData.role === r ? Accent : theme.backgroundElement,
                      }]}
                    >
                      <ThemedText style={[styles.roleOptionText, {
                        color: editUserData.role === r ? '#fff' : theme.text,
                      }]}>
                        {roleLabel(r)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Club</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clubPicker}>
                    <Pressable
                      onPress={() => setEditUserData(d => ({ ...d, club_id: '' }))}
                      style={[styles.clubOption, {
                        backgroundColor: editUserData.club_id === '' ? Accent : theme.backgroundElement,
                      }]}
                    >
                      <ThemedText style={[styles.clubOptionText, {
                        color: editUserData.club_id === '' ? '#fff' : theme.text,
                      }]}>Aucun</ThemedText>
                    </Pressable>
                    {clubs.map(club => {
                      const active = Number(editUserData.club_id) === club.id;
                      return (
                        <Pressable
                          key={club.id}
                          onPress={() => setEditUserData(d => ({ ...d, club_id: club.id }))}
                          style={[styles.clubOption, {
                            backgroundColor: active ? Accent : theme.backgroundElement,
                          }]}
                        >
                          <ThemedText style={[styles.clubOptionText, {
                            color: active ? '#fff' : theme.text,
                          }]}>{club.name}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* Section: Avatar */}
              <View style={styles.sectionBlock}>
                <ThemedText style={styles.sectionLabel}>Avatar</ThemedText>
                <View style={styles.avatarField}>
                  {editUserData.avatar ? (
                    <Image source={{ uri: String(editUserData.avatar) }} style={styles.avatarPreview} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundElement }]}>
                      <Ionicons name="image-outline" size={20} color={theme.textSecondary} />
                    </View>
                  )}
                  <TextInput
                    value={String(editUserData.avatar ?? '')}
                    onChangeText={t => setEditUserData(d => ({ ...d, avatar: t }))}
                    placeholder="https://…"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    style={[styles.modalInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                  />
                </View>
              </View>

              {/* Section: Records personnels */}
              <View style={styles.sectionBlock}>
                <ThemedText style={styles.sectionLabel}>Records personnels (PB)</ThemedText>

                {userPBs.length === 0 && (
                  <ThemedText style={styles.pbEmpty}>Aucun record</ThemedText>
                )}

                {userPBs.map(pb => {
                  const isEditing = editingPBId === pb.id;
                  const c = pbColors[pb.type_nage] ?? Accent;
                  return (
                    <View key={pb.id}>
                      {/* PB row */}
                      {!isEditing ? (
                        <Pressable
                          onPress={() => startEditPB(pb)}
                          style={[styles.pbRow, { backgroundColor: theme.hairline + '20', borderLeftColor: c }]}
                        >
                          <View style={styles.pbRowMain}>
                            <ThemedText style={styles.pbNage} numberOfLines={1}>{pb.nage}</ThemedText>
                            <View style={[styles.pbTypeBadge, { backgroundColor: c + '15' }]}>
                              <ThemedText style={[styles.pbTypeText, { color: c }]}>{pb.type_nage}</ThemedText>
                            </View>
                            <ThemedText style={styles.pbTemps}>{pb.temps}</ThemedText>
                          </View>
                          <Pressable onPress={() => handleDeletePB(pb.id)} style={styles.pbDelete}>
                            <Ionicons name="trash-outline" size={13} color="#EF4444" />
                          </Pressable>
                        </Pressable>
                      ) : (
                        /* Inline edit form */
                        <View style={[styles.pbEditCard, { backgroundColor: theme.backgroundElement, borderColor: c + '40' }]}>
                          <View style={styles.pbEditForm}>
                            <TextInput
                              value={editPBData.nage}
                              onChangeText={t => setEditPBData(d => ({ ...d, nage: t }))}
                              placeholder="Nage"
                              placeholderTextColor={theme.textSecondary}
                              style={[styles.pbEditInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.hairline }]}
                            />
                            <View style={styles.pbTypePicker}>
                              {(['crawl', 'dos', 'brass', 'pap'] as const).map(t => {
                                const active = editPBData.type_nage === t;
                                return (
                                  <Pressable
                                    key={t}
                                    onPress={() => setEditPBData(d => ({ ...d, type_nage: t }))}
                                    style={[styles.pbTypeDot, {
                                      backgroundColor: active ? pbColors[t] : theme.background,
                                    }]}
                                  >
                                    <ThemedText style={[styles.pbTypeDotText, { color: active ? '#fff' : theme.textSecondary }]}>
                                      {t[0]}
                                    </ThemedText>
                                  </Pressable>
                                );
                              })}
                            </View>
                            <TextInput
                              value={editPBData.temps}
                              onChangeText={t => setEditPBData(d => ({ ...d, temps: t }))}
                              placeholder="00:00.00"
                              placeholderTextColor={theme.textSecondary}
                              style={[styles.pbEditTime, { backgroundColor: theme.background, color: theme.text, borderColor: theme.hairline }]}
                            />
                          </View>
                          <View style={styles.pbEditActions}>
                            <Pressable onPress={() => setEditingPBId(null)} style={styles.pbEditCancel}>
                              <ThemedText style={styles.pbEditCancelText}>Annuler</ThemedText>
                            </Pressable>
                            <Pressable onPress={handleSaveEditPB} style={[styles.pbEditSave, { backgroundColor: c }]}>
                              <Ionicons name="checkmark" size={14} color="#fff" />
                              <ThemedText style={styles.pbEditSaveText}>Enreg.</ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Add PB form */}
                <View style={styles.pbAddCard}>
                  <ThemedText style={styles.pbAddLabel}>Ajouter un record</ThemedText>
                  <View style={styles.pbAddForm}>
                    <TextInput
                      value={newPBNage}
                      onChangeText={setNewPBNage}
                      placeholder="Nage"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.pbAddInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                    />
                    <View style={styles.pbTypePicker}>
                      {(['crawl', 'dos', 'brass', 'pap'] as const).map(t => {
                        const active = newPBType === t;
                        return (
                          <Pressable
                            key={t}
                            onPress={() => setNewPBType(t)}
                            style={[styles.pbTypeDot, {
                              backgroundColor: active ? pbColors[t] : theme.backgroundElement,
                            }]}
                          >
                            <ThemedText style={[styles.pbTypeDotText, { color: active ? '#fff' : theme.textSecondary }]}>
                              {t[0]}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                    <TextInput
                      value={newPBTemps}
                      onChangeText={setNewPBTemps}
                      placeholder="00:00.00"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.pbAddTime, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                    />
                    <Pressable onPress={handleAddPB} style={styles.pbAddBtn}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditUser(null)} style={styles.cancelBtn}>
                <ThemedText style={styles.cancelBtnText}>Annuler</ThemedText>
              </Pressable>
              <Pressable onPress={saveUser} style={[styles.saveBtn, { backgroundColor: Accent }]}>
                <ThemedText style={styles.saveBtnText}>Sauvegarder</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Club Modal */}
      <Modal visible={editClub != null} transparent animationType="fade" onRequestClose={() => setEditClub(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Modifier le club</ThemedText>
              <Pressable onPress={() => setEditClub(null)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            {(['name', 'city', 'referral_code'] as const).map(field => (
              <View key={field} style={styles.fieldGroup}>
                <ThemedText style={styles.fieldLabel}>{({ name: 'Nom', city: 'Ville', referral_code: 'Code de parrainage' } as Record<string, string>)[field]}</ThemedText>
                <TextInput
                  value={String(editClubData[field] ?? '')}
                  onChangeText={t => setEditClubData(d => ({ ...d, [field]: t }))}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.modalInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                />
              </View>
            ))}

            <View style={styles.toggleRow}>
              <View style={styles.toggleRowLeft}>
                <Ionicons name="key-outline" size={15} color={theme.textSecondary} />
                <ThemedText style={styles.toggleLabel}>Code de parrainage actif</ThemedText>
              </View>
              <Pressable
                onPress={toggleReferralActive}
                style={[styles.toggle, {
                  backgroundColor: editClubData.referral_active ? '#059669' : theme.text + '20',
                }]}
              >
                <View style={[styles.toggleDot, {
                  alignSelf: editClubData.referral_active ? 'flex-end' : 'flex-start',
                }]} />
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Logo</ThemedText>
              <View style={styles.logoRow}>
                {editClub && logoUrl(editClub) ? (
                  <Image source={{ uri: logoUrl(editClub)! }} style={styles.logoPreview} />
                ) : (
                  <View style={[styles.logoPlaceholder, { backgroundColor: Accent + '15' }]}>
                    <Ionicons name="image-outline" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <Pressable
                  onPress={handlePickLogo}
                  disabled={uploadingLogo}
                  style={({ pressed }) => [styles.logoBtn, {
                    opacity: uploadingLogo ? 0.5 : pressed ? 0.7 : 1,
                  }]}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={Accent} />
                  <ThemedText style={styles.logoBtnText}>
                    {uploadingLogo ? 'Envoi…' : editClub?.logo_url ? 'Changer' : 'Ajouter'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditClub(null)} style={styles.cancelBtn}>
                <ThemedText style={styles.cancelBtnText}>Annuler</ThemedText>
              </Pressable>
              <Pressable onPress={saveClub} style={[styles.saveBtn, { backgroundColor: Accent }]}>
                <ThemedText style={styles.saveBtnText}>Sauvegarder</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Club Modal */}
      <Modal visible={showCreateClub} transparent animationType="fade" onRequestClose={() => setShowCreateClub(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Nouveau club</ThemedText>
              <Pressable onPress={() => setShowCreateClub(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            {(['name', 'city', 'referral_code'] as const).map(field => (
              <View key={field} style={styles.fieldGroup}>
                <ThemedText style={styles.fieldLabel}>{({ name: 'Nom', city: 'Ville', referral_code: 'Code de parrainage' } as Record<string, string>)[field]}</ThemedText>
                <TextInput
                  value={createClubData[field]}
                  onChangeText={t => setCreateClubData(d => ({ ...d, [field]: t }))}
                  placeholderTextColor={theme.textSecondary}
                  placeholder={field === 'referral_code' ? 'ex: CNB-2026' : ''}
                  autoCapitalize={field === 'referral_code' ? 'characters' : 'none'}
                  style={[styles.modalInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                />
              </View>
            ))}

            <Pressable
              onPress={handleCreateClub}
              style={({ pressed }) => [styles.primaryBtn, {
                backgroundColor: Accent,
                opacity: pressed ? 0.9 : 1,
              }]}
            >
              <ThemedText style={styles.primaryBtnText}>Créer le club</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: Spacing.four,
    gap: 12,
    paddingBottom: 40,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: Accent + '15',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: Accent,
  },
  input: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  listGap: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.sm,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemBody: {
    flex: 1,
  },
  listItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  listItemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  referralBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  referralText: {
    fontSize: 9,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Accent + '40',
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Accent,
  },
  clubAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  notifDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  notifInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radii.md,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: Radii.lg,
    padding: Spacing.five,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: 380,
  },
  sectionBlock: {
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Accent,
    marginBottom: 2,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  fieldHalf: {
    flex: 1,
    gap: 4,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  clubPicker: {
    flexDirection: 'row',
  },
  clubOption: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.sm,
    marginRight: 4,
  },
  clubOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  avatarField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarPreview: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  rolePicker: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roleOption: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pbEmpty: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.one,
  },
  pbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.sm,
    borderLeftWidth: 3,
    marginBottom: 4,
  },
  pbRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pbNage: {
    flex: 2,
    fontSize: 13,
    fontWeight: '600',
  },
  pbTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pbTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pbTemps: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pbDelete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* PB inline edit form */
  pbEditCard: {
    borderRadius: Radii.sm,
    borderWidth: 1,
    padding: Spacing.two,
    marginBottom: 4,
    gap: Spacing.two,
  },
  pbEditForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pbEditInput: {
    flex: 2,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  pbEditTime: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    fontVariant: ['tabular-nums'],
  },
  pbEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  pbEditCancel: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
  },
  pbEditCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pbEditSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
  },
  pbEditSaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  /* PB add form */
  pbAddCard: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  pbAddLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Accent,
  },
  pbAddForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pbAddInput: {
    flex: 2,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  pbAddTime: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    fontVariant: ['tabular-nums'],
  },
  pbTypePicker: {
    flexDirection: 'row',
    gap: 2,
  },
  pbTypeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pbTypeDotText: {
    fontSize: 7,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pbAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  toggleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logoPreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Accent + '40',
    alignItems: 'center',
  },
  logoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Accent,
    marginTop: 2,
  },
  primaryBtn: {
    paddingVertical: Spacing.three,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // ─── Test tab styles ────────────────────────────────────────────
  reveilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  reveilLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  reveilInput: {
    width: 80,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.sm,
    borderWidth: 1,
    fontVariant: ['tabular-nums'],
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.two,
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  scanRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  scanInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  scanAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanList: {
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.sm,
  },
  scanItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  scanItemId: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scanItemExpiry: {
    fontSize: 11,
    fontWeight: '500',
  },
  scanItemDel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
