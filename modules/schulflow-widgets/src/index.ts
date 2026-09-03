/**
 * JS-Fassade des nativen Widget-Moduls.
 *
 * Wird nur über `src/features/widgets/bridge.ts` (gegardet, synchroner
 * require in try/catch) geladen — niemals direkt importieren, sonst bricht
 * die App in Expo Go.
 *
 * Vertrag (siehe widgets/spec.md):
 * · `writeSharedData(json)` legt das Widget-JSON in den nativen
 *   Datenspeicher (Android: SharedPreferences `schulflow_widget_data`,
 *   iOS: App-Group-Container `group.app.schulflow.client`) und
 *   benachrichtigt die Widget-Extension per Broadcast/Intent.
 */
import { requireNativeModule } from 'expo-modules-core';

interface NativeWidgets {
  isSupported(): boolean;
  writeSharedData(json: string): Promise<boolean>;
}

const Native = requireNativeModule<NativeWidgets>('SchulflowWidgets');

export function isSupported(): boolean {
  try {
    return Native.isSupported();
  } catch {
    return false;
  }
}

/** Schreibt das Widget-JSON in den gemeinsamen nativen Speicher. */
export async function writeSharedData(json: string): Promise<boolean> {
  try {
    return (await Native.writeSharedData(json)) ?? false;
  } catch {
    return false;
  }
}
