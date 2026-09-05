import React from 'react';
import { Text, View } from 'react-native';
import { Boxes, Check } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, resolveThemeColor } from '@/design/tokens';
import { ColorBlockCard, IconBadge, Pill, Row } from '@/ui/primitives';
import { SettingsNote, SettingsPage } from './_components';

export default function ModulesSettings() {
  const { colors, isDark } = useThemeColors();
  const { data } = useSnapshot();
  const modules = data?.modules ?? [];
  const tone = resolveThemeColor(colors.blocks.teal, isDark);
  const ink = foregroundOn(tone, colors);
  return (
    <SettingsPage title="Module" subtitle="Freigaben deiner Schule">
      <SettingsNote color={colors.blocks.teal}>
        Die Liste wird vom aktiven Schulmanager-Konto geliefert. Nicht freigeschaltete Module erscheinen weder in der Hauptnavigation noch in den passenden Einstellungen.
      </SettingsNote>
      <ColorBlockCard color={tone} style={{ padding: 18 }}>
        <Row className="gap-3">
          <IconBadge icon={Boxes} color={ink} tone="tint" size="lg" />
          <View className="min-w-0 flex-1">
            <Text className="text-[18px] font-extrabold" style={{ color: ink }}>Aktive Module</Text>
            <Text className="mt-0.5 text-[12.5px] leading-[17px]" style={{ color: `${ink}B8` }}>{modules.length || 'Keine'} von der Schule bereitgestellt</Text>
          </View>
        </Row>
        {modules.length ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {modules.map((module) => <Pill key={module} label={module} color={ink} tone="tint" icon={Check} />)}
          </View>
        ) : null}
      </ColorBlockCard>
    </SettingsPage>
  );
}
