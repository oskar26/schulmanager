/**
 * Lernplaner.
 *
 * Verteilt Lernblöcke für anstehende Arbeiten auf die verbleibenden Tage:
 *  · schwerere/wichtigere Arbeiten (Klausur > Test) bekommen mehr Blöcke
 *  · der Tag vor der Arbeit ist immer Wiederholung
 *  · Tage mit langem Unterricht oder anderen Arbeiten werden entlastet
 *  · niemals mehr als `maxBlocksPerDay` Blöcke pro Tag
 */
import type { Exam, Snapshot } from '@/api/types';
import { activeLessonsOn } from '@/features/insights/engine';
import { addDays, daysUntil, toISO } from '@/lib/date';

export interface StudyBlock {
  id: string;
  date: string;
  subject: string;
  examId: string;
  minutes: number;
  focus: 'Grundlagen' | 'Übung' | 'Wiederholung';
}

const WEIGHT: Record<string, number> = {
  klausur: 3,
  klassenarbeit: 3,
  schulaufgabe: 3,
  kurzarbeit: 2,
  test: 1.5,
  vokabeltest: 1,
  exen: 1,
};

const weightOf = (exam: Exam): number => {
  const key = (exam.type ?? '').toLowerCase();
  const hit = Object.entries(WEIGHT).find(([name]) => key.includes(name));
  return hit?.[1] ?? 2;
};

export function buildStudyPlan(
  snapshot: Snapshot,
  options: { horizonDays?: number; maxBlocksPerDay?: number } = {},
): StudyBlock[] {
  const horizon = options.horizonDays ?? 21;
  const maxPerDay = options.maxBlocksPerDay ?? 2;

  const exams = snapshot.exams
    .filter((exam) => daysUntil(exam.date) >= 0 && daysUntil(exam.date) <= horizon)
    .sort((a, b) => a.date.localeCompare(b.date));

  const blocks: StudyBlock[] = [];
  const perDay = new Map<string, number>();

  const load = (iso: string) => perDay.get(iso) ?? 0;
  const busy = (iso: string) => activeLessonsOn(snapshot, iso).length >= 8;

  for (const exam of exams) {
    const remaining = daysUntil(exam.date);
    const desired = Math.min(Math.max(2, Math.round(weightOf(exam) * 1.5)), Math.max(1, remaining));
    let placed = 0;

    // Rückwärts vom Vortag der Arbeit
    for (let offset = 1; offset <= remaining && placed < desired; offset += 1) {
      const iso = toISO(addDays(new Date(exam.date), -offset));
      if (daysUntil(iso) < 0) continue;
      if (load(iso) >= maxPerDay) continue;
      if (busy(iso) && load(iso) >= 1) continue;

      const isDayBefore = offset === 1;
      const focus: StudyBlock['focus'] = isDayBefore ? 'Wiederholung' : placed === desired - 1 ? 'Grundlagen' : 'Übung';

      blocks.push({
        id: `${exam.id}-${iso}`,
        date: iso,
        subject: exam.subject,
        examId: exam.id,
        minutes: isDayBefore ? 30 : weightOf(exam) >= 3 ? 45 : 25,
        focus,
      });

      perDay.set(iso, load(iso) + 1);
      placed += 1;
    }
  }

  return blocks.sort((a, b) => a.date.localeCompare(b.date) || a.subject.localeCompare(b.subject));
}
