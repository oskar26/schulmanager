/**
 * Smart Insights — die Regel-Engine, die aus rohen Schuldaten Sätze macht,
 * die man tatsächlich lesen will.
 *
 * Jede Regel ist eine reine Funktion (Snapshot → Insight[]), damit sie
 * testbar ist und sowohl im Dashboard als auch für Notifications und
 * Home-Screen-Widgets dieselben Ergebnisse liefert.
 */
import type { Lesson, Snapshot } from '@/api/types';
import { addDays, daysUntil, formatDuration, formatRelativeDay, minutesOf, nowMinutes, toISO } from '@/lib/date';

export type InsightTone = 'positive' | 'neutral' | 'warning' | 'critical' | 'fun';

export interface Insight {
  id: string;
  emoji: string;
  title: string;
  body?: string;
  tone: InsightTone;
  /** Höher = wichtiger. Das Dashboard zeigt die Top-N. */
  score: number;
  action?: { label: string; href: string };
}

const TONE_ORDER: Record<InsightTone, number> = {
  critical: 4,
  warning: 3,
  positive: 2,
  fun: 1,
  neutral: 0,
};

export const lessonsOn = (snapshot: Snapshot, iso: string): Lesson[] =>
  snapshot.lessons
    .filter((lesson) => lesson.date === iso)
    .sort((a, b) => a.start.localeCompare(b.start));

export const activeLessonsOn = (snapshot: Snapshot, iso: string): Lesson[] =>
  lessonsOn(snapshot, iso).filter((lesson) => lesson.state !== 'cancelled');

/* ------------------------------------------------------------------ Regeln */

function ruleFirstHourFree(snapshot: Snapshot, tomorrow: string): Insight[] {
  const lessons = lessonsOn(snapshot, tomorrow);
  if (lessons.length === 0) return [];

  const first = lessons[0];
  const firstActive = lessons.find((lesson) => lesson.state !== 'cancelled');
  if (!firstActive || first.state !== 'cancelled') return [];

  const minutes = minutesOf(firstActive.start) - minutesOf(first.start);
  if (minutes <= 0) return [];

  return [
    {
      id: 'first-hour-free',
      emoji: '😴',
      title: `Morgen ${formatDuration(minutes)} länger schlafen`,
      body: `${first.originalSubject ?? first.subject} in der ${first.hour}. Stunde entfällt — Schulbeginn erst um ${firstActive.start} Uhr.`,
      tone: 'positive',
      score: 95,
      action: { label: 'Stundenplan', href: '/timetable' },
    },
  ];
}

function ruleCancellations(snapshot: Snapshot, from: string, to: string): Insight[] {
  const cancelled = snapshot.lessons.filter(
    (lesson) => lesson.state === 'cancelled' && lesson.date >= from && lesson.date <= to,
  );
  if (cancelled.length === 0) return [];

  const grouped = cancelled.slice(0, 3);
  return [
    {
      id: 'cancellations',
      emoji: '🎉',
      title: cancelled.length === 1 ? '1 Stunde fällt aus' : `${cancelled.length} Stunden fallen aus`,
      body: grouped
        .map((lesson) => `${formatRelativeDay(lesson.date)}: ${lesson.originalSubject ?? lesson.subject} (${lesson.hour}.)`)
        .join(' · '),
      tone: 'positive',
      score: 78,
      action: { label: 'Ansehen', href: '/timetable' },
    },
  ];
}

function ruleSubstitutions(snapshot: Snapshot, from: string, to: string): Insight[] {
  const subs = snapshot.lessons.filter(
    (lesson) => lesson.state === 'substitution' && lesson.date >= from && lesson.date <= to,
  );
  if (subs.length === 0) return [];
  return [
    {
      id: 'substitutions',
      emoji: '🔁',
      title: `${subs.length} Vertretung${subs.length === 1 ? '' : 'en'} diese Woche`,
      body: subs
        .slice(0, 3)
        .map((lesson) => `${formatRelativeDay(lesson.date)}: ${lesson.originalSubject ?? lesson.subject} → ${lesson.teacher ?? 'Vertretung'}`)
        .join(' · '),
      tone: 'neutral',
      score: 55,
      action: { label: 'Stundenplan', href: '/timetable' },
    },
  ];
}

