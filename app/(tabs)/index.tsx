import React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Settings } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { WIDGET_COMPONENTS } from '@/features/dashboard/widgets';
import { daysUntil, formatLongDay, formatTimeAgo, greeting, toISO } from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import { Avatar } from '@/ui/gluestack/feedback';
import { AdaptiveContent, BentoCard, BentoGrid, Muted, RoundActionButton, Row, Screen, Skeleton } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, shadow } from '@/design/tokens';
import { tint } from '@/design/subjects';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { useSettings } from '@/state/settings';

/** Phase-3 Welcome-Banner: Charcoal-Hero mit Datum, Fortschritt und Heute-Statistik. */
function WelcomeBanner({
  name,
  weekdayLabel,
  dateLabel,
  progress,
  hwDone,
  hwTotal,
  stats,
  onOpenTasks,
  actions,
}: {
  name: string;
  weekdayLabel: string;
  dateLabel: string;
  progress: number;
  hwDone: number;
  hwTotal: number;
  stats: { value: string; label: string; color: string }[];
  onOpenTasks: () => void;
  actions: React.ReactNode;
}) {
  const { colors } = useThemeColors();
  const hasHomework = hwTotal > 0;
  const whiteDim = 'rgba(255,255,255,0.58)';

  return (
    <View className="overflow-hidden rounded-[28px]" style={{ backgroundColor: colors.charcoal, ...shadow.float }}>
      <View className="gap-4 px-5 pb-5 pt-5">
        {/* Kopf: Avatar + Name, rechts Aktionen */}
        <Row className="justify-between">
          <Row className="flex-1 gap-3">
            <Avatar name={name} size={46} color={colors.accent.amber} />
            <View className="flex-1 justify-center">
              <Text className="text-[10px] font-bold uppercase tracking-[1.8px]" style={{ color: whiteDim }}>
                {greeting()}
              </Text>
              <Text
                className="text-[23px] font-extrabold leading-[26px] tracking-tight"
                style={{ color: colors.on.charcoal }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {name}
              </Text>
            </View>
          </Row>
          {actions}
        </Row>

        {/* Datum (gestapelt, M3) links — Fortschritt rechts */}
        <Row className="items-end justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] font-bold uppercase tracking-[1.8px]" style={{ color: colors.accent.amber }}>
              {weekdayLabel}
            </Text>
            <Text className="mt-0.5 text-[22px] font-extrabold tracking-tight" style={{ color: colors.on.charcoal }}>
              {dateLabel}
            </Text>
          </View>
          {hasHomework ? (
            <View className="items-end">
              <Text className="text-[30px] font-extrabold leading-[32px] tracking-tight" style={{ color: colors.accent.amber }}>
                {progress}%
              </Text>
              <Text className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: whiteDim }}>
                erledigt
              </Text>
            </View>
          ) : null}
        </Row>

        {/* Klare Fortschritts-Anzeige */}
        {hasHomework ? (
          <>
            <View className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}>
              <View
                className="h-full rounded-full"
                style={{ backgroundColor: colors.accent.amber, width: `${Math.max(2, progress)}%` }}
              />
            </View>
            <Row className="justify-between">
              <Text className="text-[12px] font-semibold" style={{ color: whiteDim }}>
                {hwDone} von {hwTotal} Hausaufgaben erledigt
              </Text>
              <Pressable onPress={onOpenTasks} hitSlop={8} accessibilityRole="link">
                <Text className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  Alle ansehen
                </Text>
              </Pressable>
            </Row>
          </>
        ) : (
          <Text className="text-[12px] font-semibold" style={{ color: whiteDim }}>
            Keine Hausaufgaben offen — alles frei.
          </Text>
        )}

        {/* Heute-Statistik-Kacheln */}
        <Row className="mt-0.5 gap-2.5">
          {stats.map((stat) => (
            <View
              key={stat.label}
              className="rounded-2xl px-3 py-2.5"
              style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <Text
                className="text-[19px] font-extrabold leading-[22px]"
                style={{ color: stat.color }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {stat.value}
              </Text>
              <Text className="mt-0.5 text-[10px] font-bold leading-[12px] text-white/55" numberOfLines={2}>
                {stat.label}
              </Text>
            </View>
          ))}
        </Row>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { data, isLoading, refetch, isRefetching, isDemo } = useSnapshot();
  const widgets = useSettings((state) => state.settings.widgets);
  const layout = useLayout();
  const wide = layout.navigation !== 'bottom';

  const enabled = React.useMemo(() => widgets.filter((widget) => widget.enabled), [widgets]);
  const name = data?.student?.firstname ?? 'Schulflow';

  const iconColor = colors.muted;
  const chipBg = colors.surface;
  const reserve = useTabNavReserve();

  const isoToday = toISO(new Date());
  // Datum vertikal gestapelt (Phase 1 · M3): Wochentag groß/fett, Datum darunter.
  const [weekdayLabel, dateLabel] = formatLongDay(isoToday).split(', ');

  // Fortschritt + Heute-Statistik für das Welcome-Banner.
  const homework = data?.homework ?? [];
  const hwDone = homework.filter((h) => h.done).length;
  const progress = homework.length ? Math.round((hwDone / homework.length) * 100) : 0;
  const openCount = homework.length - hwDone;

  const lessonsToday = (data?.lessons ?? []).filter((l) => l.date === isoToday && l.state !== 'cancelled').length;
  const nextExam = [...(data?.exams ?? [])]
    .filter((exam) => daysUntil(exam.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const examDays = nextExam ? daysUntil(nextExam.date) : null;

  const hasData = Boolean(data);
  const heroStats = [
    { value: hasData ? String(lessonsToday) : '–', label: 'Stunden heute', color: colors.accent.amber },
    { value: hasData ? String(openCount) : '–', label: 'Aufgaben offen', color: colors.accent.violet },
    { value: hasData ? (examDays == null ? '–' : String(examDays)) : '–', label: examDays == null ? 'Keine Arbeit' : examDays === 1 ? 'Tag bis Arbeit' : 'Tage bis Arbeit', color: colors.accent.lime },
  ];

  const actions = !wide ? (
    <Row className="gap-2">
      <RoundActionButton
        icon={Search}
        onPress={() => router.push('/search')}
        color="rgba(255,255,255,0.92)"
        background={tint('#FFFFFF', 0.12)}
        accessibilityLabel="Suche"
      />
      <RoundActionButton
        icon={Settings}
        onPress={() => router.push('/settings')}
        color="rgba(255,255,255,0.92)"
        background={tint('#FFFFFF', 0.12)}
        accessibilityLabel="Einstellungen"
      />
    </Row>
  ) : null;

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: wide ? 0 : 18, paddingTop: 6, paddingBottom: reserve }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.accent.amber} />}
      >
        <AdaptiveContent dashboard>
          {/* Fettes Welcome-Banner (Phase 3) */}
          <View className={wide ? 'px-1' : ''} style={wide ? { width: '100%', maxWidth: 980, alignSelf: 'center' } : undefined}>
            <WelcomeBanner
              name={name}
              weekdayLabel={weekdayLabel}
              dateLabel={dateLabel}
              progress={progress}
              hwDone={hwDone}
              hwTotal={homework.length}
              stats={heroStats}
              onOpenTasks={() => router.push('/tasks')}
              actions={actions}
            />
          </View>

          {/* Schul-/Status-Pill */}
          <View
            style={{
              backgroundColor: chipBg,
              marginTop: 14,
              marginBottom: 18,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'center',
              borderWidth: 1,
              borderColor: isDark ? colors.charcoalElevated : colors.line,
            }}
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
