/**
 * Design-Tokens — die eine Quelle der Wahrheit.
 * NativeWind liest sie über CSS-Variablen (global.css), Tamagui über tamagui.config.ts,
 * und imperativer Code (Charts, SVG, Notifications) direkt von hier.
 */

export const palette = {
  // "Bento / Soft-Brutalism" color-blocks
  periwinkle: '#8C8EFF',
  periwinkleSoft: '#EDE9FE',
  amber: '#FFC83B',
  amberSoft: '#FEF3C7',
  mintSoft: '#D1FAE5',
  coralSoft: '#FEE2E2',
  charcoal: '#18181B',
  charcoalElevated: '#1F1F23',
  // Semantic (light)
  brand: '#6C5CE7',
  brandSoft: '#EDEAFE',
  brandInk: '#3C2FA0',
  mint: '#10B981',
  lemon: '#FAC748',
  coral: '#E0564C',
  sky: '#48A3FF',
  grape: '#BD7AF6',
  success: '#22B07A',
  warning: '#E8981E',
  danger: '#E0564C',
  ink: '#18181B',
  muted: '#6E6C66',
  faint: '#A29E94',
  line: '#E7E5E2',
  surface: '#FFFFFF',
  bg: '#F6F5F2',
  // Dark (Slate-Navy)
  darkBg: '#0F172A',
  darkSurface: '#1E293B',
  darkElevated: '#334155',
  darkLine: '#334155',
  darkInk: '#F8FAFC',
  darkMuted: '#94A3B8',
  darkFaint: '#64748B',
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