function ruleExamCluster(snapshot: Snapshot): Insight[] {
  const upcoming = snapshot.exams
    .filter((exam) => daysUntil(exam.date) >= 0 && daysUntil(exam.date) <= 14)
    .sort((a, b) => a.date.localeCompare(b.date));

  const out: Insight[] = [];

  const next = upcoming[0];
  if (next) {
    const days = daysUntil(next.date);
    out.push({
      id: 'next-exam',
      emoji: days <= 1 ? '🔥' : '📊',
      title:
        days === 0
          ? `Heute: ${next.subject} (${next.type ?? 'Arbeit'})`
          : days === 1
            ? `Morgen: ${next.subject}`
            : `In ${days} Tagen: ${next.subject}`,
      body: next.comment ?? next.type,
      tone: days <= 1 ? 'critical' : days <= 3 ? 'warning' : 'neutral',
      score: 90 - days * 2,
      action: { label: 'Lernplan', href: '/tasks' },
    });
  }

  // Ballung: 3+ Arbeiten innerhalb von 7 Tagen
  for (let index = 0; index < upcoming.length; index += 1) {
    const window = upcoming.filter(
      (exam) => daysUntil(exam.date) >= daysUntil(upcoming[index].date) &&
        daysUntil(exam.date) <= daysUntil(upcoming[index].date) + 6,
    );
    if (window.length >= 3) {
      out.push({
        id: 'exam-cluster',
        emoji: '⚠️',
        title: `${window.length} Arbeiten in einer Woche`,
        body: `${window.map((exam) => exam.subject).join(', ')} — jetzt mit dem Lernplan starten zahlt sich aus.`,
        tone: 'warning',
        score: 84,
        action: { label: 'Lernplan öffnen', href: '/tasks' },
      });
      break;
    }
  }

  return out;
}

function ruleHomework(snapshot: Snapshot, today: string, tomorrow: string): Insight[] {
  const open = snapshot.homework.filter((item) => !item.done && item.due >= today);
  const dueTomorrow = open.filter((item) => item.due === tomorrow);
  const overdue = snapshot.homework.filter((item) => !item.done && item.due < today);

  const out: Insight[] = [];

  if (dueTomorrow.length > 0) {
    out.push({
      id: 'homework-tomorrow',
      emoji: '📝',
      title: `${dueTomorrow.length} Hausaufgabe${dueTomorrow.length === 1 ? '' : 'n'} bis morgen`,
      body: dueTomorrow.map((item) => item.subject).join(' · '),
      tone: dueTomorrow.length > 2 ? 'warning' : 'neutral',
      score: 80,
      action: { label: 'Aufgaben', href: '/tasks' },
    });
  }

  if (overdue.length > 0) {
    out.push({
      id: 'homework-overdue',
      emoji: '⏰',
      title: `${overdue.length} Aufgabe${overdue.length === 1 ? '' : 'n'} überfällig`,
      body: overdue.map((item) => `${item.subject} (${formatRelativeDay(item.due)})`).join(' · '),
      tone: 'critical',
      score: 88,
      action: { label: 'Nachholen', href: '/tasks' },
    });
  }

  if (open.length === 0 && snapshot.homework.length > 0) {
    out.push({
      id: 'homework-clear',
      emoji: '🥳',
      title: 'Alle Hausaufgaben erledigt',
      body: 'Nichts offen. Feierabend ist erlaubt.',
      tone: 'positive',
      score: 40,
    });
  }

  return out;
}

function ruleLetters(snapshot: Snapshot): Insight[] {
  const pending = snapshot.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed);
  if (pending.length === 0) return [];

  const oldest = pending.reduce((acc, letter) => (letter.createdAt < acc.createdAt ? letter : acc), pending[0]);
  const ageDays = Math.floor((Date.now() - new Date(oldest.createdAt).getTime()) / 86_400_000);

  return [
    {
      id: 'letters-pending',
      emoji: '✉️',
      title: `${pending.length} Elternbrief${pending.length === 1 ? '' : 'e'} unbestätigt`,
      body: ageDays >= 2 ? `„${oldest.subject}" wartet seit ${ageDays} Tagen.` : oldest.subject,
      tone: ageDays >= 3 ? 'warning' : 'neutral',
      score: 70 + Math.min(ageDays, 5) * 3,
      action: { label: 'Bestätigen', href: '/inbox' },
    },
  ];
}

function ruleMessages(snapshot: Snapshot): Insight[] {
  const unread = snapshot.threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
  if (unread === 0) return [];
  return [
    {
      id: 'messages-unread',
      emoji: '💬',
      title: `${unread} neue Nachricht${unread === 1 ? '' : 'en'}`,
      body: snapshot.threads.find((thread) => thread.unreadCount > 0)?.subject,
      tone: 'neutral',
      score: 62,
      action: { label: 'Postfach', href: '/inbox' },
    },
  ];
}

