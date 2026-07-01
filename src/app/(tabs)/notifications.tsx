import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import {
  fetchNotifications,
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead as apiMarkAllRead,
  deleteNotification as apiDeleteNotif,
  type ApiNotification,
} from '@/lib/api';

const typeConfig: Record<string, { icon: string; label: string }> = {
  coach: { icon: 'megaphone', label: 'Annonce' },
  system: { icon: 'notifications', label: 'Système' },
  reminder: { icon: 'calendar', label: 'Rappel' },
};

function NotificationItem({
  notif,
  read,
  onPress,
  theme,
}: {
  notif: ApiNotification;
  read: boolean;
  onPress: () => void;
  theme: Record<string, string>;
}) {
  const config = typeConfig[notif.type] ?? { icon: 'notifications', label: 'Notification' };

  return (
    <Pressable onPress={onPress}>
      <DoubleBezelCard
        accent={!read}
        style={!read ? { borderLeftWidth: 3, borderLeftColor: Accent } : undefined}
      >
        <View style={read ? { opacity: 0.65 } : undefined}>
          <View style={styles.notifHeader}>
            <View style={[styles.notifIcon, { backgroundColor: Accent + '12' }]}>
              <Ionicons name={config.icon as any} size={14} color={Accent} />
            </View>
            <View style={styles.notifInfo}>
              <View style={styles.notifTitleRow}>
                <ThemedText
                  style={[
                    styles.notifTitle,
                    { color: theme.text },
                    !read && { fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {notif.title}
                </ThemedText>
                <View style={[styles.notifType, { backgroundColor: Accent + '10' }]}>
                  <ThemedText style={[styles.notifTypeText, { color: Accent }]}>
                    {config.label}
                  </ThemedText>
                </View>
              </View>
              <ThemedText
                style={[styles.notifBody, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {notif.body}
              </ThemedText>
              <ThemedText style={[styles.notifTime, { color: theme.textSecondary }]}>
                {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </ThemedText>
            </View>
            {!read && <View style={[styles.unreadDot, { backgroundColor: Accent }]} />}
          </View>
        </View>
      </DoubleBezelCard>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<ApiNotification | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchNotifications();
    if (res.data?.notifications) {
      setNotifications(res.data.notifications);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = notifications.filter(n => {
    const readBy: number[] = (n.read_by ?? []) as number[];
    return user ? !readBy.includes(user.id) : false;
  }).length;

  const openNotif = useCallback(async (notif: ApiNotification) => {
    setSelectedNotif(notif);
    // Marquer comme lu quand on ouvre
    if (user && !((notif.read_by ?? []) as number[]).includes(user.id)) {
      await apiMarkRead(notif.id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notif.id
            ? { ...n, read_by: [...(n.read_by ?? []), user.id] }
            : n,
        ),
      );
    }
  }, [user]);

  const closeNotif = useCallback(() => {
    setSelectedNotif(null);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await apiDeleteNotif(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSelectedNotif(null);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await apiMarkAllRead();
    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        read_by: user ? [...new Set([...(n.read_by ?? []), user.id])] : n.read_by,
      })),
    );
  }, [user]);

  const renderItem = useCallback(
    ({ item }: { item: ApiNotification }) => {
      const read = user ? ((item.read_by ?? []) as number[]).includes(user.id) : false;
      return <NotificationItem notif={item} read={read} onPress={() => openNotif(item)} theme={theme} />;
    },
    [openNotif, theme, user],
  );

  const config = selectedNotif ? typeConfig[selectedNotif.type] ?? { icon: 'notifications', label: 'Notification' } : null;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.accentLine, { backgroundColor: Accent }]} />
        <View style={styles.headerRow}>
          <ThemedText style={[styles.title, { color: theme.text }]}>Activité</ThemedText>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <ThemedText style={[styles.markAllText, { color: Accent }]}>
                Tout marquer lu
              </ThemedText>
            </Pressable>
          )}
        </View>
        {unreadCount > 0 && (
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </ThemedText>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={load}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={theme.hairline} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              {loading ? 'Chargement…' : 'Aucune notification'}
            </ThemedText>
          </View>
        }
      />

      <Modal visible={selectedNotif != null} transparent animationType="fade" onRequestClose={closeNotif}>
        <View style={modalOverlay}>
          <View style={[modalCard, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: Accent + '12' }]}>
                <Ionicons name={config?.icon as any} size={18} color={Accent} />
              </View>
              <View style={styles.modalHeaderInfo}>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]} numberOfLines={2}>
                  {selectedNotif?.title}
                </ThemedText>
                {selectedNotif && (
                  <ThemedText style={[styles.modalMeta, { color: theme.textSecondary }]}>
                    {new Date(selectedNotif.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </ThemedText>
                )}
              </View>
              <Pressable onPress={closeNotif} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={[styles.modalTagRow]}>
              <View style={[styles.modalTag, { backgroundColor: Accent + '10' }]}>
                <ThemedText style={[styles.modalTagText, { color: Accent }]}>
                  {config?.label}
                </ThemedText>
              </View>
            </View>

            <ScrollView style={styles.modalBodyScroll}>
              <ThemedText style={[styles.modalBody, { color: theme.text }]}>
                {selectedNotif?.body}
              </ThemedText>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => selectedNotif && handleDelete(selectedNotif.id)}
                style={[styles.modalDeleteBtn, { borderColor: theme.hairline }]}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <ThemedText style={[styles.modalDeleteText, { color: '#EF4444' }]}>Supprimer</ThemedText>
              </Pressable>
              <Pressable onPress={closeNotif} style={styles.modalDone}>
                <ThemedText style={[styles.modalDoneText, { color: '#fff' }]}>Fermer</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const modalOverlay: any = {
  flex: 1, justifyContent: 'center', alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.four,
};

const modalCard: any = {
  width: '100%', maxWidth: 420, borderRadius: Radii.lg, padding: Spacing.five,
  gap: Spacing.three, maxHeight: '80%',
  shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  accentLine: { height: 3, width: 48, borderRadius: 2, marginBottom: Spacing.three },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  markAllBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  markAllText: { fontSize: 12, fontWeight: '600' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  list: { padding: Spacing.four, paddingTop: Spacing.two },
  notifHeader: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  notifIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  notifInfo: { flex: 1, gap: 2 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  notifTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  notifType: { borderRadius: Radii.sm, paddingHorizontal: 5, paddingVertical: 1 },
  notifTypeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifBody: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  notifTime: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.three },
  emptyText: { fontSize: 14, fontWeight: '500' },
  modalHeader: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  modalIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  modalHeaderInfo: { flex: 1, gap: 2 },
  modalTitle: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  modalMeta: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  modalClose: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalTagRow: { flexDirection: 'row' },
  modalTag: { borderRadius: Radii.sm, paddingHorizontal: 8, paddingVertical: 2 },
  modalTagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalBodyScroll: { maxHeight: 300 },
  modalBody: { fontSize: 15, fontWeight: '500', lineHeight: 22, paddingTop: Spacing.one },
  modalActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  modalDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.three,
    borderRadius: Radii.md, borderWidth: 1,
  },
  modalDeleteText: { fontSize: 13, fontWeight: '600' },
  modalDone: {
    flex: 1, paddingVertical: Spacing.three, borderRadius: Radii.md, backgroundColor: Accent, alignItems: 'center',
  },
  modalDoneText: { fontSize: 14, fontWeight: '600' },
});
