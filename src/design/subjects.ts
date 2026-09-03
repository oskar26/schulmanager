/**
 * Fach-Farben.
 * Deterministisch aus dem Fachnamen abgeleitet (gleiches Fach ⇒ immer gleiche Farbe),
 * mit kuratierten Treffern für die häufigsten deutschen Schulfächer.
 * Nutzer:innen können pro Fach überschreiben (settings store).
 *
 * Phase E: Emojis raus — die Identität eines Fachs trägt die Farbe
 * (Pills, Dots, getönte Kacheln); Icons kommen aus lucide-react-native.
 */

export type SubjectStyle = { color: string };

const CURATED: Record<string, SubjectStyle> = {
  mathematik: { color: '#48A3FF' },
  mathe: { color: '#48A3FF' },
  deutsch: { color: '#FF7677' },
  englisch: { color: '#2ECCA8' },
  franzosisch: { color: '#BD7AF6' },
  latein: { color: '#C9A227' },
  spanisch: { color: '#FAC748' },
  physik: { color: '#5B7CFA' },
  chemie: { color: '#2ECCA8' },
  biologie: { color: '#39B970' },
  informatik: { color: '#6C5CE7' },
  geschichte: { color: '#B08968' },
  geographie: { color: '#3DBFA8' },
  geografie: { color: '#3DBFA8' },
  erdkunde: { color: '#3DBFA8' },
  sport: { color: '#FF9F43' },
  musik: { color: '#E86FC0' },
  kunst: { color: '#F26D9C' },
  religion: { color: '#9AA1B8' },
  ethik: { color: '#9AA1B8' },
  politik: { color: '#7C8BFF' },
  sozialkunde: { color: '#7C8BFF' },
  wirtschaft: { color: '#0FA36B' },
  sachunterricht: { color: '#4FC3A1' },
  werken: { color: '#A6763F' },
  ganztag: { color: '#8A7CFF' },
};

const FALLBACK_COLORS = [
  '#6C5CE7', '#48A3FF', '#2ECCA8', '#FAC748', '#FF7677',
  '#BD7AF6', '#39B970', '#FF9F43', '#5B7CFA', '#E86FC0',
];

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
  if (!raw) return { color: '#9CA2B6' };

  const key = normalise(raw);
  const override = overrides?.[key];
  const curated = CURATED[key] ?? Object.entries(CURATED).find(([k]) => key.startsWith(k))?.[1];

  if (curated) return { color: override ?? curated.color };

  const h = hash(key);
  return { color: override ?? FALLBACK_COLORS[h % FALLBACK_COLORS.length] };
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
