/**
 * Fach-Farben & -Emojis — feste Palette auf Basis der Farbflächen-Familie
 * (`palette.blocks`, Redesign Phase 1 · docs/redesign-phasen.md).
 *
 * Deterministisch aus dem Fachnamen abgeleitet (gleiches Fach ⇒ immer gleiche
 * Farbe/Icon), mit kuratierten Treffern für die häufigsten deutschen Schulfächer.
 * Nutzer:innen können pro Fach überschreiben (settings store).
 *
 * Policy: Das Emoji wird nur auf System-Oberflächen genutzt, die keine
 * Vektor-Icons rendern können — Browser-Tab-Titel und Notifications
 * (Live-Island-Effects). Die In-App-Oberfläche bleibt emoji-frei und trägt
 * die Fach-Identität über die Farbfläche + Lucide-Icons (`subjectIcon`).
 */
import { foregroundOn, palette, resolveThemeColor, type BlockName } from '@/design/tokens';

export type SubjectStyle = { color: string; emoji: string };

const { blocks } = palette;

/**
 * Kuratierte Fachbelegung: jedes häufige deutsche Schulfach bekommt eine
 * feste Familie aus der 13-Farb-Block-Palette. Angrenzende Fächer eines
 * typischen Stundenplans bekommen bewusst unterschiedliche Familien.
 */
const CURATED: Record<string, { block: BlockName; emoji: string }> = {
  mathematik: { block: 'violet', emoji: '📐' },
  mathe: { block: 'violet', emoji: '📐' },
  deutsch: { block: 'coral', emoji: '📖' },
  englisch: { block: 'sky', emoji: '🇬🇧' },
  franzosisch: { block: 'pink', emoji: '🥐' },
  latein: { block: 'lavender', emoji: '🏛️' },
  spanisch: { block: 'apricot', emoji: '🌶️' },
  physik: { block: 'slate', emoji: '🧲' },
  chemie: { block: 'teal', emoji: '⚗️' },
  biologie: { block: 'mint', emoji: '🌱' },
  bio: { block: 'mint', emoji: '🌱' },
  informatik: { block: 'charcoal', emoji: '💻' },
  info: { block: 'charcoal', emoji: '💻' },
  geschichte: { block: 'amber', emoji: '🏺' },
  gesch: { block: 'amber', emoji: '🏺' },
  politik: { block: 'violet', emoji: '🏛️' },
  sozialkunde: { block: 'violet', emoji: '🏛️' },
  gemeinschaftskunde: { block: 'violet', emoji: '🏛️' },
  wirtschaft: { block: 'sun', emoji: '📈' },
  religion: { block: 'lavender', emoji: '🕊️' },
  ethik: { block: 'lavender', emoji: '💭' },
  philosophie: { block: 'lavender', emoji: '💭' },
  musik: { block: 'pink', emoji: '🎵' },
  kunst: { block: 'coral', emoji: '🎨' },
  geographie: { block: 'lime', emoji: '🌍' },
  geografie: { block: 'lime', emoji: '🌍' },
  erdkunde: { block: 'lime', emoji: '🌍' },
  sachunterricht: { block: 'sky', emoji: '🔎' },
  werken: { block: 'apricot', emoji: '🔨' },
  technik: { block: 'apricot', emoji: '🔨' },
  ganztag: { block: 'slate', emoji: '🧩' },
};

/**
 * Fallback-Zyklus über die volle Farbflächen-Familie. Charcoal bleibt
 * bewusst außen vor: ein randloser dunkler Block wäre auf dem dunklen Canvas
 * nicht mehr erkennbar (Entscheidung #4 im Phasen-Dokument).
 */
const FALLBACK_BLOCKS: BlockName[] = [
  'violet',
  'sky',
  'mint',
  'amber',
  'coral',
  'lavender',
  'teal',
  'lime',
  'apricot',
  'pink',
  'slate',
  'sun',
];

const FALLBACK_EMOJI = ['📘', '✏️', '🧠', '🔬', '🗺️', '🎒', '📎', '🧮'];

const normalise = (input: string) =>
  input
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z]/g, '');

const hash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
};

/**
 * Farbfläche eines Fachs (Light-Hex). Für Dark-Theme-Flächen direkt
 * `subjectBlockStyle(name, true)` verwenden oder selbst durch
 * `resolveThemeColor()` schicken.
 */
export function subjectStyle(name?: string | null, overrides?: Record<string, string>): SubjectStyle {
  const raw = (name ?? '').trim();
  if (!raw) return { color: palette.faint, emoji: '📚' };

  const key = normalise(raw);
  const override = overrides?.[key];
  const curated = CURATED[key] ?? Object.entries(CURATED).find(([k]) => key.startsWith(k))?.[1];

  if (curated) return { color: override ?? blocks[curated.block], emoji: curated.emoji };

  const h = hash(key);
  const block = FALLBACK_BLOCKS[h % FALLBACK_BLOCKS.length];
  return { color: override ?? blocks[block], emoji: FALLBACK_EMOJI[h % FALLBACK_EMOJI.length] };
}

/**
 * Theme-aufgelöste Fachfarbe: im Dark Theme wird automatisch die hellere
 * Block-Variante verwendet. `overrides` bleibt nutzbar (Nutzer-Farben werden
 * durch `resolveThemeColor` ebenfalls übersetzt, wenn sie einer bekannten
 * Light-Farbe entsprechen).
 */
export function subjectColor(name?: string | null, isDark = false, overrides?: Record<string, string>): string {
  return resolveThemeColor(subjectStyle(name, overrides).color, isDark);
}

/** Farbe + Alpha für Chips/Hintergründe (funktioniert in RN & Web). */
export function tint(hex: string, alpha = 0.16): string {
  const value = (hex ?? '').replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) {
    // Härtung: ungültige Eingaben erzeugten früher `rgba(NaN, …)`-Styles,
    // die RN stumm verschluckt hat. Jetzt sichtbar transparent.
    return 'transparent';
  }
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Lesbare Vordergrundfarbe zu einer Fach-Farbe. */
export function readableOn(hex: string): string {
  return foregroundOn(hex);
}
