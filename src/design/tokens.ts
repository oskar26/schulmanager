/**
 * Schulflow Design-Tokens — die verbindliche Farb- und Formquelle.
 *
 * NativeWind liest die äquivalenten CSS-Variablen aus `global.css`, Tamagui
 * bekommt die Werte über `tamagui.config.ts` und imperativer React-Native-Code
 * importiert sie direkt von hier. Neue Farben werden deshalb immer in allen
 * drei Ebenen gepflegt.
 *
 * ── Redesign „Farbflächen-Stil“ (Phase 1 · docs/redesign-phasen.md) ──
 * Neu: feste Block-Palette (13 gesättigte Farbfamilien für Fach-/Kategorie-
 * flächen inkl. Vordergrundfarben `onBlocks` und Dark-Varianten), feste
 * Prioritätsfarben (`priority`: Coral/Amber/Lime), verbindliche Radius-Skala
 * (Karten 28, Chips/Pills 20, Heroes 32, alles Runde voll rund), Typo-Skala
 * (`typeScale`) und erweitertes Spacing.
 */

export type AccentName = 'amber' | 'amberDeep' | 'amberInk' | 'violet' | 'lime' | 'limeDeep' | 'coral';
export type OnColorName =
  | 'amber'
  | 'lime'
  | 'violet'
  | 'coral'
  | 'charcoal'
  | 'success'
  | BlockName;

/**
 * Feste Farbflächen-Familie des Farbflächen-Stils. Jede Familie bleibt über
 * Light/Dark in derselben Helligkeitsklasse — dadurch passt die zugehörige
 * Vordergrundfarbe (`onBlocks`) in beiden Themes.
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

/** Feste Prioritätsfarben: Coral = dringend, Amber = bald, Lime = ok/erledigt. */
export type PriorityName = 'urgent' | 'soon' | 'ok';
export type PriorityPalette = Record<PriorityName, string>;

export type ThemePalette = {
  canvas: string;
  surface: string;
  elevated: string;
  charcoal: string;
  charcoalElevated: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  accent: Record<AccentName, string>;
  on: Record<OnColorName, string>;
  /** Vollflächige Farbblöcke (Fächer, Kategorien, Sektionen). */
  blocks: BlockPalette;
  /** Passende Vordergrundfarben auf den Farbblöcken. */
  onBlocks: BlockPalette;
  /** Dringlichkeits-Ampel für Aufgaben/Arbeiten. */
  priority: PriorityPalette;
  success: string;
  warning: string;
  danger: string;
};

/** Farbflächen-Palette (Light) — gesättigt, aber mit sicherem Textkontrast. */
const LIGHT_BLOCKS: BlockPalette = {
  violet: '#635BFF',
  lavender: '#B3A0FF',
  sky: '#5CB5F1',
  teal: '#35BCAE',
  mint: '#8FE3BE',
  lime: '#C3F073',
  sun: '#FFD35C',
  amber: '#FF8C38',
  apricot: '#FFB570',
  coral: '#E05353',
  pink: '#F79AC0',
  slate: '#9AA6BF',
  charcoal: '#18191C',
};

const LIGHT_ON_BLOCKS: BlockPalette = {
  violet: '#FFFFFF',
  lavender: '#241A55',
  sky: '#073257',
  teal: '#04332E',
  mint: '#0E3B28',
  lime: '#1F2A00',
  sun: '#3B2B00',
  amber: '#2B1600',
  apricot: '#3A1D00',
  coral: '#FFFFFF',
  pink: '#4A0D2C',
  slate: '#1B2436',
  charcoal: '#FFFFFF',
};

/**
 * Dark-Variante: gleiche Helligkeitsklasse, behutsam angehoben — so bleibt
 * die Textfarbe aus `onBlocks` auch im Dark Theme lesbar.
 */
const DARK_BLOCKS: BlockPalette = {
  violet: '#8C86FF',
  lavender: '#C3B3FF',
  sky: '#7CC6F6',
  teal: '#55CCBF',
  mint: '#A6EFD2',
  lime: '#D4F78C',
  sun: '#FFDE85',
  amber: '#FFA05A',
  apricot: '#FFC48E',
  coral: '#F16C6C',
  pink: '#F8B0D0',
  slate: '#A9B4CB',
  charcoal: '#232428',
};

