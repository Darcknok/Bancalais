/**
 * Stockage persistant des données de rappels de course.
 * Utilise AsyncStorage pour que les rappels survivent aux redémarrages de l'app.
 *
 * Quand l'utilisateur visite l'écran Planning et que les rappels sont planifiés,
 * on sauvegarde les données dans AsyncStorage.
 * Au démarrage suivant de l'app, NotificationScheduler restaure ces données
 * et replanifie les rappels, même si l'utilisateur n'ouvre pas le Planning.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bancalais/reminder-data';

export type StoredRaceEvent = {
  id: number;
  name: string;
  time: string;       // format "HHhMM" ou "HH:MM"
  date?: string;      // format "YYYY-MM-DD"
  resultTime?: string;
};

export type ReminderStorageData = {
  /** Liste des courses à rappeler */
  events: StoredRaceEvent[];
  /** Décalage en minutes avant la course (tel que configuré dans les préférences) */
  minutesBefore: number;
  /** Timestamp de la dernière sauvegarde (ISO) */
  savedAt: string;
};

/**
 * Sauvegarde les données de rappel dans AsyncStorage.
 * Appelée après chaque planification dans useRaceReminders.
 */
export async function saveReminderData(
  events: StoredRaceEvent[],
  minutesBefore: number,
): Promise<void> {
  try {
    if (!events.length) return;
    const data: ReminderStorageData = {
      events,
      minutesBefore,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log(`[reminder-storage] Sauvegardé : ${events.length} courses, délai ${minutesBefore} min`);
  } catch (err) {
    console.error('[reminder-storage] Erreur sauvegarde :', err);
  }
}

/**
 * Charge les données de rappel depuis AsyncStorage.
 * Retourne null si aucune donnée n'existe.
 */
export async function loadReminderData(): Promise<ReminderStorageData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: ReminderStorageData = JSON.parse(raw);
    console.log(`[reminder-storage] Chargé : ${data.events.length} courses, délai ${data.minutesBefore} min (sauvé le ${data.savedAt})`);
    return data;
  } catch (err) {
    console.error('[reminder-storage] Erreur chargement :', err);
    return null;
  }
}

/**
 * Supprime les données de rappel d'AsyncStorage.
 * Utile après une déconnexion ou quand l'utilisateur n'a plus de courses.
 */
export async function clearReminderData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[reminder-storage] Données effacées');
  } catch (err) {
    console.error('[reminder-storage] Erreur effacement :', err);
  }
}
