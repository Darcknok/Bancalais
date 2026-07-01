import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

export default function HomeScreen() {
  const theme = useTheme();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = useCallback(() => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      router.replace('/(tabs)/accueil');
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 800);
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable onPress={handlePress} style={styles.tapArea}>
        <View style={[styles.accentBar, { backgroundColor: theme.text }]} />

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <View style={[styles.titleDot, { backgroundColor: theme.text }]} />
            <ThemedText style={[styles.title, { color: theme.text }]}>Bancalais</ThemedText>
          </View>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>Natation</ThemedText>

          <View style={[styles.divider, { backgroundColor: theme.hairline }]} />

          <DoubleBezelCard style={{ alignSelf: 'stretch', marginHorizontal: Spacing.two }}>
            <ThemedText style={[styles.message, { color: theme.text }]}>
              Application en cours de construction
            </ThemedText>
            <ThemedText style={[styles.note, { color: theme.textSecondary }]}>
              Revenez bientôt
            </ThemedText>
          </DoubleBezelCard>
        </View>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tapArea: {
    flex: 1,
  },
  accentBar: {
    height: 3,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginTop: Spacing.one,
  },
  divider: {
    width: 40,
    height: 1,
    marginVertical: Spacing.four,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