/**
 * Vordergründe für die **Dark**-Blöcke: Die Dark-Flächen sind heller als ihre
 * Light-Pendants, deshalb liefert Winterweiß dort keinen AA-Kontrast mehr
 * (z. B. Violett #8C86FF/Weiß ≈ 3,0:1). Fast alle Dark-Blöcke bekommen deshalb
 * Ink-Text; nur Charcoal behält Weiß.
 */
const DARK_ON_BLOCKS: BlockPalette = {
  violet: '#18191C',
  lavender: '#18191C',
  sky: '#18191C',
  teal: '#18191C',
  mint: '#18191C',
  lime: '#18191C',
  sun: '#18191C',
  amber: '#18191C',
  apricot: '#18191C',
  coral: '#18191C',
  pink: '#18191C',
  slate: '#18191C',
  charcoal: '#FFFFFF',
};

/** Light — warmes Canvas, klare Weißflächen und kräftige Farbblöcke. */
export const palette: ThemePalette = {
  canvas: '#F6F4EE',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  charcoal: '#18191C',
  charcoalElevated: '#232428',
  ink: '#18191C',
  muted: '#5C5F66',
  faint: '#6E717A',
  line: '#E8E5DC',
  accent: {
    amber: '#FF8C38',
    amberDeep: '#F27244',
    /** AA-Textfarbe des Amber-Akzents auf neutralen/tönenden Flächen. */
    amberInk: '#9A5B21',
    violet: '#635BFF',
    lime: '#C3F073',
    limeDeep: '#A3E635',
    coral: '#E05353',
  },
  on: {
    // Enthält die klassischen On-Farben (amber/lime/violet/coral/charcoal)
    // und die On-Farben aller Farbflächen-Familien.
    ...LIGHT_ON_BLOCKS,
    success: '#FFFFFF',
  },
  blocks: LIGHT_BLOCKS,
  onBlocks: LIGHT_ON_BLOCKS,
  priority: {
    urgent: '#E05353', // Coral — überfällig / heute / kritisch
    soon: '#FF8C38', // Amber — morgen / in wenigen Tagen
    ok: '#C3F073', // Lime — erledigt / entspannt
  },
  /*
   * Statusfarben seit Phase 17 als AA-Textfarben nutzbar (≥ 4,5:1 auf Surface):
   * Erfolg/Warning/Fehler sind dunkler gefasst und im Dark Mode aufgehellt.
   */
  success: '#2F7D4A',
  warning: '#B45309',
  danger: '#C23737',
};

/**
 * Dark — dieselben Akzentfamilien, auf dunklen neutralen Flächen leicht heller.
 * So bleibt die visuelle Sprache identisch, ohne ein zweites Pastell-System.
 */
export const darkPalette: ThemePalette = {
  canvas: '#101114',
  surface: '#18191C',
  elevated: '#232428',
  charcoal: '#18191C',
  charcoalElevated: '#232428',
  ink: '#F7F7F5',
  muted: '#B5B7BC',
  faint: '#8F939C',
  line: '#303238',
  accent: {
    amber: '#FFA05A',
    amberDeep: '#FF8555',
    amberInk: '#FFC59E',
    violet: '#8C86FF',
    lime: '#D4F78C',
    limeDeep: '#B9EA57',
    coral: '#F16C6C',
  },
  on: {
    ...DARK_ON_BLOCKS,
    success: '#18191C',
  },
  blocks: DARK_BLOCKS,
  onBlocks: DARK_ON_BLOCKS,
  priority: {
    urgent: '#F16C6C',
    soon: '#FFA05A',
    ok: '#D4F78C',
  },
  success: '#6BC887',
  warning: '#F2B44A',
  danger: '#F16C6C',
};
// Hinweis: Dark-on.coral ist bewusst Ink (#18191C) — siehe DARK_ON_BLOCKS.

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
  [palette.success, darkPalette.success],
  [palette.warning, darkPalette.warning],
  [palette.danger, darkPalette.danger],
]);

export function resolveThemeColor(color: string, isDark: boolean): string {
  if (!isDark) return color;
  return DARK_EQUIVALENTS.get(color.toUpperCase()) ?? DARK_EQUIVALENTS.get(color) ?? color;
}

/**
 * Textfarbe mit dem höchsten Kontrast auf einer Vollton-Fläche. Die expliziten
 * On-Token werden für unsere sechs Akzente bevorzugt; unbekannte Fachfarben
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

  // Feste Farbflächen-Familie: explizite Vordergrundfarbe statt Heuristik.
  for (const name of Object.keys(colors.blocks) as BlockName[]) {
    if (normalised === colors.blocks[name].toUpperCase()) return colors.onBlocks[name];
  }
  for (const name of Object.keys(colors.priority) as PriorityName[]) {
    if (normalised === colors.priority[name].toUpperCase()) {
      if (name === 'urgent') return colors.on.coral;
      if (name === 'soon') return colors.on.amber;
      return colors.on.lime;
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
  return darkContrast >= lightContrast ? '#18191C' : '#FFFFFF';
}

/* ------------------------------------------------- WCAG-AA-Helfer (Phase 17) */

