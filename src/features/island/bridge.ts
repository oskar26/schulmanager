/**
 * Native Seite der Island-Brücke (iOS/Android, Dev-Builds).
 *
 * Greift das lokale Expo-Modul `modules/schulflow-live-island` auf, das unter
 * Android eine dauerhafte Fortschritts-Notification („Live Update") zeichnet.
 * Auf Xiaomi HyperOS wird genau diese Notification-Klasse vom System
 * automatisch zur Fokus-Notification (HyperIsland-Darstellung um die
 * Punch-Hole-Kamera) hochgestuft — ohne Xiaomi-interne SDKs.
 *
 * In Expo Go ist das Modul nicht verlinkt → Rückgabe `null`, und der
 * JS-Fallback über `expo-notifications` übernimmt.
 */
export interface LiveIslandNative {
  isSupported(): boolean;
  show(title: string, body: string, progress: number, targetAt: number): Promise<boolean>;
  hide(): Promise<void>;
}

let cached: LiveIslandNative | null | undefined;

export function getNativeIsland(): LiveIslandNative | null {
  if (cached !== undefined) return cached;
  try {
    // Pflicht: synchroner require statt import — sonst knallt es in Expo Go
    // schon beim Laden des Bundles.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../../../modules/schulflow-live-island/src/index') as LiveIslandNative;
    cached = mod.isSupported() ? mod : null;
  } catch {
    cached = null;
  }
  return cached;
}
