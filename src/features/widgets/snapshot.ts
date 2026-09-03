/**
 * Home-Screen-Widgets — gemeinsamer Datenspeicher.
 *
 * Native Widget-Extensions (iOS WidgetKit, Android Glance) können kein
 * React rendern — sie lesen ein kompaktes JSON, das die App nach jedem
 * Sync schreibt (`bridge.ts` → SharedPreferences / App-Group-Container).
 *
 * Diese Datei ist die *einzige* Wahrheit für das Schema: Der Builder hier
 * produziert es, `widgets/spec.md` dokumentiert es für die nativen Targets.
 * `schemaVersion` erlaubt inkompatible Änderungen nach hinten.
 */
import type { Lesson, Snapshot } from '@/api/types';
import { subjectStyle } from '@/design/subjects';
import { computeInsights, computeNow } from '@/features/insights/engine';
import { daysUntil } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';

export const WIDGET_SCHEMA_VERSION = 1;

export interface WidgetSnapshot {
  schemaVersion: number;
  /** ISO-Zeitstempel — Widgets zeigen „Stand von …" und veralten sichtbar. */
  generatedAt: string;
  /** true = Demo-Datensatz, damit Widgets im Screenshot-Modus lebendig wirken. */
  demo: boolean;
  student: { name: string; className?: string };
  nextLesson: {
    subject: string;
    emoji: string;
    color: string;
    start: string;
    end: string;
    room?: string;
    teacher?: string;
    state: Lesson['state'];
    /** z. B. „noch 23 min", „Start in 12 min", „Läuft gerade" */
    label: string;
  } | null;
  homework: {
    open: number;
    total: number;
    items: { subject: string; color: string; due: string; text: string }[];
  };
  nextExam: { subject: string; color: string; date: string; days: number; type?: string } | null;
  grades: { average: number | null; recent: { subject: string; value: string; color: string }[] };
  inbox: { lettersPending: number; unreadMessages: number };
  board: { title: string; excerpt: string } | null;
  /** Top-Insight des Tages (Regel-Engine, gleiche Quelle wie Dashboard). */
  insight: { title: string; body?: string; tone: string } | null;
  /** Lock-Screen-Complication: Schule ist heute aus (bzw. kein Unterricht). */
  schoolOver: boolean;
}

export function buildWidgetSnapshot(snapshot: Snapshot, demo: boolean): WidgetSnapshot {
  const status = computeNow(snapshot);
  const lesson = status.lesson ?? status.next;
  const style = subjectStyle(lesson?.subject);

  const homework = snapshot.homework;
  const openHomework = homework.filter((item) => !item.done);

  const upcomingExams = snapshot.exams
    .filter((exam) => daysUntil(exam.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextExam = upcomingExams[0];

  const withAverage = snapshot.subjects.filter((subject) => subject.average != null);
  const overall =
    withAverage.length > 0
      ? withAverage.reduce((sum, subject) => sum + (subject.average as number), 0) / withAverage.length
      : null;

  const recent = snapshot.subjects
    .flatMap((subject) => subject.grades.map((grade) => ({ ...grade, subject: subject.subject })))
    .filter((grade) => grade.date)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 3);

  const pendingLetters = snapshot.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed);
  const unread = snapshot.threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
  const tile = snapshot.tiles[0];
  const insight = computeInsights(snapshot)[0];

  return {
    schemaVersion: WIDGET_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    demo,
    student: {
      name: `${snapshot.student?.firstname ?? ''} ${snapshot.student?.lastname ?? ''}`.trim() || 'Schüler:in',
      className: snapshot.student?.className ?? undefined,
    },
    nextLesson: lesson
      ? {
          subject: lesson.subject,
          emoji: style.emoji,
          color: style.color,
          start: lesson.start,
          end: lesson.end,
          room: lesson.room,
          teacher: lesson.teacher,
          state: lesson.state,
          label: status.label,
        }
      : null,
    homework: {
      open: openHomework.length,
      total: homework.length,
      items: openHomework.slice(0, 3).map((item) => {
        const subjectColor = subjectStyle(item.subject).color;
        return { subject: item.subject, color: subjectColor, due: item.due, text: excerpt(item.text, 48) };
      }),
    },
    nextExam: nextExam
      ? {
          subject: nextExam.subject,
          color: subjectStyle(nextExam.subject).color,
          date: nextExam.date,
          days: daysUntil(nextExam.date),
          type: nextExam.type,
        }
      : null,
    grades: {
      average: overall,
      recent: recent.map((grade) => ({
        subject: grade.subject,
        value: grade.value,
        color: subjectStyle(grade.subject).color,
      })),
    },
    inbox: { lettersPending: pendingLetters.length, unreadMessages: unread },
    board: tile ? { title: tile.title, excerpt: excerpt(htmlToText(tile.content), 60) } : null,
    insight: insight ? { title: insight.title, body: insight.body, tone: insight.tone } : null,
    schoolOver: status.kind === 'after-school' || status.kind === 'free-day',
  };
}
