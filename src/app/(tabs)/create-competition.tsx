/**
 * Écran de création manuelle d'une compétition (admin/coach).
 * Permet de définir les infos générales et d'ajouter des épreuves.
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { adminCreateCompetition, adminCreateEpreuve } from '@/lib/api';

type EpreuveForm = {
  key: string; // clé unique pour React
  nage: string;
  type_nage: 'crawl' | 'dos' | 'brass' | 'pap';
  heure: string;
};

const NAGE_OPTIONS: { label: string; value: EpreuveForm['type_nage'] }[] = [
  { label: 'Crawl', value: 'crawl' },
  { label: 'Dos', value: 'dos' },
  { label: 'Brasse', value: 'brass' },
  { label: 'Papillon', value: 'pap' },
];

let keyCounter = 0;
function nextKey() { return `ep_${++keyCounter}`; }

export default function CreateCompetitionScreen() {
  const theme = useTheme();

  // Infos générales
  const [lieu, setLieu] = useState('');
  const [date, setDate] = useState('');
  const [ouverturePortes, setOuverturePortes] = useState('');
  const [debutEpreuves, setDebutEpreuves] = useState('');
  const [pause, setPause] = useState('');
  const [remiseRecompenses, setRemiseRecompenses] = useState('');

  // Épreuves
  const [epreuves, setEpreuves] = useState<EpreuveForm[]>([]);
  const [saving, setSaving] = useState(false);

  const addEpreuve = useCallback(() => {
    setEpreuves(prev => [...prev, { key: nextKey(), nage: '', type_nage: 'crawl', heure: '' }]);
  }, []);

  const removeEpreuve = useCallback((key: string) => {
    setEpreuves(prev => prev.filter(e => e.key !== key));
  }, []);

  const updateEpreuve = useCallback((key: string, field: keyof EpreuveForm, value: string) => {
    setEpreuves(prev => prev.map(e => e.key === key ? { ...e, [field]: value } : e));
  }, []);

  const handleSave = async () => {
    if (!lieu.trim()) { Alert.alert('Erreur', 'Le lieu est requis.'); return; }
    if (!date.trim()) { Alert.alert('Erreur', 'La date est requise.'); return; }

    setSaving(true);
    try {
      // 1. Créer la compétition
      const compRes = await adminCreateCompetition({
        lieu: lieu.trim(),
        date: date.trim(),
        ouverture_portes: ouverturePortes.trim() || undefined,
        debut_epreuves: debutEpreuves.trim() || undefined,
        pause: pause.trim() || undefined,
        remise_recompenses: remiseRecompenses.trim() || undefined,
      });

      if (compRes.error) { Alert.alert('Erreur', compRes.error); setSaving(false); return; }
      const competitionId = compRes.data!.competition.id;

      // 2. Ajouter les épreuves une par une
      for (let i = 0; i < epreuves.length; i++) {
        const ep = epreuves[i];
        if (!ep.nage.trim()) continue;
        const epRes = await adminCreateEpreuve(competitionId, {
          nage: ep.nage.trim(),
          type_nage: ep.type_nage,
          heure: ep.heure.trim() || undefined,
          ordre: i + 1,
        });
        if (epRes.error) {
          console.warn(`[create-competition] Erreur création épreuve "${ep.nage}":`, epRes.error);
        }
      }

      Alert.alert(
        'Compétition créée !',
        `${lieu.trim()} — ${date.trim()}\n${epreuves.length} épreuve(s) ajoutée(s).`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      console.error('[create-competition] Erreur:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    fontSize: 14 as const,
    fontWeight: '500' as const,
    color: theme.text,
    backgroundColor: theme.backgroundElement,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: theme.hairline,
  };

  const typeNageColors: Record<EpreuveForm['type_nage'], string> = {
    crawl: '#059669',
    dos: '#2563EB',
    brass: '#D97706',
    pap: '#7C3AED',
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
          <ThemedText style={[styles.backText, { color: theme.textSecondary }]}>Retour</ThemedText>
        </Pressable>

        <ThemedText style={[styles.pageTitle, { color: theme.text }]}>Créer une compétition</ThemedText>

        {/* Section: Infos générales */}
        <DoubleBezelCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={16} color={Accent} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Informations générales</ThemedText>
          </View>

          <Field label="Lieu *" value={lieu} onChange={setLieu} placeholder="Ex: Piscine Jean Bouin" inputStyle={inputStyle} theme={theme} />
          <Field label="Date *" value={date} onChange={setDate} placeholder="Ex: 15/08/2026" inputStyle={inputStyle} theme={theme} />
          <Field label="Ouverture des portes" value={ouverturePortes} onChange={setOuverturePortes} placeholder="Ex: 08h00" inputStyle={inputStyle} theme={theme} />
          <Field label="Début des épreuves" value={debutEpreuves} onChange={setDebutEpreuves} placeholder="Ex: 09h00" inputStyle={inputStyle} theme={theme} />
          <Field label="Pause" value={pause} onChange={setPause} placeholder="Ex: 12h00-13h00" inputStyle={inputStyle} theme={theme} />
          <Field label="Remise des récompenses" value={remiseRecompenses} onChange={setRemiseRecompenses} placeholder="Ex: 18h00" inputStyle={inputStyle} theme={theme} />
        </DoubleBezelCard>

        {/* Section: Épreuves */}
        <DoubleBezelCard>
          <View style={styles.sectionHeader}>
            <Ionicons name="layers-outline" size={16} color={Accent} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Épreuves ({epreuves.length})
            </ThemedText>
          </View>

          {epreuves.length === 0 && (
            <ThemedText style={[styles.emptyHint, { color: theme.textSecondary }]}>
              Aucune épreuve pour le moment. Ajoutez-en une ci-dessous.
            </ThemedText>
          )}

          {epreuves.map((ep, idx) => {
            const color = typeNageColors[ep.type_nage];
            return (
              <View key={ep.key} style={[styles.epreuveRow, { borderColor: theme.hairline }]}>
                <View style={styles.epreuveHeader}>
                  <View style={[styles.epreuveIndex, { backgroundColor: color + '18' }]}>
                    <ThemedText style={[styles.epreuveIndexText, { color }]}>#{idx + 1}</ThemedText>
                  </View>
                  <Pressable onPress={() => removeEpreuve(ep.key)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  </Pressable>
                </View>

                <View style={styles.epreuveFields}>
                  <View style={styles.epreuveFieldRow}>
                    <View style={styles.epreuveFieldHalf}>
                      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Nage *</ThemedText>
                      <TextInput
                        value={ep.nage}
                        onChangeText={v => updateEpreuve(ep.key, 'nage', v)}
                        placeholder="Ex: 100 Nage Libre"
                        placeholderTextColor={theme.textSecondary}
                        style={inputStyle}
                      />
                    </View>
                    <View style={styles.epreuveFieldHalf}>
                      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Heure</ThemedText>
                      <TextInput
                        value={ep.heure}
                        onChangeText={v => updateEpreuve(ep.key, 'heure', v)}
                        placeholder="Ex: 09h30"
                        placeholderTextColor={theme.textSecondary}
                        style={inputStyle}
                      />
                    </View>
                  </View>

                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Type de nage</ThemedText>
                  <View style={styles.typeNageRow}>
                    {NAGE_OPTIONS.map(opt => {
                      const active = ep.type_nage === opt.value;
                      const bgColor = typeNageColors[opt.value];
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => updateEpreuve(ep.key, 'type_nage', opt.value)}
                          style={[
                            styles.typeNageChip,
                            {
                              backgroundColor: active ? bgColor + '18' : theme.hairline,
                              borderColor: active ? bgColor + '40' : 'transparent',
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.typeNageChipText,
                              { color: active ? bgColor : theme.textSecondary },
                            ]}
                          >
                            {opt.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}

          <Pressable onPress={addEpreuve} style={[styles.addBtn, { borderColor: Accent + '40' }]}>
            <Ionicons name="add-circle-outline" size={16} color={Accent} />
            <ThemedText style={[styles.addBtnText, { color: Accent }]}>Ajouter une épreuve</ThemedText>
          </Pressable>
        </DoubleBezelCard>

        {/* Bouton de sauvegarde */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: Accent, opacity: saving ? 0.5 : 1 }, Shadows.medium as any]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <ThemedText style={styles.saveBtnText}>Créer la compétition</ThemedText>
            </>
          )}
        </Pressable>

        <View style={{ height: Spacing.five }} />
      </ScrollView>
    </ThemedView>
  );
}

// Petit composant champ réutilisable
function Field({ label, value, onChange, placeholder, inputStyle, theme }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; inputStyle: any; theme: Record<string, string>;
}) {
  return (
    <View style={fieldStyles.container}>
      <ThemedText style={[fieldStyles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={inputStyle}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.four, gap: 16, paddingBottom: Spacing.six },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  backText: { fontSize: 13, fontWeight: '500' },
  pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  emptyHint: { fontSize: 13, fontWeight: '500', textAlign: 'center', paddingVertical: Spacing.three },
  epreuveRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 8,
  },
  epreuveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  epreuveIndex: {
    width: 32, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  epreuveIndexText: { fontSize: 11, fontWeight: '800' },
  removeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  epreuveFields: { gap: 10 },
  epreuveFieldRow: { flexDirection: 'row', gap: 10 },
  epreuveFieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeNageRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeNageChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.sm,
    borderWidth: 1,
  },
  typeNageChipText: { fontSize: 12, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: Radii.md, borderWidth: 1, borderStyle: 'dashed',
    marginTop: 4,
  },
  addBtnText: { fontSize: 13, fontWeight: '600' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: Radii.lg, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
