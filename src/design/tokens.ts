/**
 * Schulflow Design-Tokens — die verbindliche Farb- und Formquelle.
 *
 * NativeWind liest die äquivalenten CSS-Variablen aus `global.css`, Tamagui
 * bekommt die Werte über `tamagui.config.ts` und imperativer React-Native-Code
 * importiert sie direkt von hier. Neue Farben werden deshalb immer in allen
 * drei Ebenen gepflegt.
 *
 * ── Redesign „Playful Modern Canvas“ (docs/playful-modern.md) ──
 * Wir wechseln von „Flat High-Saturation Blocks“ zu einem **Soft Bento-Grid**:
 * · Neutrale Basis: App-Hintergrund #F6F8FD, Karten Reinweiß, Slate-Text.
 * · Farb-Tints als Flächen: Fach-/Kategorieflächen tragen nur 8–12 % ihres
 *   Farbtons (`blockTints`), der kräftige Ton (`blocks`) lebt ausschließlich
 *   auf Akzentstreifen, Icons, Pills, Fortschrittsbalken und Buttons.
 * · Radii: 8 / 14 / 20 / 9999 · Schatten weich und kaum sichtbar.
 */

export type AccentName = 'amber' | 'amberDeep' | 'violet' | 'lime' | 'limeDeep' | 'coral';
export type OnColorName =
  | 'amber'
  | 'lime'
  | 'violet'
  | 'coral'
  | 'charcoal'
  | BlockName;

/**
 * Farbfamilien der Playful-Palette. Die Namen bleiben aus Kompatibilität mit
 * dem vorherigen Farbflächen-System erhalten; ihre Werte sind jetzt die
 * kräftigen **Akzent**-Töne (Primary), die Flächen kommen aus `blockTints`.
 */
export type BlockName =
  | 'violet'
  | 'lavender'
  | 'sky'
  | 'teal'
  | 'mint'
  | 'lime'
  | 'sun'
  | 'amber'
  | 'apricot'
  | 'coral'
  | 'pink'
  | 'slate'
  | 'charcoal';

export type BlockPalette = Record<BlockName, string>;

/** Feste Prioritätsfarben: Rot = dringend, Amber = bald, Grün = ok/erledigt. */
export type PriorityName = 'urgent' | 'soon' | 'ok';
export type PriorityPalette = Record<PriorityName, string>;

export type StatusPalette = { urgent: string; warning: string; success: string; info: string };

export type ThemePalette = {
  /** App-Hintergrund (`--bg-app`). */
  canvas: string;
  /** Kartenfläche (`--bg-card`). */
  surface: string;
  /** Hover-Fläche für Karten / erhöhte Flächen (`--bg-card-hover`). */
  elevated: string;
  /** Tiefes Slate für Hero-Banner und dunkle Kapseln. */
  charcoal: string;
  charcoalElevated: string;
  /** Haupttext (`--text-main`). */
  ink: string;
  /** Sekundärtext (`--text-muted`). */
  muted: string;
  faint: string;
  /** Feine Kartenränder (`--border-subtle`). */
  line: string;
  accent: Record<AccentName, string>;
  on: Record<OnColorName, string>;
  /** Kräftige Akzenttöne der Familien (Borders, Icons, Pills, Buttons). */
  blocks: BlockPalette;
  /** Pastell-Flächen (8–12 % Tint) der Familien — Kartenhintergründe. */
  blockTints: BlockPalette;
  /** Vordergrundfarben, wenn eine Familie ausnahmsweise vollflächig steht. */
  onBlocks: BlockPalette;
  /** Dringlichkeits-Ampel für Aufgaben/Arbeiten. */
  priority: PriorityPalette;
  /** Funktionale Statusfarben. */
  status: StatusPalette;
  success: string;
  warning: string;
  danger: string;
};

/* ------------------------------------------------------------------ Light */

