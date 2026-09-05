import React from 'react';
import { Platform } from 'react-native';
import { Rocket } from 'lucide-react-native';

import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { getNativeIsland } from '@/features/island/bridge';
import { requestPermission } from '@/features/notifications/scheduler';
import { SettingsGroup, SettingsNote, SettingsPage, ToggleRow } from './_components';

export default function LiveIslandSettings() {
  const { colors } = useThemeColors();
  const { settings, update } = useSettings();
  const nativeIsland = Platform.OS !== 'web' ? getNativeIsland() : null;

  const toggle = async (value: boolean) => {
    update({ liveIsland: value });
    if (value && Platform.OS === 'android') await requestPermission();
  };

  const description = Platform.OS === 'android'
    ? nativeIsland
      ? 'Dev-Build aktiv: Schulflow nutzt eine dauerhafte Fortschritts-Notification als Live-Update. Auf HyperOS kann sie als Fokus-Notification erscheinen.'
      : 'Expo-Go-Fallback: eine stille Notification zeigt die laufende Stunde. Im Dev-Build wird daraus das native Live-Update.'
    : Platform.OS === 'ios'
      ? 'Die App rendert keine eigene Kapsel über dem Inhalt. Ein WidgetKit-Target kann die Daten als echte Live Activity auf Lockscreen und Dynamic Island anzeigen.'
      : Platform.OS === 'web'
        ? 'Im Browser sitzt die Pille unmittelbar über der schwarzen Tab-Bar. Die Detailkarte klappt nach oben auf und verdeckt keinen Inhalt.'
        : 'Die laufende bzw. nächste Stunde wird über den passenden Systemkanal angezeigt.';

  return (
    <SettingsPage title="Live-Infos" subtitle="Stunde, Countdown und Fortschritt">
      <SettingsNote color={colors.blocks.lavender}>{description}</SettingsNote>
      <SettingsGroup>
        <ToggleRow
          icon={Rocket}
          iconColor={colors.blocks.lavender}
          title="Live-Infos aktivieren"
          subtitle="Laufende und nächste Stunde immer im Blick"
          value={settings.liveIsland}
          onValueChange={(value) => void toggle(value)}
        />
      </SettingsGroup>
    </SettingsPage>
  );
}
