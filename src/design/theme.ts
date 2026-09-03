/** Theme-Bridge für imperativen React-Native-Code.
 *
 * NativeWind-Klassen erhalten ihre Farben automatisch über `global.css`.
 * Komponenten mit `style={{ color }}` brauchen dagegen diese kleine Brücke,
 * damit Light, Dark und System sofort dieselbe Palette verwenden.
 */
import { useColorScheme } from 'react-native';

import { paletteFor, type ThemePalette } from '@/design/tokens';
import { useSettings } from '@/state/settings';

export type ResolvedTheme = {
  isDark: boolean;
  colors: ThemePalette;
};

export function useThemeColors(): ResolvedTheme {
  const system = useColorScheme();
  const preference = useSettings((state) => state.settings.theme);
  const isDark = (preference === 'system' ? system ?? 'light' : preference) === 'dark';
  return { isDark, colors: paletteFor(isDark) };
}
