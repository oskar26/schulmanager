/**
 * Fach-Farben & Emojis.
 * Deterministisch aus dem Fachnamen abgeleitet (gleiches Fach ⇒ immer gleiche Farbe),
 * mit kuratierten Treffern für die häufigsten deutschen Schulfächer.
 * Nutzer:innen können pro Fach überschreiben (settings store).
 */

export type SubjectStyle = { color: string; emoji: string };

const CURATED: Record<string, SubjectStyle> = {
  mathematik: { color: '#48A3FF', emoji: '📐' },
  mathe: { color: '#48A3FF', emoji: '📐' },
  deutsch: { color: '#FF7677', emoji: '📖' },
  englisch: { color: '#2ECCA8', emoji: '🇬🇧' },
  franzosisch: { color: '#BD7AF6', emoji: '🥐' },
  latein: { color: '#C9A227', emoji: '🏛️' },
  spanisch: { color: '#FAC748', emoji: '🌶️' },
  physik: { color: '#5B7CFA', emoji: '🧲' },
  chemie: { color: '#2ECCA8', emoji: '⚗️' },
  biologie: { color: '#39B970', emoji: '🌱' },
  informatik: { color: '#6C5CE7', emoji: '💻' },
  geschichte: { color: '#B08968', emoji: '🏺' },
  geographie: { color: '#3DBFA8', emoji: '🌍' },
  geografie: { color: '#3DBFA8', emoji: '🌍' },
  erdkunde: { color: '#3DBFA8', emoji: '🌍' },
  sport: { color: '#FF9F43', emoji: '🏃' },
  musik: { color: '#E86FC0', emoji: '🎵' },
  kunst: { color: '#F26D9C', emoji: '🎨' },
  religion: { color: '#9AA1B8', emoji: '🕊️' },
  ethik: { color: '#9AA1B8', emoji: '💭' },
  politik: { color: '#7C8BFF', emoji: '🏛️' },
  sozialkunde: { color: '#7C8BFF', emoji: '🏛️' },
  wirtschaft: { color: '#0FA36B', emoji: '📈' },
  sachunterricht: { color: '#4FC3A1', emoji: '🔎' },
  werken: { color: '#A6763F', emoji: '🔨' },
  ganztag: { color: '#8A7CFF', emoji: '🧩' },
};

const FALLBACK_COLORS = [
  '#6C5CE7', '#48A3FF', '#2ECCA8', '#FAC748', '#FF7677',
  '#BD7AF6', '#39B970', '#FF9F43', '#5B7CFA', '#E86FC0',
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
  if (!raw) return { color: '#9CA2B6', emoji: '📚' };

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

/** Farbe + 18 % Deckkraft für Chips/Hintergründe (funktioniert in RN & Web). */
export function tint(hex: string, alpha = 0.16): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Lesbare Vordergrundfarbe zu einer Fach-Farbe. */
export function readableOn(hex: string): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.68 ? '#121422' : '#FFFFFF';
}
