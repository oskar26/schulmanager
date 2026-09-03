/**
 * Haptik-Feedback — respektiert die Einstellung `hapticFeedback`.
 * Alle Aufrufe sind bestmöglich entkoppelt: auf Web bzw. ohne Erlaubnis passieren sie einfach nicht.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettings } from '@/state/settings';

const enabled = (): boolean =>
  Platform.OS !== 'web' && useSettings.getState().settings.hapticFeedback;

/** Leichtes Ticken für Toggles, Checkboxen, Auswahlen. */
export function hapticLight(): void {
  if (!enabled()) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/** Erfolgs-Feedback (z. B. Krankmeldung gesendet). */
export function hapticSuccess(): void {
  if (!enabled()) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

/** Warn-/Fehler-Feedback. */
export function hapticError(): void {
  if (!enabled()) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
}
