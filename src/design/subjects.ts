/**
 * Fach-Farben, Icons & Emojis.
 * Deterministisch aus dem Fachnamen abgeleitet (gleiches Fach ⇒ immer gleiche
 * Farbe/Icon/Emoji), mit kuratierten Treffern für alle gängigen Schulfächer.
 *
 * Die App-Oberfläche nutzt Vektor-Icons (Lucide) und satte Farbflächen.
 * Emojis werden primär für System-Oberflächen (Notifications, Browser-Tab) verwendet.
 */
import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  Atom,
  BookOpen,
  Briefcase,
  Calculator,
  Compass,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Hammer,
  HelpCircle,
  Landmark,
  Languages,
  Laptop,
  Leaf,
  Music,
  Palette,
  Puzzle,
  Scale,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { foregroundOn, palette } from '@/design/tokens';

export type SubjectStyle = {
  color: string;
  tint: string;
  emoji: string;
  icon: LucideIcon;
};

const { accent, category } = palette;

/** Satte Fachfarben und zugehörige Vektor-Icons */
const CURATED: Record<string, { color: string; tint: string; emoji: string; icon: LucideIcon }> = {
  mathematik: { color: '#8B5CF6', tint: '#EDE9FE', emoji: '📐', icon: Calculator },
  mathe: { color: '#8B5CF6', tint: '#EDE9FE', emoji: '📐', icon: Calculator },
  deutsch: { color: '#F43F5E', tint: '#FFE4E6', emoji: '📖', icon: BookOpen },
  englisch: { color: '#0EA5E9', tint: '#E0F2FE', emoji: '🇬', icon: Languages },
  franzosisch: { color: '#6366F1', tint: '#EEF2FF', emoji: '🥐', icon: Languages },
  latein: { color: '#D97706', tint: '#FEF3C7', emoji: '🏛️', icon: Landmark },
  spanisch: { color: '#EA580C', tint: '#FFEDD5', emoji: '🌶️', icon: Languages },
  italienisch: { color: '#16A34A', tint: '#DCFCE7', emoji: '🍕', icon: Languages },
  physik: { color: '#635BFF', tint: '#EDE9FE', emoji: '🧲', icon: Atom },
  chemie: { color: '#059669', tint: '#D1FAE5', emoji: '⚗️', icon: FlaskConical },
  biologie: { color: '#10B981', tint: '#D1FAE5', emoji: '🌱', icon: Leaf },
  bio: { color: '#10B981', tint: '#D1FAE5', emoji: '🌱', icon: Leaf },
  informatik: { color: '#0284C7', tint: '#E0F2FE', emoji: '💻', icon: Laptop },
  info: { color: '#0284C7', tint: '#E0F2FE', emoji: '💻', icon: Laptop },
  geschichte: { color: '#B45309', tint: '#FEF3C7', emoji: '🏺', icon: Landmark },
  geographie: { color: '#14B8A6', tint: '#CCFBF1', emoji: '🌍', icon: Globe },
  geografie: { color: '#14B8A6', tint: '#CCFBF1', emoji: '🌍', icon: Globe },
  erdkunde: { color: '#14B8A6', tint: '#CCFBF1', emoji: '🌍', icon: Globe },
  geo: { color: '#14B8A6', tint: '#CCFBF1', emoji: '🌍', icon: Globe },
  sport: { color: '#F97316', tint: '#FFEDD5', emoji: '🏃', icon: Activity },
  musik: { color: '#A855F7', tint: '#F3E8FF', emoji: '🎵', icon: Music },
  kunst: { color: '#EC4899', tint: '#FCE7F3', emoji: '🎨', icon: Palette },
  religion: { color: '#818CF8', tint: '#EEF2FF', emoji: '🕊️', icon: Sparkles },
  reli: { color: '#818CF8', tint: '#EEF2FF', emoji: '🕊️', icon: Sparkles },
  ethik: { color: '#6366F1', tint: '#EEF2FF', emoji: '💭', icon: Scale },
  politik: { color: '#4F46E5', tint: '#EEF2FF', emoji: '🏛️', icon: Landmark },
  sozialkunde: { color: '#4F46E5', tint: '#EEF2FF', emoji: '🏛️', icon: Landmark },
  wirtschaft: { color: '#059669', tint: '#D1FAE5', emoji: '📈', icon: TrendingUp },
  sachunterricht: { color: '#14B8A6', tint: '#CCFBF1', emoji: '🔎', icon: Compass },
  werken: { color: '#D97706', tint: '#FEF3C7', emoji: '🔨', icon: Hammer },
  ganztag: { color: '#635BFF', tint: '#EDE9FE', emoji: '🧩', icon: Puzzle },
};

const FALLBACK_STYLES: { color: string; tint: string; emoji: string; icon: LucideIcon }[] = [
  { color: '#8B5CF6', tint: '#EDE9FE', emoji: '📘', icon: BookOpen },
  { color: '#FF8C38', tint: '#FFEDD5', emoji: '✏️', icon: Compass },
  { color: '#10B981', tint: '#D1FAE5', emoji: '🌱', icon: Leaf },
  { color: '#E05353', tint: '#FFE4E6', emoji: '🎒', icon: GraduationCap },
  { color: '#0EA5E9', tint: '#E0F2FE', emoji: '📎', icon: FileText },
  { color: '#635BFF', tint: '#EDE9FE', emoji: '🧮', icon: Sparkles },
];

const normalise = (input: string) =>
  input
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z]/g, '');

const hash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
};

export function subjectStyle(name?: string | null, overrides?: Record<string, string>): SubjectStyle {
  const raw = (name ?? '').trim();
  if (!raw) {
    return {
      color: palette.muted,
      tint: palette.line,
      emoji: '📚',
      icon: BookOpen,
    };
  }

  const key = normalise(raw);
  const override = overrides?.[key];
  const curated = CURATED[key] ?? Object.entries(CURATED).find(([k]) => key.startsWith(k))?.[1];

  if (curated) {
    return {
      color: override ?? curated.color,
      tint: curated.tint,
      emoji: curated.emoji,
      icon: curated.icon,
    };
  }

  const h = hash(key);
  const fallback = FALLBACK_STYLES[h % FALLBACK_STYLES.length];
  return {
    color: override ?? fallback.color,
    tint: fallback.tint,
    emoji: fallback.emoji,
    icon: fallback.icon,
  };
}

export function subjectIcon(name?: string | null): LucideIcon {
  return subjectStyle(name).icon;
}

/** Farbe + Alpha für Chips/Hintergründe (funktioniert in RN & Web). */
export function tint(hex: string, alpha = 0.16): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return `rgba(128, 128, 128, ${alpha})`;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Lesbare Vordergrundfarbe zu einer Fach-Farbe. */
export function readableOn(hex: string): string {
  return foregroundOn(hex);
}
