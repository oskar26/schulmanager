/**
 * Kategorie-Farben für Sektions- und Brett-Karten (Redesign Phase 1,
 * genutzt in Phase 3 „Dashboard“ und Phase 7 „Postfach“ · docs/redesign-phasen.md).
 *
 * Feste Zuordnung laut Zielbild:
 * · Elternbriefe     → Lavendel
 * · Klassenarbeiten  → Mint
 * · Postfach/Briefe  → Apricot
 * · Sekretariat      → Sky (Blau)
 * · Bibliothek       → Mint (Grün)
 * · AG-Anmeldung     → Violet (Lila)
 * · Fundsachen       → Amber (Orange)
 *
 * Unbekannte Kategorien fallen auf Lavendel zurück — die Standardfamilie
 * für „allgemeine Informationen“.
 */
import {
  Backpack,
  BookMarked,
  Building2,
  ClipboardList,
  Inbox,
  Mail,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { palette, resolveThemeColor, type BlockName, type ThemePalette } from '@/design/tokens';

export type CategoryKey =
  | 'letters'
  | 'exams'
  | 'mailbox'
  | 'secretary'
  | 'library'
  | 'club'
  | 'lostfound'
  | 'general';

const CATEGORY_BLOCKS: Record<CategoryKey, BlockName> = {
  letters: 'lavender',
  exams: 'mint',
  mailbox: 'apricot',
  secretary: 'sky',
  library: 'mint',
  club: 'violet',
  lostfound: 'amber',
  general: 'lavender',
};

/** Schlüsselwörter (normalisiert, Kleinbuchstaben) → Kategorie. */
const KEYWORDS: [RegExp, CategoryKey][] = [
  [/sekretariat|verwaltung|büro|schulleitung/, 'secretary'],
  [/bibliothek|bücherei|lesezeichen|ausleihe/, 'library'],
  [/ag |arbeitsgemeinschaft|anmeldung|kursanmeldung|wahl/, 'club'],
  [/fundsachen|fundstück|verloren|gefunden|fundbüro/, 'lostfound'],
  [/klassenarbeit|klausur|arbeit|prüfung|test/, 'exams'],
  [/elternbrief|brief|elterninformation|rundbrief/, 'letters'],
];

/** Leitet die Kategorie aus einem Titel/Text ab (Fallback: `general`). */
export function categoryFromText(text?: string | null): CategoryKey {
  const value = (text ?? '').toLowerCase();
  if (!value) return 'general';
  for (const [pattern, key] of KEYWORDS) {
    if (pattern.test(value)) return key;
  }
  return 'general';
}

/** Block-Familie einer Kategorie. */
export function categoryBlock(key: CategoryKey): BlockName {
  // Bug (Phase 7): Der frühere Fallback `?? 'general'` gab einen
  // Kategorie-Schlüssel statt eines Block-Namens zurück — `blocks['general']`
  // ist `undefined`, die Fläche wurde unsichtbar. Fallback ist jetzt die
  // Familie der Kategorie `general` (Lavendel).
  return CATEGORY_BLOCKS[key] ?? CATEGORY_BLOCKS.general;
}

/** Lucide-Icon je Kategorie — für die Icon-Badges auf Brett-/Brief-Karten. */
const CATEGORY_ICONS: Record<CategoryKey, LucideIcon> = {
  letters: Mail,
  exams: ClipboardList,
  mailbox: Inbox,
  secretary: Building2,
  library: BookMarked,
  club: Sparkles,
  lostfound: Backpack,
  general: Inbox,
};

/** Kurzer, menschenlesbarer Name der Kategorie (für Pills). */
const CATEGORY_LABELS: Record<CategoryKey, string> = {
  letters: 'Elternbrief',
  exams: 'Klassenarbeit',
  mailbox: 'Postfach',
  secretary: 'Sekretariat',
  library: 'Bibliothek',
  club: 'AG-Anmeldung',
  lostfound: 'Fundsachen',
  general: 'Aushang',
};

export function categoryIcon(key: CategoryKey): LucideIcon {
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS.general;
}

export function categoryLabel(key: CategoryKey): string {
  return CATEGORY_LABELS[key] ?? CATEGORY_LABELS.general;
}

/** Vollton-Farbe einer Kategorie, theme-aufgelöst. */
export function categoryColor(key: CategoryKey, isDark = false, colors: ThemePalette = palette): string {
  return resolveThemeColor(colors.blocks[categoryBlock(key)], isDark);
}

/** Lesbare Vordergrundfarbe auf einer Kategorie-Fläche. */
export function categoryForeground(key: CategoryKey, colors: ThemePalette = palette): string {
  return colors.onBlocks[categoryBlock(key)];
}
