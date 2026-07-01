import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth';
import { ThemeModeProvider, useThemeMode } from '@/hooks/use-theme-mode';
import { configureNotificationHandler, requestNotificationPermissions } from '@/lib/notifications';

function RootLayoutInner() {
  const { mode } = useThemeMode();
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  // Initialiser les notifications au démarrage
  useEffect(() => {
    configureNotificationHandler();
    requestNotificationPermissions().then(granted => {
      console.log('[layout] Notifications permissions:', granted);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/accueil');
    }
  }, [user, isLoading, segments]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

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
