import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth';
import { ThemeModeProvider, useThemeMode } from '@/hooks/use-theme-mode';
import { configureNotificationHandler, requestNotificationPermissions } from '@/lib/notifications';

// Initialiser le handler de notification au niveau du module
configureNotificationHandler();

function RootLayoutInner() {
  const { mode } = useThemeMode();
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  // Demander les permissions de notification au démarrage
  useEffect(() => {
    requestNotificationPermissions();
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
