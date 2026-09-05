import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeBack } from '@/ui/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  GraduationCap,
  Link2,
  MapPin,
  Palmtree,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { useSession } from '@/state/session';
import { shareIcalUrl } from '@/api/downloads';
import { tint } from '@/design/subjects';
import {
  MONTHS, WEEKDAYS_SHORT, addDays, daysUntil, formatRelativeDay, startOfWeek, toISO,
} from '@/lib/date';
import { htmlToText } from '@/lib/html';
import {
  BlockCaption,
  BlockText,
  Card,
  Chip,
  ColorBlockCard,
  EmptyState,
  IconBadge,
  Muted,
  Pill,
  Row,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Sheet,
  Title,
  useBlockInk,
} from '@/ui/primitives';
import { FadeInUp, PressableOpacity, PressableScale } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, readableInk, resolveThemeColor } from '@/design/tokens';

type Mode = 'list' | 'month';

type Entry = {
  id: string;
  date: string;
  title: string;
  time: string;
  color: string;
  kind: string;
  description?: string;
  location?: string;
  isHoliday?: boolean;
  isExam?: boolean;
};

/* ------------------------------------------------------------------ Screen */

export default function CalendarScreen() {
  const { colors, isDark } = useThemeColors();
  const dismiss = useSafeBack();
  const { data } = useSnapshot();
  const [mode, setMode] = useState<Mode>('list');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<Entry | null>(null);

  const events = data?.events ?? [];
  const exams = data?.exams ?? [];

  /** Termine + Klassenarbeiten in einer Liste — die Original-App trennt das unnötig. */
  const merged = useMemo<Entry[]>(
    () =>
      [
        ...events.map((event) => ({
          id: String(event.id),
          date: event.start.slice(0, 10),
          title: event.title,
          time: event.allDay ? 'ganztägig' : new Date(event.start).toTimeString().slice(0, 5),
          color: event.color ?? (event.isHoliday ? colors.accent.amber : colors.accent.violet),
          kind: event.isHoliday ? 'Ferien' : (event.categoryName ?? 'Termin'),
          description: event.description ?? undefined,
          location: event.location ?? undefined,
          isHoliday: Boolean(event.isHoliday),
          isExam: false,
        })),
        ...exams.map((exam) => ({
          id: `exam-${exam.id}`,
          date: exam.date,
          title: `${exam.subject}: ${exam.type ?? 'Arbeit'}`,
          time: exam.start ?? '',
          color: colors.danger,
          kind: 'Leistungsnachweis',
          description: exam.comment,
          location: undefined as string | undefined,
          isHoliday: false,
          isExam: true,
        })),
      ]
        .filter((entry) => daysUntil(entry.date) >= -7)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, exams],
  );

  const monthDate = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }, [monthOffset]);

  const grid = useMemo(() => {
    const first = startOfWeek(monthDate);
    return Array.from({ length: 42 }, (_, index) => toISO(addDays(first, index)));
  }, [monthDate]);

  // Stats für den Zeitraum.
  const upcomingCount = merged.filter((e) => daysUntil(e.date) >= 0).length;
  const holidayCount = merged.filter((e) => e.isHoliday).length;
  const examCount = merged.filter((e) => e.isExam).length;

  // Gruppierung nach Datum für die Listenansicht.
  const grouped = useMemo(() => {
    const groups = new Map<string, Entry[]>();
    for (const entry of merged) {
      const existing = groups.get(entry.date) ?? [];
      existing.push(entry);
      groups.set(entry.date, existing);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [merged]);

  const handleShareIcal = async () => {
    try {
      const { api } = useSession.getState();
      const url = await api.icalToken();
      if (url) await shareIcalUrl(url);
    } catch {
      /* Im Demo-Modus gibt es keinen echten iCal-Link */
    }
  };

  return (
    <Screen adaptive="content">
      <ScreenHeader
        title="Kalender"
        subtitle={`${upcomingCount} kommende · ${holidayCount} Ferien · ${examCount} Arbeiten`}
        action={
          <PressableOpacity
            onPress={handleShareIcal}
            className="min-h-[44px] items-center justify-center rounded-full bg-accent-violet/15 px-3.5 hover:bg-accent-violet/25"
            accessibilityRole="button"
            accessibilityLabel="iCal-Link teilen"
          >
            <Row className="gap-1">
              <Link2 size={13} strokeWidth={2.6} color={colors.accent.violet} />
              <Text className="text-[12px] font-extrabold" style={{ color: colors.accent.violet }}>iCal</Text>
            </Row>
          </PressableOpacity>
        }
      />

      <View className="px-4 pb-3">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'list', label: 'Liste' },
            { value: 'month', label: 'Monat' },
          ]}
        />
      </View>

      {mode === 'month' ? (
        <MonthView
          grid={grid}
          monthDate={monthDate}
          merged={merged}
          monthOffset={monthOffset}
          onPrev={() => setMonthOffset((v) => v - 1)}
          onNext={() => setMonthOffset((v) => v + 1)}
          onSelect={setSelected}
        />
      ) : null}

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {merged.length === 0 ? (
          <EmptyState
            illustration="no-events"
            title="Keine Termine"
            hint="Für diesen Zeitraum ist nichts eingetragen."
          />
        ) : mode === 'list' ? (
          <View className="gap-4">
            {grouped.map(([date, entries], groupIndex) => (
              <FadeInUp key={date} delay={groupIndex * 40}>
                <DateGroup date={date} entries={entries} onSelect={setSelected} isDark={isDark} />
              </FadeInUp>
            ))}
          </View>
        ) : (
          /* Im Monatsmodus: nur die Events des gewählten Monats als Liste darunter */
          <View className="gap-2.5">
            {merged
              .filter((e) => {
                const d = new Date(e.date);
                return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
              })
              .map((entry, index) => (
                <FadeInUp key={entry.id} delay={index * 25}>
                  <EventCard entry={entry} onSelect={setSelected} isDark={isDark} />
                </FadeInUp>
              ))}
          </View>
        )}
      </ScrollView>

      <EventSheet entry={selected} isDark={isDark} onClose={() => setSelected(null)} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ Monatsansicht */