function ruleGrades(snapshot: Snapshot): Insight[] {
  const withAverage = snapshot.subjects.filter((subject) => subject.average != null);
  if (withAverage.length === 0) return [];

  const overall =
    withAverage.reduce((sum, subject) => sum + (subject.average as number), 0) / withAverage.length;

  const out: Insight[] = [];

  const weakest = [...withAverage].sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];
  if (weakest && (weakest.average ?? 0) >= 3.6) {
    out.push({
      id: 'grade-risk',
      emoji: '🎯',
      title: `${weakest.subject} braucht Aufmerksamkeit`,
      body: `Schnitt ${weakest.average?.toFixed(2)} — eine gute Note in der nächsten Arbeit hebt ihn spürbar.`,
      tone: 'warning',
      score: 66,
      action: { label: 'Notenrechner', href: '/grades' },
    });
  }

  const best = [...withAverage].sort((a, b) => (a.average ?? 9) - (b.average ?? 9))[0];
  if (best && (best.average ?? 9) <= 1.6) {
    out.push({
      id: 'grade-strength',
      emoji: '⭐',
      title: `${best.subject} läuft richtig gut`,
      body: `Schnitt ${best.average?.toFixed(2)}. Weiter so.`,
      tone: 'positive',
      score: 34,
    });
  }

  out.push({
    id: 'grade-overall',
    emoji: '📈',
    title: `Gesamtschnitt ${overall.toFixed(2)}`,
    body: `Über ${withAverage.length} Fächer mit Noten.`,
    tone: 'neutral',
    score: 24,
    action: { label: 'Noten', href: '/grades' },
  });

  return out;
}

function ruleAttendance(snapshot: Snapshot): Insight[] {
  const unexcused = snapshot.absences.filter((absence) => !absence.excused);
  if (unexcused.length === 0) return [];
  return [
    {
      id: 'attendance-unexcused',
      emoji: '🩹',
      title: `${unexcused.length} unentschuldigte Fehlzeit${unexcused.length === 1 ? '' : 'en'}`,
      body: 'Eine Entschuldigung nachreichen verhindert Ärger im Zeugnis.',
      tone: 'warning',
      score: 72,
      action: { label: 'Fehlzeiten', href: '/attendance' },
    },
  ];
}

function ruleExemptions(snapshot: Snapshot): Insight[] {
  const open = snapshot.exemptions.filter((entry) => entry.granted === null);
  if (open.length === 0) return [];
  return [
    {
      id: 'exemption-pending',
      emoji: '🕓',
      title: `${open.length} Beurlaubung wartet auf Antwort`,
      body: open.map((entry) => entry.comment ?? '').filter(Boolean).join(' · '),
      tone: 'neutral',
      score: 45,
    },
  ];
}

function ruleEvents(snapshot: Snapshot): Insight[] {
  const soon = snapshot.events
    .filter((event) => {
      const days = daysUntil(event.start.slice(0, 10));
      return days >= 0 && days <= 3;
    })
    .slice(0, 2);

  return soon.map((event, index) => ({
    id: `event-${event.id}`,
    emoji: event.isHoliday ? '🏖️' : '📅',
    title: `${formatRelativeDay(event.start.slice(0, 10))}: ${event.title}`,
    body: event.location ?? event.categoryName,
    tone: event.isHoliday ? 'positive' : 'neutral',
    score: 50 - index * 5,
    action: { label: 'Kalender', href: '/calendar' },
  }));
}

function rulePackingList(snapshot: Snapshot, tomorrow: string): Insight[] {
  const items = packingList(snapshot, tomorrow);
  if (items.length === 0) return [];
  return [
    {
      id: 'packing',
      emoji: '🎒',
      title: 'Für morgen einpacken',
      body: items.join(' · '),
      tone: 'fun',
      score: 58,
    },
  ];
}

function ruleLongDay(snapshot: Snapshot, tomorrow: string): Insight[] {
  const lessons = activeLessonsOn(snapshot, tomorrow);
  if (lessons.length < 8) return [];
  return [
    {
      id: 'long-day',
      emoji: '☕',
      title: `Morgen ${lessons.length} Stunden`,
      body: `Von ${lessons[0].start} bis ${lessons[lessons.length - 1].end} Uhr — Verpflegung mitnehmen.`,
      tone: 'neutral',
      score: 44,
    },
  ];
}

/* ------------------------------------------------------------------ Packliste */