/**
 * Kontrast-Helfer für den Karten-Neutralisierungs-Umbau: Farben bleiben als
 * Akzent erhalten (Streifen, Icons, Tint-Pills), aber **Text** sitzt wieder auf
 * neutralen Flächen. Für farbigen Text auf neutralen/tönenden Flächen und für
 * Vollton-Pills/Badges liefern diese Helfer automatisch AA-sichere Werte
 * (≥ 4,5:1, mit kleinem Puffer gerechnet, damit auch 14-%-Tints sicher sind).
 */
const AA_RATIO = 4.6;

function hexToRgb(hex: string): [number, number, number] | null {
  const value = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) return null;
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (
    0.2126 * channelLuminance(rgb[0]) +
    0.7152 * channelLuminance(rgb[1]) +
    0.0722 * channelLuminance(rgb[2])
  );
}

/** WCAG-Kontrastverhältnis zweier Farben (1 … 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function mixRgb(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * t) as [number, number, number];
}

/** Richtung, in die eine Farbe gemischt wird, um auf dunklen Flächen lesbar zu sein. */
const INK_TARGET_LIGHT: [number, number, number] = [14, 15, 18];
const INK_TARGET_DARK: [number, number, number] = [255, 255, 255];
const SURFACE_FOR = (isDark: boolean) => (isDark ? '#18191C' : '#FFFFFF');

const readableCache = new Map<string, string>();

/**
 * AA-sichere *Textfarbe* einer Akzentfarbe auf neutralen Karten (Surface bzw.
 * dezente Tint-Flächen): Hellt/Dunkelt die Akzentfarbe entlang ihrer selbst,
 * bis ≥ 4,6:1 erreicht ist — die Farbfamilie bleibt erkennbar
 * (Amber → warmes Tiefamber, Sky → Tiefblau, Lime → Oliv …).
 */
export function readableInk(color: string, isDark: boolean): string {
  const cacheKey = `ink:${color}:${isDark}`;
  const cached = readableCache.get(cacheKey);
  if (cached) return cached;
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  const surface = SURFACE_FOR(isDark);
  const target = isDark ? INK_TARGET_DARK : INK_TARGET_LIGHT;
  let result = color;
  if (contrastRatio(color, surface) < AA_RATIO) {
    for (let step = 1; step <= 20; step += 1) {
      const candidate = rgbToHex(mixRgb(rgb, target, step * 0.05));
      result = candidate;
      if (contrastRatio(candidate, surface) >= AA_RATIO) break;
    }
  }
  readableCache.set(cacheKey, result);
  return result;
}

const solidCache = new Map<string, { bg: string; fg: string }>();

/**
 * AA-sicheres Flächen-/Text-Paar für **Vollton**-Pills, Badges und Buttons:
 * Bevorzugt die Originalfläche mit dem kontraststärkeren Vordergrund (Weiß
 * oder Ink); erst wenn beides unter 4,6:1 bleibt, wird die Fläche selbst
 * angepasst (Light: abgedunkelt, Dark: aufgehellt).
 */
export function solidPair(color: string, isDark: boolean): { bg: string; fg: string } {
  const cacheKey = `solid:${color}:${isDark}`;
  const cached = solidCache.get(cacheKey);
  if (cached) return cached;
  const rgb = hexToRgb(color);
  if (!rgb) return { bg: color, fg: '#FFFFFF' };

  const whiteRatio = contrastRatio(color, '#FFFFFF');
  const inkRatio = contrastRatio(color, '#18191C');
  let pair: { bg: string; fg: string };
  if (Math.max(whiteRatio, inkRatio) >= AA_RATIO) {
    pair = whiteRatio >= inkRatio ? { bg: color, fg: '#FFFFFF' } : { bg: color, fg: '#18191C' };
  } else {
    // Mittlere Helligkeit: Fläche in Richtung des stärkeren Vordergrunds ziehen.
    const preferWhite = whiteRatio >= inkRatio;
    const target = preferWhite ? INK_TARGET_LIGHT : INK_TARGET_DARK;
    let bg = color;
    for (let step = 1; step <= 20; step += 1) {
      bg = rgbToHex(mixRgb(rgb, target, step * 0.05));
      const ratio = preferWhite ? contrastRatio(bg, '#FFFFFF') : contrastRatio(bg, '#18191C');
      if (ratio >= AA_RATIO) break;
    }
    pair = { bg, fg: preferWhite ? '#FFFFFF' : '#18191C' };
  }
  solidCache.set(cacheKey, pair);
  return pair;
}

