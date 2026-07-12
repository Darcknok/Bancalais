/**
 * Layout de la barre de navigation inférieure (tabs) — Bancalais Natation.
 *
 * Ce fichier définit la navigation principale de l'application avec :
 * - Une barre de tabs personnalisée (pas le Tab Navigator natif d'Expo Router)
 * - Des onglets configurables selon le rôle de l'utilisateur :
 *     • Tous les rôles : Accueil, Planning, Activité (notifications), Profil
 *     • Admin serveur (id=1) : onglet Serveur supplémentaire
 * - Un compteur de notifications non lues sur l'onglet Activité
 * - Des animations de pression (spring) sur chaque onglet
 * - Un design glassmorphism / floating bar avec coins arrondis
 *
 * Les écrans disponibles dans le Stack sous-jacent :
 *   accueil, planning, race-feedback, notifications, coach, reglages, serveur, developpeur
 *
 * Note : le chat est désactivé en attendant une refonte.
 */

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

function TabButton({ tab, isActive, onPress, theme }: {
  tab: { name: string; label: string; icon: string; iconActive: string; badge?: number };
  isActive: boolean;
  onPress: () => void;
  theme: Record<string, string>;
}) {
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
      onPress={onPress}
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
}

export default function TabLayout() {
  const theme = useTheme();
  const segments = useSegments();
  // Détermine l'onglet actif depuis l'URL (segments[1] = nom du tab)
  const activeTab = segments[1] ?? 'accueil';
  const { user, isCoach } = useAuth();
  // Compteur de notifications non lues pour le badge
  const [unread, setUnread] = useState(0);
  const insets = useSafeAreaInsets();

  // --- Chargement du nombre de notifications non lues ---
  const loadUnread = useCallback(async () => {
    if (!user) { setUnread(0); return; }
    const res = await fetchUnreadCount();
    if (res.data) setUnread(res.data.count);
  }, [user]);

  useEffect(() => { loadUnread(); }, [loadUnread]);

  // Rafraîchir le compteur quand l'onglet notifications devient actif
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadUnread();
    }
  }, [activeTab, loadUnread]);

  // Vérification spéciale : seul l'utilisateur avec id=1 a accès à l'onglet Serveur
  const isServerAdmin = user?.id === 1;

  // --- Définition des onglets ---
  // Chaque tab définit : nom de route, label affiché, icônes (inactive/active), et badge optionnel
  const tabs: Array<{ name: string; label: string; icon: string; iconActive: string; badge?: number }> = [
    { name: 'accueil', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
    { name: 'planning', label: 'Planning', icon: 'calendar-outline', iconActive: 'calendar' },
    // Chat désactivé pour le moment
    // { name: 'chat', label: 'Chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
    { name: 'notifications', label: 'Activité', icon: 'notifications-outline', iconActive: 'notifications', badge: unread },
    // Onglet Serveur visible uniquement pour l'admin serveur (id=1)
    ...(isServerAdmin ? [{ name: 'serveur' as const, label: 'Serveur', icon: 'server-outline', iconActive: 'server' }] : []),
    { name: 'reglages', label: 'Profil', icon: 'person-outline', iconActive: 'person' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Zone de contenu principal : le Stack Navigator occupe tout l'espace disponible */}
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
          <Stack.Screen name="serveur" />
          <Stack.Screen name="developpeur" />
          <Stack.Screen name="create-competition" />
        </Stack>
      </View>

      {/* Barre de navigation inférieure floating avec effet glassmorphism */}
      <View style={[
        styles.outerShell,
        { paddingBottom: Math.max(insets.bottom, Spacing.two) },
      ]}>
        <ThemedView style={styles.innerCore}>
          {tabs.map(tab => (
            <TabButton
              key={tab.name}
              tab={tab}
              isActive={activeTab === tab.name}
              onPress={() => router.push(`/(tabs)/${tab.name}` as any)}
              theme={theme}
            />
          ))}
        </ThemedView>
      </View>
    </View>
  );
}

// --- Styles ---
// Layout : root (container flex), slot (zone Stack), outerShell (marge barre),
// innerCore (barre elle-même), tabButton/tabInner (chaque onglet),
// badge/badgeText (compteur de notifications)
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
