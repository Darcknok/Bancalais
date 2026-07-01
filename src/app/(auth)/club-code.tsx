import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '@/context/auth';
import { lookupClub, fetchClubs, type ApiClub } from '@/lib/api';

export default function ClubCodeScreen() {
  const theme = useTheme();
  const { user, changeClub } = useAuth();

  const [code, setCode] = useState('');
  const [validatedClub, setValidatedClub] = useState<ApiClub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [allClubs, setAllClubs] = useState<ApiClub[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await fetchClubs();
      if (data?.clubs) setAllClubs(data.clubs);
    })();
  }, []);

  const currentClub = user?.clubId ? allClubs.find(c => c.id === user.clubId) ?? null : null;

  const handleVerify = useCallback(async () => {
    setError(null);
    setValidatedClub(null);

    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Veuillez entrer un code');
      return;
    }

    const { data, error: apiError } = await lookupClub(trimmed);
    if (apiError || !data?.club) {
      setError(apiError ?? 'Code invalide');
      return;
    }

    setValidatedClub(data.club);
  }, [code]);

  const handleJoin = useCallback(() => {
    if (!validatedClub) return;
    setLoading(true);
    changeClub(validatedClub.id, code.trim().toUpperCase());
    router.back();
  }, [validatedClub, code, changeClub]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.accentBar, { backgroundColor: theme.text }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Code de parrainage
          </ThemedText>
          <View style={styles.headerRight} />
        </View>

        {currentClub && (
          <View style={[styles.currentClubBanner, { backgroundColor: theme.hairline }]}>
            <Ionicons name="checkmark-circle" size={18} color={theme.success} />
            <ThemedText style={[styles.currentClubText, { color: theme.textSecondary }]}>
              Club actuel : {currentClub.name} ({currentClub.city})
            </ThemedText>
          </View>
        )}

        <View style={styles.formWrapper}>
          <DoubleBezelCard style={styles.card}>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Entrez le code de votre club pour le rejoindre
            </ThemedText>

            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                Code
              </ThemedText>
              <TextInput
                value={code}
                onChangeText={text => {
                  setCode(text);
                  if (validatedClub) setValidatedClub(null);
                  if (error) setError(null);
                }}
                placeholder="ex: CNB-2026"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
            </View>

            {error && (
              <ThemedText style={[styles.errorText, { color: theme.danger }]}>
                {error}
              </ThemedText>
            )}

            {!validatedClub ? (
              <Pressable
                onPress={handleVerify}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: theme.text,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <ThemedText style={[styles.buttonText, { color: theme.background }]}>
                  Vérifier et rejoindre
                </ThemedText>
              </Pressable>
            ) : (
              <View style={styles.validatedSection}>
                <View
                  style={[styles.clubPreview, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                >
                  <View style={styles.clubIcon}>
                    <Ionicons name="water" size={22} color={Accent} />
                  </View>
                  <View style={styles.clubInfo}>
                    <ThemedText style={[styles.clubName, { color: theme.text }]}>
                      {validatedClub.name}
                    </ThemedText>
                    <ThemedText style={[styles.clubCity, { color: theme.textSecondary }]}>
                      {validatedClub.city}
                    </ThemedText>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={theme.success} />
                </View>

                <Pressable
                  onPress={handleJoin}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: Accent,
                      opacity: loading ? 0.5 : pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
                    {loading ? 'Adhésion…' : 'Rejoindre ce club'}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </DoubleBezelCard>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  accentBar: {
    height: 3,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 38,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  currentClubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.md,
    marginBottom: Spacing.three,
  },
  currentClubText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  card: {
    gap: Spacing.three,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    paddingBottom: Spacing.one,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 17,
    fontWeight: '500',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.md,
    height: 50,
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    height: 52,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  validatedSection: {
    gap: Spacing.three,
  },
  clubPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  clubIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: {
    flex: 1,
    gap: 2,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
  },
  clubCity: {
    fontSize: 13,
    fontWeight: '500',
  },
});