/** Kräftige Akzenttöne (Light). */
const LIGHT_BLOCKS: BlockPalette = {
  violet: '#6366F1', // Mathematik / MINT — Electric Violet
  lavender: '#8B5CF6', // Religion / Ethik / Elternbriefe
  sky: '#0EA5E9', // Fremdsprachen — Sky Blue
  teal: '#14B8A6',
  mint: '#10B981', // Naturwissenschaften — Emerald Mint
  lime: '#84CC16',
  sun: '#EAB308',
  amber: '#F97316', // Gesellschaft — Warm Orange (zugleich Marken-Akzent)
  apricot: '#F59E0B',
  coral: '#F43F5E', // Sprachen / Deutsch — Coral Red
  pink: '#EC4899', // Sport & Kunst — Magenta
  slate: '#64748B',
  charcoal: '#0F172A',
};

/** Pastell-Flächen (Light) — kuratierte 50er-Stufen, ~8–12 % Farbanteil. */
const LIGHT_TINTS: BlockPalette = {
  violet: '#EEF2FF',
  lavender: '#F5F3FF',
  sky: '#F0F9FF',
  teal: '#F0FDFA',
  mint: '#ECFDF5',
  lime: '#F7FEE7',
  sun: '#FEFCE8',
  amber: '#FFF7ED',
  apricot: '#FFFBEB',
  coral: '#FFF1F2',
  pink: '#FDF2F8',
  slate: '#F1F5F9',
  charcoal: '#F1F5F9',
};

const LIGHT_ON_BLOCKS: BlockPalette = {
  violet: '#FFFFFF',
  lavender: '#FFFFFF',
  sky: '#FFFFFF',
  teal: '#FFFFFF',
  mint: '#FFFFFF',
  lime: '#1A2E05',
  sun: '#422006',
  amber: '#FFFFFF',
  apricot: '#451A03',
  coral: '#FFFFFF',
  pink: '#FFFFFF',
  slate: '#FFFFFF',
  charcoal: '#FFFFFF',
};

/* ------------------------------------------------------------------ Dark */

/** Dark: dieselben Familien eine Stufe heller, damit sie auf Slate leuchten. */
const DARK_BLOCKS: BlockPalette = {
  violet: '#818CF8',
  lavender: '#A78BFA',
  sky: '#38BDF8',
  teal: '#2DD4BF',
  mint: '#34D399',
  lime: '#A3E635',
  sun: '#FACC15',
  amber: '#FB923C',
  apricot: '#FBBF24',
  coral: '#FB7185',
  pink: '#F472B6',
  slate: '#94A3B8',
  charcoal: '#1E293B',
};

const DARK_SURFACE = '#111A2E';