const PACKING_RULES: { match: RegExp; item: string }[] = [
  { match: /sport/i, item: '🏃 Sportzeug' },
  { match: /schwimm/i, item: '🏊 Badesachen' },
  { match: /kunst|bildner/i, item: '🎨 Malzeug' },
  { match: /musik/i, item: '🎵 Instrument/Noten' },
  { match: /chemie|physik|biologie|nawi|natur/i, item: '🥽 Laborheft' },
  { match: /informatik/i, item: '💻 Laptop/Tablet' },
  { match: /werken|technik/i, item: '🔨 Arbeitskittel' },
  { match: /koch|hauswirtschaft/i, item: '🍳 Schürze' },
];

export function packingList(snapshot: Snapshot, iso: string): string[] {
  const lessons = activeLessonsOn(snapshot, iso);
  const items = new Set<string>();

  lessons.forEach((lesson) => {
    PACKING_RULES.forEach((rule) => {
      if (rule.match.test(lesson.subject) || rule.match.test(lesson.originalSubject ?? '')) {
        items.add(rule.item);
      }
    });
  });

  snapshot.homework
    .filter((item) => !item.done && item.due === iso)
    .forEach((item) => items.add(`📝 ${item.subject}-Hausaufgabe`));

  snapshot.exams
    .filter((exam) => exam.date === iso)
    .forEach((exam) => items.add(`📊 ${exam.subject}: ${exam.type ?? 'Arbeit'}`));

  return Array.from(items);
}

/* ------------------------------------------------------------------ Aggregation */

export function computeInsights(snapshot: Snapshot): Insight[] {
  const today = toISO(new Date());
  const tomorrow = toISO(addDays(new Date(), 1));
  const inSevenDays = toISO(addDays(new Date(), 7));

  const insights = [
    ...ruleFirstHourFree(snapshot, tomorrow),
    ...ruleCancellations(snapshot, today, inSevenDays),
    ...ruleSubstitutions(snapshot, today, inSevenDays),
    ...ruleExamCluster(snapshot),
    ...ruleHomework(snapshot, today, tomorrow),
    ...ruleLetters(snapshot),
    ...ruleMessages(snapshot),
    ...ruleGrades(snapshot),
    ...ruleAttendance(snapshot),
    ...ruleExemptions(snapshot),
    ...ruleEvents(snapshot),
    ...rulePackingList(snapshot, tomorrow),
    ...ruleLongDay(snapshot, tomorrow),
  ];

  return insights.sort((a, b) => b.score - a.score || TONE_ORDER[b.tone] - TONE_ORDER[a.tone]);
}

/* ------------------------------------------------------------------ „Jetzt"-Status */

export interface NowStatus {
  kind: 'before-school' | 'in-lesson' | 'break' | 'after-school' | 'free-day';
  lesson?: Lesson;
  next?: Lesson;
  /** Minuten bis zum Ende der laufenden bzw. bis zum Beginn der nächsten Stunde */
  minutes: number;
  label: string;
}

export function computeNow(snapshot: Snapshot): NowStatus {
  const today = toISO(new Date());
  const lessons = activeLessonsOn(snapshot, today);
  const minutes = nowMinutes();

  if (lessons.length === 0) {
    const nextDay = snapshot.lessons
      .filter((lesson) => lesson.date > today && lesson.state !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))[0];
    return {
      kind: 'free-day',
      next: nextDay,
      minutes: 0,
      label: nextDay ? `Nächster Unterricht ${formatRelativeDay(nextDay.date)}` : 'Kein Unterricht',
    };
  }

  const current = lessons.find(
    (lesson) => minutes >= minutesOf(lesson.start) && minutes < minutesOf(lesson.end),
  );
  if (current) {
    return {
      kind: 'in-lesson',
      lesson: current,
      next: lessons.find((lesson) => minutesOf(lesson.start) > minutes),
      minutes: minutesOf(current.end) - minutes,
      label: `noch ${formatDuration(minutesOf(current.end) - minutes)}`,
    };
  }

  const next = lessons.find((lesson) => minutesOf(lesson.start) > minutes);
  if (!next) {
    return { kind: 'after-school', minutes: 0, label: 'Schule ist aus 🎈' };
  }

  const first = lessons[0];
  if (minutes < minutesOf(first.start)) {
    return {
      kind: 'before-school',
      next: first,
      minutes: minutesOf(first.start) - minutes,
      label: `Start in ${formatDuration(minutesOf(first.start) - minutes)}`,
    };
  }

  return {
    kind: 'break',
    next,
    minutes: minutesOf(next.start) - minutes,
    label: `Pause — noch ${formatDuration(minutesOf(next.start) - minutes)}`,
  };
}
