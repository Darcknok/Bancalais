/**
 * NotificationScheduler — composant racine invisible.
 *
 * Deux responsabilités :
 * 1. Restaure les rappels de course depuis AsyncStorage au démarrage de l'app.
 * 2. Polle les notifications serveur (activité) et déclenche un push local
 *    quand une nouvelle notification apparaît.
 *
 * Le composant ne produit aucun rendu visuel.
 */

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { loadReminderData } from '@/lib/reminder-storage';
import {
  scheduleRaceReminder,
  cancelAllRaceReminders,
  notifyActivity,
  logScheduledNotifications,
} from '@/lib/notifications';
import { fetchNotifications } from '@/lib/api';

const LAST_ACTIVITY_ID_KEY = '@bancalais/last-activity-id';
const POLL_INTERVAL_MS = 120_000; // 2 minutes

type RestoredEvent = {
  id: number;
  name: string;
  time: string;
  date?: string;
};

/**
 * Replanifie tous les rappels à partir des données persistées.
 */
async function restoreReminders(events: RestoredEvent[], minutesBefore: number): Promise<void> {
  console.log(`[notification-scheduler] Restauration de ${events.length} rappels (délai: ${minutesBefore} min)...`);

  await cancelAllRaceReminders();

  let scheduledCount = 0;
  for (const event of events) {
    if (!event.time || event.time === '—') continue;

    const raceDate = event.date ?? new Date().toISOString().split('T')[0];
    const [hours, mins] = event.time.includes('h')
      ? event.time.split('h')
      : event.time.split(':');
    const raceTime = new Date(`${raceDate}T${hours.padStart(2, '0')}:${(mins || '00').padStart(2, '0')}:00`);

    await scheduleRaceReminder({
      identifier: `race-${event.id}`,
      eventName: event.name,
      raceTime,
      minutesBefore,
    });
    scheduledCount++;
  }

  console.log(`[notification-scheduler] ${scheduledCount} rappels restaurés`);
  setTimeout(() => { logScheduledNotifications(); }, 1000);
}

/**
 * Récupère le dernier ID de notification connu depuis AsyncStorage.
 */
async function getLastActivityId(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ACTIVITY_ID_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

/**
 * Sauvegarde le dernier ID de notification connu.
 */
async function setLastActivityId(id: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVITY_ID_KEY, String(id));
  } catch (err) {
    console.warn('[notification-scheduler] Erreur sauvegarde lastActivityId:', err);
  }
}

/**
 * Interroge le serveur pour les nouvelles notifications d'activité
 * et déclenche un push local pour celles qui n'ont pas encore été vues.
 */
async function pollActivity(): Promise<void> {
  try {
    const lastId = await getLastActivityId();
    const res = await fetchNotifications();
    if (!res.data?.notifications?.length) return;

    const notifs = res.data.notifications;
    let maxId = lastId;

    for (const n of notifs) {
      if (n.id > lastId) {
        // Nouvelle notification jamais vue → push local
        await notifyActivity({
          id: n.id,
          title: n.title,
          body: n.body,
          type: n.type,
        });
      }
      if (n.id > maxId) maxId = n.id;
    }

    if (maxId > lastId) {
      await setLastActivityId(maxId);
    }
  } catch (err) {
    console.warn('[notification-scheduler] Erreur poll activité:', err);
  }
}

export default function NotificationScheduler() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // ── 1. Restaurer les rappels de course ──
    (async () => {
      const data = await loadReminderData();
      if (!data || cancelled) return;
      await restoreReminders(data.events, data.minutesBefore);
    })();

    // ── 2. Lancer le polling d'activité ──
    const startPolling = async () => {
      // Premier poll immédiat (mais après initNotifications)
      setTimeout(async () => {
        if (cancelled) return;
        await pollActivity();
      }, 3000);

      // Puis toutes les 2 minutes
      intervalRef.current = setInterval(async () => {
        if (cancelled) return;
        // Ne pas poller si l'app est en arrière-plan
        if (AppState.currentState === 'active') {
          await pollActivity();
        }
      }, POLL_INTERVAL_MS);
    };

    startPolling();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return null;
}
