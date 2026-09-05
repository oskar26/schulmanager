import React, { useMemo } from 'react';
import { Bell } from 'lucide-react-native';
import { Platform } from 'react-native';

import { useModuleActive, useSnapshot } from '@/data/queries';
import { useSettings, type NotificationPrefs } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { requestPermission, syncNotifications } from '@/features/notifications/scheduler';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { SettingsGroup, SettingsNote, SettingsPage, ToggleRow } from './_components';

const rows: { key: keyof NotificationPrefs; title: string; subtitle: string; module: 'core' | 'letters' | 'messenger' | 'grades' }[] = [
  { key: 'substitutions', title: 'Vertretung & Entfall', subtitle: 'Sofort, sobald sich der Plan ändert', module: 'core' },
  { key: 'firstHourCancelled', title: 'Ausschlafen-Alarm', subtitle: 'Wenn die erste Stunde entfällt', module: 'core' },
  { key: 'homeworkDue', title: 'Hausaufgaben fällig', subtitle: 'Abends vorher um 18:00', module: 'core' },
  { key: 'examCountdown', title: 'Klassenarbeiten', subtitle: '7, 3 und 1 Tag vorher', module: 'core' },
  { key: 'newLetter', title: 'Neue Elternbriefe', subtitle: 'Sofort', module: 'letters' },
  { key: 'letterReminder', title: 'Erinnerung Bestätigung', subtitle: 'Nach 48 Stunden ohne Bestätigung', module: 'letters' },
  { key: 'newMessage', title: 'Neue Nachrichten', subtitle: 'Sofort', module: 'messenger' },
  { key: 'newGrade', title: 'Neue Noten', subtitle: 'Sobald eine Note eingetragen wird', module: 'grades' },
  { key: 'morningBriefing', title: 'Morgen-Briefing', subtitle: 'Stunden, Aufgaben und Packliste', module: 'core' },
  { key: 'eveningCheck', title: 'Abend-Check', subtitle: '20:00 „Alles für morgen bereit?“', module: 'core' },
  { key: 'weeklyReview', title: 'Wochenrückblick', subtitle: 'Sonntags um 18:00', module: 'core' },
  { key: 'unexcusedAbsence', title: 'Unentschuldigte Fehlzeit', subtitle: 'Sobald eine auftaucht', module: 'core' },
];

export default function NotificationSettings() {
  const { colors } = useThemeColors();
  const { data } = useSnapshot();
  const { settings, updateNotifications } = useSettings();
  const gradesOn = useModuleActive('grades');
  const messengerOn = useModuleActive('messenger');
  const lettersOn = useModuleActive('letters');
  const visible = useMemo(
    () => rows.filter((row) => row.module === 'core' || (row.module === 'grades' && gradesOn) || (row.module === 'messenger' && messengerOn) || (row.module === 'letters' && lettersOn)),
    [gradesOn, lettersOn, messengerOn],
  );

  const recalculate = async () => {
    if (Platform.OS === 'android') await requestPermission();
    if (data) await syncNotifications(data, settings.notifications, { force: true });
  };

  return (
    <SettingsPage title="Benachrichtigungen" subtitle={`${settings.notifications.quietHours.from}–${settings.notifications.quietHours.to} Ruhezeit`}>
      <SettingsNote color={colors.blocks.apricot}>
        Ruhezeit {settings.notifications.quietHours.from}–{settings.notifications.quietHours.to} · Morgen-Briefing um {settings.notifications.briefingTime}. Änderungen werden sofort gespeichert.
      </SettingsNote>
      <SettingsGroup>
        {visible.map((row) => (
          <ToggleRow
            key={row.key}
            icon={Bell}
            iconColor={colors.blocks.apricot}
            title={row.title}
            subtitle={row.subtitle}
            value={Boolean(settings.notifications[row.key])}
            onValueChange={(value) => updateNotifications({ [row.key]: value })}
          />
        ))}
      </SettingsGroup>
      <SettingsGroup className="p-[18px]">
        <Button action="secondary" size="sm" onPress={() => void recalculate()}>
          <ButtonText>Zeitplan jetzt neu berechnen</ButtonText>
        </Button>
      </SettingsGroup>
    </SettingsPage>
  );
}
