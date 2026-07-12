/**
 * Hook useRaceReminders — planifie des notifications de rappel
 * pour les courses d'un nageur, et notifie quand un nouveau résultat apparaît.
 *
 * NB: les rappels restent actifs même après démontage du composant.
 * La planification est persistante jusqu'au prochain changement de données.
 */

import { useEffect, useRef } from 'react';
import {
  cancelAllRaceReminders,
  notifyRaceResult,
  scheduleRaceReminder,
} from '@/lib/notifications';
import { saveReminderData, clearReminderData } from '@/lib/reminder-storage';

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

export function useRaceReminders({ events, minutesBefore = 10, previousResults }: Props) {
  const scheduledRef = useRef(false);
  const eventsKeyRef = useRef('');

  // ─── Planification des rappels ──────────────────────────────
  useEffect(() => {
    if (!events.length) return;

    // Construire une clé pour détecter les changements de données
    const key = events.map(e => `${e.id}|${e.time}|${e.date}`).join(';');

    // Si déjà planifié avec les mêmes données, ne rien faire
    if (scheduledRef.current && key === eventsKeyRef.current) return;

    // Si les données ont changé, annuler les anciens rappels et replanifier
    if (scheduledRef.current && key !== eventsKeyRef.current) {
      cancelAllRaceReminders().catch(err =>
        console.warn('[reminders] Erreur annulation anciens rappels:', err)
      );
    }

    eventsKeyRef.current = key;
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

    // Persister les données pour restauration au prochain démarrage
    saveReminderData(events, minutesBefore).catch(err =>
      console.warn('[reminders] Erreur sauvegarde persistante:', err)
    );

    // PAS de cleanup — les rappels doivent survivre au démontage du composant
  }, [events, minutesBefore]);

  // ─── Nettoyage si plus aucune course ────────────────────────
  useEffect(() => {
    if (!events.length) {
      clearReminderData().catch(() => {});
    }
  }, [events.length]);

  // ─── Détection des nouveaux résultats ───────────────────────
  useEffect(() => {
    if (!previousResults || !events.length) return;

    events.forEach(event => {
      const currentResult = event.resultTime;
      const previousResult = previousResults.get(event.id);

      if (currentResult && currentResult !== previousResult && previousResult !== undefined) {
        notifyRaceResult({
          eventName: event.name,
          time: currentResult,
        });
      }
    });
  }, [events, previousResults]);
}
