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
