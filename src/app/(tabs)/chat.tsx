/**
 * CHAT DÉSACTIVÉ POUR LE MOMENT.
 * Ce fichier n'est plus chargé — l'onglet Chat est commenté dans _layout.tsx.
 * On garde le code pour une réactivation future.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  clubs,
  chatGroups,
  chatMessages,
  getUser,
  getUsersByClub,
  getGroupParticipants,
  type ChatMessage,
  type ChatUser,
} from '@/data/chat';

type Filter = 'global' | number;

function MessageBubble({ message }: { message: ChatMessage }) {
  const sender = getUser(message.senderId);
  const theme = useTheme();
  const isSenderCoach = sender?.role === 'coach';
  const isPinned = message.pinned;
  const [showFull, setShowFull] = useState(false);

  return (
    <Pressable onPress={() => setShowFull(!showFull)}>
      <View style={styles.bubbleOuter}>
        <View
          style={[
            styles.bubbleInner,
            {
              backgroundColor: isSenderCoach
                ? Accent + '10'
                : theme.backgroundSelected + '60',
            },
            isSenderCoach && { borderLeftColor: Accent, borderLeftWidth: 2.5 },
          ]}
        >
          <View style={styles.bubbleHeader}>
            {isSenderCoach && (
              <View style={[styles.coachBadge, { backgroundColor: Accent + '20' }]}>
                <ThemedText style={[styles.coachBadgeText, { color: Accent }]}>
                  Coach
                </ThemedText>
              </View>
            )}
            <ThemedText
              style={[
                styles.senderName,
                { color: isSenderCoach ? Accent : theme.textSecondary, fontWeight: isSenderCoach ? '700' : '600' },
              ]}
            >
              {sender?.prenom} {sender?.nom?.[0]}.
            </ThemedText>
            <ThemedText style={[styles.messageTime, { color: theme.textSecondary }]}>
              {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </ThemedText>
            {isPinned && (
              <Ionicons name="pin" size={12} color={theme.textSecondary} />
            )}
          </View>

          <View style={styles.bubbleContent}>
            <ThemedText
              style={[
                styles.messageText,
                { color: theme.text },
                message.content.length > 120 && !showFull && { maxHeight: 60, overflow: 'hidden' },
              ]}
              numberOfLines={showFull ? undefined : 4}
            >
              {message.content}
            </ThemedText>
            {message.content.length > 120 && !showFull && (
              <ThemedText style={[styles.showMore, { color: Accent }]}>… voir plus</ThemedText>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function PinnedBanner({ message, onPress }: { message: ChatMessage; onPress: () => void }) {
  const theme = useTheme();
  const sender = getUser(message.senderId);

  return (
    <Pressable onPress={onPress} style={[styles.pinnedBanner, { backgroundColor: Accent + '08', borderColor: Accent + '20' }]}>
      <Ionicons name="pin" size={12} color={Accent} />
      <ThemedText style={[styles.pinnedText, { color: theme.textSecondary }]} numberOfLines={1}>
        Message épinglé : {sender?.prenom} • {message.content}
      </ThemedText>
    </Pressable>
  );
}

function MemberList({
  users,
  currentUserId,
  onContact,
  onClose,
  theme,
}: {
  users: ChatUser[];
  currentUserId: number;
  onContact: (coach: ChatUser) => void;
  onClose: () => void;
  theme: Record<string, string>;
}) {
  const coaches = users.filter(u => u.role === 'coach');
  const swimmers = users.filter(u => u.role === 'swimmer' && u.id !== currentUserId);

  return (
    <View style={[styles.memberPanel, { backgroundColor: theme.background, borderColor: theme.hairline }]}>
      <View style={styles.memberPanelHeader}>
        <ThemedText style={[styles.memberPanelTitle, { color: theme.text }]}>Membres du club</ThemedText>
        <Pressable onPress={onClose} style={styles.memberPanelClose}>
          <Ionicons name="close" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.memberScroll} showsVerticalScrollIndicator={false}>
        {coaches.length > 0 && (
          <View style={styles.memberSection}>
            <ThemedText style={[styles.memberSectionLabel, { color: theme.textSecondary }]}>
              Encadrement ({coaches.length})
            </ThemedText>
            {coaches.map(coach => (
              <View key={coach.id} style={[styles.memberRow, { borderBottomColor: theme.hairline }]}>
                <View style={[styles.memberAvatarSm, { backgroundColor: Accent + '20' }]}>
                  <Ionicons name="shield-checkmark" size={14} color={Accent} />
                </View>
                <View style={styles.memberInfo}>
                  <ThemedText style={[styles.memberName, { color: theme.text }]}>
                    {coach.prenom} {coach.nom}
                  </ThemedText>
                  <ThemedText style={[styles.memberRole, { color: Accent }]}>Coach</ThemedText>
                </View>
                <Pressable
                  onPress={() => onContact(coach)}
                  style={[styles.contactBtn, { backgroundColor: Accent + '12', borderColor: Accent + '30' }]}
                >
                  <Ionicons name="chatbubble-ellipses" size={13} color={Accent} />
                  <ThemedText style={[styles.contactBtnText, { color: Accent }]}>Contacter</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {swimmers.length > 0 && (
          <View style={styles.memberSection}>
            <ThemedText style={[styles.memberSectionLabel, { color: theme.textSecondary }]}>
              Nageurs ({swimmers.length})
            </ThemedText>
            {swimmers.map(swimmer => (
              <View key={swimmer.id} style={[styles.memberRow, { borderBottomColor: theme.hairline }]}>
                <View style={[styles.memberAvatarSm, { backgroundColor: theme.hairline }]}>
                  <Ionicons name="person" size={14} color={theme.textSecondary} />
                </View>
                <View style={styles.memberInfo}>
                  <ThemedText style={[styles.memberName, { color: theme.text }]}>
                    {swimmer.prenom} {swimmer.nom}
                  </ThemedText>
                  <ThemedText style={[styles.memberRole, { color: theme.textSecondary }]}>Nageur</ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function ChatScreen() {
  const theme = useTheme();
  const [selectedClubId] = useState(1);
  const [filter, setFilter] = useState<Filter>('global');
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [privateCoachId, setPrivateCoachId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(() => chatMessages.filter(m => m.clubId === selectedClubId));
  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => {
      Animated.timing(keyboardAnim, {
        toValue: Math.max(e.endCoordinates.height - 40, 0),
        duration: 280,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
      }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, [keyboardAnim]);

  const currentUserId = 1;
  const currentUser = getUser(currentUserId);
  const isCoach = currentUser?.role === 'coach';

  const club = clubs.find(c => c.id === selectedClubId);
  const groups = chatGroups.filter(g => g.clubId === selectedClubId);
  const clubUsers = getUsersByClub(selectedClubId);

  const filteredMessages = messages.filter(m => {
    if (privateCoachId) {
      const sender = getUser(m.senderId);
      return !m.groupId && (
        (m.senderId === currentUserId && sender?.role === 'swimmer') ||
        m.senderId === privateCoachId
      );
    }
    if (filter === 'global') {
      if (!m.groupId) {
        if (isCoach) return true;
        const sender = getUser(m.senderId);
        return sender?.role === 'coach' || m.senderId === currentUserId;
      }
      return false;
    }
    return m.groupId === filter;
  });

  const pinnedMessages = filteredMessages.filter(m => m.pinned);
  const sortedMessages = [...filteredMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const currentGroup = typeof filter === 'number' ? groups.find(g => g.id === filter) : null;
  const privateCoach = privateCoachId ? getUser(privateCoachId) : null;
  const groupLabel = privateCoach
    ? `Privé : ${privateCoach.prenom}`
    : currentGroup
      ? currentGroup.name
      : 'Fil général';
  const groupParticipants = currentGroup ? getGroupParticipants(currentGroup) : [];

  const handleSend = useCallback(() => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now(),
      senderId: currentUserId,
      content: newMessage.trim(),
      clubId: selectedClubId,
      groupId: typeof filter === 'number' ? filter : undefined,
      pinned: false,
      mentions: privateCoachId ? [privateCoachId] : [],
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [newMessage, selectedClubId, filter, privateCoachId, currentUserId]);

  const scrollToPinned = useCallback((id: number) => {
    const idx = sortedMessages.findIndex(m => m.id === id);
    if (idx >= 0) flatRef.current?.scrollToIndex({ index: idx, animated: true });
  }, [sortedMessages]);

  const handleContactCoach = useCallback((coach: ChatUser) => {
    setPrivateCoachId(coach.id);
    setFilter('global');
    setShowMembers(false);
    setShowGroupPicker(false);
  }, []);

  const handleBackToGeneral = useCallback(() => {
    setPrivateCoachId(null);
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerAccent, { backgroundColor: Accent }]} />
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={[styles.clubDot, { backgroundColor: Accent }]} />
            <View>
              <ThemedText style={[styles.clubName, { color: theme.text }]}>
                {club?.name ?? 'Chat'}
              </ThemedText>
              <ThemedText style={[styles.clubSub, { color: theme.textSecondary }]}>
                {club?.city}
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => setShowMembers(!showMembers)}
            style={[styles.coachIndicator, { borderColor: showMembers ? Accent : theme.hairline }]}
          >
            <Ionicons
              name="people"
              size={14}
              color={showMembers ? Accent : theme.textSecondary}
            />
          </Pressable>
        </View>

        {/* Filtre */}
        {!privateCoach ? (
          <Pressable onPress={() => setShowGroupPicker(!showGroupPicker)} style={styles.filterRow}>
            <View style={[styles.filterPill, { backgroundColor: theme.hairline }]}>
              <Ionicons
                name={typeof filter === 'number' ? 'chatbubble-ellipses' : 'globe-outline'}
                size={13}
                color={Accent}
              />
              <ThemedText style={[styles.filterLabel, { color: theme.text }]}>{groupLabel}</ThemedText>
              <Ionicons name={showGroupPicker ? 'chevron-up' : 'chevron-down'} size={12} color={theme.textSecondary} />
            </View>
            {groupParticipants.length > 0 && (
              <ThemedText style={[styles.participantCount, { color: theme.textSecondary }]}>
                {groupParticipants.map(u => u.prenom).join(', ')}
              </ThemedText>
            )}
          </Pressable>
        ) : (
          <Pressable onPress={handleBackToGeneral} style={styles.filterRow}>
            <View style={[styles.filterPill, { backgroundColor: Accent + '15' }]}>
              <Ionicons name="lock-closed" size={13} color={Accent} />
              <ThemedText style={[styles.filterLabel, { color: Accent }]}>{groupLabel}</ThemedText>
              <Ionicons name="close-circle" size={14} color={Accent} />
            </View>
            <ThemedText style={[styles.participantCount, { color: theme.textSecondary }]}>
              Message privé — seul {privateCoach?.prenom} verra votre message
            </ThemedText>
          </Pressable>
        )}

        {/* Group picker */}
        {showGroupPicker && !privateCoach && (
          <View style={[styles.groupPicker, { backgroundColor: theme.background, borderColor: theme.hairline }]}>
            <Pressable
              style={[styles.groupItem, filter === 'global' && { backgroundColor: Accent + '10' }]}
              onPress={() => { setFilter('global'); setShowGroupPicker(false); }}
            >
              <Ionicons name="globe-outline" size={15} color={filter === 'global' ? Accent : theme.textSecondary} />
              <ThemedText style={[styles.groupItemText, { color: filter === 'global' ? Accent : theme.text }]}>
                Fil général
              </ThemedText>
            </Pressable>
            {groups.map(g => (
              <Pressable
                key={g.id}
                style={[styles.groupItem, filter === g.id && { backgroundColor: Accent + '10' }]}
                onPress={() => { setFilter(g.id); setShowGroupPicker(false); }}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={15}
                  color={filter === g.id ? Accent : theme.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.groupItemText, { color: filter === g.id ? Accent : theme.text }]}>
                    {g.name}
                  </ThemedText>
                  <ThemedText style={[styles.groupItemSub, { color: theme.textSecondary }]}>
                    {getGroupParticipants(g).map(u => u.prenom).join(', ')}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Member list */}
        {showMembers && (
          <MemberList
            users={clubUsers}
            currentUserId={currentUserId}
            onContact={handleContactCoach}
            onClose={() => setShowMembers(false)}
            theme={theme}
          />
        )}
      </View>

      {/* Messages épinglés */}
      {pinnedMessages.length > 0 && !privateCoach && (
        <View style={[styles.pinnedSection, { borderBottomColor: theme.hairline }]}>
          {pinnedMessages.map(pm => (
            <PinnedBanner key={pm.id} message={pm} onPress={() => scrollToPinned(pm.id)} />
          ))}
        </View>
      )}

      <Animated.View style={{ flex: 1, paddingBottom: keyboardAnim }}>
        {/* Liste des messages */}
        <FlatList
          ref={flatRef}
          data={sortedMessages}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={40} color={theme.hairline} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Aucun message dans ce fil
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => <MessageBubble message={item} />}
        />

        {/* Barre de saisie */}
        <View style={[styles.inputBar, { borderTopColor: theme.hairline }]}>
          <View style={[styles.inputOuter, { backgroundColor: theme.hairline }]}>
            <TextInput
              ref={inputRef}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={
                privateCoach
                  ? `Message privé à ${privateCoach.prenom}…`
                  : isCoach
                    ? 'Envoyer un message au groupe…'
                    : 'Envoyer un message…'
              }
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              multiline
            />
          </View>
          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: newMessage.trim() ? Accent : theme.hairline }]}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={16} color={newMessage.trim() ? '#FFFFFF' : theme.textSecondary} />
          </Pressable>
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  headerAccent: {
    height: 3,
    width: 48,
    borderRadius: 2,
    marginBottom: Spacing.three,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clubDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  clubName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  clubSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  coachIndicator: {
    borderRadius: Radii.sm,
    borderWidth: 1,
    padding: 6,
  },
  filterRow: {
    gap: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.md,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  participantCount: {
    fontSize: 11,
    fontWeight: '500',
    paddingLeft: Spacing.two,
  },
  groupPicker: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  groupItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupItemSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  memberPanel: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginTop: Spacing.two,
    maxHeight: 340,
    overflow: 'hidden',
  },
  memberPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  memberPanelTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  memberPanelClose: {
    padding: 4,
  },
  memberScroll: {
    maxHeight: 280,
  },
  memberSection: {
    paddingTop: Spacing.two,
  },
  memberSectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 0.5,
  },
  memberAvatarSm: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pinnedSection: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: 4,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bubbleOuter: {
    marginBottom: 10,
  },
  bubbleInner: {
    borderRadius: Radii.lg,
    padding: 12,
    gap: 4,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bubbleContent: {},
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  showMore: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  coachBadge: {
    borderRadius: Radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  coachBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  senderName: {
    fontSize: 12,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  mention: {
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
  },
  inputOuter: {
    flex: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: {
    fontSize: 14,
    fontWeight: '500',
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
