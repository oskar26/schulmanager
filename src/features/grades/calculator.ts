/**
 * Notenrechner.
 * Beantwortet die eine Frage, die die offizielle App nie beantwortet:
 * „Welche Note brauche ich in der nächsten Arbeit, um auf X zu kommen?"
 */
import type { Grade, SubjectGrades } from '@/api/types';
import { palette } from '@/design/tokens';

export const average = (grades: Grade[]): number | null => {
  const usable = grades.filter((grade) => grade.numeric != null);
  if (usable.length === 0) return null;
  const weight = usable.reduce((sum, grade) => sum + (grade.weight || 1), 0);
  const total = usable.reduce((sum, grade) => sum + (grade.numeric as number) * (grade.weight || 1), 0);
  return total / weight;
};

/**
 * Welche Note braucht es in der nächsten Arbeit (Gewicht `weight`),
 * damit der Schnitt `target` erreicht wird?
 * Rückgabe `null`, wenn es rechnerisch unmöglich ist.
 */
export function requiredGrade(
  subject: SubjectGrades,
  target: number,
  weight = 2,
): { needed: number; possible: boolean } {
  const usable = subject.grades.filter((grade) => grade.numeric != null);
  const currentWeight = usable.reduce((sum, grade) => sum + (grade.weight || 1), 0);
  const currentTotal = usable.reduce((sum, grade) => sum + (grade.numeric as number) * (grade.weight || 1), 0);

  const needed = (target * (currentWeight + weight) - currentTotal) / weight;
  const best = subject.gradingSystem === 1 ? 15 : 1;
  const worst = subject.gradingSystem === 1 ? 0 : 6;

  const possible =
    subject.gradingSystem === 1 ? needed <= best && needed >= worst : needed >= best && needed <= worst;

  return { needed: Math.round(needed * 100) / 100, possible };
}

/** Wie wirkt sich eine hypothetische Note aus? */
export function simulate(subject: SubjectGrades, value: number, weight = 2): number | null {
  const next = [
    ...subject.grades,
    { id: 'sim', value: String(value), numeric: value, weight },
  ] as Grade[];
  return average(next);
}

/** Deutsche Zahlformatierung: 1,92 statt 1.92. */
export const de = (value: number, digits = 2): string => value.toFixed(digits).replace('.', ',');

/** Vorzeichenbehaftete Differenz, z. B. „−0,18“ / „+0,25“. */
export const deDelta = (value: number, digits = 2): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : '±'}${de(Math.abs(value), digits)}`;

export const gradeLabel = (value: number | null | undefined, system: 0 | 1 = 0): string => {
  if (value == null) return '–';
  return system === 1 ? `${Math.round(value)} P` : de(value);
};

/** Farbe nach Notenqualität — für Balken und Chips. */
export function gradeColor(value: number | null | undefined, system: 0 | 1 = 0): string {
  if (value == null) return palette.faint;
  const normalised = system === 1 ? (15 - value) / 15 * 5 + 1 : value;
  if (normalised <= 1.5) return palette.success;
  if (normalised <= 2.5) return palette.accent.limeDeep;
  if (normalised <= 3.5) return palette.accent.amber;
  if (normalised <= 4.5) return palette.warning;
  return palette.danger;
}

/* ------------------------------------------------------------------ Trend (Redesign Phase 6) */

/**
 * Datierte Noten in zeitlicher Reihenfolge — Basis für die Mini-Trendlinie
 * (Sparkline) auf den Fach-Karten. Noten ohne Datum oder ohne numerischen
 * Wert werden ignoriert, weil sie sich nicht auf der Zeitachse einordnen
 * lassen.
 */
export function datedSeries(subject: SubjectGrades): { date: string; value: number }[] {
  return subject.grades
    .filter((grade): grade is Grade & { date: string; numeric: number } =>
      typeof grade.date === 'string' && grade.date.length > 0 && grade.numeric != null)
    .map((grade) => ({ date: grade.date, value: grade.numeric }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type GradeTrend = {
  /** Chronologische Werte (mind. 3), sonst `points = []`. */
  points: number[];
  /** Differenz „zweite Hälfte − erste Hälfte“ in Notenpunkten. */
  delta: number;
  /** `up` = Entwicklung verbessert sich, `down` = verschlechtert, `flat` = stabil. */
  direction: 'up' | 'down' | 'flat';
};

/**
 * Trend über die Zeit: Vergleicht den Schnitt der älteren mit dem der
 * jüngeren Hälfte der datierten Noten. „Besser“ heißt bei Noten 1–6 ein
 * *kleinerer*, bei Punkten 0–15 ein *größerer* Wert — `direction` normalisiert
 * das, damit die Oberfläche immer dieselbe Semantik anzeigen kann.
 * Erst ab 3 datierten Noten aussagekräftig (Vorgabe Phase 6).
 */
export function gradeTrend(subject: SubjectGrades): GradeTrend {
  const series = datedSeries(subject);
  if (series.length < 3) return { points: [], delta: 0, direction: 'flat' };

  const values = series.map((entry) => entry.value);
  const half = Math.floor(values.length / 2);
  const older = values.slice(0, half);
  const newer = values.slice(values.length - half);
  const mean = (list: number[]) => list.reduce((sum, value) => sum + value, 0) / list.length;
  const delta = mean(newer) - mean(older);

  // Punkte: mehr = besser. Noten: weniger = besser.
  const improving = subject.gradingSystem === 1 ? delta > 0 : delta < 0;
  const flat = Math.abs(delta) < (subject.gradingSystem === 1 ? 0.5 : 0.15);

  return { points: values, delta, direction: flat ? 'flat' : improving ? 'up' : 'down' };
}

/**
 * Normalisiert einen Notenwert auf 0…1, wobei 1 immer „am besten“ bedeutet —
 * unabhängig vom Notensystem. Für Balken- und Sparkline-Höhen.
 */
export function gradeRatio(value: number | null | undefined, system: 0 | 1 = 0): number {
  if (value == null) return 0;
  const ratio = system === 1 ? value / 15 : (6 - value) / 5;
  return Math.max(0, Math.min(1, ratio));
}
