import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Settings } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { WIDGET_COMPONENTS } from '@/features/dashboard/widgets';
import { greeting, formatLongDay, formatTimeAgo, toISO } from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import { Avatar } from '@/ui/gluestack/feedback';
import { AdaptiveContent, BentoCard, BentoGrid, Muted, RoundActionButton, Row, Screen, Skeleton } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';
import { foregroundOn } from '@/design/tokens';
import { tint } from '@/design/subjects';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { useSettings } from '@/state/settings';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { data, isLoading, refetch, isRefetching, isDemo } = useSnapshot();
  const widgets = useSettings((state) => state.settings.widgets);
  const layout = useLayout();
  const wide = layout.navigation !== 'bottom';

  const enabled = useMemo(() => widgets.filter((widget) => widget.enabled), [widgets]);
  const name = data?.student?.firstname ?? 'Schulflow';

  const iconColor = colors.muted;
  const chipBg = colors.surface;
  const reserve = useTabNavReserve();
  // Datum vertikal gestapelt (Phase 1 · M3): Wochentag groß/fett, Datum darunter —
  // statt „Donnerstag, 3. …“ einzeilig abzuschneiden.
  const [weekdayLabel, dateLabel] = formatLongDay(toISO(new Date())).split(', ');
  // Fortschritts-Pill: Anteil erledigter Hausaufgaben (Phase C, §2.5 Header).
  const homework = data?.homework ?? [];
  const hwDone = homework.filter((h) => h.done).length;
  const progress = homework.length ? Math.round((hwDone / homework.length) * 100) : 0;

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: wide ? 0 : 18, paddingTop: 6, paddingBottom: reserve }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.accent.amber} />}
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
                      <View className="h-full rounded-full bg-accent-amber" style={{ width: `${progress}%` }} />
                    </View>
                    <Text className="text-[10px] font-bold text-muted">Fortschritt {progress}%</Text>
                  </Row>
                </View>
              </Row>
              {/* Datum gestapelt: Wochentag fett, darunter das Datum (kein Truncation). */}
              <Text
                className={`mt-2 font-extrabold tracking-tight text-ink ${
                  layout.isDesktop ? 'text-[36px]' : 'text-[27px]'
                }`}
              >
                {weekdayLabel}
              </Text>
              <Text className="mt-0.5 text-[15px] font-semibold text-muted">{dateLabel}</Text>
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
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isDark ? colors.charcoalElevated : colors.line }} />
            {isDemo ? (
              <View style={{ backgroundColor: tint(colors.accent.amber, 0.18), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: foregroundOn(colors.accent.amber, colors) }}>DEMO</Text>
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
                <BentoCard tone={colors.accent.amber} className="items-center py-6">
                  <Text className="text-center text-[15px] font-extrabold text-on-amber">
                    Dashboard anpassen
                  </Text>
                  <Text className="mt-1 text-center text-[13px] leading-5" style={{ color: foregroundOn(colors.accent.amber, colors), opacity: 0.74 }}>
                    Bestimme, welche Karten hier erscheinen und in welcher Reihenfolge.
                  </Text>
                  <View className="mt-3">
                    <RoundActionButton
                      icon={Settings}
                      onPress={() => router.push('/settings')}
                      color={colors.on.amber}
                      background={colors.surface}
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
