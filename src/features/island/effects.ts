/**
 * Live-Island — plattformabhängige Nebeneffekte.
 *
 * · Web      → Browser-Tab-Titel zeigt den Countdown (`📐 Mathe · noch 23 min — Schulflow`)
 *
 * Emojis hier sind bewusst: Tab-Titel und Notification sind System-Oberflächen
 * ohne eigenes Icon — das Fach-Emoji macht sie auf einen Blick erkennbar.
 * · Android  → dauerhafte Fortschritts-Notification, erst über das lokale
 *              native Modul (Dev-Build: echte ongoing/Live-Update-/HyperOS-
 *              Fokus-Notification), sonst als Expo-Go-Fallback über
 *              `expo-notifications` (stille Low-Importance-Notification,
 *              die minütlich aktualisiert wird).
 * · iOS      → echte Live Activities brauchen eine WidgetKit-Extension
 *              (nativer Target, App-Store-Build). Die Swift-Module-Quellen
 *              liegen unter `modules/schulflow-live-island/ios/`; der Target-Build
 *              steht in `docs/PLATTFORMEN.md` §3.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';

import type { IslandState } from '@/features/island/use-island';
import { getNativeIsland } from '@/features/island/bridge';
import { useSettings } from '@/state/settings';

const WEB_BASE_TITLE = 'Schulflow';
const FALLBACK_CHANNEL = 'schulflow.live-island-fallback';
const FALLBACK_ID = 'schulflow.live-island';

/** Letzter an die Notification geschriebener Inhalt — Updates nur bei Änderung. */
let lastSignature: string | null = null;

function signatureOf(state: IslandState): string {
  return [
    state.kind,
    state.lesson.id,
    state.title,
    state.statusLabel,
    Math.round(state.progress * 100),
  ].join('|');
}

/* ------------------------------------------------------------------ Web */

function useWebTitle(state: IslandState | null, enabled: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!enabled || !state) {
      document.title = WEB_BASE_TITLE;
      return;
    }
    const headline = state.statusLabel.split('·')[0].trim();
    document.title = `${state.emoji} ${state.title.replace(' (entfällt)', '')} · ${headline} — ${WEB_BASE_TITLE}`;
    return () => {
      document.title = WEB_BASE_TITLE;
    };
  }, [enabled, state?.kind, state?.title, state?.statusLabel]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ------------------------------------------------------------------ Android (nativ oder Fallback) */

function useAndroidIsland(state: IslandState | null, enabled: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const signature = !enabled || !state ? null : signatureOf(state);
    if (signature === lastSignature) return;
    lastSignature = signature;

    const island = getNativeIsland();

    async function sync() {
      if (!enabled || !state) {
        lastSignature = null;
        if (island) await island.hide().catch(() => {});
        await dismissFallback();
        return;
      }

      const body = `${state.statusLabel} — ${state.lesson.start}–${state.lesson.end} Uhr`;
      if (island) {
        const ok = await island
          .show(`${state.emoji} ${state.title}`, body, Math.round(state.progress * 100), state.targetAtMs)
          .catch(() => false);
        if (ok) return;
      }
      await showFallback(state, body);
    }

    void sync();
  }, [enabled, state?.kind, state?.title, state?.statusLabel, state?.progress]); // eslint-disable-line react-hooks/exhaustive-deps
}

async function showFallback(state: IslandState, body: string): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.setNotificationChannelAsync(FALLBACK_CHANNEL, {
      name: 'Nächste Stunde · Live',
      description: 'Laufender Countdown zur Stunde (Expo-Go-Fallback).',
      importance: Notifications.AndroidImportance.LOW,
      showBadge: false,
      enableVibrate: false,
      sound: null,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    await Notifications.scheduleNotificationAsync({
      identifier: FALLBACK_ID,
      content: {
        title: `${state.emoji} ${state.title}`,
        body,
        sticky: true,
        autoDismiss: false,
        categoryIdentifier: 'schulflow-live',
        data: { deepLink: 'schulflow://timetable' },
        color: '#6C5CE7',
      },
      trigger: null,
    });
  } catch {
    /* Benachrichtigungen verweigert oder Plattform ohne Support — egal */
  }
}

async function dismissFallback(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.dismissNotificationAsync(FALLBACK_ID);
  } catch {
    /* egal */
  }
}

/* ------------------------------------------------------------------ Orchestrierung */

/**
 * Einmal in der Root-Layout aufrufen — hält Tab-Titel und System-Notification
 * mit dem Insel-State synchron.
 */
export function useLiveIslandEffects(state: IslandState | null): void {
  const enabled = useSettings((store) => store.settings.liveIsland);
  useWebTitle(state, enabled);
  useAndroidIsland(state, enabled);
}
