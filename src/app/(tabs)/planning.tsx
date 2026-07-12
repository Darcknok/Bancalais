import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { nageCouleurs } from '@/data/competitions';
import {
  fetchCompetitionDetail, fetchCompetitionParticipants, findSwimmerByName,
  type ApiCompetition, type ApiEpreuve, type ApiPB, type CompetitionSource, type LiveFFNParticipant,
} from '@/data/competition-service';
import {
  fetchLiveFFNSwimmer,
  fetchLiveFFNProgram,
  type LiveFFNSession,
  type LiveFFNEvent,
  type LiveFFNRaceResult,
  type LiveFFNSplit,
  type ProgramItem,
} from '@/data/liveffn';
import { fetchMyPBs } from '@/lib/api';
import { useRaceReminders } from '@/hooks/use-race-reminders';
import { logScheduledNotifications } from '@/lib/notifications';

type ItemKind = 'event' | 'race' | 'pause';
type ItemStatus = 'past' | 'current' | 'future';

function parseHeureToMinutes(heure: string): number {
  const sep = heure.includes('h') ? 'h' : ':';
  const parts = heure.split(sep);
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return parseInt(parts[0], 10) * 60 || 0;
}

function calculatePauseMinutes(time1: string, time2: string): number {
  return parseHeureToMinutes(time2) - parseHeureToMinutes(time1);
}

