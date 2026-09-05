import React from 'react';
import { Alert, Platform } from 'react-native';
import { EyeOff, Fingerprint, Trash2 } from 'lucide-react-native';

import { useModuleActive } from '@/data/queries';
import { DEFAULT_SETTINGS, useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { SettingsGroup, SettingsNote, SettingsPage, ToggleRow, InfoRow } from './_components';

export default function PrivacySettings() {
  const { colors } = useThemeColors();
  const { settings, update, clearCredentials } = useSettings();
  const gradesOn = useModuleActive('grades');

  const reset = async () => {
    await clearCredentials();
    // Der Onboarding-Status ist kein lokaler Nutzdatensatz und bleibt erhalten.
    update({ ...DEFAULT_SETTINGS, onboarded: settings.onboarded });
  };

  const askReset = () => {
    if (Platform.OS === 'web') {
      void reset();
      return;
    }
    Alert.alert('Wirklich löschen?', 'Alle lokal gespeicherten Daten werden entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void reset() },
    ]);
  };

  return (
    <SettingsPage title="Datenschutz" subtitle="Was auf diesem Gerät bleibt">
      <SettingsNote color={colors.blocks.charcoal}>
        Schulflow speichert Zugangsdaten verschlüsselt. Demo-Daten und Einstellungen bleiben lokal und werden nicht an Dritte weitergegeben.
      </SettingsNote>
      <SettingsGroup>
        {gradesOn ? <ToggleRow icon={EyeOff} iconColor={colors.blocks.violet} title="Noten verbergen" subtitle="Zeigt Punkte als •••, bis du sie einblendest" value={settings.hideGrades} onValueChange={(value) => update({ hideGrades: value })} /> : null}
        <ToggleRow icon={Fingerprint} iconColor={colors.blocks.teal} title="Biometrie beim Start" subtitle="Face ID / Fingerabdruck vor dem Öffnen" value={settings.requireBiometrics} onValueChange={(value) => update({ requireBiometrics: value })} />
        <InfoRow icon={Trash2} danger title="Lokale Daten löschen" subtitle="Cache, Haken und gespeicherte Zugangsdaten" onPress={askReset} />
      </SettingsGroup>
    </SettingsPage>
  );
}
