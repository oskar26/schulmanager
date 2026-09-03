import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Settings } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { WIDGET_COMPONENTS } from '@/features/dashboard/widgets';
import { greeting, formatLongDay, formatTimeAgo, toISO } from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import { Avatar } from '@/ui/gluestack/feedback';
import { AdaptiveContent, BentoCard, BentoGrid, Muted, RoundActionButton, Row, Screen, Skeleton } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useSettings } from '@/state/settings';

export default function DashboardScreen() {
  const router = useRouter();
  const system = useColorScheme();
  const theme = useSettings((state) => state.settings.theme);
  const dark = (theme === 'system' ? system : theme) === 'dark';
  const { data, isLoading, refetch, isRefetching, isDemo } = useSnapshot();
  const widgets = useSettings((state) => state.settings.widgets);
  const layout = useLayout();
  const wide = layout.navigation !== 'bottom';

  const enabled = useMemo(() => widgets.filter((widget) => widget.enabled), [widgets]);
  const name = data?.student?.firstname ?? 'Schulflow';

  const iconColor = dark ? '#94A3B8' : '#6E6C66';
  const chipBg = dark ? '#1E293B' : '#FFFFFF';
  // Fortschritts-Pill: Anteil erledigter Hausaufgaben (Phase C, §2.5 Header).
  const homework = data?.homework ?? [];
  const hwDone = homework.filter((h) => h.done).length;
  const progress = homework.length ? Math.round((hwDone / homework.length) * 100) : 0;

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: wide ? 0 : 18, paddingTop: 6, paddingBottom: 132 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor="#6C5CE7" />}
      >
        <AdaptiveContent dashboard>
          {/* Kopf: Begrüßung + Datum + Fortschritt, rechts Aktionen */}
          <Row className="justify-between pt-2">
            <View className="flex-1 pr-3">
              <Row className="gap-2.5">
                <Avatar name={`${data?.student?.firstname ?? 'S'} ${data?.student?.lastname ?? 'F'}`} size={36} />
                <View className="flex-1">
                  <Text className={`font-semibold text-muted ${wide ? 'text-[15px]' : 'text-[13px]'}`} numberOfLines={1}>
                    {greeting()}, {name}
                  </Text>
                  {/* Fortschritts-Pill (Bento-Hierarchie) */}
                  <Row className="mt-1.5 gap-2">
                    <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <View className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
                    </View>
                    <Text className="text-[10px] font-bold text-muted">Fortschritt {progress}%</Text>
                  </Row>
                </View>
              </Row>
              <Text
                className={`mt-2 font-extrabold tracking-tight text-ink ${
                  layout.isDesktop ? 'text-[36px]' : 'text-[27px]'
                }`}
                numberOfLines={1}
              >
                {formatLongDay(toISO(new Date()))}
              </Text>
            </View>
            {/* Auf großen Screens leben Suche & Einstellungen in der Sidebar. */}
            {!wide ? (
              <Row className="gap-2">
                <RoundActionButton icon={Search} onPress={() => router.push('/search')} color={iconColor} background={chipBg} accessibilityLabel="Suche" />
                <RoundActionButton icon={Settings} onPress={() => router.push('/settings')} color={iconColor} background={chipBg} accessibilityLabel="Einstellungen" />
              </Row>
            ) : null}
          </Row>

          {/* Schul-/Status-Pill */}
          <View
            style={{ backgroundColor: chipBg, marginTop: 14, marginBottom: 18, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}
          >
            <Muted className="text-[12px]" numberOfLines={1}>
              {data?.institution?.name ?? 'Schule'}
              {data?.student?.className ? ` · Klasse ${data.student.className}` : ''}
            </Muted>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dark ? '#475569' : '#D6D3D1' }} />
            {isDemo ? (
              <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>DEMO</Text>
              </View>
            ) : (
              <Muted className="text-[11px]">{formatTimeAgo(data?.fetchedAt)}</Muted>
            )}
          </View>

          {isLoading || !data ? (
            <BentoGrid className="gap-4">
              <Skeleton className="h-40 w-full rounded-[28px]" />
              <Skeleton className="h-48 w-full rounded-[28px]" />
              <Skeleton className="h-56 w-full rounded-[28px]" />
            </BentoGrid>
          ) : (
            <BentoGrid
              className="gap-4"
              style={layout.columns > 1 ? undefined : { flexDirection: 'column' as const, flexWrap: 'nowrap' as const }}
            >
              {enabled.map((widget, index) => {
                const Component = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS];
                if (!Component) return null;
                return (
                  <FadeInUp
                    key={widget.id}
                    delay={Math.min(index, 10) * 45}
                    style={
                      layout.columns > 1
                        ? { flexGrow: 1, flexBasis: layout.columns === 3 ? 300 : 360, maxWidth: '100%' }
                        : { width: '100%' }
                    }
                  >
                    <View className="h-full">
                      <Component snapshot={data} />
                    </View>
                  </FadeInUp>
                );
              })}

              <View
                style={
                  layout.columns > 1
                    ? { flexGrow: 1, flexBasis: layout.columns === 3 ? 300 : 360, maxWidth: '100%' }
                    : { width: '100%' }
                }
              >
                <BentoCard tone="#EDE9FE" className="items-center py-6">
                  <Text className="text-center text-[15px] font-extrabold text-indigo-900">
                    Dashboard anpassen
                  </Text>
                  <Muted className="mt-1 text-center text-[13px] leading-5">
                    Bestimme, welche Karten hier erscheinen und in welcher Reihenfolge.
                  </Muted>
                  <View className="mt-3">
                    <RoundActionButton
                      icon={Settings}
                      onPress={() => router.push('/settings')}
                      color="#6C5CE7"
                      accessibilityLabel="Einstellungen"
                    />
                  </View>
                </BentoCard>
              </View>
            </BentoGrid>
          )}
        </AdaptiveContent>
      </ScrollView>
    </Screen>
  );
}