function formatPause(totalMin: number): string {
  if (totalMin <= 0) return '0 min';
  if (totalMin < 60) return `Pause ${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `Pause ${h}h${m}` : `Pause ${h}h`;
}

function getStatus(time: string, dateStr?: string): ItemStatus {
  const now = new Date();

  // If a date is provided, check if it's today; otherwise all items on that day
  // get the same "base" status from the date alone.
  if (dateStr) {
    const today = now.toISOString().split('T')[0];
    if (dateStr < today) return 'past';
    if (dateStr > today) return 'future';
    // Same day → fall through to time check
  }

  const itemMin = parseHeureToMinutes(time);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const diff = itemMin - nowMin;
  if (diff < -30) return 'past';
  if (diff <= 30) return 'current';
  return 'future';
}

function liveFFNEventToApiEpreuve(event: LiveFFNEvent): ApiEpreuve {
  const lower = event.nom.toLowerCase();
  let typeNage: ApiEpreuve['type_nage'] = 'crawl';
  if (lower.includes('papillon')) typeNage = 'pap';
  else if (lower.includes('dos')) typeNage = 'dos';
  else if (lower.includes('brasse')) typeNage = 'brass';
  return {
    id: event.id,
    competition_id: 0,
    heure: event.heure || '',
    nage: event.nom,
    type_nage: typeNage,
    ordre: 0,
    inscription: null,
  };
}

/**
 * Extrait le temps principal d'une cellule LiveFFN qui peut contenir
 * les splits concaténés (séparés par tabulation).
 * Ex: "00:58.08\t50 m : 28.31 (28.31)\t100 m : 58.08 (29.77)" → "00:58.08"
 */
function cleanTime(raw: string): string {
  if (!raw) return raw;
  // Si contient une tabulation, prendre avant
  const tabIdx = raw.indexOf('\t');
  if (tabIdx >= 0) return raw.slice(0, tabIdx).trim();
  // Extraire le premier temps valide au format MM:SS.hh ou SS.hh
  // avec exactement 2 chiffres pour les centièmes (évite de capturer les splits concaténés)
  const match = raw.match(/^(\d{1,3}:\d{2}\.\d{2}|\d{2}\.\d{2})/);
  if (match) return match[1];
  return raw.trim();
}

function parseTime(t: string): number {
  const parts = t.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0]);
    const secParts = parts[1].split('.');
    const secs = parseInt(secParts[0]);
    const hund = parseInt(secParts[1]) || 0;
    return mins * 6000 + secs * 100 + hund;
  }
  const secParts = t.split('.');
  const secs = parseInt(secParts[0]);
  const hund = parseInt(secParts[1]) || 0;
  return secs * 100 + hund;
}

function formatDiff(engagement: string, nouveau: string): string {
  const diff = parseTime(nouveau) - parseTime(engagement);
  const sign = diff <= 0 ? '-' : '+';
  const abs = Math.abs(diff);
  const secs = Math.floor(abs / 100);
  const hund = abs % 100;
  return `${sign}${secs}.${String(hund).padStart(2, '0')}`;
}

function PulseDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.pulseDot, { backgroundColor: color, opacity, transform: [{ scale }] }]}
    />
  );
}

function RaceCard({ epreuve, status, theme: t, pb: pbFromPBs, dqRemark, sessionLabel, resultTime, splits, onPress }: { epreuve: ApiEpreuve; status: ItemStatus; theme: Record<string, string>; pb?: string; dqRemark?: string; sessionLabel?: string; resultTime?: string; splits?: LiveFFNSplit[]; onPress?: () => void }) {
  const isNow = status === 'current';
  const dimmed = status === 'past';
  const color = nageCouleurs[epreuve.type_nage as keyof typeof nageCouleurs] ?? t.accent;
  const pb = epreuve.inscription?.temps_engagement ?? pbFromPBs;
  const isDQ = !!dqRemark;
  const displayTime = resultTime || pb || '—';
  const [showSplits, setShowSplits] = useState(false);
  const hasSplits = splits && splits.length > 0;

  return (
    <Pressable onPress={onPress}>
      <DoubleBezelCard noPadding gap={0} accent={isNow} style={isNow ? (Shadows.soft as any) : undefined}>
      <View style={styles.raceInner}>
        {sessionLabel && (
          <View style={styles.sessionLabelRow}>
            <ThemedText style={[styles.sessionLabelText, { color: t.textSecondary + '80' }]}>
              {sessionLabel}
            </ThemedText>
          </View>
        )}
        <View style={styles.raceHeader}>
          <View style={[styles.raceTypeDot, { backgroundColor: color + '20' }]}>
            <View style={[styles.raceTypeDotInner, { backgroundColor: isDQ ? '#EF4444' : color }]} />
          </View>
          <ThemedText
            style={[styles.raceLabel, { color: t.text }]}
          >
            {epreuve.nage}
          </ThemedText>
          {isDQ ? (
            <View style={[styles.racePill, { backgroundColor: '#EF4444' + '15' }]}>
              <ThemedText style={[styles.racePillText, { color: '#EF4444' }]}>
                {dqRemark}
              </ThemedText>
            </View>
          ) : hasSplits ? (
            <Pressable onLongPress={() => setShowSplits(v => !v)}>
              <View style={[styles.racePill, { backgroundColor: resultTime ? color + '20' : pb ? color + '15' : t.hairline }]}>
                <ThemedText style={[styles.racePillText, { color: resultTime ? '#22C55E' : pb ? color : t.textSecondary }]}>
                  {displayTime}
                </ThemedText>
              </View>
            </Pressable>
          ) : (
            <View style={[styles.racePill, { backgroundColor: resultTime ? color + '20' : pb ? color + '15' : t.hairline }]}>
              <ThemedText style={[styles.racePillText, { color: resultTime ? '#22C55E' : pb ? color : t.textSecondary }]}>
                {displayTime}
              </ThemedText>
            </View>
          )}
        </View>

        {showSplits && hasSplits && (
          <View style={styles.splitsRow}>
            {splits.map((split, idx) => (
              <View key={idx} style={[styles.splitChip, { backgroundColor: t.hairline }]}>
                <ThemedText style={[styles.splitChipDist, { color: t.textSecondary }]}>
                  {split.distance}
                </ThemedText>
                <ThemedText style={[styles.splitChipTime, { color: t.text }]}>
                  {split.splitTime}
                </ThemedText>
                <ThemedText style={[styles.splitChipLap, { color: t.textSecondary + '99' }]}>
                  {split.lapTime}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {epreuve.inscription?.nouveau_temps && (
          <View style={styles.tempsRow}>
            <Ionicons name="arrow-forward" size={12} color={t.textSecondary} />
            <ThemedText style={[styles.tempsVal, { color: t.text }]}>
              {epreuve.inscription.nouveau_temps}
            </ThemedText>
            <ThemedText
              style={[styles.tempsDiff, {
                color: parseTime(epreuve.inscription.nouveau_temps) < parseTime(pb || '0')
                  ? '#22C55E' : '#EF4444',
              }]}
            >
              {formatDiff(pb || '0', epreuve.inscription.nouveau_temps)}
            </ThemedText>
            <ThemedText style={[styles.tempsLabel, { color: '#22C55E' }]}>Nouveau PB</ThemedText>
          </View>
        )}
      </View>
    </DoubleBezelCard>
    </Pressable>
  );
}

export default function PlanningScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { id, source: sourceParam } = useLocalSearchParams<{ id: string; source: string }>();
  const source: CompetitionSource = sourceParam === 'liveffn' ? 'liveffn' : 'local';
  const [comp, setComp] = useState<ApiCompetition | null>(null);
  const [pbs, setPBs] = useState<ApiPB[]>([]);
  const [loading, setLoading] = useState(true);
  const [noId, setNoId] = useState(!id);
  const [participant, setParticipant] = useState<LiveFFNParticipant | null>(null);
  const [swimmerEventIds, setSwimmerEventIds] = useState<number[]>([]);
  const [swimmerResultsMap, setSwimmerResultsMap] = useState<Map<string, LiveFFNRaceResult>>(new Map());
  const [swimmerRoundSet, setSwimmerRoundSet] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<LiveFFNSession[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false); // true quand un intervalle tourne
  const dayScrollRef = useRef<ScrollView>(null);
  const todayStr = new Date().toISOString().split('T')[0]; // "2026-06-29"

  // Rediriger vers l'accueil si aucun ID n'est fourni (ex: appui direct sur l'onglet Planning)
  useEffect(() => {
    if (!id) {
      router.replace('/(tabs)/accueil');
    } else if (noId) {
      setNoId(false);
    }
  }, [id]);

  if (noId) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={theme.accent} />
      </ThemedView>
    );
  }

  const load = useCallback(async () => {
    setLoading(true);
    const compId = Number(id) || 1;

    const [compRes, pbsRes] = await Promise.all([
      fetchCompetitionDetail(compId, source),
      fetchMyPBs(),
    ]);

    const loadedComp = compRes.data?.competition ?? null;
    if (loadedComp) setComp(loadedComp);
    if (pbsRes.data?.pbs) setPBs(pbsRes.data.pbs);

    if (source === 'liveffn' && user && loadedComp) {
      try {
        const participantsRes = await fetchCompetitionParticipants(compId);
        if (participantsRes.data?.participants) {
          const found = findSwimmerByName(
            participantsRes.data.participants,
            user.prenom,
            user.nom,
          );
          if (found) {
            setParticipant(found);
            const swimmerRes = await fetchLiveFFNSwimmer(found.iuf, compId);
            if (swimmerRes.data) {
              const ids = [...new Set(swimmerRes.data.results.map(r => r.eventId))];
              console.log(`[planning] swimmer ${found.prenom} ${found.nom}: ${ids.length} eventIds found`, ids);
              setSwimmerEventIds(ids);
              // Build map eventId → result for DQ/remark lookup
              const resultsMap = new Map(
                swimmerRes.data.results.map(r => [`${r.eventId}:${r.round}`, r] as [string, LiveFFNRaceResult]),
              );
              setSwimmerResultsMap(resultsMap);
              // Build set of "eventId:round" for precise round matching
              const roundSet = new Set(swimmerRes.data.results.map(r => `${r.eventId}:${r.round}`));
              setSwimmerRoundSet(roundSet);
            } else {
              console.warn('[planning] swimmer results empty or error:', swimmerRes.error);
            }
            const programRes = await fetchLiveFFNProgram(compId);
            if (programRes.data) {
              console.log(`[planning] program: ${programRes.data.sessions.length} sessions`);
              setSessions(programRes.data.sessions);
            } else {
              console.warn('[planning] program fetch error:', programRes.error);
            }
          } else {
            console.log('[planning] swimmer not found in participants');
          }
        } else {
          console.warn('[planning] no participants data:', participantsRes.error);
        }
      } catch (err) {
        console.warn('[planning] swimmer mode setup failed:', err);
      }
    }

    setLoading(false);
  }, [id, source, user]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh toutes les 3 minutes en mode swimmer (LiveFFN)
  useEffect(() => {
    if (!id || source !== 'liveffn' || !user || !participant) return;
    setAutoRefresh(true);
    const compId = Number(id);
    const REFRESH_MS = 3 * 60 * 1000; // 3 minutes

    const tick = async () => {
      try {
        console.log('[planning] auto-refresh swimmer data');
        const [swimmerRes, programRes] = await Promise.all([
          fetchLiveFFNSwimmer(participant.iuf, compId),
          fetchLiveFFNProgram(compId),
        ]);
        if (swimmerRes.data) {
          const ids = [...new Set(swimmerRes.data.results.map(r => r.eventId))];
          setSwimmerEventIds(ids);
          const resultsMap = new Map(
            swimmerRes.data.results.map(r => [`${r.eventId}:${r.round}`, r] as [string, LiveFFNRaceResult]),
          );
          setSwimmerResultsMap(resultsMap);
          const roundSet = new Set(swimmerRes.data.results.map(r => `${r.eventId}:${r.round}`));
          setSwimmerRoundSet(roundSet);
        }
        if (programRes.data) {
          setSessions(programRes.data.sessions);
        }
      } catch (err) {
        console.warn('[planning] auto-refresh failed:', err);
      }
    };

    const interval = setInterval(tick, REFRESH_MS);
    return () => { clearInterval(interval); setAutoRefresh(false); };
  }, [id, source, user, participant]);

  // Group sessions by unique date, merge events chronologically
  const dayGroups = useMemo(() => {
    const groups = new Map<string, LiveFFNSession[]>();
    for (const s of sessions) {
      const key = s.date || 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }
    // Sort by date
    const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([date, sessionsOnDate], idx) => {
      // Merge all sport events from all sessions, sorted by time
      const merged: LiveFFNEvent[] = [];
      for (const s of sessionsOnDate) {
        for (const e of s.epreuves) {
          merged.push({ ...e, _sessionLabel: sessionsOnDate.length > 1 ? `Réunion ${s.numero}` : undefined });
        }
      }
      merged.sort((a, b) => (a.heure || '').localeCompare(b.heure || ''));
      // Concatenate all items (sport + annotations) preserving session and HTML order
      const mergedItems: ProgramItem[] = [];
      const multi = sessionsOnDate.length > 1;
      for (const s of sessionsOnDate) {
        for (const item of s.items) {
          if (item.kind === 'sport' && item.epreuve) {
            mergedItems.push({
              ...item,
              epreuve: { ...item.epreuve, _sessionLabel: multi ? `Réunion ${s.numero}` : undefined },
            });
          } else {
            mergedItems.push(item);
          }
        }
      }
      return { index: idx, date, label: `Jour ${idx + 1}`, sessions: sessionsOnDate, epreuves: merged, mergedItems };
    });
  }, [sessions]);

  const swimmerMode = source === 'liveffn' && participant !== null && swimmerEventIds.length > 0 && dayGroups.length > 0;

  const dayLabels = useMemo(() => {
    return dayGroups.map(g => ({ index: g.index, label: g.label, date: g.date }));
  }, [dayGroups]);

  // Fix auto-select: find today by date across groups, not session index
  useEffect(() => {
    if (dayGroups.length > 0) {
      const todayIdx = dayGroups.findIndex(g => g.date === todayStr);
      if (todayIdx >= 0) {
        setSelectedDay(todayIdx);
      }
    }
  }, [dayGroups, todayStr]);

  const filteredDayEpreuves = useMemo(() => {
    if (!swimmerMode || dayGroups.length === 0) return [];
    const group = dayGroups[selectedDay];
    if (!group) return [];
    return group.epreuves.filter(e => {
      // Must match eventId AND round type
      if (!swimmerEventIds.includes(e.id)) return false;
      const roundKey = `${e.id}:${(e as any).typeTour || 'Séries'}`;
      return swimmerRoundSet.has(roundKey);
    });
  }, [swimmerMode, dayGroups, selectedDay, swimmerEventIds, swimmerRoundSet]);

  const dayItems = useMemo(() => {
    const currentDate = dayGroups[selectedDay]?.date || '';
    const group = dayGroups[selectedDay];
    if (!group) return [];
    const items: {
      kind: 'race' | 'pause' | 'info';
      time: string;
      label: string;
      date?: string;
      remark?: string;
      resultTime?: string;
      sessionLabel?: string;
      typeTour?: string;
      epreuve?: ApiEpreuve;
    }[] = [];

    // Collect swimmer's sport items for pause calculation
    const swimmerSportItems: { time: string; epreuve: LiveFFNEvent }[] = [];

    // Determine which sessions have at least one swimmer race
    const sessionsWithSwimmerRaces = new Set<number>();
    for (const item of group.mergedItems) {
      if (item.kind === 'sport' && item.epreuve) {
        const e = item.epreuve;
        const roundKey = `${e.id}:${e.typeTour || 'Séries'}`;
        if (swimmerEventIds.includes(e.id) && swimmerRoundSet.has(roundKey)) {
          sessionsWithSwimmerRaces.add(item.sessionNumero);
        }
      }
    }

    for (const item of group.mergedItems) {
      if (item.kind === 'sport' && item.epreuve) {
        const e = item.epreuve;
        const roundKey = `${e.id}:${e.typeTour || 'Séries'}`;
        const swimmerRaces = swimmerEventIds.includes(e.id) && swimmerRoundSet.has(roundKey);
        if (!swimmerRaces) continue;
        const matchedResult = swimmerResultsMap.get(roundKey);
        const result = matchedResult || undefined;
        const resultTime = (result && result.time !== '--:--.--') ? result.time : undefined;
        const remark = (result?.remark && result.time === '--:--.--') ? result.remark : undefined;
        items.push({
          kind: 'race',
          time: e.heure,
          label: e.nom,
          date: currentDate,
          remark,
          resultTime,
          sessionLabel: (e as any)._sessionLabel,
          typeTour: e.typeTour,
          epreuve: liveFFNEventToApiEpreuve(e),
        });
        swimmerSportItems.push({ time: e.heure, epreuve: e });
      } else if (item.kind === 'nonSportif' || item.kind === 'debutEpreuve') {
        // Only show session annotations if the swimmer has races in that session
        if (sessionsWithSwimmerRaces.has(item.sessionNumero)) {
          items.push({
            kind: 'info',
            time: '',
            label: item.label,
            date: currentDate,
          });
        }
      }
    }

    // Compute pauses between consecutive swimmer races (not info/pause items)
    if (swimmerSportItems.length > 1) {
      for (let i = 0; i < swimmerSportItems.length - 1; i++) {
        const pauseMin = calculatePauseMinutes(swimmerSportItems[i].time, swimmerSportItems[i + 1].time);
        if (pauseMin > 0) {
          // Find position of current race in items array
          const raceIdx = items.findIndex(it => it.kind === 'race' && it.time === swimmerSportItems[i].time);
          if (raceIdx >= 0) {
            items.splice(raceIdx + 1, 0, {
              kind: 'pause',
              time: '',
              label: formatPause(pauseMin),
            });
          }
        }
      }
    }

    return items;
  }, [filteredDayEpreuves, dayGroups, selectedDay, swimmerResultsMap, swimmerRoundSet, swimmerEventIds]);

  // Items timeline pour le mode non-swimmer (competitions locales)
  // ATTENTION : ce hook doit être AVANT le early return pour respecter les Règles des Hooks
  const items = useMemo(() => {
    const epreuves = comp?.epreuves ?? [];
    const firstTime = epreuves[0]?.heure || '';
    const lastTime = epreuves.slice(-1)[0]?.heure || '';

    return [
      ...(comp?.debut_epreuves || firstTime
        ? [{ kind: 'event' as const, time: comp?.debut_epreuves ?? firstTime, label: 'Début des épreuves', icon: 'flag' as const }]
        : []),
      ...epreuves.map(e => ({
        kind: 'race' as const,
        time: e.heure,
        label: e.nage,
        epreuve: e,
      })),
      ...(comp?.pause
        ? [{ kind: 'pause' as const, time: '', label: 'Pause ' + comp.pause }]
        : []),
      ...(comp?.remise_recompenses || lastTime
        ? [{ kind: 'event' as const, time: comp?.remise_recompenses ?? lastTime, label: 'Remise des récompenses', icon: 'trophy' as const }]
        : []),
    ] as {
      kind: ItemKind;
      time: string;
      label: string;
      icon?: string;
      epreuve?: ApiEpreuve;
    }[];
  }, [comp]);

  // Tous les événements du nageur pour les rappels (tous les jours, pas seulement le jour sélectionné)
  const allSwimmerEvents = useMemo(() => {
    if (!swimmerMode) return [];
    const events: { id: number; name: string; time: string; date?: string; resultTime?: string }[] = [];
    for (const group of dayGroups) {
      for (const item of group.mergedItems) {
        if (item.kind === 'sport' && item.epreuve) {
          const e = item.epreuve;
          const roundKey = `${e.id}:${e.typeTour || 'Séries'}`;
          if (swimmerEventIds.includes(e.id) && swimmerRoundSet.has(roundKey)) {
            const result = swimmerResultsMap.get(roundKey);
            const resultTime = (result && result.time !== '--:--.--') ? cleanTime(result.time) : undefined;
            events.push({
              id: e.id,
              name: e.nom,
              time: e.heure,
              date: group.date,
              resultTime,
            });
          }
        }
      }
    }
    return events;
  }, [swimmerMode, dayGroups, swimmerEventIds, swimmerRoundSet, swimmerResultsMap]);

  // Mémoriser les résultats précédents pour détecter les nouveaux
  const prevResultsRef = useRef<Map<number, string | undefined>>(new Map());
  const currentResults = useMemo(() => {
    const map = new Map<number, string | undefined>();
    for (const ev of allSwimmerEvents) {
      map.set(ev.id, ev.resultTime);
    }
    return map;
  }, [allSwimmerEvents]);

  // Planifier les rappels de course et notifier les nouveaux résultats
  const reminderDelay = user?.preferences?.reminderDelay ?? 10;
  useRaceReminders({
    events: allSwimmerEvents,
    minutesBefore: reminderDelay,
    previousResults: prevResultsRef.current,
  });

  // Logger les notifications planifiées (debug)
  useEffect(() => {
    if (!swimmerMode || allSwimmerEvents.length === 0) return;
    const timer = setTimeout(() => {
      logScheduledNotifications();
    }, 2000);
    return () => clearTimeout(timer);
  }, [swimmerMode, allSwimmerEvents.length]);

  // Mettre à jour le ref après chaque rendu pour la prochaine comparaison
  useEffect(() => {
    prevResultsRef.current = currentResults;
  }, [currentResults]);

  if (loading || !comp) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={theme.accent} />
      </ThemedView>
    );
  }

  const pbMap = new Map(pbs.map(p => [p.nage.toLowerCase(), p.temps]));

  function renderTimelineRow(item: {
    kind: string; time: string; label: string;
    icon?: string; date?: string; remark?: string; sessionLabel?: string; epreuve?: ApiEpreuve;
  }, i: number) {
    if (item.kind === 'pause') {
      return (
        <View key={i} style={styles.pauseBlock}>
          <View style={[styles.pauseLine, { backgroundColor: theme.hairline }]} />
          <View style={styles.pauseContent}>
            <Ionicons name="cafe-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={[styles.pauseText, { color: theme.textSecondary }]}>
              {item.label}
            </ThemedText>
          </View>
          <View style={[styles.pauseLine, { backgroundColor: theme.hairline }]} />
        </View>
      );
    }

    if (item.kind === 'info') {
      const isDebut = item.label.toLowerCase().includes('ouverture');
      const isFin = item.label.toLowerCase().includes('fin');
      return (
        <View key={i} style={styles.infoBlock}>
          <View style={[styles.infoLine, { backgroundColor: theme.hairline }]} />
          <View style={styles.infoContent}>
            <Ionicons
              name={isDebut ? 'enter-outline' : isFin ? 'exit-outline' : 'information-circle-outline'}
              size={12}
              color={theme.textSecondary}
            />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary + 'cc' }]}>
              {item.label}
            </ThemedText>
          </View>
          <View style={[styles.infoLine, { backgroundColor: theme.hairline }]} />
        </View>
      );
    }

    const status = getStatus(item.time, 'date' in item ? item.date : undefined);
    const dimmed = status === 'past';
    const isNow = status === 'current';
    const isRace = item.kind === 'race';
    const dqRemark = 'remark' in item ? item.remark : undefined;
    // Récupérer les temps de passage depuis les résultats LiveFFN si disponibles
    const splitRoundKey = item.epreuve ? `${item.epreuve.id}:${(item as any).typeTour || 'Séries'}` : '';
    const splits = swimmerMode && isRace && item.epreuve
      ? (swimmerResultsMap.get(splitRoundKey)?.splits)
      : undefined;

    return (
      <View key={i} style={[styles.row, dimmed && styles.dimmed]}>
        <View style={styles.timeCol}>
          <View style={[styles.timePill, { backgroundColor: isNow ? theme.accent + '15' : theme.hairline }]}>
            <ThemedText style={[styles.timeText, { color: isNow ? theme.accent : theme.textSecondary }]}>
              {item.time || '—'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.lineCol}>
          {isNow && (
            <View style={[styles.nowRing, { borderColor: theme.accent + '40' }]}>
              <PulseDot color={theme.accent} />
            </View>
          )}
          <View style={[styles.timelineBar, { backgroundColor: isNow ? theme.accent + '60' : theme.hairline }]} />
        </View>

        <View style={styles.cardCol}>
          {isRace && item.epreuve ? (
            <RaceCard epreuve={item.epreuve} status={status} theme={theme} pb={pbMap.get(item.epreuve.nage.toLowerCase())} dqRemark={dqRemark} sessionLabel={item.sessionLabel} resultTime={'resultTime' in item ? (item as any).resultTime : undefined} splits={splits} onPress={() => {
              const params = new URLSearchParams({
                competitionId: String(comp!.id),
                eventId: String(item.epreuve!.id),
                nage: item.epreuve!.nage,
                typeTour: (item as any).typeTour || 'Séries',
                date: (item as any).date || '',
                nageurIUF: String(participant?.iuf ?? ''),
              });
              router.push(`/(tabs)/race-feedback?${params.toString()}` as any);
            }} />
          ) : (
            <DoubleBezelCard noPadding gap={0} accent={isNow}>
              <View style={[styles.eventRow, { padding: 14 }]}>
                <Ionicons
                  name={item.icon! as any}
                  size={15}
                  color={isNow ? theme.accent : theme.textSecondary}
                />
                <ThemedText
                  style={[styles.eventLabel, { color: isNow ? theme.accent : theme.text }]}
                >
                  {item.label}
                </ThemedText>
              </View>
            </DoubleBezelCard>
          )}
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
          <ThemedText style={[styles.backText, { color: theme.textSecondary }]}>Retour</ThemedText>
        </Pressable>

        <DoubleBezelCard accent style={[Shadows.medium as any]}>
          <View style={styles.headerTop}>
            <View style={[styles.headerIcon, { backgroundColor: theme.accent + '15' }]}>
              <Ionicons name="location" size={16} color={theme.accent} />
            </View>
            <View style={styles.headerInfo}>
              <ThemedText style={[styles.headerLieu, { color: theme.text }]}>{comp.lieu}</ThemedText>
              <View style={styles.headerMetaRow}>
                <Ionicons name="calendar-outline" size={11} color={theme.textSecondary} />
                <ThemedText style={[styles.headerMeta, { color: theme.textSecondary }]}>{comp.date}</ThemedText>
              </View>
              {comp.ouverture_portes && (
                <View style={styles.headerMetaRow}>
                  <Ionicons name="time-outline" size={11} color={theme.textSecondary} />
                  <ThemedText style={[styles.headerMeta, { color: theme.textSecondary }]}>
                    Ouverture des portes à {comp.ouverture_portes}
                  </ThemedText>
                </View>
              )}
                  {participant && (
                <View style={styles.headerMetaRow}>
                  <Ionicons name="person-outline" size={11} color={theme.accent} />
                  <ThemedText style={[styles.headerMeta, { color: theme.accent }]}>
                    {participant.prenom} {participant.nom} — {participant.clubName}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </DoubleBezelCard>

        {swimmerMode && dayLabels.length > 1 && (
          dayLabels.length > 2 ? (
            <ScrollView
              ref={dayScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySliderContent}
              style={styles.daySlider}
            >
              {dayLabels.map(day => {
                const isPast = day.date < todayStr;
                const isActive = selectedDay === day.index;
                const isToday = day.date === todayStr;
                return (
                  <Pressable
                    key={day.index}
                    onPress={() => setSelectedDay(day.index)}
                    style={[
                      styles.dayTab,
                      isActive && styles.dayTabActive,
                      isPast && !isActive && !isToday && styles.dayTabPast,
                      isToday && !isActive && styles.dayTabToday,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.dayTabLabel,
                        { color: isActive ? Accent : isToday ? Accent + 'cc' : isPast ? theme.textSecondary + '60' : theme.textSecondary },
                      ]}
                    >
                      {day.label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.dayTabDate,
                        { color: isActive ? Accent : isToday ? Accent + 'cc' : isPast ? theme.textSecondary + '60' : theme.textSecondary },
                      ]}
                    >
                      {day.date}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.daySwitcher}>
              {dayLabels.map(day => {
                const isPast = day.date < todayStr;
                const isActive = selectedDay === day.index;
                const isToday = day.date === todayStr;
                return (
                  <Pressable
                    key={day.index}
                    onPress={() => setSelectedDay(day.index)}
                    style={[
                      styles.dayTab,
                      isActive && styles.dayTabActive,
                      isPast && !isActive && !isToday && styles.dayTabPast,
                      isToday && !isActive && styles.dayTabToday,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.dayTabLabel,
                        { color: isActive ? Accent : isToday ? Accent + 'cc' : isPast ? theme.textSecondary + '60' : theme.textSecondary },
                      ]}
                    >
                      {day.label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.dayTabDate,
                        { color: isActive ? Accent : isToday ? Accent + 'cc' : isPast ? theme.textSecondary + '60' : theme.textSecondary },
                      ]}
                    >
                      {day.date}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          )
        )}

        {swimmerMode && dayLabels.length === 1 && (
          <View style={styles.singleDayHeader}>
            <ThemedText style={[styles.singleDayText, { color: theme.textSecondary }]}>
              {dayLabels[0].date}
            </ThemedText>
          </View>
        )}

        <View style={styles.timeline}>
          {swimmerMode ? (
            dayItems.length === 0 ? (
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Aucune course ce jour
              </ThemedText>
            ) : (
              dayItems.map((item, i) => renderTimelineRow(item, i))
            )
          ) : (
            items.map((item, i) => renderTimelineRow(item, i))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: Spacing.four,
    gap: 12,
    paddingBottom: Spacing.six,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  backText: { fontSize: 13, fontWeight: '500' },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIcon: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: { gap: 3, flex: 1 },
  headerLieu: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerMeta: { fontSize: 12, fontWeight: '500' },
  timeline: { gap: 6 },
  row: { flexDirection: 'row', marginBottom: 16 },
  dimmed: { opacity: 1 },
  timeCol: { width: 52, justifyContent: 'center', alignItems: 'center' },
  timePill: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: Radii.sm },
  timeText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  lineCol: { width: 20, alignItems: 'center' },
  timelineBar: { width: 1.5, flex: 1 },
  nowRing: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  cardCol: { flex: 1 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  eventLabel: { fontSize: 13, flex: 1 },
  raceInner: { padding: 14, gap: 8 },
  sessionLabelRow: { marginBottom: -4 },
  sessionLabelText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  raceHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  raceTypeDot: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  raceTypeDotInner: { width: 10, height: 10, borderRadius: 5 },
  raceLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  racePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radii.sm },
  racePillText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tempsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 30 },
  tempsLabel: { fontSize: 11, fontWeight: '500' },
  tempsVal: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tempsDiff: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tempsNonInscrit: { fontSize: 12, fontWeight: '500', fontStyle: 'italic' },
  pauseBlock: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.three, paddingLeft: 48, marginVertical: 4,
  },
  pauseContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  pauseText: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  pauseLine: { flex: 1, height: 1 },
  infoBlock: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.one, paddingLeft: 48, marginVertical: 2,
  },
  infoContent: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 10, fontWeight: '500', letterSpacing: 0.6, textTransform: 'uppercase' },
  infoLine: { flex: 1, height: 1 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  nowLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.sm,
  },
  nowLabelText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bottomSpacer: { height: Spacing.three },
  daySlider: {
    marginBottom: 16,
  },
  daySliderContent: {
    gap: 10,
    paddingHorizontal: 0,
  },
  daySwitcher: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  dayTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayTabActive: {
    borderColor: Accent + '60',
    backgroundColor: Accent + '12',
  },
  dayTabPast: {
    opacity: 0.5,
  },
  dayTabToday: {
    borderColor: Accent + '30',
    backgroundColor: Accent + '06',
    borderWidth: 1,
    borderRadius: Radii.md,
  },
  dayTabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayTabDate: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  singleDayHeader: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  singleDayText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  splitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  splitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  splitChipDist: {
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  splitChipTime: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  splitChipLap: {
    fontSize: 9,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
