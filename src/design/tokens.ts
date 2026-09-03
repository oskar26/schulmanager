/**
 * Schulflow Design-Tokens — die verbindliche Farb- und Formquelle.
 *
 * NativeWind liest die äquivalenten CSS-Variablen aus `global.css`, Tamagui
 * bekommt die Werte über `tamagui.config.ts` und imperativer React-Native-Code
 * importiert sie direkt von hier. Neue Farben werden deshalb immer in allen
 * drei Ebenen gepflegt.
 */

export type AccentName = 'amber' | 'amberDeep' | 'violet' | 'lime' | 'limeDeep' | 'coral';
export type OnColorName = 'amber' | 'lime' | 'violet' | 'coral' | 'charcoal';

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
  success: string;
  warning: string;
  danger: string;
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
  faint: '#9A9DA6',
  line: '#E8E5DC',
  accent: {
    amber: '#FF8C38',
    amberDeep: '#F27244',
    violet: '#635BFF',
    lime: '#C3F073',
    limeDeep: '#A3E635',
    coral: '#E05353',
  },
  on: {
    amber: '#2B1600',
    lime: '#1F2A00',
    violet: '#FFFFFF',
    coral: '#FFFFFF',
    charcoal: '#FFFFFF',
  },
  success: '#3E9B5A',
  warning: '#E89C1E',
  danger: '#E05353',
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
  faint: '#7C7F87',
  line: '#303238',
  accent: {
    amber: '#FFA05A',
    amberDeep: '#FF8555',
    violet: '#8C86FF',
    lime: '#D4F78C',
    limeDeep: '#B9EA57',
    coral: '#F16C6C',
  },
  on: {
    amber: '#2B1600',
    lime: '#1F2A00',
    violet: '#FFFFFF',
    coral: '#FFFFFF',
    charcoal: '#FFFFFF',
  },
  success: '#6BC887',
  warning: '#F2B44A',
  danger: '#F16C6C',
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

export const radius = {
  cardSm: 20,
  card: 24,
  cardLg: 28,
  pill: 999,
  // Kompatible Kurzformen für Tamagui und bestehende Layout-Helfer.
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  blob: 28,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

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
