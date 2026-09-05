import React from 'react';
import { CalendarDays, Palette } from 'lucide-react-native';

import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { Muted, SegmentedControl } from '@/ui/primitives';
import { SectionBlock, SettingsGroup, SettingsNote, SettingsPage, ToggleRow } from './_components';

export default function AppearanceSettings() {
  const { colors } = useThemeColors();
  const { settings, update } = useSettings();
  return (
    <SettingsPage title="Erscheinungsbild" subtitle="Dein Rhythmus, deine Farben">
      <SettingsNote color={colors.blocks.amber}>
        Das Farbschema greift sofort in Web und App. Haptik wird nur auf Geräten mit Vibrationsmotor verwendet.
      </SettingsNote>
      <SettingsGroup className="p-[18px]">
        <Palette color={colors.blocks.amber} size={22} strokeWidth={2.3} />
        <SegmentedControl<'system' | 'light' | 'dark'>
          value={settings.theme}
          onChange={(next) => update({ theme: next })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Hell' },
            { value: 'dark', label: 'Dunkel' },
          ]}
        />
      </SettingsGroup>
      <SettingsGroup>
        <ToggleRow title="Kompakter Stundenplan" subtitle="Mehr Stunden auf einen Blick" value={settings.compactTimetable} onValueChange={(value) => update({ compactTimetable: value })} />
        <ToggleRow title="Wochenende anzeigen" subtitle="Samstag und Sonntag im Plan einblenden" value={settings.showWeekend} onValueChange={(value) => update({ showWeekend: value })} />
        <ToggleRow title="Haptisches Feedback" subtitle="Kurzes, präzises Feedback bei Aktionen" value={settings.hapticFeedback} onValueChange={(value) => update({ hapticFeedback: value })} />
      </SettingsGroup>

      <SectionBlock
        icon={CalendarDays}
        color={colors.blocks.sky}
        title="Stundenplan-Ansicht"
        hint="Standard-Ansicht beim Öffnen des Stundenplans"
      />
      <SettingsGroup className="p-[18px]">
        <SegmentedControl<'list' | 'calendar'>
          value={settings.timetableMode}
          onChange={(mode) => update({ timetableMode: mode })}
          options={[
            { value: 'list', label: 'Liste' },
            { value: 'calendar', label: 'Kalender' },
          ]}
        />
        <Muted className="mt-2 text-[12px] leading-[17px]">
          {settings.timetableMode === 'calendar'
            ? 'Wochenraster mit Zeitachse — ganze Woche auf einen Blick.'
            : 'Zwei Wochen gestapelt + Tagesliste mit Farbflächen.'}
        </Muted>
      </SettingsGroup>
    </SettingsPage>
  );
}
