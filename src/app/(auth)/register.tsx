import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

export default function RegisterScreen() {
  const theme = useTheme();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await register({
        email: email.trim(),
        password,
        prenom: prenom.trim(),
        nom: nom.trim(),
        role: 'swimmer',
        referralCode: referralCode.trim() || undefined,
      });
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
  }, [email, password, prenom, nom, referralCode, register]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.accentBar, { backgroundColor: theme.text }]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft} />
            <ThemedText style={[styles.title, { color: theme.text }]}>
              Créer un compte
            </ThemedText>
            <View style={styles.headerLeft} />
          </View>

          <View style={styles.formWrapper}>
            <DoubleBezelCard style={styles.card}>
              <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                  Prénom
                </ThemedText>
                <TextInput
                  value={prenom}
                  onChangeText={setPrenom}
                  placeholder="Jean"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="givenName"
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
              </View>

              <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                  Nom
                </ThemedText>
                <TextInput
                  value={nom}
                  onChangeText={setNom}
                  placeholder="Dupont"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="familyName"
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
              </View>

              <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                  Email
                </ThemedText>
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
                    textContentType="newPassword"
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

              <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                <ThemedText style={[styles.labelOptional, { color: theme.textSecondary }]}>
                  Code de parrainage
                  <ThemedText style={[styles.optionalTag, { color: theme.textSecondary }]}>
                    {' '}— Optionnel
                  </ThemedText>
                </ThemedText>
                <TextInput
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="CODE10"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
                <ThemedText style={[styles.referralNote, { color: theme.textSecondary }]}>
                  Optionnel — permet de rejoindre un club
                </ThemedText>
                <ThemedText style={[styles.referralNote, { color: theme.textSecondary }]}>
                  Vous pourrez ajouter ou changer de club plus tard dans vos réglages.
                </ThemedText>
              </View>

              {error && (
                <ThemedText style={[styles.errorText, { color: theme.danger }]}>
                  {error}
                </ThemedText>
              )}

              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: theme.text,
                    opacity: loading ? 0.5 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <ThemedText style={[styles.buttonText, { color: theme.background }]}>
                  {loading ? 'Création…' : 'Créer mon compte'}
                </ThemedText>
              </Pressable>
            </DoubleBezelCard>

            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
                Déjà un compte ?
              </ThemedText>
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                style={({ pressed }) => [
                  styles.loginButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <ThemedText style={[styles.loginText, { color: theme.accent }]}>
                  Se connecter
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
  headerLeft: {
    width: 38,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
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
  labelOptional: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
    textTransform: 'none',
  },
  input: {
    fontSize: 17,
    fontWeight: '500',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.md,
    height: 50,
  },
  referralNote: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
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
  loginButton: {
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: Radii.md,
  },
  loginText: {
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