function MonthView({
  grid,
  monthDate,
  merged,
  monthOffset,
  onPrev,
  onNext,
  onSelect,
}: {
  grid: string[];
  monthDate: Date;
  merged: Entry[];
  monthOffset: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (entry: Entry) => void;
}) {
  const { colors } = useThemeColors();
  const todayISO = toISO(new Date());

  return (
    <View className="px-4">
      <Row className="justify-between pb-3">
        <PressableScale
          onPress={onPrev}
          scale={0.9}
          className="h-10 w-10 items-center justify-center rounded-full bg-line/50"
          accessibilityRole="button"
          accessibilityLabel="Vorheriger Monat"
        >
          <ChevronLeft color={colors.ink} size={20} />
        </PressableScale>
        <Text className="self-center text-[17px] font-extrabold tracking-[-0.2px] text-ink">
          {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
        </Text>
        <PressableScale
          onPress={onNext}
          scale={0.9}
          className="h-10 w-10 items-center justify-center rounded-full bg-line/50"
          accessibilityRole="button"
          accessibilityLabel="Nächster Monat"
        >
          <ChevronRight color={colors.ink} size={20} />
        </PressableScale>
      </Row>

      {/* Wochentage-Header */}
      <Row className="pb-1">
        {WEEKDAYS_SHORT.map((day) => (
          <Text
            key={day}
            className="flex-1 text-center text-[10px] font-extrabold uppercase tracking-wide text-faint"
          >
            {day}
          </Text>
        ))}
      </Row>

      {/* Kalender-Raster */}
      <View className="flex-row flex-wrap">
        {grid.map((iso) => {
          const dayEvents = merged.filter((entry) => entry.date === iso);
          const inMonth = new Date(iso).getMonth() === monthDate.getMonth();
          const isToday = iso === todayISO;
          const hasEvents = dayEvents.length > 0;
          return (
            <PressableOpacity
              key={iso}
              onPress={() => dayEvents[0] && onSelect(dayEvents[0])}
              style={{ width: `${100 / 7}%` }}
              className="aspect-square items-center justify-center p-0.5"
            >
              <View
                className={`h-full w-full items-center justify-center rounded-[14px] ${
                  isToday
                    ? 'bg-accent-amber'
                    : hasEvents
                      ? 'bg-line/40'
                      : ''
                }`}
              >
                <Text
                  className={`text-[12px] font-bold ${
                    isToday
                      ? 'text-on-amber'
                      : inMonth
                        ? 'text-ink'
                        : 'text-faint/50'
                  }`}
                >
                  {new Date(iso).getDate()}
                </Text>
                {hasEvents ? (
                  <Row className="mt-0.5 gap-0.5">
                    {dayEvents.slice(0, 3).map((entry) => (
                      <View
                        key={entry.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: isToday ? colors.on.amber : entry.color,
                        }}
                      />
                    ))}
                  </Row>
                ) : null}
              </View>
            </PressableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ Datumsgruppe */

function DateGroup({
  date,
  entries,
  onSelect,
  isDark,
}: {
  date: string;
  entries: Entry[];
  onSelect: (entry: Entry) => void;
  isDark: boolean;
}) {
  const { colors } = useThemeColors();
  const d = new Date(date);
  const isToday = date === toISO(new Date());
  const isPast = daysUntil(date) < 0;

  return (
    <View>
      {/* Datums-Header */}
      <Row className="mb-2 gap-2.5">
        <View
          className="items-center justify-center rounded-[14px] px-3 py-1.5"
          style={{
            backgroundColor: isToday ? colors.accent.amber : tint(colors.charcoal, 0.08),
          }}
        >
          <Text
            className="text-[10px] font-extrabold uppercase tracking-wide"
            style={{ color: isToday ? colors.on.amber : colors.muted }}
          >
            {MONTHS[d.getMonth()].slice(0, 3)}
          </Text>
          <Text
            className="text-[22px] font-extrabold leading-[24px]"
            style={{ color: isToday ? colors.on.amber : colors.ink }}
          >
            {d.getDate()}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-[15px] font-extrabold tracking-[-0.2px] text-ink">
            {isToday ? 'Heute' : formatRelativeDay(date)}
          </Text>
          <Muted className="text-[12px]">
            {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'}
          </Muted>
        </View>
      </Row>

      {/* Event-Karten */}
      <View className="gap-2">
        {entries.map((entry) => (
          <EventCard key={entry.id} entry={entry} onSelect={onSelect} isDark={isDark} />
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ Event-Karte */

function EventCard({
  entry,
  onSelect,
  isDark,
}: {
  entry: Entry;
  onSelect: (entry: Entry) => void;
  isDark: boolean;
}) {
  const { colors } = useThemeColors();
  // Akzentfarbe der Karte als AA-sichere Pill-Farbe — NICHT mehr #000 auf
  // Vollfarbe (Phase-17-Bugfix: schwarze Pills auf dunklen Blöcken). Der Hook
  // reicht hier nicht, weil der Context erst *innerhalb* der Karte lebt.
  const accentInk = readableInk(resolveThemeColor(entry.color, isDark), isDark);
  const resolved = resolveThemeColor(entry.color, isDark);
  const isPast = daysUntil(entry.date) < 0;

  const icon: LucideIcon = entry.isExam
    ? GraduationCap
    : entry.isHoliday
      ? Palmtree
      : entry.kind === 'Termin'
        ? Sparkles
        : CalendarDays;

  return (
    <ColorBlockCard
      color={entry.color}
      onPress={() => onSelect(entry)}
      dim={isPast}
      radius={24}
      style={{ padding: 14 }}
    >
      <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
        <EventIconBadge icon={icon} />
        <View className="min-w-0 flex-1">
          <BlockText
            className="text-[15px] font-bold leading-[19px] tracking-[-0.2px]"
            numberOfLines={2}
          >
            {entry.title}
          </BlockText>
          <Row className="mt-1.5 flex-wrap items-center gap-1.5">
            {entry.time ? (
              <Pill label={entry.time} color={accentInk} tone="tint" icon={Clock} />
            ) : null}
            {entry.location ? (
              <Pill label={entry.location} color={accentInk} tone="tint" icon={MapPin} />
            ) : null}
            <Pill label={entry.kind} color={accentInk} tone="tint" />
          </Row>
        </View>
      </Row>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Icon-Badge im Block */

function EventIconBadge({ icon }: { icon: LucideIcon }) {
  const ink = useBlockInk();
  return <IconBadge icon={icon} color={ink} size="md" tone="tint" />;
}

/* ------------------------------------------------------------------ Detail-Sheet */

function EventSheet({
  entry,
  isDark,
  onClose,
}: {
  entry: Entry | null;
  isDark: boolean;
  onClose: () => void;
}) {
  const { colors } = useThemeColors();

  const icon: LucideIcon = entry?.isExam
    ? GraduationCap
    : entry?.isHoliday
      ? Palmtree
      : CalendarDays;

  return (
    <Sheet open={Boolean(entry)} onClose={onClose} title={entry?.title}>
      {entry ? (
        <View className="gap-3">
          {/* Kopf als Akzentkarte (neutral + Streifen in Eventfarbe) */}
          <ColorBlockCard color={entry.color} style={{ padding: 16 }}>
            <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
              <SheetIconBadge icon={icon} />
              <View className="min-w-0 flex-1">
                <BlockText className="text-[19px] font-bold leading-[24px] tracking-[-0.3px]" numberOfLines={2}>
                  {entry.title}
                </BlockText>
                <BlockCaption className="mt-1 text-[13px] font-semibold">
                  {formatRelativeDay(entry.date)}
                  {entry.time ? ` · ${entry.time}` : ''}
                </BlockCaption>
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  <SheetAccentPill label={entry.kind} />
                  {entry.location ? (
                    <SheetAccentPill label={entry.location} icon={MapPin} />
                  ) : null}
                </View>
              </View>
            </Row>
          </ColorBlockCard>

          {/* Beschreibung */}
          {entry.description ? (
            <View className="gap-2 rounded-[24px] bg-line/50 p-4">
              <Text className="text-[13px] font-extrabold text-ink">Beschreibung</Text>
              <Muted className="text-[13px] leading-5">{htmlToText(entry.description)}</Muted>
            </View>
          ) : (
            <Muted className="text-center text-[13px]">Keine weiteren Angaben.</Muted>
          )}
        </View>
      ) : null}
    </Sheet>
  );
}

/** Icon-Kreis im Sheet-Kopf — IconBadge liefert bereits die passende Form. */
function SheetIconBadge({ icon }: { icon: LucideIcon }) {
  const ink = useBlockInk();
  return <IconBadge icon={icon} color={ink} size="lg" tone="tint" className="mt-0.5" />;
}

/** Pill im Sheet-Kopf in der AA-sichere Akzentfarbe der Eventkarte. */
function SheetAccentPill({ label, icon }: { label: string; icon?: LucideIcon }) {
  const ink = useBlockInk();
  return <Pill label={label} color={ink} tone="tint" icon={icon} />;
}
