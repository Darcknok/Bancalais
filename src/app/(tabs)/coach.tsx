import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
// Chat désactivé pour le moment
// import { chatGroups, chatUsers, clubs, getGroupParticipants, getUsersByClub } from '@/data/chat';
import { useTheme } from '@/hooks/use-theme';
import { createNotification } from '@/lib/api';

export default function CoachScreen() {
  const { user, isPrivileged } = useAuth();
  const theme = useTheme();

  const clubId = user?.clubId;

  const [showAnnounce, setShowAnnounce] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceBody, setAnnounceBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendAnnouncement = async () => {
    if (!announceTitle.trim() || !announceBody.trim()) {
      Alert.alert('Erreur', 'Titre et contenu requis');
      return;
    }
    setSending(true);
    const { error } = await createNotification({
      type: 'coach',
      title: announceTitle.trim(),
      body: announceBody.trim(),
      target_role: 'swimmer',
      club_id: clubId,
    });
    setSending(false);
    if (error) {
      Alert.alert('Erreur', error);
      return;
    }
    Alert.alert('Envoyé', 'Annonce publiée à tous les nageurs du club.');
    setShowAnnounce(false);
    setAnnounceTitle('');
    setAnnounceBody('');
  };

  const clubName = useMemo(() => {
    if (!clubId) return '';
    // Chat désactivé — le nom du club viendra d'ailleurs plus tard
    return '';
  }, [clubId]);

  const swimmers = useMemo((): { id: number; prenom: string; nom: string }[] => {
    if (!clubId) return [];
    // Chat désactivé — la liste des nageurs viendra d'ailleurs plus tard
    return [];
  }, [clubId]);

  // Chat désactivé pour le moment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGroupParticipants = (_g: any) => [] as any[];

  const modalOverlay = { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.four };
  const modalCard = { width: '100%' as const, maxWidth: 400, borderRadius: Radii.lg, padding: Spacing.five, gap: Spacing.three, shadowColor: '#000' as const, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 };
  const inputStyle = {
    fontSize: 14 as const,
    fontWeight: '500' as const,
    color: theme.text,
    backgroundColor: theme.backgroundElement,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: theme.hairline,
  };
  const inputMulti = { ...inputStyle, minHeight: 100, textAlignVertical: 'top' as const };

  if (!isPrivileged) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.lockContainer}>
          <View style={[styles.lockIconRing, { backgroundColor: theme.hairline }]}>
            <Ionicons name="lock-closed" size={28} color={theme.textSecondary} />
          </View>
          <ThemedText style={[styles.lockTitle, { color: theme.text }]}>
            Espace réservé aux entraîneurs
          </ThemedText>
          <ThemedText style={[styles.lockSubtitle, { color: theme.textSecondary }]}>
            Connectez-vous avec un compte entraîneur pour accéder à cette section.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={[styles.accentLine, { backgroundColor: Accent }]} />
          <View style={styles.headerContent}>
            <ThemedText style={[styles.eyebrow, { color: theme.textSecondary }]}>
              {clubName}
            </ThemedText>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              Espace entraîneur
            </ThemedText>
          </View>
        </View>

        <DoubleBezelCard>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={18} color={Accent} />
              <ThemedText style={[styles.statValue, { color: theme.text }]}>
                {swimmers.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Nageurs
              </ThemedText>
            </View>
            {/* Chat/Groups désactivé pour le moment */}
            {/* <View style={[styles.statDivider, { backgroundColor: theme.hairline }]} />
            <View style={styles.statItem}>
              <Ionicons name="layers" size={18} color={Accent} />
              <ThemedText style={[styles.statValue, { color: theme.text }]}>
                {groups.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Groupes
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.hairline }]} />
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-ellipses" size={18} color={Accent} />
              <View style={styles.statValueRow}>
                <ThemedText style={[styles.statValue, { color: theme.text }]}>
                  2
                </ThemedText>
                <View style={[styles.unreadBadge, { backgroundColor: Accent }]}>
                  <ThemedText style={styles.unreadBadgeText}>N</ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Non lus
              </ThemedText>
            </View> */}
          </View>
        </DoubleBezelCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="people-outline" size={13} color={Accent} />
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Mes nageurs
          </ThemedText>
          <View style={[styles.sectionLine, { backgroundColor: theme.hairline }]} />
        </View>

        <DoubleBezelCard>
          {swimmers.length === 0 && (
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun nageur dans votre club.
            </ThemedText>
          )}
          {swimmers.map((swimmer, idx) => (
            <View key={swimmer.id}>
              {idx > 0 && <View style={[styles.itemDivider, { backgroundColor: theme.hairline }]} />}
              <View style={styles.swimmerRow}>
                <View style={[styles.avatarCircle, { backgroundColor: Accent + '15' }]}>
                  <Ionicons name="person" size={16} color={Accent} />
                </View>
                <View style={styles.swimmerInfo}>
                  <ThemedText style={[styles.swimmerName, { color: theme.text }]}>
                    {swimmer.prenom} {swimmer.nom}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: swimmer.id % 2 === 0 ? '#22C55E' : theme.textSecondary },
                  ]}
                />
              </View>
            </View>
          ))}
        </DoubleBezelCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="layers-outline" size={13} color={Accent} />
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Mes groupes
          </ThemedText>
          <View style={[styles.sectionLine, { backgroundColor: theme.hairline }]} />
        </View>

        {/* Chat/Groups désactivé pour le moment */}
        {false && (
          <>
            {groups.length === 0 && (
              <DoubleBezelCard>
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Aucun groupe géré pour le moment.
                </ThemedText>
              </DoubleBezelCard>
            )}
            {groups.map((group, idx) => {
              const members = getGroupParticipants(group);
              return (
                <DoubleBezelCard key={group.id}>
                  <Pressable style={styles.groupRow}>
                    <View style={styles.groupLeft}>
                      <View style={[styles.groupIcon, { backgroundColor: Accent + '12' }]}>
                        <Ionicons name="people" size={16} color={Accent} />
                      </View>
                      <View>
                        <ThemedText style={[styles.groupName, { color: theme.text }]}>
                          {group.name}
                        </ThemedText>
                        <ThemedText style={[styles.groupMemberCount, { color: theme.textSecondary }]}>
                          {members.length} membre{members.length > 1 ? 's' : ''}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.chevronRing, { borderColor: theme.hairline }]}>
                      <Ionicons name="chevron-forward" size={13} color={theme.textSecondary} />
                    </View>
                  </Pressable>
                </DoubleBezelCard>
              );
            })}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="megaphone-outline" size={13} color={Accent} />
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Communication
          </ThemedText>
          <View style={[styles.sectionLine, { backgroundColor: theme.hairline }]} />
        </View>

        <DoubleBezelCard accent>
          <Pressable style={styles.announceRow} onPress={() => setShowAnnounce(true)}>
            <View style={[styles.announceIcon, { backgroundColor: Accent + '18' }]}>
              <Ionicons name="megaphone" size={20} color={Accent} />
            </View>
            <View style={styles.announceTextBlock}>
              <ThemedText style={[styles.announceTitle, { color: theme.text }]}>
                Publier une annonce
              </ThemedText>
              <ThemedText style={[styles.announceSub, { color: theme.textSecondary }]}>
                Envoyez une notification à tous les nageurs du club
              </ThemedText>
            </View>
            <View style={[styles.chevronRing, { borderColor: theme.hairline }]}>
              <Ionicons name="chevron-forward" size={13} color={theme.textSecondary} />
            </View>
          </Pressable>
        </DoubleBezelCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Annonce Modal */}
      <Modal visible={showAnnounce} transparent animationType="fade" onRequestClose={() => setShowAnnounce(false)}>
        <View style={modalOverlay}>
          <View style={[modalCard, { backgroundColor: theme.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Nouvelle annonce</ThemedText>
              <Pressable onPress={() => setShowAnnounce(false)} style={{ width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View>
              <ThemedText style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>Titre</ThemedText>
              <TextInput
                value={announceTitle}
                onChangeText={setAnnounceTitle}
                placeholder="Ex: Reprise des entraînements"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
              />
            </View>

            <View>
              <ThemedText style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>Message</ThemedText>
              <TextInput
                value={announceBody}
                onChangeText={setAnnounceBody}
                placeholder="Votre message aux nageurs..."
                placeholderTextColor={theme.textSecondary}
                multiline
                style={inputMulti}
              />
            </View>

            <Pressable
              onPress={handleSendAnnouncement}
              disabled={sending}
              style={{
                paddingVertical: Spacing.three, borderRadius: Radii.md, backgroundColor: Accent, alignItems: 'center',
                opacity: sending ? 0.5 : 1, marginTop: Spacing.two,
              }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Publier</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    gap: 20,
    paddingBottom: Spacing.six,
  },
  header: {
    paddingTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  accentLine: {
    height: 3,
    width: 48,
    borderRadius: 2,
    marginLeft: Spacing.four,
    marginBottom: Spacing.three,
  },
  headerContent: {
    paddingHorizontal: Spacing.four,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  unreadBadge: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  itemDivider: {
    height: 1,
    marginVertical: 10,
  },
  swimmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swimmerInfo: {
    flex: 1,
  },
  swimmerName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  groupMemberCount: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  chevronRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  announceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announceTextBlock: {
    flex: 1,
    gap: 2,
  },
  announceTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  announceSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  lockIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: Spacing.three,
  },
});
