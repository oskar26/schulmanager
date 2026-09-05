import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  Building2,
  CircleUserRound,
  Info,
  LayoutGrid,
  Palette,
  Rocket,
  School,
  Shield,
} from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { useThemeColors } from '@/design/theme';
import { useSafeBack } from '@/ui/navigation';
import { IconButton, Screen, Title } from '@/ui/primitives';
import { CategoryCard } from './_components';

const categories = [
  { key: 'account', title: 'Konto & Verbindung', hint: 'Anmeldung, Demo-Modus und Schulmanager-API.', icon: CircleUserRound, color: 'mint', href: '/settings/account' },
  { key: 'school', title: 'Schule', hint: 'Schulprofil, Kind und freigeschaltete Module.', icon: School, color: 'sky', href: '/settings/school' },
  { key: 'appearance', title: 'Erscheinungsbild', hint: 'Farbschema, Stundenplan und Haptik.', icon: Palette, color: 'amber', href: '/settings/appearance' },
  { key: 'widgets', title: 'Dashboard-Widgets', hint: 'Karten ein-/ausblenden und per Ziehen sortieren.', icon: LayoutGrid, color: 'violet', href: '/settings/widgets' },
  { key: 'notifications', title: 'Benachrichtigungen', hint: 'Ereignisse, Ruhezeiten und Briefing.', icon: Bell, color: 'apricot', href: '/settings/notifications' },
  { key: 'live-island', title: 'Live-Infos', hint: 'Laufende Stunde als System-Info oder Web-Pille.', icon: Rocket, color: 'lavender', href: '/settings/live-island' },
  { key: 'privacy', title: 'Datenschutz', hint: 'Sichtbarkeit, Biometrie und lokale Daten.', icon: Shield, color: 'charcoal', href: '/settings/privacy' },
  { key: 'modules', title: 'Module', hint: 'Welche Bereiche deine Schule bereitstellt.', icon: Building2, color: 'teal', href: '/settings/modules' },
  { key: 'about', title: 'Über Schulflow', hint: 'Build, Styling-Pipeline und API-Hinweise.', icon: Info, color: 'slate', href: '/settings/about' },
] as const;

export default function SettingsIndex() {
  const router = useRouter();
  const back = useSafeBack('/');
  const { colors } = useThemeColors();
  const { data } = useSnapshot();

  const blockColors: Record<(typeof categories)[number]['color'], string> = {
    mint: colors.blocks.mint,
    sky: colors.blocks.sky,
    amber: colors.blocks.amber,
    violet: colors.blocks.violet,
    apricot: colors.blocks.apricot,
    lavender: colors.blocks.lavender,
    charcoal: colors.blocks.charcoal,
    teal: colors.blocks.teal,
    slate: colors.blocks.slate,
  };

  return (
    <Screen adaptive="content">
      <View className="px-4 pb-1 pt-2">
        <View className="flex-row items-center gap-3">
          <IconButton icon="chevron-back" onPress={back} color={colors.muted} background="bg-line/50" size={40} />
          <View className="min-w-0 flex-1">
            <Title numberOfLines={1}>Einstellungen</Title>
            <Text className="text-[13px] font-medium text-muted">Alles an einem Ort — wähle eine Kategorie.</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View className="mb-2 mt-4 rounded-[24px] bg-surface px-4 py-3.5">
          <Text className="text-[12.5px] font-semibold leading-[18px] text-muted">
            Deine Einstellungen sind sofort aktiv und werden auf diesem Gerät gespeichert. Unterseiten lassen sich direkt öffnen und sicher zurückgehen.
          </Text>
        </View>
        {categories.map((category) => (
          <CategoryCard
            key={category.key}
            icon={category.icon}
            color={blockColors[category.color]}
            title={category.title}
            hint={category.hint}
            onPress={() => router.push(category.href)}
          />
        ))}
        {data?.institution ? (
          <Text className="mt-1 px-1 text-[11px] font-semibold text-faint" numberOfLines={1}>
            {data.institution.name ?? 'Schulflow'}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
