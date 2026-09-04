/**
 * Kleine Navigations-Helfer für die App-Shell.
 *
 * Sie halten die Badge-Darstellung in Rail, Sidebar und Bottom-Nav identisch
 * und geben modal geöffneten Deep-Links immer ein sicheres Ziel zum Schließen.
 */
import { useCallback } from 'react';
import { type Href, useRouter } from 'expo-router';

/** Obergrenze für sichtbare Zähler in jeder Navigation. */
export const NAV_BADGE_MAX = 99;

/** Haupt-Tabs werden per `navigate` aktiviert, damit kein neuer Stack entsteht. */
const MAIN_TAB_HREFS = new Set(['/', '/timetable', '/tasks', '/grades', '/inbox']);

export function isMainTabHref(href: string): boolean {
  return MAIN_TAB_HREFS.has(href);
}

/**
 * Bereinigt API-/Demo-Zähler vor dem Rendern. Negative, gebrochene und
 * nicht-endliche Werte dürfen weder eine Navigation überdecken noch "NaN"
 * anzeigen.
 */
export function normaliseBadgeCount(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value as number));
}

/** Sichtbares Label eines Nav-Badges — ab 100 immer kompakt als „99+“. */
export function formatNavBadge(value: number | null | undefined): string | null {
  const count = normaliseBadgeCount(value);
  if (count === 0) return null;
  return count > NAV_BADGE_MAX ? '99+' : String(count);
}

/**
 * Schließt Stack-/Sheet-Routen wie gewohnt, fällt bei direkt geöffneten
 * Deep-Links aber sauber auf den Start-Tab zurück statt in einen leeren Stack
 * zu navigieren.
 */
export function useSafeBack(fallback: Href = '/') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallback);
  }, [fallback, router]);
}
