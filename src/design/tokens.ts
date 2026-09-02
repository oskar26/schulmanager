/**
 * Design-Tokens — die eine Quelle der Wahrheit.
 * NativeWind liest sie über CSS-Variablen (global.css), Tamagui über tamagui.config.ts,
 * und imperativer Code (Charts, SVG, Notifications) direkt von hier.
 */

export const palette = {
  brand: '#6C5CE7',
  brandSoft: '#EDEAFE',
  brandInk: '#3C2FA0',
  mint: '#2ECCA8',
  lemon: '#FAC748',
  coral: '#FF7677',
  sky: '#48A3FF',
  grape: '#BD7AF6',
  success: '#22B07A',
  warning: '#E8981E',
  danger: '#E24848',
  ink: '#121422',
  muted: '#6A7086',
  faint: '#9CA2B6',
  line: '#E8EAF3',
  surface: '#FFFFFF',
  bg: '#F8F9FD',
  darkBg: '#0B0E1A',
  darkSurface: '#141828',
  darkElevated: '#1B2034',
  darkLine: '#272D44',
  darkInk: '#F0F2FA',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  blob: 34,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Verspielte, weiche Schatten — nie hart, nie grau. */
export const shadow = {
  card: {
    shadowColor: '#1B1F3B',
    shadowOpacity: 0.07,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  float: {
    shadowColor: '#1B1F3B',
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
} as const;

export const duration = {
  fast: 140,
  base: 220,
  slow: 380,
} as const;

export type ColorName = keyof typeof palette;
