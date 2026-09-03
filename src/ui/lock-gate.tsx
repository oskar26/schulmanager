/**
 * Biometrie-Sperre.
 *
 * Wenn `requireBiometrics` aktiv ist, legt sich diese Sperre vor die ganze App:
 * beim Start und bei jedem Wiederaufnehmen (App in den Vordergrund). Die Daten
 * liegen darunter unlesbar hinter einer Vollbild-Abdeckung.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, Text, View } from 'react-native';
import { Lock as LockIcon } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { useSettings } from '@/state/settings';

export function LockGate({ children }: { children: React.ReactNode }) {
  const requireBiometrics = useSettings((state) => state.settings.requireBiometrics);
  const [locked, setLocked] = useState(requireBiometrics && Platform.OS !== 'web');
  const [hasBiometrics, setHasBiometrics] = useState(true);
  const [failed, setFailed] = useState(false);

  const authenticate = useCallback(async () => {
    if (Platform.OS === 'web') {
      setLocked(false);
      return;
    }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(hasHardware && enrolled);
      if (!hasHardware || !enrolled) {
        // Kein Fingerabdruck/Face eingerichtet → Sperre macht keinen Sinn.
        setLocked(false);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Schulflow entsperren',
        cancelLabel: 'Abbrechen',
      });
      if (result.success) {
        setFailed(false);
        setLocked(false);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!requireBiometrics || Platform.OS === 'web') {
      setLocked(false);
      return;
    }
    setLocked(true);
    void authenticate();
  }, [requireBiometrics, authenticate]);

  useEffect(() => {
    if (!requireBiometrics || Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && locked) void authenticate();
    });
    return () => subscription.remove();
  }, [requireBiometrics, locked, authenticate]);

  if (!locked) return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center bg-bg px-8">
      <View className="h-20 w-20 items-center justify-center rounded-[26px] bg-charcoal">
        <LockIcon color="#FFFFFF" size={32} />
      </View>
      <Text className="mt-4 text-[20px] font-bold tracking-tight text-ink">Gesichert</Text>
      <Text className="mt-1 text-center text-[13px] leading-5 text-muted">
        {hasBiometrics
          ? failed
            ? 'Entsperrung abgebrochen. Noch einmal versuchen, um deine Noten zu sehen.'
            : 'Entsperre Schulflow mit Fingerabdruck oder Gesicht.'
          : 'Biometrie ist auf diesem Gerät nicht eingerichtet. Du kannst die Sperre in den Einstellungen deaktivieren.'}
      </Text>
      <Pressable onPress={() => void authenticate()} className="mt-5 rounded-2xl bg-brand px-6 py-3.5 active:opacity-80">
        <Text className="text-[15px] font-bold text-white">Entsperren</Text>
      </Pressable>
    </View>
  );
}
