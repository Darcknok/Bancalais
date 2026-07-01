import { useCallback, useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchFeedback, saveFeedback } from '@/lib/api';

const STORAGE_PREFIX = 'race_feedback_';

function storageKey(competitionId: string, eventId: string, typeTour: string): string {
  return `${STORAGE_PREFIX}${competitionId}_${eventId}_${typeTour}`;
}

type Feedback = {
  ressenti: string;
  pointsForts: string;
  pointsFaibles: string;
};

export default function RaceFeedbackScreen() {
  const theme = useTheme();
  const { competitionId, eventId, nage, typeTour, date, nageurIUF } = useLocalSearchParams<{
    competitionId: string;
    eventId: string;
    nage: string;
    typeTour: string;
    date: string;
    nageurIUF: string;
  }>();

  const [feedback, setFeedback] = useState<Feedback>({ ressenti: '', pointsForts: '', pointsFaibles: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing feedback: from API then fallback to AsyncStorage
  useEffect(() => {
    if (!competitionId || !eventId || !typeTour) return;

    const loadFromApi = async () => {
      if (!nageurIUF) return null;
      const iuf = parseInt(nageurIUF, 10);
      if (isNaN(iuf)) return null;

      const { data, error } = await fetchFeedback({
        competition_id: parseInt(competitionId, 10),
        event_id: parseInt(eventId, 10),
        type_tour: typeTour,
        nageur_iuf: iuf,
      });
      if (data?.feedback) {
        return {
          ressenti: data.feedback.ressenti || '',
          pointsForts: data.feedback.points_forts || '',
          pointsFaibles: data.feedback.ameliorer || '',
        } as Feedback;
      }
      return null;
    };

    const loadFromStorage = async (): Promise<Feedback | null> => {
      const key = storageKey(competitionId, eventId, typeTour);
      const json = await AsyncStorage.getItem(key);
      if (json) {
        try {
          const parsed = JSON.parse(json) as Feedback;
          if (parsed.ressenti || parsed.pointsForts || parsed.pointsFaibles) {
            return parsed;
          }
        } catch { /* ignore */ }
      }
      return null;
    };

    (async () => {
      // Try API first
      const apiFeedback = await loadFromApi();
      if (apiFeedback) {
        setFeedback(apiFeedback);
        setSaved(true);
      } else {
        // Fallback to AsyncStorage
        const localFeedback = await loadFromStorage();
        if (localFeedback) {
          setFeedback(localFeedback);
          setSaved(true);
        }
      }
      setLoading(false);
    })();
  }, [competitionId, eventId, typeTour, nageurIUF]);

  const handleSave = useCallback(async () => {
    if (!competitionId || !eventId || !typeTour) return;
    setSaving(true);

    // Always save to AsyncStorage
    const key = storageKey(competitionId, eventId, typeTour);
    await AsyncStorage.setItem(key, JSON.stringify(feedback));

    // Try to save to API if we have a nageurIUF
    let apiFailed = false;
    if (nageurIUF) {
      const iuf = parseInt(nageurIUF, 10);
      if (!isNaN(iuf)) {
        const { error } = await saveFeedback({
          competition_id: parseInt(competitionId, 10),
          event_id: parseInt(eventId, 10),
          type_tour: typeTour,
          nage: decodeURIComponent(nage || ''),
          date: date || '',
          nageur_iuf: iuf,
          ressenti: feedback.ressenti,
          points_forts: feedback.pointsForts,
          ameliorer: feedback.pointsFaibles,
        });
        if (error) {
          console.warn('[feedback] save to API failed:', error);
          apiFailed = true;
        }
      }
    }

    setSaving(false);
    setSaved(true);
    if (apiFailed) {
      Alert.alert(
        'Sauvegardé localement',
        'La synchronisation avec le serveur a échoué. Tes données sont conservées sur cet appareil.',
      );
    } else {
      Alert.alert('Enregistré', 'Ton ressenti a bien été sauvegardé.');
    }
  }, [competitionId, eventId, typeTour, nageurIUF, nage, date, feedback]);

  const hasContent = feedback.ressenti || feedback.pointsForts || feedback.pointsFaibles;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Pressable onPress={() => router.back()} style={styles.backRow}>
            <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.backText, { color: theme.textSecondary }]}>Retour</ThemedText>
          </Pressable>

          <DoubleBezelCard accent style={[Shadows.medium as any]}>
            <View style={styles.headerTop}>
              <View style={[styles.headerIcon, { backgroundColor: Accent + '15' }]}>
                <Ionicons name="stopwatch-outline" size={18} color={Accent} />
              </View>
              <View style={styles.headerInfo}>
                <ThemedText style={[styles.headerNage, { color: theme.text }]}>{decodeURIComponent(nage || '')}</ThemedText>
                <ThemedText style={[styles.headerMeta, { color: theme.textSecondary }]}>
                  {typeTour ? decodeURIComponent(typeTour) : ''}{date ? ` — ${decodeURIComponent(date)}` : ''}
                </ThemedText>
              </View>
            </View>
          </DoubleBezelCard>

          {/* Feedback form */}
          <DoubleBezelCard style={[Shadows.soft as any, { marginTop: Spacing.three }]}>
            <View style={styles.formSection}>
              {/* Ressenti */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="happy-outline" size={16} color={Accent} />
                  <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>Ressenti</ThemedText>
                </View>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                  placeholder="Comment t'es-tu senti(e) pendant cette course ?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={feedback.ressenti}
                  onChangeText={t => { setFeedback(f => ({ ...f, ressenti: t })); setSaved(false); }}
                />
              </View>

              {/* Points forts */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="trending-up-outline" size={16} color="#22C55E" />
                  <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>Points forts</ThemedText>
                </View>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                  placeholder="Ce qui a bien fonctionné..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={feedback.pointsForts}
                  onChangeText={t => { setFeedback(f => ({ ...f, pointsForts: t })); setSaved(false); }}
                />
              </View>

              {/* Points à améliorer */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="trending-down-outline" size={16} color="#EF4444" />
                  <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>À améliorer</ThemedText>
                </View>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.hairline }]}
                  placeholder="Ce que tu veux travailler pour la prochaine fois..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={feedback.pointsFaibles}
                  onChangeText={t => { setFeedback(f => ({ ...f, pointsFaibles: t })); setSaved(false); }}
                />
              </View>

              {/* Save button */}
              <View style={styles.saveRow}>
                {saved && hasContent && (
                  <View style={styles.savedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                    <ThemedText style={[styles.savedText, { color: '#22C55E' }]}>Sauvegardé</ThemedText>
                  </View>
                )}
                <Pressable
                  onPress={handleSave}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: Accent, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="save-outline" size={16} color="#fff" />
                  <ThemedText style={styles.saveButtonText}>Enregistrer</ThemedText>
                </Pressable>
              </View>
            </View>
          </DoubleBezelCard>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ThemedText style={[{ color: theme.textSecondary, fontSize: 12 }]}>Chargement...</ThemedText>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: Spacing.two, paddingVertical: 4,
  },
  backText: { fontSize: 13, fontWeight: '500' },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.three,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: { gap: 3, flex: 1 },
  headerNage: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  headerMeta: { fontSize: 11, fontWeight: '500' },
  formSection: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  fieldLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  fieldLabel: {
    fontSize: 14, fontWeight: '700',
  },
  textArea: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.two,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
  },
  saveRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: Spacing.two, marginTop: Spacing.one,
  },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  savedText: { fontSize: 12, fontWeight: '600' },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radii.md,
  },
  saveButtonText: {
    color: '#fff', fontSize: 13, fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
});
