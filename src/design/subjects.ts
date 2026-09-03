/**
 * Fach-Farben & -Emojis.
 * Deterministisch aus dem Fachnamen abgeleitet (gleiches Fach ⇒ immer gleiche
 * Farbe/Emoji), mit kuratierten Treffern für die häufigsten deutschen Schulfächer.
 * Nutzer:innen können pro Fach überschreiben (settings store).
 *
 * Policy: Das Emoji wird nur auf System-Oberflächen genutzt, die keine
 * Vektor-Icons rendern können — Browser-Tab-Titel und Notifications
 * (Live-Island-Effects). Die In-App-Oberfläche bleibt emoji-frei und trägt
 * die Fach-Identität über Farbe + Lucide-Icons.
 */
import { foregroundOn, palette } from '@/design/tokens';

export type SubjectStyle = { color: string; emoji: string };

const { accent } = palette;

/** Fachfarben folgen der Phase-2-Akzentfamilie statt einem zweiten Pastell-Set. */
const CURATED: Record<string, SubjectStyle> = {
  mathematik: { color: accent.violet, emoji: '📐' },
  mathe: { color: accent.violet, emoji: '📐' },
  deutsch: { color: accent.coral, emoji: '📖' },
  englisch: { color: accent.limeDeep, emoji: '🇬' },
  franzosisch: { color: accent.violet, emoji: '🥐' },
  latein: { color: accent.amberDeep, emoji: '🏛️' },
  spanisch: { color: accent.amber, emoji: '🌶️' },
  physik: { color: accent.violet, emoji: '🧲' },
  chemie: { color: accent.limeDeep, emoji: '⚗️' },
  biologie: { color: palette.success, emoji: '🌱' },
  informatik: { color: accent.violet, emoji: '💻' },
  geschichte: { color: accent.amberDeep, emoji: '🏺' },
  geographie: { color: accent.limeDeep, emoji: '🌍' },
  geografie: { color: accent.limeDeep, emoji: '🌍' },
  erdkunde: { color: accent.limeDeep, emoji: '🌍' },
  sport: { color: accent.amber, emoji: '🏃' },
  musik: { color: accent.violet, emoji: '🎵' },
  kunst: { color: accent.coral, emoji: '🎨' },
  religion: { color: accent.violet, emoji: '🕊️' },
  ethik: { color: accent.violet, emoji: '💭' },
  politik: { color: accent.violet, emoji: '🏛️' },
  sozialkunde: { color: accent.violet, emoji: '🏛️' },
  wirtschaft: { color: palette.success, emoji: '📈' },
  sachunterricht: { color: accent.limeDeep, emoji: '🔎' },
  werken: { color: accent.amberDeep, emoji: '🔨' },
  ganztag: { color: accent.violet, emoji: '🧩' },
};

const FALLBACK_COLORS = [
  accent.violet,
  accent.amber,
  accent.limeDeep,
  accent.coral,
  accent.amberDeep,
  palette.success,
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

export function subjectStyle(name?: string | null, overrides?: Record<string, string>): SubjectStyle {
  const raw = (name ?? '').trim();
  if (!raw) return { color: palette.faint, emoji: '📚' };

  const key = normalise(raw);
  const override = overrides?.[key];
  const curated = CURATED[key] ?? Object.entries(CURATED).find(([k]) => key.startsWith(k))?.[1];

  if (curated) return { color: override ?? curated.color, emoji: curated.emoji };

  const h = hash(key);
  return {
    color: override ?? FALLBACK_COLORS[h % FALLBACK_COLORS.length],
    emoji: FALLBACK_EMOJI[h % FALLBACK_EMOJI.length],
  };
}

/** Farbe + Alpha für Chips/Hintergründe (funktioniert in RN & Web). */
export function tint(hex: string, alpha = 0.16): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Lesbare Vordergrundfarbe zu einer Fach-Farbe. */
export function readableOn(hex: string): string {
  return foregroundOn(hex);
}
