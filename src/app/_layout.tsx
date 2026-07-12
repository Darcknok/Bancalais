/**
 * Layout racine de l'application mobile Bancalais Natation.
 *
 * Ce fichier définit la structure de navigation globale de l'app :
 * - Gestion de l'authentification : redirige vers /login si non connecté,
 *   vers l'accueil si connecté.
 * - Thème : adapte la barre de statut (clair/sombre) selon la préférence utilisateur.
 * - Notifications : initialise le système de notifications au démarrage de l'app.
 * - Navigation : utilise un Stack navigator natif avec trois écrans racine :
 *     - index (splash/redirect)
 *     - (auth) : écrans d'authentification (login, register)
 *     - (tabs) : application principale avec barre de navigation inférieure
 *
 * Hiérarchie des providers :
 *   SafeAreaProvider > ThemeModeProvider > AuthProvider > RootLayoutInner
 */

import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth';
import { ThemeModeProvider, useThemeMode } from '@/hooks/use-theme-mode';
import { initNotifications } from '@/lib/notifications';
import NotificationScheduler from '@/components/notification-scheduler';

/**
 * Composant racine interne — placé à l'intérieur de tous les providers.
 * Contient la logique de navigation conditionnelle et le rendu du Stack.
 */
function RootLayoutInner() {
  const { mode } = useThemeMode();
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  // --- Initialisation des notifications au démarrage ---
  // Configure les handlers push, demande les permissions, crée les canaux Android,
  // et enregistre les écouteurs d'événements.
  useEffect(() => {
    initNotifications();
  }, []);

  // --- Redirection automatique selon l'état d'authentification ---
  // Si l'utilisateur n'est pas connecté et n'est pas sur un écran d'auth → login
  // Si l'utilisateur est connecté mais sur un écran d'auth → accueil
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/accueil');
    }
  }, [user, isLoading, segments]);

  // --- Rendu ---
  return (
    <>
      {/* Planificateur de notifications en arrière-plan */}
      <NotificationScheduler />
      {/* Barre de statut adaptée au thème (texte clair sur fond sombre, et inversement) */}
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {/* Stack navigator avec headers masqués (gérés manuellement par écran) */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

/**
 * Composant racine exporté — enveloppe toute l'app dans les providers :
 * 1. SafeAreaProvider : gère les zones de sécurité (encoche, barre inférieure)
 * 2. ThemeModeProvider : fournit le thème clair/sombre + bascule
 * 3. AuthProvider : gère l'état d'authentification global
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeModeProvider>
        <AuthProvider>
          <RootLayoutInner />
        </AuthProvider>
      </ThemeModeProvider>
    </SafeAreaProvider>
  );
}
