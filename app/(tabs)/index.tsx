import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Search, Settings } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { WIDGET_COMPONENTS } from '@/features/dashboard/widgets';
import { daysUntil, formatLongDay, formatTimeAgo, greeting, toISO } from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import { Avatar } from '@/ui/gluestack/feedback';
import {
  AdaptiveContent,
  ColorBlockCard,
  IconBadge,
  Pill,
  RoundActionButton,
  Row,
  Screen,
  ScreenHeader,
  StatCard,
  useBlockInk,
} from '@/ui/primitives';
import { FadeInUp, PressableOpacity } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';
import { radius, shadow } from '@/design/tokens';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { useSettings } from '@/state/settings';

/**
 * Charcoal-Hero: Begrüßung, Fortschritt und die drei großen Heute-Zahlen.
 * Die Stats sind echte StatCards, damit auch die Startseite dem verbindlichen
 * „Zahl + kleine Caption“-Muster folgt.
 */
function WelcomeBanner({
  name,
  weekdayLabel,
  dateLabel,
  progress,
  hwDone,
  hwTotal,
  stats,
  onOpenTasks,
}: {
  name: string;
  weekdayLabel: string;
  dateLabel: string;
  progress: number;
  hwDone: number;
  hwTotal: number;
  stats: { value: string; label: string; color: string }[];
  onOpenTasks: () => void;
}) {
  const { colors } = useThemeColors();
  const hasHomework = hwTotal > 0;
  // AA (Phase 17): 58 % Weiß auf Charcoal erreichte nur ~4,3:1 — 74 % hält
  // komfortabel über 4,5:1 und bleibt dabei sekundär.
  const whiteDim = 'rgba(255,255,255,0.74)';

  return (
    <View className="overflow-hidden rounded-[32px]" style={{ backgroundColor: colors.charcoal, ...shadow.float }}>
      <View className="gap-4 px-5 pb-5 pt-5">
        <Row>
          <Row className="flex-1 gap-3">
            <Avatar name={name} size={48} color={colors.accent.amber} />
            <View className="min-w-0 flex-1 justify-center">
              <Text className="text-[10px] font-extrabold uppercase tracking-[1.8px]" style={{ color: whiteDim }}>
                {greeting()}
              </Text>
              <Text
                className="text-[24px] font-extrabold leading-[27px] tracking-tight"
                style={{ color: colors.on.charcoal }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {name}
              </Text>
            </View>
          </Row>
        </Row>

        <Row className="items-end justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] font-extrabold uppercase tracking-[1.8px]" style={{ color: colors.accent.amber }}>
              {weekdayLabel}
            </Text>
            <Text className="mt-0.5 text-[22px] font-extrabold tracking-tight" style={{ color: colors.on.charcoal }}>
              {dateLabel}
            </Text>
          </View>
          {hasHomework ? (
            <View className="items-end">
              <Text className="text-[34px] font-extrabold leading-[36px] tracking-tight" style={{ color: colors.accent.amber }}>
                {progress}%
              </Text>
              <Text className="text-[10px] font-extrabold uppercase tracking-[1.2px]" style={{ color: whiteDim }}>
                erledigt
              </Text>
            </View>
          ) : null}
        </Row>

        {hasHomework ? (
          <>
            {/* Fortschritt: Bei 0 % bleibt nur der Track sichtbar — keine
                Mini-Füllung mehr, die wie ein Lade-Fehler wirkte. */}
            <View className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}>
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.accent.amber,
                  width: `${progress}%`,
                  opacity: progress <= 0 ? 0 : 1,
                }}
              />
            </View>
            <Row className="justify-between gap-3">
              <Text className="flex-1 text-[12px] font-semibold" style={{ color: whiteDim }}>
                {hwDone} von {hwTotal} Hausaufgaben erledigt
              </Text>
              <PressableOpacity onPress={onOpenTasks} hitSlop={12} accessibilityRole="link">
                <Text className="text-[12px] font-extrabold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Alle ansehen
                </Text>
              </PressableOpacity>
            </Row>
          </>
        ) : (
          <Text className="text-[12px] font-semibold" style={{ color: whiteDim }}>
            Keine Hausaufgaben offen — alles frei.
          </Text>
        )}

        <Row className="mt-0.5 gap-2.5">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              caption={stat.label}
              block={stat.color}
              className="flex-1"
              style={{ minWidth: 0 }}
            />
          ))}
        </Row>
      </View>
    </View>
  );
}

