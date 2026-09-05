import React from 'react';
import Constants from 'expo-constants';
import { Text, View } from 'react-native';
import { Activity, CircleCheck, CircleX, Info } from 'lucide-react-native';

import { useSmTransport } from '@/api/use-transport';
import { useStylePipelineHealth } from '@/ui/style-guard';
import { useThemeColors } from '@/design/theme';
import { Pill, Row } from '@/ui/primitives';
import { SettingsGroup, SettingsNote, SettingsPage } from './_components';

export default function AboutSettings() {
  const { colors } = useThemeColors();
  const health = useStylePipelineHealth();
  const { transport } = useSmTransport();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build = Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber ?? '—';
  const pipelineColor = health === 'healthy' ? colors.blocks.mint : health === 'broken' ? colors.blocks.coral : colors.blocks.amber;
  const PipelineIcon = health === 'healthy' ? CircleCheck : health === 'broken' ? CircleX : Activity;

  return (
    <SettingsPage title="Über Schulflow" subtitle="Build und Diagnose">
      <SettingsNote color={colors.blocks.slate}>
        Schulflow 1.0 ist ein inoffizieller Client für Schulmanager Online. Keine Verbindung zur Schulmanager Online GmbH; Nutzung auf eigene Verantwortung.
      </SettingsNote>
      <SettingsGroup>
        <View className="p-4">
          <Row className="gap-3">
            <Info color={colors.blocks.slate} size={22} strokeWidth={2.3} />
            <View className="flex-1">
              <Text className="text-[15px] font-extrabold text-ink">Versionsinformationen</Text>
              <Text className="mt-0.5 text-[12px] text-muted">Version {version} · Build {String(build)}</Text>
            </View>
          </Row>
        </View>
        <View className="p-4">
          <Row className="gap-3">
            <PipelineIcon color={pipelineColor} size={22} strokeWidth={2.3} />
            <View className="flex-1">
              <Text className="text-[15px] font-extrabold text-ink">Styling-Pipeline</Text>
              <Text className="mt-0.5 text-[12px] leading-[17px] text-muted">
                {health === 'healthy' ? 'NativeWind-Stylesheet geladen.' : health === 'broken' ? 'Stylesheet-Sonde fehlgeschlagen — npm run doctor ausführen.' : 'Sonde läuft oder wartet auf das erste Layout.'}
              </Text>
            </View>
            <Pill label={health === 'healthy' ? 'OK' : health === 'broken' ? 'Fehler' : 'Prüfung'} color={pipelineColor} tone="solid" />
          </Row>
        </View>
        <View className="p-4">
          <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">Transport</Text>
          <Text className="mt-1 text-[13px] font-semibold text-ink">{transport?.label ?? 'wird geprüft …'}</Text>
          <Text className="mt-0.5 text-[12px] leading-[17px] text-muted">{transport?.detail ?? 'Die Verbindungsdiagnose läuft.'}</Text>
        </View>
      </SettingsGroup>
      <SettingsNote>
        Die Datenanbindung prüft im Browser zuerst den eigenen Durchreicher und verwendet keinen öffentlichen Standard-Proxy. Nativ wird direkt mit der Schulmanager-API gesprochen.
      </SettingsNote>
    </SettingsPage>
  );
}
