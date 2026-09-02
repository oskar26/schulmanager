/**
 * Lokale, „smarte" Benachrichtigungen.
 *
 * Serverlos: Schulflow vergleicht bei jedem Sync den neuen Snapshot mit dem
 * zuletzt gesehenen und plant nur für *echte* Änderungen eine Notification.
 * Dadurch gibt es keine Doppelmeldungen und keinen Push-Backend-Zwang.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { Snapshot } from '@/api/types';
import { daysUntil, formatRelativeDay, minutesOf, toISO, addDays } from '@/lib/date';
import { KEYS, storage } from '@/lib/storage';
import type { NotificationPrefs } from '@/state/settings';
import { packingList, activeLessonsOn } from '@/features/insights/engine';

export interface PlannedNotification {
  id: string;
  title: string;
  body: string;
  /** Zeitpunkt als ISO-String; Vergangenheit ⇒ wird verworfen */
  at: string;
  channel: 'timetable' | 'tasks' | 'inbox' | 'grades' | 'digest';
}

interface NotificationState {
  seenLetters: string[];
  seenGrades: string[];
  seenSubstitutions: string[];
  lastDigest?: string;
}

const EMPTY_STATE: NotificationState = { seenLetters: [], seenGrades: [], seenSubstitutions: [] };

export function registerNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync('timetable', {
      name: 'Stundenplan & Vertretung',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#6C5CE7',
    });
    void Notifications.setNotificationChannelAsync('tasks', {
      name: 'Aufgaben & Arbeiten',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    void Notifications.setNotificationChannelAsync('inbox', {
      name: 'Briefe & Nachrichten',
      importance: Notifications.AndroidImportance.HIGH,
    });
    void Notifications.setNotificationChannelAsync('digest', {
      name: 'Briefings',
      importance: Notifications.AndroidImportance.LOW,
    });
  }
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

const inQuietHours = (date: Date, prefs: NotificationPrefs): boolean => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const from = minutesOf(prefs.quietHours.from);
  const to = minutesOf(prefs.quietHours.to);
  return from > to ? minutes >= from || minutes < to : minutes >= from && minutes < to;
};

const at = (iso: string, time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(`${iso}T00:00:00`);
  date.setHours(hours ?? 8, minutes ?? 0, 0, 0);
  return date.toISOString();
};

/**
 * Reine Funktion: Snapshot + Zustand + Einstellungen → Liste zu planender Meldungen.
 * Genau so ist die Engine testbar, ohne das Notification-System zu berühren.
 */
