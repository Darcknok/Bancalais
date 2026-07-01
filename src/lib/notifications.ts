/**
 * Notification utilities for local push notifications.
 * Uses expo-notifications to schedule race reminders and result alerts.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Configuration ─────────────────────────────────────────────

let handlerConfigured = false;

/**
 * Demande les permissions de notification sur l'appareil.
 * À appeler au démarrage de l'app.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
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
 * Sécurisé contre les appels multiples.
 */
export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;

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
  /** ID unique du rappel (ex: "race-{eventId}") */
  identifier: string;
  /** Nom de la nage */
  eventName: string;
  /** Date/heure de la course */
  raceTime: Date;
  /** Décalage en minutes avant la course pour déclencher la notif */
  minutesBefore: number;
};

/**
 * Planifie une notification de rappel pour une course.
 * Si la course est déjà passée, ne fait rien.
 */
export async function scheduleRaceReminder(reminder: RaceReminder): Promise<void> {
  try {
    const triggerDate = new Date(reminder.raceTime.getTime() - reminder.minutesBefore * 60 * 1000);

    if (triggerDate <= new Date()) {
      console.log(`[notifications] Course déjà passée, pas de rappel : ${reminder.eventName}`);
      return;
    }

    // Annule un éventuel doublon
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

    console.log(
      `[notifications] Rappel planifié : ${reminder.eventName} → ${triggerDate.toLocaleString()}`,
    );
  } catch (err) {
    console.error(`[notifications] Erreur planification rappel "${reminder.eventName}":`, err);
  }
}

/**
 * Annule tous les rappels de course planifiés.
 */
export async function cancelAllRaceReminders(): Promise<void> {
  try {
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
  try {
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

/**
 * Vérifie les notifications planifiées (debug).
 */
export async function logScheduledNotifications(): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`[notifications] ${all.length} notifications planifiées :`);
    for (const n of all) {
      console.log(`  - ${n.identifier}: "${n.content.title}" (trigger: ${JSON.stringify(n.trigger)})`);
    }
  } catch (err) {
    console.error('[notifications] Erreur listage:', err);
  }
}
