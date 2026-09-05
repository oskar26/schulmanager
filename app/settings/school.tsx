import React from 'react';
import { Text, View } from 'react-native';
import { Building2, Phone, UserRound } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { useThemeColors } from '@/design/theme';
import { resolveThemeColor } from '@/design/tokens';
import { Pill } from '@/ui/primitives';
import { InfoRow, SettingsGroup, SettingsNote, SettingsPage } from './_components';

export default function SchoolSettings() {
  const { colors, isDark } = useThemeColors();
  const { data } = useSnapshot();
  const institution = data?.institution;
  const student = data?.student;

  return (
    <SettingsPage title="Schule" subtitle={institution?.name ?? 'Schulprofil'}>
      <SettingsNote>
        Diese Informationen kommen aus dem aktiven Schulmanager-Konto. Sie können hier nicht versehentlich verändert werden.
      </SettingsNote>
      <SettingsGroup>
        <InfoRow icon={Building2} iconColor={colors.blocks.sky} title={institution?.name ?? 'Schule'} subtitle={[institution?.street, institution?.city].filter(Boolean).join(', ') || 'Keine Adresse hinterlegt'} />
        <InfoRow icon={Phone} iconColor={colors.blocks.sky} title="Sekretariat" subtitle={institution?.phone ?? 'Keine Telefonnummer hinterlegt'} />
        <InfoRow
          icon={UserRound}
          iconColor={colors.blocks.violet}
          title={`${student?.firstname ?? ''} ${student?.lastname ?? ''}`.trim() || 'Kind'}
          subtitle={student?.className ? `Klasse ${student.className}` : 'Keine Klasse hinterlegt'}
        />
      </SettingsGroup>
      {(data?.modules ?? []).length > 0 ? (
        <View className="rounded-[20px] border border-line bg-surface p-[18px]">
          <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">Freigeschaltete Module</Text>
          <View className="mt-2.5 flex-row flex-wrap gap-2">
            {(data?.modules ?? []).map((module) => (
              <Pill key={module} label={module} color={resolveThemeColor(colors.blocks.violet, isDark)} tone="tint" />
            ))}
          </View>
        </View>
      ) : null}
    </SettingsPage>
  );
}
