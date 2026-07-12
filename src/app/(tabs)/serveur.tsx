import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';

import { DoubleBezelCard } from '@/components/double-bezel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchServerStatus, type ServerStatus } from '@/lib/api';
import { API_BASE_URL } from '@/lib/api';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}j`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}min`);
  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIcon, { backgroundColor: (color ?? Accent) + '15' }]}>
        <Ionicons name={icon as any} size={14} color={color ?? Accent} />
      </View>
      <View style={styles.statInfo}>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
        <ThemedText style={[styles.statValue, { color: color ?? theme.text }]}>{value}</ThemedText>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{title}</ThemedText>
      <DoubleBezelCard noPadding>
        <View style={styles.sectionInner}>{children}</View>
      </DoubleBezelCard>
    </View>
  );
}

export default function ServeurScreen() {
  const theme = useTheme();
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const brand = await Device.brand;
        const modelName = await Device.modelName;
        const osVersion = await Device.osVersion;
        setDeviceInfo([brand, modelName, osVersion].filter(Boolean).join(' / '));
      } catch {
        setDeviceInfo('Inconnu');
      }
    })();
  }, []);

  const load = useCallback(async () => {
    const res = await fetchServerStatus();
    if (res.data) setStatus(res.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading && !status) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={theme.accent} />
      </ThemedView>
    );
  }

  const s = status;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.accentLine, { backgroundColor: Accent }]} />
          <View style={styles.headerRow}>
            <ThemedText style={[styles.title, { color: theme.text }]}>Serveur</ThemedText>
            <View style={[styles.serverBadge, { backgroundColor: s ? '#22C55E' + '20' : '#EF4444' + '20' }]}>
              <View style={[styles.serverDot, { backgroundColor: s ? '#22C55E' : '#EF4444' }]} />
              <ThemedText style={[styles.serverBadgeText, { color: s ? '#22C55E' : '#EF4444' }]}>
                {s ? 'En ligne' : 'Hors ligne'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {API_BASE_URL}
          </ThemedText>
        </View>

        {/* Machine */}
        <Section title="Machine">
          <StatRow icon="server-outline" label="Nom d'hôte" value={s?.hostname ?? '—'} />
          <StatRow icon="hardware-chip-outline" label="OS" value={s?.platform ?? '—'} />
          <StatRow icon="desktop-outline" label="Architecture" value={s?.arch ?? '—'} />
          <StatRow icon="phone-portrait-outline" label="Appareil" value={deviceInfo || '—'} color="#8B5CF6" />
        </Section>

        {/* Alimentation */}
        <Section title="Alimentation">
          <StatRow
            icon={s?.power.source === 'battery' ? 'battery-half-outline' : 'power-outline'}
            label="Source"
            value={s?.power.label ?? '—'}
            color={s?.power.source === 'battery' ? '#F59E0B' : '#22C55E'}
          />
          {s?.power.source === 'battery' && s?.power.batteryPercent != null && (
            <StatRow icon="battery-charging-outline" label="Batterie" value={`${s.power.batteryPercent}%`} color="#F59E0B" />
          )}
          {s?.power.source === 'battery' && s?.power.batteryRemainingMin != null && (
            <StatRow icon="time-outline" label="Autonomie restante" value={`${s.power.batteryRemainingMin} min`} color="#F59E0B" />
          )}
        </Section>

        {/* Temps */}
        <Section title="Temps">
          <StatRow icon="rocket-outline" label="Uptime système" value={s ? formatUptime(s.systemUptime) : '—'} color="#0EA5E9" />
          <StatRow icon="time-outline" label="Uptime process" value={s ? formatUptime(s.processUptime) : '—'} color="#0EA5E9" />
          <StatRow icon="calendar-outline" label="Dernière collecte" value={s ? new Date(s.timestamp).toLocaleString('fr-FR') : '—'} />
        </Section>

        {/* CPU */}
        <Section title="Processeur">
          <StatRow icon="server-outline" label="CPU" value={`${s?.cpuCount ?? '?'} cœurs`} />
          <StatRow
            icon="pulse-outline"
            label="Charge (1/5/15 min)"
            value={s ? `${(s.loadAverage[0] ?? 0).toFixed(2)} / ${(s.loadAverage[1] ?? 0).toFixed(2)} / ${(s.loadAverage[2] ?? 0).toFixed(2)}` : '—'}
            color="#F59E0B"
          />
        </Section>

        {/* Mémoire */}
        <Section title="Mémoire">
          <StatRow icon="cube-outline" label="Totale" value={s ? formatBytes(s.totalMem) : '—'} />
          <StatRow icon="cube-outline" label="Libre" value={s ? formatBytes(s.freeMem) : '—'} color="#22C55E" />
          <StatRow
            icon="analytics-outline"
            label="Utilisation"
            value={s ? `${s.memUsagePercent}%` : '—'}
            color={s && s.memUsagePercent > 80 ? '#EF4444' : s && s.memUsagePercent > 50 ? '#F59E0B' : '#22C55E'}
          />
          {s && (
            <View style={styles.barOuter}>
              <View
                style={[
                  styles.barInner,
                  {
                    width: `${s.memUsagePercent}%`,
                    backgroundColor: s.memUsagePercent > 80 ? '#EF4444' : s.memUsagePercent > 50 ? '#F59E0B' : '#22C55E',
                  },
                ]}
              />
            </View>
          )}
        </Section>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable onPress={onRefresh} style={[styles.actionBtn, { borderColor: theme.hairline }]}>
            <Ionicons name="refresh-outline" size={16} color={Accent} />
            <ThemedText style={[styles.actionText, { color: Accent }]}>Actualiser</ThemedText>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.four, gap: 12, paddingBottom: Spacing.six },
  header: { marginBottom: Spacing.two },
  accentLine: { height: 3, width: 48, borderRadius: 2, marginBottom: Spacing.three },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2, fontVariant: ['tabular-nums'] as any },
  serverBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm,
  },
  serverDot: { width: 7, height: 7, borderRadius: 3.5 },
  serverBadgeText: { fontSize: 11, fontWeight: '700' },
  section: { gap: Spacing.one },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', paddingLeft: 2 },
  sectionInner: { padding: Spacing.three, gap: Spacing.two },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  barOuter: { height: 6, borderRadius: 3, backgroundColor: '#E5E0D8', marginTop: 4, overflow: 'hidden' },
  barInner: { height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: Spacing.two, paddingHorizontal: Spacing.three,
    borderRadius: Radii.md, borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  bottomSpacer: { height: Spacing.three },
});
