/**
 * Scroll-Reserve für die schwebende Tab-Kapsel unten (PROJECT_STATUS.md · Phase 1 · M1).
 *
 * Die FloatingTabBar (Phone) liegt absolut über dem Screen-Inhalt. Damit sie
 * Inhalte niemals verdeckt, bekommt der Scroll-Content aller Tab-Screens unten
 * diese Reserve — mindestens 100 px laut Design-Briefing, auf Geräten mit
 * Home-Indicator entsprechend mehr (Safe-Area + Kapselhöhe).
 *
 * Verwendung: `const reserve = useTabNavReserve();` und dann
 * `contentContainerStyle={{ paddingBottom: reserve }}`.
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Mindest-Reserve laut Briefing („padding-bottom: 100px“). */
export const TAB_NAV_RESERVE = 100;

/** Kapselhöhe inkl. Float-Abstand, die zusätzlich zur Safe-Area benötigt wird. */
const CAPSULE_HEIGHT = 88;

/** Reserve = max(100 px, Safe-Area unten + Kapselhöhe). */
export function useTabNavReserve(): number {
  const insets = useSafeAreaInsets();
  return Math.max(TAB_NAV_RESERVE, insets.bottom + CAPSULE_HEIGHT);
}
