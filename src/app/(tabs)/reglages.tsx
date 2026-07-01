import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import type { NotificationPreferences } from '@/data/auth';
import { API_BASE_URL, fetchClubs, lookupClub, type ApiClub } from '@/lib/api';
import { DEV_MODE } from '@/lib/env';

export default function ReglagesScreen() {
  const theme = useTheme();
  const { mode, toggle } = useThemeMode();
  const isDark = mode === 'dark';
  const { user, updateProfile, changeClub, isCoach, isAdmin, isPrivileged, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editPrenom, setEditPrenom] = useState(user?.prenom ?? '');
  const [editNom, setEditNom] = useState(user?.nom ?? '');
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    user?.preferences ?? {
      messages: true, announcements: true, eventReminders: true, mentions: true, clubInvites: true,
    }
  );

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [code, setCode] = useState('');
  const [validatedClub, setValidatedClub] = useState<ApiClub | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  const [apiClubs, setApiClubs] = useState<ApiClub[]>([]);

  useEffect(() => {
    fetchClubs().then(res => { if (res.data?.clubs) setApiClubs(res.data.clubs); });
  }, []);

  const currentClub = user?.clubId ? apiClubs.find(c => c.id === user.clubId) ?? null : null;

  const saveProfile = () => {
    updateProfile({ prenom: editPrenom, nom: editNom });
    setEditing(false);
  };

  const togglePref = (key: keyof NotificationPreferences) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    updateProfile({ preferences: next });
  };

  const handleLogout = () => {
    logout();
  };

  const handleVerifyCode = useCallback(async () => {
    setCodeError(null);
    setValidatedClub(null);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setCodeError('Veuillez entrer un code'); return; }
    const { data, error } = await lookupClub(trimmed);
    if (error || !data?.club) { setCodeError(error ?? 'Code invalide'); return; }
    setValidatedClub(data.club);
  }, [code]);

  const handleJoinClub = useCallback(() => {
    if (!validatedClub) return;
    setCodeLoading(true);
    changeClub(validatedClub.id, code.trim().toUpperCase());
    setShowCodeModal(false);
    setCode('');
    setValidatedClub(null);
    setCodeLoading(false);
  }, [validatedClub, code, changeClub]);

  const openCodeModal = () => {
    setCode('');
    setValidatedClub(null);
    setCodeError(null);
    setShowCodeModal(true);
  };

  const closeCodeModal = () => {
    setShowCodeModal(false);
    setCode('');
    setValidatedClub(null);
    setCodeError(null);
  };

  const avatars = ['person', 'happy', 'fitness', 'water', 'star', 'flash'];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.accentLine, { backgroundColor: Accent }]} />
        <ThemedText style={[styles.title, { color: theme.text }]}>Profil</ThemedText>

        {/* Avatar & identité */}
        <DoubleBezelCard accent style={[Shadows.medium as any]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={15} color={Accent} />
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Identité</ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: theme.hairline }]} />
          </View>

          <View style={styles.logoRow}>
            <Pressable onPress={() => setEditing(!editing)} style={[styles.logoOuter, { backgroundColor: Accent + '15' }]}>
              <View style={[styles.logoCircle, { backgroundColor: Accent }]}>
                <Ionicons name={user?.avatar as any || 'person'} size={22} color="#FFFFFF" />
              </View>
            </Pressable>
            <View style={styles.logoInfo}>
              <ThemedText style={[styles.logoName, { color: theme.text }]}>
                {user?.prenom} {user?.nom}
              </ThemedText>
              <ThemedText style={[styles.logoSub, { color: theme.textSecondary }]}>
                {isCoach ? 'Entraîneur' : 'Nageur'}
                {currentClub ? ` · ${currentClub.name}` : ' · Aucun club'}
              </ThemedText>
            </View>
          </View>

          {editing && (
            <View style={styles.avatarRow}>
              {avatars.map(a => (
                <Pressable
                  key={a}
                  onPress={() => updateProfile({ avatar: a })}
                  style={[
                    styles.avatarOption,
                    { borderColor: user?.avatar === a ? Accent : theme.hairline },
                    { backgroundColor: user?.avatar === a ? Accent + '10' : 'transparent' },
                  ]}
                >
                  <Ionicons name={a as any} size={18} color={user?.avatar === a ? Accent : theme.textSecondary} />
                </Pressable>
              ))}
            </View>
          )}

          <View style={[styles.fieldsDivider, { backgroundColor: theme.hairline }]} />

          <EditableField
            icon="person-outline" label="Prénom"
            value={editing ? editPrenom : (user?.prenom ?? '')}
            editing={editing} onChange={setEditPrenom} theme={theme}
          />
          <View style={[styles.fieldDivider, { backgroundColor: theme.hairline }]} />
          <EditableField
            icon="text" label="Nom"
            value={editing ? editNom : (user?.nom ?? '')}
            editing={editing} onChange={setEditNom} theme={theme}
          />
          <View style={[styles.fieldDivider, { backgroundColor: theme.hairline }]} />
          <EditableField
            icon="mail-outline" label="Email"
            value={user?.email ?? ''}
            editing={false} onChange={() => {}} theme={theme}
          />
          <View style={[styles.fieldDivider, { backgroundColor: theme.hairline }]} />

          <View style={styles.editRow}>
            <Pressable
              onPress={() => setEditing(!editing)}
              style={[styles.editBtn, { borderColor: theme.hairline }]}
            >
              <Ionicons name={editing ? 'close' : 'pencil'} size={11} color={theme.textSecondary} />
              <ThemedText style={[styles.editBtnText, { color: theme.textSecondary }]}>
                {editing ? 'Annuler' : 'Modifier'}
              </ThemedText>
            </Pressable>
            {editing && (
              <Pressable
                onPress={saveProfile}
                style={[styles.editBtn, { borderColor: Accent, backgroundColor: Accent + '10' }]}
              >
                <Ionicons name="checkmark" size={11} color={Accent} />
                <ThemedText style={[styles.editBtnText, { color: Accent }]}>Sauvegarder</ThemedText>
              </Pressable>
            )}
          </View>
        </DoubleBezelCard>

        {/* Club */}
        <DoubleBezelCard accent style={[Shadows.medium as any]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={15} color={Accent} />
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Club</ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: theme.hairline }]} />
          </View>

          {currentClub ? (
            <View style={styles.clubInfo}>
              {currentClub.logo_url ? (
                <Image source={{ uri: `${API_BASE_URL}${currentClub.logo_url}` }} style={styles.clubLogo} />
              ) : (
                <View style={[styles.clubBadge, { backgroundColor: Accent + '12' }]}>
                  <Ionicons name="water" size={18} color={Accent} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.clubName, { color: theme.text }]}>{currentClub.name}</ThemedText>
                <ThemedText style={[styles.clubCity, { color: theme.textSecondary }]}>{currentClub.city}</ThemedText>
                {user?.referralCodeUsed && (
                  <ThemedText style={[styles.clubCode, { color: theme.textSecondary }]}>
                    Code : {user.referralCodeUsed}
                  </ThemedText>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noClub}>
              <Ionicons name="business-outline" size={20} color={theme.textSecondary} />
              <ThemedText style={[styles.noClubText, { color: theme.textSecondary }]}>
                Aucun club affilié
              </ThemedText>
            </View>
          )}

          <Pressable
            onPress={openCodeModal}
            style={({ pressed }) => [
              styles.changeClubBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="swap-horizontal-outline" size={15} color={Accent} />
            <ThemedText style={[styles.changeClubText, { color: Accent }]}>
              {currentClub ? 'Changer de club' : 'Rejoindre un club'}
            </ThemedText>
            <ThemedText style={[styles.changeClubHint, { color: theme.textSecondary }]}>
              avec un code de parrainage
            </ThemedText>
          </Pressable>

          {/* Code de parrainage — Modal */}
          <Modal
            visible={showCodeModal}
            transparent
            animationType="fade"
            onRequestClose={closeCodeModal}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                    Code de parrainage
                  </ThemedText>
                  <Pressable onPress={closeCodeModal} style={styles.modalClose}>
                    <Ionicons name="close" size={22} color={theme.textSecondary} />
                  </Pressable>
                </View>

                {currentClub && (
                  <View style={[styles.warningBanner, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="warning-outline" size={16} color="#92400E" />
                    <ThemedText style={styles.warningText}>
                      Tu vas être retiré du club actuel ({currentClub.name})
                    </ThemedText>
                  </View>
                )}

                <TextInput
                  value={code}
                  onChangeText={text => { setCode(text); if (validatedClub) setValidatedClub(null); if (codeError) setCodeError(null); }}
                  placeholder="ex: CNB-2026"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[styles.modalInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />

                {codeError && (
                  <ThemedText style={[styles.modalError, { color: theme.danger }]}>{codeError}</ThemedText>
                )}

                {!validatedClub ? (
                  <Pressable
                    onPress={handleVerifyCode}
                    style={({ pressed }) => [styles.modalBtn, { backgroundColor: theme.text, opacity: pressed ? 0.85 : 1 }]}
                  >
                    <ThemedText style={[styles.modalBtnText, { color: theme.background }]}>Vérifier</ThemedText>
                  </Pressable>
                ) : (
                  <View style={{ gap: Spacing.two }}>
                    <View style={[styles.clubPreview, { backgroundColor: theme.backgroundElement }]}>
                      {validatedClub.logo_url ? (
                        <Image source={{ uri: `${API_BASE_URL}${validatedClub.logo_url}` }} style={{ width: 40, height: 40, borderRadius: 10 }} />
                      ) : (
                        <View style={styles.clubPreviewIcon}>
                          <Ionicons name="water" size={20} color={Accent} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.clubPreviewName, { color: theme.text }]}>{validatedClub.name}</ThemedText>
                        <ThemedText style={[styles.clubPreviewCity, { color: theme.textSecondary }]}>{validatedClub.city}</ThemedText>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                    </View>
                    <Pressable
                      onPress={handleJoinClub}
                      disabled={codeLoading}
                      style={({ pressed }) => [styles.modalBtn, { backgroundColor: Accent, opacity: codeLoading ? 0.5 : pressed ? 0.85 : 1 }]}
                    >
                      <ThemedText style={[styles.modalBtnText, { color: '#fff' }]}>
                        {codeLoading ? 'Adhésion…' : 'Rejoindre ce club'}
                      </ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        </DoubleBezelCard>

        {/* Notifications */}
        <DoubleBezelCard accent style={[Shadows.medium as any]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={15} color={Accent} />
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Notifications</ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: theme.hairline }]} />
          </View>

          {/* Chat/Messages désactivé pour le moment */}
          {/* <NotifToggle
            icon="chatbubble-ellipses-outline"
            label="Messages"
            value={prefs.messages}
            onToggle={() => togglePref('messages')}
            theme={theme}
          />
          <View style={[styles.fieldDivider, { backgroundColor: theme.hairline }]} /> */}
          <NotifToggle
            icon="megaphone-outline"
            label="Annonces des coachs"
            value={prefs.announcements}
            onToggle={() => togglePref('announcements')}
            theme={theme}
          />
          <View style={[styles.fieldDivider, { backgroundColor: theme.hairline }]} />
          <NotifToggle
            icon="calendar-outline"
            label="Rappels d'événements"
            value={prefs.eventReminders}
            onToggle={() => togglePref('eventReminders')}
            theme={theme}
          />
          <View style={[styles.fieldDivider, { backgroundColor: theme.hairline }]} />
          <NotifToggle
            icon="at-outline"
            label="Mentions"
            value={prefs.mentions}
            onToggle={() => togglePref('mentions')}
            theme={theme}
          />
          <View style={[styles.fieldDivider, { backgroundColor: theme.hairline }]} />
          <NotifToggle
            icon="people-outline"
            label="Invitations club"
            value={prefs.clubInvites}
            onToggle={() => togglePref('clubInvites')}
            theme={theme}
          />
        </DoubleBezelCard>

        {/* Affichage */}
        <DoubleBezelCard accent style={[Shadows.medium as any]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={15} color={Accent} />
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Affichage</ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: theme.hairline }]} />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={15} color={theme.textSecondary} />
              <ThemedText style={[styles.rowLabel, { color: theme.text }]}>Mode sombre</ThemedText>
            </View>
            <Pressable
              onPress={toggle}
              style={[styles.toggle, { backgroundColor: isDark ? Accent : theme.text + '15' }]}
            >
              <View
                style={[
                  styles.toggleDot,
                  { backgroundColor: isDark ? '#FFFFFF' : theme.text },
                  isDark && styles.toggleDotActive,
                ]}
              />
            </Pressable>
          </View>
        </DoubleBezelCard>

        {/* Espace Entraîneur */}
        {isPrivileged && (
          <DoubleBezelCard accent style={[Shadows.medium as any]}>
            <Pressable onPress={() => router.push('/(tabs)/coach')} style={styles.navRow}>
              <Ionicons name="shield-checkmark" size={15} color={Accent} />
              <ThemedText style={[styles.navText, { color: Accent }]}>Espace Entraîneur</ThemedText>
              <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
            </Pressable>
          </DoubleBezelCard>
        )}

        {/* Panneau d'administration */}
        {isAdmin && (
          <DoubleBezelCard accent style={[Shadows.medium as any]}>
            <Pressable onPress={() => router.push('/(tabs)/developpeur')} style={styles.navRow}>
              <Ionicons name="settings-outline" size={15} color="#F59E0B" />
              <ThemedText style={[styles.navText, { color: '#F59E0B' }]}>
                Administration
              </ThemedText>
              <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
            </Pressable>
          </DoubleBezelCard>
        )}

        {/* Déconnexion */}
        <DoubleBezelCard accent style={[Shadows.medium as any]}>
          <Pressable onPress={handleLogout} style={styles.logoutRow}>
            <Ionicons name="log-out-outline" size={15} color="#EF4444" />
            <ThemedText style={[styles.logoutText, { color: '#EF4444' }]}>Déconnexion</ThemedText>
          </Pressable>
        </DoubleBezelCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

function EditableField({
  icon, label, value, editing, onChange, theme,
}: {
  icon: string; label: string; value: string; editing: boolean; onChange: (v: string) => void; theme: Record<string, string>;
}) {
  return (
    <View style={[styles.row, { paddingVertical: 8 }]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={13} color={theme.textSecondary} />
        <ThemedText style={[styles.rowLabel, { color: theme.text }]}>{label}</ThemedText>
      </View>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholderTextColor={theme.textSecondary}
          placeholder={`Votre ${label.toLowerCase()}`}
          style={[styles.input, { color: theme.text, borderBottomColor: Accent + '40', backgroundColor: 'transparent' }]}
        />
      ) : (
        <ThemedText style={[styles.rowValue, { color: value ? theme.text : theme.textSecondary }]}>
          {value || '—'}
        </ThemedText>
      )}
    </View>
  );
}

function NotifToggle({
  icon, label, value, onToggle, theme,
}: {
  icon: string; label: string; value: boolean; onToggle: () => void; theme: Record<string, string>;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={13} color={theme.textSecondary} />
        <ThemedText style={[styles.rowLabel, { color: theme.text }]}>{label}</ThemedText>
      </View>
      <Pressable
        onPress={onToggle}
        style={[styles.toggle, { backgroundColor: value ? Accent : theme.text + '15' }]}
      >
        <View
          style={[
            styles.toggleDot,
            { backgroundColor: value ? '#FFFFFF' : theme.text },
            value && styles.toggleDotActive,
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.four, gap: 12, paddingBottom: Spacing.six },
  accentLine: { height: 3, width: 48, borderRadius: 2, marginBottom: Spacing.three },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  logoOuter: { borderRadius: 28, padding: 3 },
  logoCircle: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  logoInfo: { flex: 1, gap: 2 },
  logoName: { fontSize: 16, fontWeight: '700' },
  logoSub: { fontSize: 12, fontWeight: '500' },

  avatarRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two, flexWrap: 'wrap' },
  avatarOption: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  editRow: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1 },
  editBtnText: { fontSize: 11, fontWeight: '600' },
  fieldsDivider: { height: 1, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowValue: { fontSize: 14, fontWeight: '500' },
  input: { fontSize: 14, fontWeight: '500', paddingVertical: 4, borderBottomWidth: 1, minWidth: 120, textAlign: 'right' },

  fieldDivider: { height: 1 },
  clubInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  clubBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  clubLogo: { width: 40, height: 40, borderRadius: 10 },
  clubName: { fontSize: 16, fontWeight: '700' },
  clubCity: { fontSize: 12, fontWeight: '500' },
  clubCode: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  noClub: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  noClubText: { fontSize: 14, fontWeight: '500' },
  changeClubBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.three, marginTop: Spacing.two,
    borderTopWidth: 1, borderTopColor: 'transparent',
  },
  changeClubText: { fontSize: 14, fontWeight: '600' },
  changeClubHint: { fontSize: 12, fontWeight: '400' },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.four,
  },
  modalCard: {
    width: '100%', maxWidth: 400, borderRadius: Radii.lg,
    padding: Spacing.five, gap: Spacing.three,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.three, borderRadius: Radii.md,
  },
  warningText: {
    flex: 1, fontSize: 13, fontWeight: '500', color: '#92400E', lineHeight: 18,
  },
  modalInput: {
    fontSize: 17, fontWeight: '500', paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three, borderRadius: Radii.md,
    height: 50, textAlign: 'center', letterSpacing: 2,
  },
  modalError: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  modalBtn: {
    height: 50, borderRadius: Radii.md, alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: { fontSize: 16, fontWeight: '700' },
  clubPreview: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    padding: Spacing.three, borderRadius: Radii.md,
  },
  clubPreviewIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Accent + '18', alignItems: 'center', justifyContent: 'center',
  },
  clubPreviewName: { fontSize: 16, fontWeight: '700' },
  clubPreviewCity: { fontSize: 13, fontWeight: '500' },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  toggleDot: { width: 20, height: 20, borderRadius: 10 },
  toggleDotActive: { alignSelf: 'flex-end' },
  logoutRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, justifyContent: 'center', paddingVertical: 4 },
  logoutText: { fontSize: 14, fontWeight: '600' },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 4 },
  navText: { fontSize: 14, fontWeight: '600' },
  bottomSpacer: { height: Spacing.three },
});
