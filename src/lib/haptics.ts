/**
 * Haptik-Feedback — respektiert die Einstellung `hapticFeedback`.
 * Alle Aufrufe sind bestmöglich entkoppelt: auf Web bzw. ohne Erlaubnis passieren sie einfach nicht.
 *
 * Redesign Phase 12 · „knackig statt brummend“
 * --------------------------------------------
 * Bisher lief auf Android jeder Klick über `impactAsync(...)`/`notificationAsync(...)`.
 * expo-haptics simuliert diese Stile auf Android mit `Vibrator` +
 * `VibrationEffect.createOneShot(…, amplitude)` — ein spürbar langes, gleichmäßiges
 * Brummen (bei Erfolgsmeldungen zusätzlich ein Mehrpunkt-Muster). Ein Tap auf
 * einer Pille soll sich aber wie ein Klick anfühlen, nicht wie eine Nachricht.
 *
 * Deshalb:
 *  · **Android** → `performAndroidHapticsAsync(...)` Das nutzt die
 *    systemeigenen `VibrationEffect`-Konstanten (EFFECT_CLICK, EFFECT_TICK,
 *    EFFECT_HEAVY_CLICK, …): kurz, präzise, vom Hersteller auf die eigene
 *    Vibrations-Spule kalibriert und ohne `VIBRATE`-Permission.
 *  · **iOS** → `UIImpactFeedbackGenerator` mit `.light`/`.medium`/`.heavy`
 *    (Generation-„prepare“ übernimmt expo-haptics), Erfolg/Fehler bleiben auf
 *    `UINotificationFeedbackGenerator`.
 *  · Muster, die direkt aufeinanderfolgen, werden zusammengefasst (Coalescing),
 *    damit schnelles Abhaken mehrerer Aufgaben nicht zu einem Rattern wird.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettings } from '@/state/settings';

const enabled = (): boolean =>
  Platform.OS !== 'web' && useSettings.getState().settings.hapticFeedback;

/**
 * Zwei Feedbacks innerhalb dieses Fensters sind ein Tipp-Pendant zueinander —
 * das zweite wird verworfen. Verhindert das „Doppel-Brummen“ beim schnellen
 * Abhaken (Checkbox-Toggle + Listen-Reflow feuern gern im selben Frame).
 */
const COALESCE_MS = 55;
let lastAt = 0;

function allow(kind: string): boolean {
  const now = Date.now();
  if (now - lastAt < COALESCE_MS && kind !== 'success' && kind !== 'error') return false;
  lastAt = now;
  return true;
}

/** Android: kurze System-Effekte; wirft auf alten Geräten/APIs still zurück. */
function android(type: Haptics.AndroidHaptics): void {
  void Haptics.performAndroidHapticsAsync(type).catch(() => {
    // Fallback für Geräte/ROMs ohne Effect-Tabelle (API < 30): ein einzelner,
    // kurzer Impuls statt des langen Vibrator-Musters.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  });
}

/** Leichtes Ticken für Toggles, Checkboxen, Auswahlen, Tab-Wechsel. */
export function hapticLight(): void {
  if (!enabled() || !allow('light')) return;
  if (Platform.OS === 'android') {
    android(Haptics.AndroidHaptics.Segment_Tick);
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/** Karten-/Button-Tap: einen Tick präsenter als `hapticLight`. */
export function hapticTap(): void {
  if (!enabled() || !allow('tap')) return;
  if (Platform.OS === 'android') {
    android(Haptics.AndroidHaptics.Context_Click);
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

/** Umschalten eines Switches — Richtung ist spürbar (toggle-on / toggle-off). */
export function hapticToggle(on: boolean): void {
  if (!enabled() || !allow('toggle')) return;
  if (Platform.OS === 'android') {
    android(on ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off);
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/** Auswahl in einer Liste/Segment-Control (ein Klick pro Wechsel). */
export function hapticSelection(): void {
  if (!enabled() || !allow('selection')) return;
  if (Platform.OS === 'android') {
    android(Haptics.AndroidHaptics.Virtual_Key);
    return;
  }
  void Haptics.selectionAsync().catch(() => undefined);
}

/** Langes Drücken / Bestätigen einer Fläche. */
export function hapticHeavy(): void {
  if (!enabled() || !allow('heavy')) return;
  if (Platform.OS === 'android') {
    android(Haptics.AndroidHaptics.Long_Press);
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
}

/** Erfolgs-Feedback (z. B. Krankmeldung gesendet). */
export function hapticSuccess(): void {
  if (!enabled() || !allow('success')) return;
  if (Platform.OS === 'android') {
    android(Haptics.AndroidHaptics.Confirm);
    return;
  }
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

/** Warn-/Fehler-Feedback. */
export function hapticError(): void {
  if (!enabled() || !allow('error')) return;
  if (Platform.OS === 'android') {
    android(Haptics.AndroidHaptics.Reject);
    return;
  }
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
}