export function planNotifications(
  snapshot: Snapshot,
  prefs: NotificationPrefs,
  state: NotificationState = EMPTY_STATE,
): { planned: PlannedNotification[]; nextState: NotificationState } {
  const planned: PlannedNotification[] = [];
  const today = toISO(new Date());
  const tomorrow = toISO(addDays(new Date(), 1));

  /* --- Vertretungen & Ausfälle ------------------------------------------ */
  const seenSubstitutions = new Set(state.seenSubstitutions);
  if (prefs.substitutions) {
    snapshot.lessons
      .filter((lesson) => lesson.date >= today && ['cancelled', 'substitution', 'room-change'].includes(lesson.state))
      .forEach((lesson) => {
        const key = `${lesson.id}-${lesson.state}`;
        if (seenSubstitutions.has(key)) return;
        seenSubstitutions.add(key);
        planned.push({
          id: `sub-${key}`,
          title:
            lesson.state === 'cancelled'
              ? `🎉 ${lesson.originalSubject ?? lesson.subject} fällt aus`
              : lesson.state === 'substitution'
                ? `🔁 Vertretung in ${lesson.originalSubject ?? lesson.subject}`
                : `🚪 Raumwechsel: ${lesson.subject}`,
          body: `${formatRelativeDay(lesson.date)}, ${lesson.hour}. Stunde${lesson.room ? ` · Raum ${lesson.room}` : ''}`,
          at: new Date().toISOString(),
          channel: 'timetable',
        });
      });
  }

  /* --- Erste Stunde entfällt -------------------------------------------- */
  if (prefs.firstHourCancelled) {
    const lessons = snapshot.lessons
      .filter((lesson) => lesson.date === tomorrow)
      .sort((a, b) => a.start.localeCompare(b.start));
    const firstActive = lessons.find((lesson) => lesson.state !== 'cancelled');
    if (lessons[0]?.state === 'cancelled' && firstActive) {
      planned.push({
        id: `sleepin-${tomorrow}`,
        title: '😴 Morgen länger schlafen',
        body: `Schulbeginn erst um ${firstActive.start} Uhr.`,
        at: at(today, '19:00'),
        channel: 'timetable',
      });
    }
  }

  /* --- Hausaufgaben ------------------------------------------------------ */
  if (prefs.homeworkDue) {
    const due = snapshot.homework.filter((item) => !item.done && item.due === tomorrow);
    if (due.length > 0) {
      planned.push({
        id: `hw-${tomorrow}`,
        title: `📝 ${due.length} Hausaufgabe${due.length === 1 ? '' : 'n'} bis morgen`,
        body: due.map((item) => item.subject).join(', '),
        at: at(today, '18:00'),
        channel: 'tasks',
      });
    }
  }

  /* --- Klassenarbeiten --------------------------------------------------- */
  if (prefs.examCountdown) {
    snapshot.exams.forEach((exam) => {
      [7, 3, 1].forEach((offset) => {
        const days = daysUntil(exam.date);
        if (days < offset) return;
        const reminderDay = toISO(addDays(new Date(exam.date), -offset));
        planned.push({
          id: `exam-${exam.id}-${offset}`,
          title: offset === 1 ? `🔥 Morgen: ${exam.subject}` : `📊 In ${offset} Tagen: ${exam.subject}`,
          body: `${exam.type ?? 'Leistungsnachweis'}${exam.comment ? ` · ${exam.comment}` : ''}`,
          at: at(reminderDay, '16:00'),
          channel: 'tasks',
        });
      });
    });
  }

  /* --- Elternbriefe ------------------------------------------------------ */
  const seenLetters = new Set(state.seenLetters);
  snapshot.letters.forEach((letter) => {
    const id = String(letter.id);
    if (prefs.newLetter && !seenLetters.has(id)) {
      planned.push({
        id: `letter-${id}`,
        title: '✉️ Neuer Elternbrief',
        body: letter.subject,
        at: new Date().toISOString(),
        channel: 'inbox',
      });
    }
    seenLetters.add(id);

    if (prefs.letterReminder && letter.requiresConfirmation && !letter.confirmed) {
      const age = Date.now() - new Date(letter.createdAt).getTime();
      if (age > 2 * 86_400_000) {
        planned.push({
          id: `letter-reminder-${id}`,
          title: '📌 Elternbrief noch unbestätigt',
          body: letter.subject,
          at: at(today, '17:30'),
          channel: 'inbox',
        });
      }
    }
  });

  /* --- Neue Noten -------------------------------------------------------- */
  const seenGrades = new Set(state.seenGrades);
  if (prefs.newGrade) {
    snapshot.subjects.forEach((subject) => {
      subject.grades.forEach((grade) => {
        const id = `${subject.subject}-${grade.id}`;
        if (seenGrades.has(id)) return;
        seenGrades.add(id);
        // Beim allerersten Sync nicht alles nachmelden
        if (state.seenGrades.length === 0) return;
        planned.push({
          id: `grade-${id}`,
          title: `🎯 Neue Note in ${subject.subject}`,
          body: `${grade.value}${grade.type ? ` · ${grade.type}` : ''}`,
          at: new Date().toISOString(),
          channel: 'grades',
        });
      });
    });
  }

  /* --- Unentschuldigte Fehlzeit ------------------------------------------ */
  if (prefs.unexcusedAbsence) {
    const unexcused = snapshot.absences.filter((absence) => !absence.excused);
    if (unexcused.length > 0) {
      planned.push({
        id: `absence-${unexcused.length}`,
        title: `🩹 ${unexcused.length} unentschuldigte Fehlzeit${unexcused.length === 1 ? '' : 'en'}`,
        body: 'Entschuldigung nachreichen?',
        at: at(today, '17:00'),
        channel: 'inbox',
      });
    }
  }

  /* --- Morgen-Briefing --------------------------------------------------- */
  if (prefs.morningBriefing) {
    const lessons = activeLessonsOn(snapshot, tomorrow);
    if (lessons.length > 0) {
      const items = packingList(snapshot, tomorrow);
      planned.push({
        id: `briefing-${tomorrow}`,
        title: `☀️ ${lessons.length} Stunden, Start ${lessons[0].start}`,
        body: [lessons.map((lesson) => lesson.subject).slice(0, 4).join(' · '), items.join(' · ')]
          .filter(Boolean)
          .join('\n'),
        at: at(tomorrow, prefs.briefingTime),
        channel: 'digest',
      });
    }
  }

  /* --- Abend-Check ------------------------------------------------------- */
  if (prefs.eveningCheck) {
    planned.push({
      id: `evening-${today}`,
      title: '🌙 Alles für morgen bereit?',
      body: packingList(snapshot, tomorrow).join(' · ') || 'Tasche packen und gut schlafen.',
      at: at(today, '20:00'),
      channel: 'digest',
    });
  }

  /* --- Wochenrückblick (Sonntag 18:00) ----------------------------------- */
  if (prefs.weeklyReview) {
    const sunday = toISO(addDays(new Date(), (7 - new Date().getDay()) % 7));
    planned.push({
      id: `weekly-${sunday}`,
      title: '📅 Deine Woche im Überblick',
      body: `${snapshot.exams.filter((exam) => daysUntil(exam.date) >= 0 && daysUntil(exam.date) <= 7).length} Arbeiten, ${
        snapshot.homework.filter((item) => !item.done).length
      } offene Aufgaben.`,
      at: at(sunday, '18:00'),
      channel: 'digest',
    });
  }

  const filtered = planned.filter((notification) => {
    const date = new Date(notification.at);
    if (Number.isNaN(date.getTime())) return false;
    if (date.getTime() < Date.now() - 60_000) return false;
    return !inQuietHours(date, prefs);
  });

  return {
    planned: filtered,
    nextState: {
      seenLetters: Array.from(seenLetters),
      seenGrades: Array.from(seenGrades),
      seenSubstitutions: Array.from(seenSubstitutions).slice(-400),
      lastDigest: today,
    },
  };
}

/** Plant alles neu — alte Planungen werden vorher verworfen (idempotent). */
export async function syncNotifications(snapshot: Snapshot, prefs: NotificationPrefs): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const granted = await requestPermission();
  if (!granted) return 0;

  const state = await storage.getJSON<NotificationState>(KEYS.notificationState, EMPTY_STATE);
  const { planned, nextState } = planNotifications(snapshot, prefs, state);

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const notification of planned) {
    const date = new Date(notification.at);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { channel: notification.channel },
      },
      trigger:
        date.getTime() <= Date.now() + 5_000
          ? null
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }

  await storage.setJSON(KEYS.notificationState, nextState);
  return planned.length;
}