/** Mischt zwei Hex-Farben (t = Anteil von `b`). */
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const ch = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `#${[ch(0), ch(1), ch(2)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const value = (hex ?? '').replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) return null;
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

/** Dark-Tints: 16 % Farbton auf der dunklen Kartenfläche. */
const DARK_TINTS: BlockPalette = Object.fromEntries(
  (Object.keys(DARK_BLOCKS) as BlockName[]).map((name) => [name, mixHex(DARK_SURFACE, DARK_BLOCKS[name], 0.16)]),
) as BlockPalette;

const DARK_ON_BLOCKS: BlockPalette = {
  ...LIGHT_ON_BLOCKS,
  violet: '#0F172A',
  lavender: '#0F172A',
  sky: '#0F172A',
  teal: '#0F172A',
  mint: '#0F172A',
  amber: '#0F172A',
  coral: '#0F172A',
  pink: '#0F172A',
  slate: '#0F172A',
  charcoal: '#FFFFFF',
};

/* ------------------------------------------------------------------ Paletten */

/** Light — warmes Soft-Blue-Canvas, weiße Karten, Slate-Text. */
export const palette: ThemePalette = {
  canvas: '#F6F8FD',
  surface: '#FFFFFF',
  elevated: '#F8FAFC',
  charcoal: '#0F172A',
  charcoalElevated: '#1E293B',
  ink: '#0F172A',
  muted: '#64748B',
  faint: '#94A3B8',
  line: '#E2E8F0',
  accent: {
    amber: '#F97316',
    amberDeep: '#EA580C',
    violet: '#6366F1',
    lime: '#84CC16',
    limeDeep: '#65A30D',
    coral: '#F43F5E',
  },
  on: {
    ...LIGHT_ON_BLOCKS,
  },
  blocks: LIGHT_BLOCKS,
  blockTints: LIGHT_TINTS,
  onBlocks: LIGHT_ON_BLOCKS,
  priority: {
    urgent: '#EF4444',
    soon: '#F59E0B',
    ok: '#22C55E',
  },
  status: {
    urgent: '#EF4444',
    warning: '#F59E0B',
    success: '#22C55E',
    info: '#3B82F6',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

/** Dark — Slate-Nacht: gleiche Familien, Flächen als 16 %-Tints. */
export const darkPalette: ThemePalette = {
  canvas: '#0B1220',
  surface: DARK_SURFACE,
  elevated: '#172038',
  charcoal: '#0F172A',
  charcoalElevated: '#1E293B',
  ink: '#F1F5F9',
  muted: '#A5B1C6',
  faint: '#6F7D96',
  line: '#26334D',
  accent: {
    amber: '#FB923C',
    amberDeep: '#F97316',
    violet: '#818CF8',
    lime: '#A3E635',
    limeDeep: '#84CC16',
    coral: '#FB7185',
  },
  on: {
    ...DARK_ON_BLOCKS,
  },
  blocks: DARK_BLOCKS,
  blockTints: DARK_TINTS,
  onBlocks: DARK_ON_BLOCKS,
  priority: {
    urgent: '#F87171',
    soon: '#FBBF24',
    ok: '#4ADE80',
  },
  status: {
    urgent: '#F87171',
    warning: '#FBBF24',
    success: '#4ADE80',
    info: '#60A5FA',
  },
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
};

/** Liefert genau die Palette des bereits aufgelösten Themes. */
export function paletteFor(isDark: boolean): ThemePalette {
  return isDark ? darkPalette : palette;
}

/**
 * Übersetzt bekannte Light-Token in ihr Dark-Pendant. Nützlich für bestehende
 * Komponenten, die einen Farbblock per `style={{ backgroundColor }}` bekommen.
 */
const DARK_EQUIVALENTS = new Map<string, string>([
  [palette.canvas, darkPalette.canvas],
  [palette.surface, darkPalette.surface],
  [palette.elevated, darkPalette.elevated],
  [palette.charcoal, darkPalette.charcoal],
  [palette.charcoalElevated, darkPalette.charcoalElevated],
  [palette.ink, darkPalette.ink],
  [palette.muted, darkPalette.muted],
  [palette.faint, darkPalette.faint],
  [palette.line, darkPalette.line],
  ...Object.keys(palette.accent).map((name) => {
    const key = name as AccentName;
    return [palette.accent[key], darkPalette.accent[key]] as [string, string];
  }),
  ...Object.keys(palette.blocks).map((name) => {
    const key = name as BlockName;
    return [palette.blocks[key], darkPalette.blocks[key]] as [string, string];
  }),
  [palette.priority.urgent, darkPalette.priority.urgent],
  [palette.priority.soon, darkPalette.priority.soon],
  [palette.priority.ok, darkPalette.priority.ok],
  [palette.status.info, darkPalette.status.info],
  [palette.success, darkPalette.success],
  [palette.warning, darkPalette.warning],
  [palette.danger, darkPalette.danger],
]);

export function resolveThemeColor(color: string, isDark: boolean): string {
  if (!isDark) return color;
  return DARK_EQUIVALENTS.get(color.toUpperCase()) ?? DARK_EQUIVALENTS.get(color) ?? color;
}

/**
 * Pastell-Fläche zu einem (bereits theme-aufgelösten) Akzentton.
 * Bekannte Familien liefern ihre kuratierte 50er-Stufe; unbekannte Farben
 * (Nutzer-Overrides) werden rechnerisch auf ~10 % (Light) bzw. 16 % (Dark)
 * gemischt — so bleibt jede Karte eine ruhige Fläche.
 */
export function blockTint(color: string, isDark = false): string {
  const colors = paletteFor(isDark);
  const normalised = color.toUpperCase();
  for (const name of Object.keys(colors.blocks) as BlockName[]) {
    if (colors.blocks[name].toUpperCase() === normalised) return colors.blockTints[name];
  }
  // Light-Hex im Dark-Theme? Erst übersetzen, dann noch einmal nachschlagen.
  if (isDark) {
    const translated = resolveThemeColor(color, true);
    if (translated.toUpperCase() !== normalised) return blockTint(translated, true);
  }
  return isDark ? mixHex(colors.surface, color, 0.16) : mixHex('#FFFFFF', color, 0.1);
}

/**
 * Textfarbe mit dem höchsten Kontrast auf einer Vollton-Fläche. Die expliziten
 * On-Token werden für unsere Akzente bevorzugt; unbekannte Fachfarben
 * bekommen eine berechnete, robuste Schwarz/Weiß-Antwort.
 */
export function foregroundOn(color: string, colors: ThemePalette = palette): string {
  const normalised = color.toUpperCase();
  const accents = colors.accent;
  if (normalised === accents.amber.toUpperCase() || normalised === accents.amberDeep.toUpperCase()) return colors.on.amber;
  if (normalised === accents.lime.toUpperCase() || normalised === accents.limeDeep.toUpperCase()) return colors.on.lime;
  if (normalised === accents.violet.toUpperCase()) return colors.on.violet;
  if (normalised === accents.coral.toUpperCase() || normalised === colors.danger.toUpperCase()) return colors.on.coral;
  if (normalised === colors.charcoal.toUpperCase() || normalised === colors.charcoalElevated.toUpperCase()) return colors.on.charcoal;

  for (const name of Object.keys(colors.blocks) as BlockName[]) {
    if (normalised === colors.blocks[name].toUpperCase()) return colors.onBlocks[name];
  }
  for (const name of Object.keys(colors.priority) as PriorityName[]) {
    if (normalised === colors.priority[name].toUpperCase()) {
      return name === 'soon' ? '#451A03' : '#FFFFFF';
    }
  }

  const value = color.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) return '#FFFFFF';
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const luminance = channels
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const darkContrast = (luminance + 0.05) / 0.05;
  const lightContrast = 1.05 / (luminance + 0.05);
  return darkContrast >= lightContrast ? '#0F172A' : '#FFFFFF';
}

/**
 * Radius-Skala „Playful Modern“ (verbindlich, gegen den Lego-Stein-Effekt):
 * · Outer Cards / Bento-Boxen 20 px (`lg`)
 * · Inner Widgets / Sub-Cards / Modals 14 px (`md`)
 * · Buttons & Badges 8 px (`sm`) oder voll rund (`pill`)
 */
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 9999,
  // Kompatible Aliase für bestehende Aufrufer.
  cardSm: 14,
  card: 20,
  cardLg: 24,
  chip: 9999,
  blob: 24,
} as const;

/**
 * Spacing-Raster: 4er-Basis. `xxl`/`xxxl` für Sektionsabstände.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/**
 * Typo-Skala. Karten-Titel 18/700 (`headline`, entspricht `.card-title`),
 * Subtitles 14/500 muted.
 */
export const typeScale = {
  display: { size: 38, lineHeight: 43, weight: '800', tracking: -1 },
  title: { size: 28, lineHeight: 33, weight: '800', tracking: -0.6 },
  headline: { size: 18, lineHeight: 24, weight: '700', tracking: -0.2 },
  stat: { size: 44, lineHeight: 47, weight: '800', tracking: -1.2 },
  statLg: { size: 56, lineHeight: 58, weight: '800', tracking: -1.5 },
  body: { size: 15, lineHeight: 21, weight: '500', tracking: 0 },
  subtitle: { size: 14, lineHeight: 20, weight: '500', tracking: 0 },
  caption: { size: 12, lineHeight: 16, weight: '600', tracking: 0 },
  label: { size: 10.5, lineHeight: 13, weight: '800', tracking: 1.4 },
} as const;

export type TypeScaleStep = keyof typeof typeScale;

/** Hilfs-API für Screen-seitige Prioritäts-Legenden. */
export function priorityLabel(name: PriorityName): string {
  if (name === 'urgent') return 'dringend';
  if (name === 'soon') return 'bald';
  return 'ok';
}

/**
 * Schatten „Playful Modern“: kaum sichtbar, kühl (Slate) statt warm-grau.
 * `card` ≈ `0 4px 20px -2px rgba(15,23,42,.04)`, `hover` ≈ `0 12px 28px -4px rgba(15,23,42,.08)`.
 */
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  float: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
} as const;

export const duration = {
  fast: 140,
  base: 200,
  slow: 380,
} as const;

export type ColorName = keyof ThemePalette;