const whiteOnCache = new Map<string, string>();

/**
 * Fläche, auf der **Weiß** als Text garantiert AA erreicht (z. B. Zähler-
 * Badges in Navigation und Tabs): dunkelt die Farbe nur so weit ab wie nötig.
 */
export function whiteOn(color: string, isDark: boolean): string {
  const cacheKey = `white:${color}:${isDark}`;
  const cached = whiteOnCache.get(cacheKey);
  if (cached) return cached;
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  let result = color;
  if (contrastRatio(color, '#FFFFFF') < AA_RATIO) {
    for (let step = 1; step <= 20; step += 1) {
      result = rgbToHex(mixRgb(rgb, INK_TARGET_LIGHT, step * 0.05));
      if (contrastRatio(result, '#FFFFFF') >= AA_RATIO) break;
    }
  }
  whiteOnCache.set(cacheKey, result);
  return result;
}

/**
 * Radius-Skala des Farbflächen-Stils (verbindlich):
 * · Große Karten 28 px, Hero-Blöcke 32 px, kleine Kacheln 24 px.
 * · Chips/Pills 20 px — wirkt bei Pill-Höhe voll rund, bleibt bei mehrzeiligem
 *   Inhalt sauber gerundet. Reine Pills/Avataren/Nav: voll rund (999).
 */
export const radius = {
  cardSm: 24,
  card: 28,
  cardLg: 32,
  chip: 20,
  pill: 999,
  // Kompatible Kurzformen für Tamagui und bestehende Layout-Helfer.
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  blob: 32,
} as const;

/**
 * Spacing-Raster: 4er-Basis. `xxl`/`xxxl` für Sektionsabstände — der
 * Farbflächen-Stil atmet großzügiger als die alte Listen-Optik.
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
 * Typo-Skala (verbindlich für den Farbflächen-Stil):
 * Screen-Titel groß & fett, Stat-Zahlen extra groß, Fließtext reduziert.
 * `weight` ist der Ziel-Font-Weight (RN: 700 ≈ bold, 800 ≈ extrabold).
 */
export const typeScale = {
  /** Haupt-Headline (Onboarding, Hero). */
  display: { size: 38, lineHeight: 43, weight: '800', tracking: -1 },
  /** Screen-Titel — jeder Screen beginnt damit. */
  title: { size: 28, lineHeight: 33, weight: '800', tracking: -0.6 },
  /** Karten-Headline. */
  headline: { size: 18, lineHeight: 24, weight: '700', tracking: -0.2 },
  /** Riesige Stat-Zahl. */
  stat: { size: 44, lineHeight: 47, weight: '800', tracking: -1.2 },
  /** Noch größere Hero-Zahl (Gesamtschnitt, Countdown). */
  statLg: { size: 56, lineHeight: 58, weight: '800', tracking: -1.5 },
  /** Fließtext — sparsam einsetzen. */
  body: { size: 15, lineHeight: 21, weight: '500', tracking: 0 },
  /** Sekundärtext/Hints. */
  caption: { size: 12, lineHeight: 16, weight: '600', tracking: 0 },
  /** Uppercase-Mikro-Label (Captions unter Stat-Zahlen, Overlines). */
  label: { size: 10.5, lineHeight: 13, weight: '800', tracking: 1.4 },
} as const;

export type TypeScaleStep = keyof typeof typeScale;

/** Hilfs-API für Screen-seitige Prioritäts-Legenden (Coral/Amber/Lime). */
export function priorityLabel(name: PriorityName): string {
  if (name === 'urgent') return 'dringend';
  if (name === 'soon') return 'bald';
  return 'ok';
}

/** Dezente, warme Schatten: Flächen trennen sich, ohne grau oder plastisch zu wirken. */
export const shadow = {
  card: {
    shadowColor: '#18191C',
    shadowOpacity: 0.055,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  float: {
    shadowColor: '#18191C',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
  },
} as const;

export const duration = {
  fast: 140,
  base: 220,
  slow: 380,
} as const;

export type ColorName = keyof ThemePalette;
