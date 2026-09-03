/**
 * JS-Fassade des nativen Island-Moduls.
 *
 * Wird nur über `src/features/island/bridge.native.ts` (geguardet, synchroner
 * require in try/catch) geladen — niemals direkt importieren, sonst bricht
 * die App in Expo Go.
 */
import { requireNativeModule } from 'expo-modules-core';

interface NativeLiveIsland {
  isSupported(): boolean;
  show(title: string, body: string, progress: number, targetAt: number): Promise<boolean>;
  hide(): Promise<void>;
}

const Native = requireNativeModule<NativeLiveIsland>('SchulflowLiveIsland');

export function isSupported(): boolean {
  try {
    return Native.isSupported();
  } catch {
    return false;
  }
}

/**
 * Zeichnet/aktualisiert die laufende Fortschritts-Notification.
 * · `progress`  0–100 (Anteil der laufenden Stunde oder Annäherung)
 * · `targetAt`  Unix-ms des Endes (laufende Stunde) bzw. Starts (nächste Stunde)
 */
export async function show(title: string, body: string, progress: number, targetAt: number): Promise<boolean> {
  try {
    return (await Native.show(title, body, Math.round(progress), Math.round(targetAt))) ?? false;
  } catch {
    return false;
  }
}

export async function hide(): Promise<void> {
  try {
    await Native.hide();
  } catch {
    /* kein Modul, nichts zu verstecken */
  }
}