/** Randlose Schul-/Datenstatus-Pill unter dem Hero. */
function SchoolStatusPill({
  name,
  className,
  isDemo,
  fetchedAt,
}: {
  name: string;
  className?: string | null;
  isDemo: boolean;
  fetchedAt?: string;
}) {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 7,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'center',
        maxWidth: '100%',
        ...shadow.card,
      }}
    >
      <Text className="flex-shrink text-[12px] font-semibold text-ink" numberOfLines={1}>
        {name}{className ? ` · Klasse ${className}` : ''}
      </Text>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
      {isDemo ? (
        <Pill label="DEMO" color={colors.accent.amber} tone="solid" />
      ) : (
        <Text className="text-[11px] font-medium text-muted" numberOfLines={1}>{formatTimeAgo(fetchedAt)}</Text>
      )}
    </View>
  );
}

/** Farbige Platzhalter, solange der erste Snapshot noch eintrifft. */
function DashboardSkeleton({ color, height }: { color: string; height: number }) {
  return (
    <ColorBlockCard color={color} dim style={{ height }}>
      <DashboardSkeletonLines />
    </ColorBlockCard>
  );
}

function DashboardSkeletonLines() {
  const ink = useBlockInk();
  return (
    <View className="gap-3">
      <View style={{ width: '42%', height: 14, borderRadius: 8, backgroundColor: `${ink}38` }} />
      <View style={{ width: '78%', height: 28, borderRadius: 12, backgroundColor: `${ink}24` }} />
      <View style={{ width: '60%', height: 12, borderRadius: 8, backgroundColor: `${ink}1F` }} />
    </View>
  );
}


/** Zellenstil des Dashboard-Rasters: gleichbreit, schrumpfbar, volle Zeilenhöhe. */
const cellStyle = { flex: 1, minWidth: 0 } as const;

/**
 * Raster-Wrapper (Phase 17): teilt die Zellen in Zeilen fester Spaltenzahl.
 * Alle Spalten einer Zeile sind gleich breit und equally hoch (alignItems:
 * stretch ist Yoga-Default); unvollständige letzte Zeilen bekommen unsichtbare
 * Füller, damit die Kartenreihe bündig mit dem Rest abschließt.
 */
