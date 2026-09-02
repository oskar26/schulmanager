/**
 * Tamagui-Konfiguration.
 * Tamagui liefert in Schulflow die Animations-Treiber und Design-Tokens;
 * das visuelle Styling kommt aus NativeWind/gluestack. Beide lesen dieselben Tokens
 * aus `src/design/tokens.ts`, damit es keine zwei Wahrheiten gibt.
 */
import { createAnimations } from '@tamagui/animations-react-native';
import { createFont, createTamagui, createTokens } from 'tamagui';

import { palette, radius, space } from './tokens';

export const animations = createAnimations({
  bouncy: { type: 'spring', damping: 12, mass: 0.9, stiffness: 180 },
  snappy: { type: 'spring', damping: 20, mass: 0.8, stiffness: 260 },
  lazy: { type: 'spring', damping: 22, stiffness: 90 },
  quick: { type: 'timing', duration: 140 },
});

const tokens = createTokens({
  color: {
    brand: palette.brand,
    brandSoft: palette.brandSoft,
    mint: palette.mint,
    lemon: palette.lemon,
    coral: palette.coral,
    sky: palette.sky,
    grape: palette.grape,
    ink: palette.ink,
    muted: palette.muted,
    surface: palette.surface,
    bg: palette.bg,
    darkBg: palette.darkBg,
    darkSurface: palette.darkSurface,
    darkInk: palette.darkInk,
  },
  space: { 0: 0, 1: space.xs, 2: space.sm, 3: space.md, 4: space.lg, 5: space.xl, 6: space.xxl, true: space.md },
  size: { 0: 0, 1: 20, 2: 28, 3: 36, 4: 44, 5: 56, 6: 72, true: 44 },
  radius: { 0: 0, 1: radius.sm, 2: radius.md, 3: radius.lg, 4: radius.xl, 5: radius.blob, true: radius.lg },
  zIndex: { 0: 0, 1: 10, 2: 100, 3: 1000 },
});

/** Tamagui verlangt mindestens eine Font-Definition, auch wenn wir System-Fonts nutzen. */
const bodyFont = createFont({
  family: 'System',
  size: { 1: 11, 2: 12, 3: 13, 4: 15, 5: 17, 6: 20, 7: 24, 8: 32, true: 15 },
  lineHeight: { 1: 15, 2: 16, 3: 18, 4: 20, 5: 24, 6: 26, 7: 28, 8: 36, true: 20 },
  weight: { 4: '400', 6: '600', 7: '700', 8: '800', true: '400' },
  letterSpacing: { 4: 0, 8: -1, true: 0 },
});

export const tamaguiConfig = createTamagui({
  animations,
  tokens,
  themes: {
    light: {
      background: palette.bg,
      backgroundStrong: palette.surface,
      color: palette.ink,
      colorMuted: palette.muted,
      accent: palette.brand,
    },
    dark: {
      background: palette.darkBg,
      backgroundStrong: palette.darkSurface,
      color: palette.darkInk,
      colorMuted: '#9AA1B8',
      accent: '#8A7CFF',
    },
  },
  fonts: {
    body: bodyFont,
    heading: bodyFont,
  },
  shorthands: {
    f: 'flex',
    p: 'padding',
    m: 'margin',
    br: 'borderRadius',
    bg: 'backgroundColor',
  } as const,
  defaultFont: 'body',
});

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default tamaguiConfig;
