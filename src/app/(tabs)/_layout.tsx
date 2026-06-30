import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { fetchUnreadCount } from '@/lib/api';

export default function TabLayout() {
  const theme = useTheme();
  const segments = useSegments();
  const activeTab = segments[1] ?? 'accueil';
  const { user, isCoach } = useAuth();
  const [unread, setUnread] = useState(0);
  const insets = useSafeAreaInsets();

  const loadUnread = useCallback(async () => {
    if (!user) { setUnread(0); return; }
    const res = await fetchUnreadCount();
    if (res.data) setUnread(res.data.count);
  }, [user]);

  useEffect(() => { loadUnread(); }, [loadUnread]);

  // Refresh unread count when notifications tab becomes active
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadUnread();
    }
  }, [activeTab, loadUnread]);

  const tabs: Array<{ name: string; label: string; icon: string; iconActive: string; badge?: number }> = [
    { name: 'accueil', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
    { name: 'planning', label: 'Planning', icon: 'calendar-outline', iconActive: 'calendar' },
    // Chat désactivé pour le moment
    // { name: 'chat', label: 'Chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
    { name: 'notifications', label: 'Activité', icon: 'notifications-outline', iconActive: 'notifications', badge: unread },
    { name: 'reglages', label: 'Profil', icon: 'person-outline', iconActive: 'person' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.slot}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="accueil" />
          <Stack.Screen name="planning" />
          <Stack.Screen name="race-feedback" />
          {/* Chat désactivé pour le moment */}
          {/* <Stack.Screen name="chat" /> */}
          <Stack.Screen name="notifications" />
          <Stack.Screen name="coach" />
          <Stack.Screen name="reglages" />
          <Stack.Screen name="developpeur" />
        </Stack>
      </View>

      <View style={[
        styles.outerShell,
        { paddingBottom: Math.max(insets.bottom, Spacing.two) },
      ]}>
        <ThemedView style={styles.innerCore}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.name;
            const scale = useRef(new Animated.Value(1)).current;

            const onPressIn = () => {
              Animated.spring(scale, {
                toValue: 0.92,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
              }).start();
            };

            const onPressOut = () => {
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 8,
              }).start();
            };

            return (
              <Pressable
                key={tab.name}
                onPress={() => router.push(`/(tabs)/${tab.name}` as any)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.tabButton}
              >
                <Animated.View style={[{ transform: [{ scale }] }, styles.tabInner, isActive && { backgroundColor: Accent + '12' }]}>
                  <View>
                    <Ionicons
                      name={(isActive ? tab.iconActive : tab.icon) as any}
                      size={20}
                      color={isActive ? Accent : undefined}
                    />
                    {tab.badge != null && tab.badge > 0 && (
                      <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                        <ThemedText style={styles.badgeText}>
                          {tab.badge > 9 ? '9+' : tab.badge}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText
                    style={[
                      styles.tabLabel,
                      { color: isActive ? Accent : theme.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </ThemedText>
                </Animated.View>
              </Pressable>
            );
          })}
        </ThemedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  outerShell: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
  },
  innerCore: {
    flexDirection: 'row',
    borderRadius: Radii.xl,
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.lg,
    minWidth: 48,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
