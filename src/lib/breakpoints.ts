/**
 * Responsives Layout — eine Quelle der Wahrheit für Breakpoints.
 *
 * Die App kennt vier Formfaktoren:
 *
 * | Formfaktor | Breite      | Navigation            | Inhalt                         |
 * |------------|-------------|-----------------------|--------------------------------|
 * | `phone`    | < 600 dp    | Bottom-Tab-Bar        | 1 Spalte, volle Breite         |
 * | `tablet`   | 600–1199 dp | Icon-Rail links       | bis zu 2 Spalten, max. ~1120   |
 * | `desktop`  | ≥ 1200 dp   | Sidebar mit Labels    | bis zu 3 Spalten, max. ~1280   |
 * | `wide`     | ≥ 1600 dp   | Sidebar mit Labels    | 3 Spalten, max. ~1440          |
 *
 * `tablet` ab 600 dp folgt der Android-Konvention (`sw600dp`) — damit zählen
 * auch kompakte Tablets wie das Xiaomi Pad 6 im Hochformat (654 dp) oder der
 * innere Screen von Faltphones als Tablet. Auf Geräten mit Fenster-Modi
 * (iPad Stage Manager, HyperOS Freeform, Split-Screen) schaltet die App beim
 * Zoomen/Ziehen des Fensters live zwischen den Layouts um.
 */
import { Platform, useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet' | 'desktop' | 'wide';

export const BREAKPOINTS = {
  tablet: 600,
  desktop: 1200,
  wide: 1600,
} as const;

export interface LayoutInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isLandscape: boolean;
  /** Spaltenzahl für Dashboard-Widgets und Kartenfeeds. */
  columns: 1 | 2 | 3;
  /** Maximale Breite von Lese-Inhalten (Listen, Formulare). */
  contentMaxWidth: number;
  /** Maximale Breite des Dashboard-Kartens. */
  dashboardMaxWidth: number;
  /** Linke Navigation: unten (Tab-Bar), Rail (nur Icons) oder volle Sidebar. */
  navigation: 'bottom' | 'rail' | 'sidebar';
  /** Breite der linken Navigation in dp (0 bei `bottom`). */
  navigationWidth: number;
  /** Horizontales Außenpadding für breite Screens. */
  gutter: number;
  /**
   * Vermuteter echter Desktop-Browser/Web — beeinflusst nur Kleinigkeiten
   * (z. B. Hover-Hinweise), nie Layout-Grundlagen.
   */
  isWeb: boolean;
}

export function layoutForWidth(width: number, height = 0): LayoutInfo {
  const breakpoint: Breakpoint =
    width >= BREAKPOINTS.wide
      ? 'wide'
      : width >= BREAKPOINTS.desktop
        ? 'desktop'
        : width >= BREAKPOINTS.tablet
          ? 'tablet'
          : 'phone';

  const isPhone = breakpoint === 'phone';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'wide';
  const isWide = breakpoint === 'wide';

  const navigation: LayoutInfo['navigation'] = isPhone ? 'bottom' : isTablet ? 'rail' : 'sidebar';
  const navigationWidth = navigation === 'bottom' ? 0 : navigation === 'rail' ? 88 : 264;

  const contentWidth = Math.max(320, width - navigationWidth);

  return {
    width,
    height,
    breakpoint,
    isPhone,
    isTablet,
    isDesktop,
    isWide,
    isLandscape: height > 0 && width > height,
    columns: isDesktop ? 3 : isPhone ? 1 : 2,
    contentMaxWidth: 1120,
    dashboardMaxWidth: isWide ? 1440 : 1280,
    navigation,
    navigationWidth,
    gutter: isDesktop ? 28 : isTablet ? 24 : 16,
    isWeb: Platform.OS === 'web',
  };
}

export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();
  return layoutForWidth(width, height);
}

/** Schnellzugriff: breiter als ein Handy? */
export function useIsWideLayout(): boolean {
  return useLayout().navigation !== 'bottom';
}
