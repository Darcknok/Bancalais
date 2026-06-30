import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { nageCouleurs } from '@/data/competitions';
import { fetchAllCompetitions, type SourceCompetition } from '@/data/competition-service';

function StaggerItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.spring(opacity, {
      toValue: 1,
      useNativeDriver: true,
      speed: 14,
      bounciness: 5,
      delay: 100 * index,
    }).start();
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 12,
      bounciness: 5,
      delay: 100 * index,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function EpreuveTag({ label, typeNage }: { label: string; typeNage: string }) {
  const color = nageCouleurs[typeNage as keyof typeof nageCouleurs] ?? Accent;
  const bgRgba = color + '18';
  return (
    <View style={[styles.miniTag, { borderColor: color, backgroundColor: bgRgba }]}>
      <ThemedText style={[styles.miniTagText, { color }]}>{label}</ThemedText>
    </View>
  );
}

type FilterMode = 'all' | 'local';

export default function AccueilScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('local');
  const [competitions, setCompetitions] = useState<SourceCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchAllCompetitions(
      filterMode === 'all' ? 'all' : 'local',
      user?.prenom,
      user?.nom,
    );
    if (res.data?.competitions) setCompetitions(res.data.competitions);
    setLoading(false);
  }, [filterMode, user?.prenom, user?.nom]);

  useEffect(() => { load(); }, [load]);

  const filteredComps = useMemo(
    () => competitions.filter(c => {
      if (filterMode === 'local') {
        // Mes compétitions = locales + LiveFFN où le nageur est inscrit
        if (c.source === 'local') return true;
        if (c.source === 'liveffn' && c.swimmerFound) return true;
        return false;
      }
      if (!search) return true;
      return (
        c.lieu.toLowerCase().includes(search.toLowerCase()) ||
        (c.epreuves ?? []).some(e => e.nage.toLowerCase().includes(search.toLowerCase()))
      );
    }),
    [search, competitions, filterMode],
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Accent} />}
      >
        <View style={styles.header}>
          <View style={[styles.accentLine, { backgroundColor: Accent }]} />
          <View style={styles.headerTop}>
            <View style={styles.greetingRow}>
              <View style={[styles.waveBg, { backgroundColor: Accent + '12' }]}>
                <Ionicons name="water-outline" size={18} color={Accent} />
              </View>
              <View style={styles.greetingTextBlock}>
                <ThemedText style={[styles.eyebrow, { color: theme.textSecondary }]}>
                  Bonjour, {user?.prenom ?? 'Mathias'}
                </ThemedText>
                <View style={styles.titleRow}>
                  <ThemedText style={[styles.title, { color: theme.text }]}>Bancalais</ThemedText>
                  <View style={[styles.titleDot, { backgroundColor: Accent }]} />
                </View>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>Natation</ThemedText>
              </View>
            </View>
          </View>
        </View>

        <DoubleBezelCard accent style={[Shadows.soft as any]}>
          <View style={styles.searchRow}>
            <View style={[styles.searchIconRing, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="search" size={15} color={theme.textSecondary} />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher une compétition…"
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} style={styles.searchClear}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </DoubleBezelCard>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setFilterMode('local')}
            style={[
              styles.tabPill,
              filterMode === 'local' && { backgroundColor: Accent },
              filterMode !== 'local' && { backgroundColor: theme.backgroundElement, borderColor: theme.hairline, borderWidth: 1 },
              filterMode === 'local' && (Shadows.soft as any),
            ]}
          >
            <ThemedText
              style={[
                styles.tabText,
                filterMode === 'local' && { color: '#FFFFFF' },
                filterMode !== 'local' && { color: theme.textSecondary },
              ]}
            >
              Mes compétitions
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('all')}
            style={[
              styles.tabPill,
              filterMode === 'all' && { backgroundColor: Accent },
              filterMode !== 'all' && { backgroundColor: theme.backgroundElement, borderColor: theme.hairline, borderWidth: 1 },
              filterMode === 'all' && (Shadows.soft as any),
            ]}
          >
            <ThemedText
              style={[
                styles.tabText,
                filterMode === 'all' && { color: '#FFFFFF' },
                filterMode !== 'all' && { color: theme.textSecondary },
              ]}
            >
              Global
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.filterTitleRow}>
          <View style={styles.filterTitleTextBlock}>
            <ThemedText style={[styles.filterTitle, { color: theme.text }]}>
              {filterMode === 'local' ? 'Mes compétitions' : 'Toutes les compétitions'}
            </ThemedText>
            {filterMode === 'local' && user?.prenom && (
              <ThemedText style={[styles.filterSubtitle, { color: theme.textSecondary }]}>
                {user.prenom} {user.nom}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconRing, { backgroundColor: Accent + '12' }]}>
            <Ionicons name="calendar" size={12} color={Accent} />
          </View>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Compétitions
          </ThemedText>
          <View style={[styles.sectionLine, { backgroundColor: theme.hairline }]} />
          <View style={[styles.sectionCount, { backgroundColor: theme.hairline }]}>
            <ThemedText style={[styles.sectionCountText, { color: theme.textSecondary }]}>
              {filteredComps.length}
            </ThemedText>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={Accent} />
          </View>
        )}

        {!loading && filteredComps.length === 0 && (
          <StaggerItem index={0}>
            <DoubleBezelCard>
              <EmptyState
                icon={search ? 'search-outline' : 'calendar-outline'}
                title="Aucun résultat"
                subtitle={search ? `Aucune compétition pour "${search}"` : 'Aucune compétition à venir'}
              />
            </DoubleBezelCard>
          </StaggerItem>
        )}

        {!loading && filteredComps.map((comp, idx) => (
          <StaggerItem key={comp.id} index={idx}>
            <Pressable
              onPress={() => router.push(`/(tabs)/planning?id=${comp.id}&source=${comp.source}` as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
            >
              <DoubleBezelCard accent style={[Shadows.soft as any]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={styles.cardLieuRow}>
                      <Ionicons name="location-outline" size={13} color={theme.textSecondary} />
                      <ThemedText style={[styles.cardLieu, { color: theme.text }]}>{comp.lieu}</ThemedText>
                      {comp.source === 'liveffn' && (
                        <View style={[styles.sourceBadge, {
                          backgroundColor: comp.swimmerFound ? '#22C55E' + '18' : Accent + '18',
                        }]}>
                          <ThemedText style={[styles.sourceBadgeText, {
                            color: comp.swimmerFound ? '#22C55E' : Accent,
                          }]}>
                            {comp.swimmerFound ? 'Inscrit' : 'LiveFFN'}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardDateRow}>
                      <Ionicons name="calendar-outline" size={11} color={theme.textSecondary} />
                      <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>{comp.date}</ThemedText>
                    </View>
                  </View>
                  <View style={[styles.chevronRing, { borderColor: theme.hairline, backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name="chevron-forward" size={12} color={theme.textSecondary} />
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: theme.hairline }]} />

                <View style={styles.tagRow}>
                  {(comp.epreuves ?? []).slice(0, 4).map((ep, i) => (
                    <EpreuveTag key={i} label={ep.nage} typeNage={ep.type_nage} />
                  ))}
                  {(comp.epreuves ?? []).length > 4 && (
                    <View style={[styles.moreBadge, { backgroundColor: theme.hairline }]}>
                      <ThemedText style={[styles.moreBadgeText, { color: theme.textSecondary }]}>
                        +{comp.epreuves.length - 4}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </DoubleBezelCard>
            </Pressable>
          </StaggerItem>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.four,
    gap: 20,
    paddingBottom: Spacing.six,
  },
  header: {
    paddingTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  accentLine: {
    height: 3,
    width: 48,
    borderRadius: 2,
    marginLeft: Spacing.four,
    marginBottom: Spacing.five,
  },
  headerTop: {
    paddingHorizontal: Spacing.four,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  waveBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTextBlock: {
    gap: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  searchIconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 2,
  },
  searchClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: 10,
  },
  sectionIconRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  sectionCount: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    gap: 6,
  },
  cardLieuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLieu: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  chevronRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniTag: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  miniTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  moreBadge: {
    borderRadius: Radii.md,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  moreBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  loadingState: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  bottomSpacer: {
    height: Spacing.three,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  tabPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    marginTop: Spacing.one,
  },
  filterTitleTextBlock: {
    gap: 2,
  },
  filterTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  filterSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
