/**
 * Hook useRaceReminders — planifie des notifications de rappel
 * pour les courses d'un nageur, et notifie quand un nouveau résultat apparaît.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  cancelAllRaceReminders,
  notifyRaceResult,
  scheduleRaceReminder,
} from '@/lib/notifications';

type RaceEvent = {
  id: number;
  name: string;
  time: string;       // format "HHhMM" ou "HH:MM"
  date?: string;      // format "YYYY-MM-DD"
  resultTime?: string;
};

type Props = {
  /** La liste des courses du nageur */
  events: RaceEvent[];
  /** Décalage en minutes avant la course pour le rappel (défaut: 10) */
  minutesBefore?: number;
  /** Map des derniers résultats connus : eventId → resultTime */
  previousResults?: Map<number, string | undefined>;
};

/**
 * Planifie les rappels de course et surveille les nouveaux résultats.
 * À utiliser dans le planning screen quand les données du nageur sont chargées.
 */
export function useRaceReminders({ events, minutesBefore = 10, previousResults }: Props) {
  const scheduledRef = useRef(false);

  // Planifier les rappels une fois que les events sont disponibles
  useEffect(() => {
    if (!events.length || scheduledRef.current) return;
    scheduledRef.current = true;

    events.forEach(event => {
      if (!event.time || event.time === '—') return;

      // Construire la date/heure de la course
      const raceDate = event.date ?? new Date().toISOString().split('T')[0];
      const [hours, mins] = event.time.includes('h')
        ? event.time.split('h')
        : event.time.split(':');
      const raceTime = new Date(`${raceDate}T${hours.padStart(2, '0')}:${(mins || '00').padStart(2, '0')}:00`);

      scheduleRaceReminder({
        identifier: `race-${event.id}`,
        eventName: event.name,
        raceTime,
        minutesBefore,
      });
    });

    return () => {
      cancelAllRaceReminders();
      scheduledRef.current = false;
    };
  }, [events, minutesBefore]);

  // Surveiller les nouveaux résultats
  useEffect(() => {
    if (!previousResults || !events.length) return;

    events.forEach(event => {
      const currentResult = event.resultTime;
      const previousResult = previousResults.get(event.id);

      if (currentResult && currentResult !== previousResult && previousResult !== undefined) {
        // Nouveau résultat détecté
        notifyRaceResult({
          eventName: event.name,
          time: currentResult,
        });
      }
    });
  }, [events, previousResults]);
}
