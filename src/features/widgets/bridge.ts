/**
 * Home-Screen-Widgets — Brücke zum nativen Datenspeicher.
 *
 * Die App schreibt nach jedem Sync das Widget-JSON (`snapshot.ts`) an zwei
 * Stellen:
 *
 * 1. AsyncStorage (`KEYS.widgetSnapshot`) — immer verfügbar, dient auch als
 *    Abgleichs-Quelle und Debugging-Zugang (DevTools → localStorage/Storage).
 * 2. Natives Modul `modules/schulflow-widgets` (Dev-Builds):
 *    · Android → `SharedPreferences` (liest das Glance-Widget, s. spec)
 *    · iOS     → App-Group-Container `group.app.schulflow.client`
 *                (liest die WidgetKit-Extension, s. spec)
 *
 * In Expo Go ist das Modul nicht verlinkt — wie bei der Live-Island-Brücke
 * ein *synchroner* require in try/catch, damit der Web-Bundle nicht knallt.
 */
import { Platform } from 'react-native';

import { KEYS, storage } from '@/lib/storage';
import type { WidgetSnapshot } from '@/features/widgets/snapshot';

interface NativeWidgets {
  isSupported(): boolean;
  writeSharedData(json: string): Promise<boolean>;
}

let cached: NativeWidgets | null | undefined;

export function getNativeWidgets(): NativeWidgets | null {
  if (cached !== undefined) return cached;
  try {
    // Pflicht: synchroner require statt import — sonst bricht es in Expo Go
    // schon beim Laden des Bundles.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../../../modules/schulflow-widgets/src/index') as NativeWidgets;
    cached = mod.isSupported() ? mod : null;
  } catch {
    cached = null;
  }
  return cached;
}

/**
 * Schreibt das Widget-JSON in den gemeinsamen Datenspeicher.
 * Immer fire-and-forget aufrufen — Widgets dürfen nie den Sync bremsen.
 */
export async function writeWidgetData(snapshot: WidgetSnapshot): Promise<void> {
  const json = JSON.stringify(snapshot);

  // 1. App-interne Kopie (alle Plattformen, auch Web/Expo Go)
  await storage.setJSON(KEYS.widgetSnapshot, snapshot);

  // 2. Natives Teilen mit der Widget-Extension
  if (Platform.OS === 'web') return;
  const native = getNativeWidgets();
  if (!native) return;
  try {
    await native.writeSharedData(json);
  } catch {
    /* Modul weg/crash — die AsyncStorage-Kopie reicht für die App */
  }
}
