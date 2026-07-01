import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const { mode, toggle } = useThemeMode();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result === null) {
        router.replace('/(tabs)/accueil');
      } else {
        setError(result);
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.accentBar, { backgroundColor: theme.text }]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <ThemedText style={[styles.title, { color: theme.text }]}>Connexion</ThemedText>
          <Pressable onPress={toggle} style={styles.toggleButton}>
            <Ionicons
              name={mode === 'dark' ? 'sunny' : 'moon'}
              size={22}
              color={theme.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.formWrapper}>
          <DoubleBezelCard style={styles.card}>
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Email</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="exemple@email.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
            </View>

            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                Mot de passe
              </ThemedText>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                    { flex: 1 },
                  ]}
                />
                <Pressable
                  onPress={() => setShowPassword(s => !s)}
                  style={[styles.eyeButton, { backgroundColor: theme.backgroundElement }]}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {error && (
              <ThemedText style={[styles.errorText, { color: theme.danger }]}>
                {error}
              </ThemedText>
            )}

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: theme.text,
                  opacity: loading ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemedText
                style={[styles.buttonText, { color: theme.background }]}
              >
                {loading ? 'Connexion…' : 'Connexion'}
              </ThemedText>
            </Pressable>
          </DoubleBezelCard>

          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
              Pas encore de compte ?
            </ThemedText>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              style={({ pressed }) => [
                styles.registerButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText style={[styles.registerText, { color: theme.accent }]}>
                Créer un compte
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
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
  headerLeft: {
    width: 38,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  toggleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {
    alignItems: 'center',
    marginTop: Spacing.five,
    gap: Spacing.three,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: Radii.md,
  },
  registerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.two,
  },
});
