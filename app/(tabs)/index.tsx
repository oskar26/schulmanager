import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutGrid, Search, Settings } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { WIDGET_COMPONENTS, WIDGET_SPANS, type WidgetKey } from '@/features/dashboard/widgets';
import { daysUntil, formatLongDay, formatTimeAgo, greeting, toISO } from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import { Avatar } from '@/ui/gluestack/feedback';
import {
  AdaptiveContent,
  Pill,
  RoundActionButton,
  Row,
  Screen,
  ScreenHeader,
  Skeleton,
  StatCard,
} from '@/ui/primitives';
import { FadeInUp, PressableOpacity, PressableScale } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';
import { radius, shadow } from '@/design/tokens';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { useSettings } from '@/state/settings';

/** Raster-Konstanten des Dashboards (docs/playful-modern.md §3.2). */
const GRID_COLUMNS = 12;
const GRID_GAP = 20;
const GRID_MAX_WIDTH = 1400;

/**
 * Hero-Banner (Span 12): tiefdunkles Slate-Blau mit dezenten Licht-Blobs
 * statt eines isolierten schwarzen Kastens. Begrüßung links, die drei
 * Kennzahlen als gläserne Pillen rechts (auf dem Phone darunter).
 */
function WelcomeBanner({
  name,
  weekdayLabel,
  dateLabel,
  progress,
  hwDone,
  hwTotal,
  stats,
  stacked,
  onOpenTasks,
}: {
  name: string;
  weekdayLabel: string;
  dateLabel: string;
  progress: number;
  hwDone: number;
  hwTotal: number;
  stats: { value: string; label: string }[];
  stacked: boolean;
  onOpenTasks: () => void;
}) {
  const { colors } = useThemeColors();
  const hasHomework = hwTotal > 0;
  const whiteDim = 'rgba(255,255,255,0.62)';

  return (
    <View
      style={{
        overflow: 'hidden',
        borderRadius: radius.lg,
        backgroundColor: colors.charcoal,
        ...shadow.float,
      }}
    >
      {/* Dezenter „Gradient“ aus zwei Licht-Blobs (ohne native Gradient-Abhängigkeit). */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -120,
          right: -60,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: 'rgba(99,102,241,0.22)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -140,
          left: '30%',
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: 'rgba(30,41,59,0.9)',
        }}
      />

      <View style={{ padding: 24, gap: 20, flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center' }}>
        <View style={{ flex: 1, minWidth: 0, gap: 14 }}>
          <Row className="gap-3">
            <Avatar name={name} size={46} color={colors.accent.amber} />
            <View className="min-w-0 flex-1 justify-center">
              <Text className="text-[11px] font-extrabold uppercase tracking-[1.6px]" style={{ color: whiteDim }} numberOfLines={1}>
                {weekdayLabel} · {dateLabel}
              </Text>
              <Text
                className="text-[26px] font-extrabold leading-[31px] tracking-[-0.6px] text-white"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {greeting()}, {name} 👋
              </Text>
            </View>
          </Row>

          {hasHomework ? (
            <View style={{ gap: 8 }}>
              <View className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)', maxWidth: 420 }}>
                <View className="h-full rounded-full" style={{ backgroundColor: colors.accent.amber, width: `${Math.max(2, progress)}%` }} />
              </View>
              <Row className="gap-3" style={{ maxWidth: 420 }}>
                <Text className="flex-1 text-[12.5px] font-semibold" style={{ color: whiteDim }} numberOfLines={1}>
                  {hwDone} von {hwTotal} Hausaufgaben erledigt · {progress}%
                </Text>
                <PressableOpacity onPress={onOpenTasks} hitSlop={12} accessibilityRole="link">
                  <Text className="text-[12.5px] font-extrabold text-white">Alle ansehen</Text>
                </PressableOpacity>
              </Row>
            </View>
          ) : (
            <Text className="text-[13px] font-semibold" style={{ color: whiteDim }}>
              Keine Hausaufgaben offen — alles frei.
            </Text>
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            justifyContent: stacked ? 'flex-start' : 'flex-end',
            flexShrink: 0,
          }}
        >
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              caption={stat.label}
              glass
              className={stacked ? 'flex-1' : ''}
              style={{ minWidth: stacked ? 0 : 118 }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/** Schul-/Datenstatus als schmale Zeile unter dem Hero — bündig zum Grid. */
function SchoolStatusLine({
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
    <Row className="gap-2 px-1">
      <Text className="flex-shrink text-[12.5px] font-semibold text-muted" numberOfLines={1}>
        {name}{className ? ` · Klasse ${className}` : ''}
      </Text>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.faint }} />
      {isDemo ? (
        <Pill label="DEMO" color={colors.accent.amber} tone="tint" className="px-2 py-0.5" />
      ) : (
        <Text className="text-[12px] font-medium text-faint" numberOfLines={1}>{formatTimeAgo(fetchedAt)}</Text>
      )}
    </Row>
  );
}

/** Kompakter, gestrichelter Action-Slot: „Dashboard anpassen“. */
function CustomizeSlot({ onPress, compact }: { onPress: () => void; compact: boolean }) {
  const { colors } = useThemeColors();
  return (
    <PressableScale
      onPress={onPress}
      scale={0.98}
      hoverScale={1.01}
      accessibilityRole="button"
      accessibilityLabel="Dashboard anpassen"
      style={{ borderRadius: radius.lg, flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          minHeight: compact ? 64 : 120,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.line,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: compact ? 'row' : 'column',
          gap: compact ? 10 : 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' }}>
          <LayoutGrid size={18} strokeWidth={2.2} color={colors.muted} />
        </View>
        <Text className="text-[13px] font-bold text-muted" numberOfLines={1}>Dashboard anpassen</Text>
      </View>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Bento-Packer */

type GridItem = { key: string; span: number; node: React.ReactNode };

/**
 * Packt Widgets in 12er-Zeilen. Passt ein Widget nicht mehr in die laufende
 * Zeile, wird die Zeile aufgefüllt (der letzte Eintrag wächst) — so bleiben
 * keine Leerflächen rechts. Die letzte Zeile bleibt ungefüllt, damit der
 * Aufrufer den Rest (z. B. mit dem Anpassen-Slot) belegen kann.
 */
function packRows(items: GridItem[], columns: 1 | 2 | 3): { rows: GridItem[][]; free: number } {
  const normalise = (span: number) => (columns === 1 ? 12 : columns === 2 ? (span >= 6 ? 12 : 6) : span);
  const rows: GridItem[][] = [];
  let current: GridItem[] = [];
  let used = 0;

  const flush = (fill: boolean) => {
    if (current.length === 0) return;
    const remaining = GRID_COLUMNS - used;
    if (fill && remaining > 0) {
      const last = current[current.length - 1];
      current[current.length - 1] = { ...last, span: last.span + remaining };
    }
    rows.push(current);
    current = [];
    used = 0;
  };

  const queue = items.map((item) => ({ ...item, span: normalise(item.span) }));
  while (queue.length > 0) {
    const free = GRID_COLUMNS - used;
    // Passt das nächste Widget nicht mehr, ziehen wir das erste spätere vor,
    // das noch in die Lücke passt (Look-ahead) — erst dann wird aufgefüllt.
    let index = queue.findIndex((item) => item.span <= free);
    if (index === -1) {
      flush(true);
      index = 0;
    }
    const [item] = queue.splice(index, 1);
    current.push(item);
    used += item.span;
    if (used === GRID_COLUMNS) flush(false);
  }
  const free = current.length > 0 ? GRID_COLUMNS - used : 0;
  flush(false);
  return { rows, free };
}

function BentoGrid12({ rows, width, gap }: { rows: GridItem[][]; width: number; gap: number }) {
  const colWidth = (width - gap * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  let index = 0;
  return (
    <View style={{ gap }}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={{ flexDirection: 'row', gap, alignItems: 'stretch' }}>
          {row.map((item) => {
            const itemWidth = item.span * colWidth + (item.span - 1) * gap;
            const delay = Math.min(index, 10) * 45;
            index += 1;
            return (
              <FadeInUp key={item.key} delay={delay} style={{ width: itemWidth, flexShrink: 0 }}>
                <View style={{ flex: 1 }}>{item.node}</View>
              </FadeInUp>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ Screen */

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { data, isLoading, refetch, isRefetching, isDemo } = useSnapshot();
  const widgets = useSettings((state) => state.settings.widgets);
  const layout = useLayout();
  const enabled = React.useMemo(() => widgets.filter((widget) => widget.enabled), [widgets]);
  const name = data?.student?.firstname ?? 'Schulflow';
  const reserve = useTabNavReserve();
  const [gridWidth, setGridWidth] = useState(0);

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
    { value: hasData ? String(lessonsToday) : '–', label: 'Std heute' },
    { value: hasData ? String(openCount) : '–', label: 'Offen' },
    {
      value: hasData ? (examDays == null ? '–' : String(examDays)) : '–',
      label: examDays == null ? 'Keine Arbeit' : examDays === 1 ? 'Tag b. Arbeit' : 'Tage b. Arbeit',
    },
  ];

  const headerActions = (
    <Row className="gap-2">
      <RoundActionButton icon={Search} onPress={() => router.push('/search')} color={colors.ink} background={colors.surface} accessibilityLabel="Suche" />
      <RoundActionButton icon={Settings} onPress={() => router.push('/settings')} color={colors.ink} background={colors.surface} accessibilityLabel="Einstellungen" />
    </Row>
  );

  const gap = layout.isPhone ? 14 : GRID_GAP;
  const onGridLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== gridWidth) setGridWidth(next);
  };
  // Bis `onLayout` gemeldet hat (bzw. falls es nie feuert), rechnen wir die
  // Rasterbreite aus Fensterbreite, Navigation und Gutters — nie ein leeres Grid.
  const estimatedWidth = Math.max(
    280,
    Math.min(
      GRID_MAX_WIDTH,
      Math.min(layout.width - layout.navigationWidth, layout.isPhone ? layout.width : layout.dashboardMaxWidth) -
        (layout.isPhone ? 0 : layout.gutter * 2) -
        32,
    ),
  );
  const effectiveWidth = gridWidth > 0 ? gridWidth : estimatedWidth;

  const gridItems: GridItem[] = data
    ? enabled.flatMap((widget) => {
        const Component = WIDGET_COMPONENTS[widget.id as WidgetKey];
        if (!Component) return [];
        return [{ key: widget.id, span: WIDGET_SPANS[widget.id as WidgetKey] ?? 4, node: <Component snapshot={data} /> }];
      })
    : [];

  // Anpassen-Slot: füllt den Rest der letzten Zeile (≥ 3 Spalten), sonst
  // eine kompakte eigene Zeile. Nie mehr eine riesige Vollton-Karte.
  const { rows, free } = packRows(gridItems, layout.columns);
  const lastRow = rows[rows.length - 1];
  if (layout.columns > 1 && lastRow && free >= 3) {
    lastRow.push({ key: 'customize', span: free, node: <CustomizeSlot onPress={() => router.push('/settings/widgets')} compact={false} /> });
  } else {
    if (lastRow && free > 0) {
      const last = lastRow[lastRow.length - 1];
      lastRow[lastRow.length - 1] = { ...last, span: last.span + free };
    }
    rows.push([{ key: 'customize', span: GRID_COLUMNS, node: <CustomizeSlot onPress={() => router.push('/settings/widgets')} compact /> }]);
  }

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
          {/* Ein Container für Hero + Grid: gleiche Kante links/rechts, max 1400. */}
          <View style={{ width: '100%', maxWidth: GRID_MAX_WIDTH, alignSelf: 'center', gap }} onLayout={onGridLayout}>
            <WelcomeBanner
              name={name}
              weekdayLabel={weekdayLabel}
              dateLabel={dateLabel}
              progress={progress}
              hwDone={hwDone}
              hwTotal={homework.length}
              stats={heroStats}
              stacked={layout.isPhone}
              onOpenTasks={() => router.navigate('/tasks')}
            />

            <SchoolStatusLine
              name={data?.institution?.name ?? 'Schule'}
              className={data?.student?.className}
              isDemo={isDemo}
              fetchedAt={data?.fetchedAt}
            />

            {isLoading || !data ? (
              <View style={{ gap }}>
                <Skeleton className="h-40" />
                <Skeleton className="h-48" />
                <Skeleton className="h-56" />
              </View>
            ) : (
              <BentoGrid12 rows={rows} width={effectiveWidth} gap={gap} />
            )}
          </View>
        </ScrollView>
      </AdaptiveContent>
    </Screen>
  );
}
