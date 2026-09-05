import React from 'react';
import { Palette } from 'lucide-react-native';

import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { SegmentedControl } from '@/ui/primitives';
import { SettingsGroup, SettingsNote, SettingsPage, ToggleRow } from './_components';

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
    </SettingsPage>
  );
}