function DashboardGrid({
  columns,
  children,
}: {
  columns: 1 | 2 | 3;
  children: React.ReactNode[];
}) {
  const cells = React.Children.toArray(children).filter(Boolean);
  const rows: React.ReactNode[][] = [];
  for (let index = 0; index < cells.length; index += columns) {
    rows.push(cells.slice(index, index + columns));
  }
  return (
    <View style={{ gap: 16 }}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={{ flexDirection: 'row', gap: 16 }}>
          {row.map((cell, cellIndex) => (
            <View key={`cell-${rowIndex}-${cellIndex}`} style={{ flex: 1, minWidth: 0 }}>
              {cell}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, padIndex) => (
            <View key={`pad-${rowIndex}-${padIndex}`} style={{ flex: 1 }} pointerEvents="none" />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Kompakte „Dashboard anpassen“-Karte (Phase 17): statt einer riesigen Kachel
 * eine schlanke Listenkarte (eine Zeile, Icon + Titel + Hinweis + Chevron) —
    der Informationsgehalt rechtfertigt keine große Fläche.
 */
function CustomizeCard({ onPress }: { onPress: () => void }) {
  const { colors } = useThemeColors();
  return (
    <PressableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Dashboard anpassen"
      className="hover:bg-line/30 active:bg-line/50"
      style={{
        borderRadius: radius.cardSm,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        ...shadow.card,
      }}
    >
      <IconBadge icon={Settings} color={colors.accent.amber} size="md" tone="tint" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
          Dashboard anpassen
        </Text>
        <Text className="text-[12px] text-muted" numberOfLines={1}>
          Karten ein- und ausblenden, Reihenfolge ändern
        </Text>
      </View>
      <ChevronRight size={18} strokeWidth={2.2} color={colors.faint} />
    </PressableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { data, isLoading, refetch, isRefetching, isDemo } = useSnapshot();
  const widgets = useSettings((state) => state.settings.widgets);
  const layout = useLayout();
  const enabled = React.useMemo(() => widgets.filter((widget) => widget.enabled), [widgets]);
  const name = data?.student?.firstname ?? 'Schulflow';
  const reserve = useTabNavReserve();

  const isoToday = toISO(new Date());
  const [weekdayLabel, dateLabel] = formatLongDay(isoToday).split(', ');
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
    { value: hasData ? String(lessonsToday) : '–', label: 'Stunden heute', color: colors.blocks.amber },
    { value: hasData ? String(openCount) : '–', label: 'Aufgaben offen', color: colors.blocks.violet },
    {
      value: hasData ? (examDays == null ? '–' : String(examDays)) : '–',
      label: examDays == null ? 'Keine Arbeit' : examDays === 1 ? 'Tag bis Arbeit' : 'Tage bis Arbeit',
      color: colors.blocks.lime,
    },
  ];

  const headerActions = (
    <Row className="gap-2">
      <RoundActionButton
        icon={Search}
        onPress={() => router.push('/search')}
        color={colors.ink}
        background={colors.surface}
        accessibilityLabel="Suche"
      />
      <RoundActionButton
        icon={Settings}
        onPress={() => router.push('/settings')}
        color={colors.ink}
        background={colors.surface}
        accessibilityLabel="Einstellungen"
      />
    </Row>
  );

  return (
    <Screen>
      <AdaptiveContent dashboard className="flex-1">
        <ScreenHeader title="Start" action={headerActions} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: reserve }}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.accent.amber}
              colors={[colors.accent.amber]}
              progressBackgroundColor={colors.surface}
            />
          )}
        >
          <View style={{ width: '100%' }}>
            <WelcomeBanner
              name={name}
              weekdayLabel={weekdayLabel}
              dateLabel={dateLabel}
              progress={progress}
              hwDone={hwDone}
              hwTotal={homework.length}
              stats={heroStats}
              onOpenTasks={() => router.navigate('/tasks')}
            />
          </View>

          <View className="my-4">
            <SchoolStatusPill
              name={data?.institution?.name ?? 'Schule'}
              className={data?.student?.className}
              isDemo={isDemo}
              fetchedAt={data?.fetchedAt}
            />
          </View>

          {isLoading || !data ? (
            <View className="gap-4">
              <DashboardSkeleton color={colors.blocks.sky} height={164} />
              <DashboardSkeleton color={colors.blocks.lavender} height={192} />
              <DashboardSkeleton color={colors.blocks.mint} height={224} />
            </View>
          ) : (
            /* Phase 17: Echtes Raster statt flex-wrap-Masonry — Zeilen mit
               fester Spaltenzahl (layout.columns), gleichbreite Spalten (flex: 1)
               und ein fester Gap von 16 px. Die letzte Zeile wird mit unsichtbaren
               Platzhaltern aufgefüllt, damit Karten immer bündig abschließen und
               keine schwimmenden Breiten entstehen. */
            <DashboardGrid columns={layout.columns}>
              {enabled.map((widget, index) => {
                const Component = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS];
                if (!Component) return null;
                return (
                  <FadeInUp key={widget.id} delay={Math.min(index, 10) * 45} style={cellStyle}>
                    <View className="h-full w-full"><Component snapshot={data} /></View>
                  </FadeInUp>
                );
              })}
              <FadeInUp delay={Math.min(enabled.length, 10) * 45} style={cellStyle}>
                <CustomizeCard onPress={() => router.push('/settings')} />
              </FadeInUp>
            </DashboardGrid>
          )}
        </ScrollView>
      </AdaptiveContent>
    </Screen>
  );
}
