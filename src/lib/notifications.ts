/**
 * Notification utilities for local push notifications.
 * Uses expo-notifications to schedule race reminders and result alerts.
 *
 * NB: expo-notifications n'est PAS disponible dans Expo Go (depuis SDK 53+).
 * L'import est donc protégé : si le module est absent (Expo Go / web),
 * toutes les fonctions se comportent en no-op silencieux.
 */

import { Platform } from 'react-native';
import { Accent } from '@/constants/theme';

// Types seulement (pas de code exécutable, safe même si le module est absent)
import type * as NotificationsTypes from 'expo-notifications';

// ─── Module chargé paresseusement ──────────────────────────────

let NotificationsModule: typeof NotificationsTypes | null = null;

try {
  NotificationsModule = require('expo-notifications');
} catch (e: any) {
  console.warn(`[notifications] expo-notifications indisponible : ${e?.message ?? 'unknown'}`);
}

function N(): typeof NotificationsTypes {
  if (!NotificationsModule) {
    throw new Error('expo-notifications not available');
  }
  return NotificationsModule;
}

function isAvailable(): boolean {
  return NotificationsModule !== null;
}

// ─── Configuration ─────────────────────────────────────────────

let handlerConfigured = false;
let notificationListenersAttached = false;

/**
 * Vérifie si l'app est sur Android 12+ et a besoin de SCHEDULE_EXACT_ALARM.
 */
export function isExactAlarmRequired(): boolean {
  return Platform.OS === 'android' && Platform.Version >= 31;
}

/**
 * Demande les permissions de notification sur l'appareil.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isAvailable()) return false;
  try {
    const Notifications = N();
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[notifications] Permission refusée');
      return false;
    }

    // Android : créer les canaux
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('race-reminders', {
        name: 'Rappels de course',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF8C00',
      });
      await Notifications.setNotificationChannelAsync('race-results', {
        name: 'Résultats de course',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
      });
      await Notifications.setNotificationChannelAsync('activity', {
        name: 'Activité',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: Accent,
      });
    }

    return true;
  } catch (err) {
    console.error('[notifications] Erreur permission/channels:', err);
    return false;
  }
}

/**
 * Configure le handler global qui détermine comment afficher
 * une notification quand l'app est en premier plan.
 */
export function configureNotificationHandler() {
  if (handlerConfigured || !isAvailable()) return;
  handlerConfigured = true;

  const Notifications = N();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ─── Planification ─────────────────────────────────────────────

export type RaceReminder = {
  identifier: string;
  eventName: string;
  raceTime: Date;
  minutesBefore: number;
};

/**
 * Planifie une notification de rappel pour une course.
 */
export async function scheduleRaceReminder(reminder: RaceReminder): Promise<void> {
  if (!isAvailable()) return;
  try {
    const Notifications = N();
    const triggerDate = new Date(reminder.raceTime.getTime() - reminder.minutesBefore * 60 * 1000);

    if (triggerDate <= new Date()) {
      console.log(`[notifications] Course déjà passée, pas de rappel : ${reminder.eventName}`);
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(reminder.identifier).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.identifier,
      content: {
        title: 'Rappel de course',
        body: `Votre course "${reminder.eventName}" commence dans ${reminder.minutesBefore} minutes !`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'race-reminder', eventName: reminder.eventName },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'race-reminders',
      },
    });

    console.log(`[notifications] Rappel planifié : ${reminder.eventName} → ${triggerDate.toLocaleString()}`);
  } catch (err) {
    console.error(`[notifications] Erreur planification rappel "${reminder.eventName}":`, err);
  }
}

/**
 * Annule tous les rappels de course planifiés.
 */
export async function cancelAllRaceReminders(): Promise<void> {
  if (!isAvailable()) return;
  try {
    const Notifications = N();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const reminders = scheduled.filter(n => n.content.data?.type === 'race-reminder');
    for (const n of reminders) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
    console.log(`[notifications] ${reminders.length} rappels annulés`);
  } catch (err) {
    console.error('[notifications] Erreur annulation rappels:', err);
  }
}

// ─── Notification immédiate ────────────────────────────────────

export type ResultNotification = {
  eventName: string;
  time: string;
  place?: string;
};

/**
 * Envoie une notification locale immédiate pour un résultat de course.
 */
export async function notifyRaceResult(result: ResultNotification): Promise<void> {
  if (!isAvailable()) return;
  try {
    const Notifications = N();
    const body = result.place
      ? `${result.eventName} : ${result.time} — Place : ${result.place}`
      : `${result.eventName} : ${result.time}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Résultat disponible',
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'race-result', ...result },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: 'race-results',
      },
    });

    console.log(`[notifications] Résultat notifié : ${body}`);
  } catch (err) {
    console.error('[notifications] Erreur notification résultat:', err);
  }
}

// ─── Notification d'activité ───────────────────────────────────

export type ActivityNotification = {
  id: number;
  title: string;
  body: string;
  type: string;
};

/**
 * Envoie une notification locale immédiate pour une activité
 * (annonce coach, notification système, invitation, etc.).
 */
export async function notifyActivity(activity: ActivityNotification): Promise<void> {
  if (!isAvailable()) return;
  try {
    const Notifications = N();
    await Notifications.scheduleNotificationAsync({
      identifier: `activity-${activity.id}`,
      content: {
        title: activity.title,
        body: activity.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'activity', sourceType: activity.type, activityId: activity.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: 'activity',
      },
    });

    console.log(`[notifications] Activité notifiée : ${activity.title}`);
  } catch (err) {
    console.error('[notifications] Erreur notification activité:', err);
  }
}

/**
 * Vérifie les notifications planifiées (debug).
 */
export async function logScheduledNotifications(): Promise<void> {
  if (!isAvailable()) return;
  try {
    const Notifications = N();
    const all = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`[notifications] ${all.length} notifications planifiées :`);
    for (const n of all) {
      console.log(`  - ${n.identifier}: "${n.content.title}" (trigger: ${JSON.stringify(n.trigger)})`);
    }
  } catch (err) {
    console.error('[notifications] Erreur listage:', err);
  }
}

// ─── Listeners ──────────────────────────────────────────────────

/**
 * Attache des écouteurs de notification (reçue, tapée) pour le debug.
 */
export function attachNotificationListeners() {
  if (notificationListenersAttached || !isAvailable()) return;
  notificationListenersAttached = true;

  const Notifications = N();

  Notifications.addNotificationReceivedListener(notification => {
    console.log('[notifications] Reçue:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      identifier: notification.request.identifier,
    });
  });

  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('[notifications] Tapée:', {
      actionIdentifier: response.actionIdentifier,
      notification: {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data,
      },
    });
  });
}

// ─── Initialisation complète ────────────────────────────────────

/**
 * Initialisation complète des notifications :
 * 1. Handler foreground
 * 2. Permissions + canaux Android
 * 3. Écouteurs
 * À appeler UNE FOIS au démarrage de l'app.
 */
export async function initNotifications(): Promise<boolean> {
  if (!isAvailable()) {
    console.log('[notifications] Module indisponible, initialisation ignorée');
    return false;
  }

  console.log('[notifications] Initialisation...');

  configureNotificationHandler();

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.warn('[notifications] Permissions non accordées');
    return false;
  }

  attachNotificationListeners();

  console.log('[notifications] Initialisé avec succès');
  return true;
}
