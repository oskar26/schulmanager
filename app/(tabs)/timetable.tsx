import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  AlertTriangle,
  Ban,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MoveRight,
  UserCheck,
  type LucideIcon,
} from 'lucide-react-native';

import type { Lesson } from '@/api/types';
import { useSnapshot } from '@/data/queries';
import { subjectColor, subjectIcon } from '@/design/subjects';
import {
  WEEKDAYS_SHORT, addDays, formatLongDay, minutesOf, nowMinutes, startOfWeek, toISO,
} from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import {
  AdaptiveContent, BlockCaption, BlockText, Chip, ColorBlockCard, EmptyState,
  IconBadge, Muted, Pill, Row, Screen, ScreenHeader, SegmentedControl, Sheet,
  Skeleton, useBlockInk,
} from '@/ui/primitives';
import { FadeInUp, LivePulse, PressableOpacity, PressableScale } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { TimetableWeekGrid } from '@/ui/timetable-week-grid';

/**
 * Phase 15 · Stundenplan — Listen- ↔ Kalenderansicht.
 *
 * Umschaltbar zwischen der Listenansicht aus Phase 4 (zwei Wochen-Streifen +
 * Tagesliste) und einer neuen Kalenderansicht (Wochenraster mit Zeitachse).
 * Die gewählte Ansicht wird über `settings.timetableMode` persistiert.
 */

/* Solange die App läuft, merkt sie sich den gewählten Tag — ein Tab-Wechsel
 * oder Zurückkehren aus dem Hintergrund setzt die Auswahl nicht mehr zurück.
 * (Nur solange der Tag in den zwei sichtbaren Wochen liegt.) */
let lastSelectedDay: string | null = null;

/* ------------------------------------------------------------------ Status-Ampel */

/** Farbpunkt-Regel für die Tages-Pillen (Entscheidungs-Log #6, Phase 4 final):
 *  · grün  = Vertretung  ·  coral = Entfall einzelner Stunden
 *  · grau  = kompletter Ausfall-Tag (alle eingetragenen Stunden entfallen). */
type DayDot = 'substitution' | 'cancelled' | 'off';

function dayDots(lessons: Lesson[]): DayDot[] {
  if (lessons.length === 0) return [];
  const substitutions = lessons.some((lesson) => lesson.state === 'substitution');
  const cancelled = lessons.some((lesson) => lesson.state === 'cancelled');
  const allCancelled = lessons.every((lesson) => lesson.state === 'cancelled');
  const dots: DayDot[] = [];
  if (cancelled && !allCancelled) dots.push('cancelled');
  if (substitutions) dots.push('substitution');
  if (allCancelled && dots.length === 0) dots.push('off');
  return dots;
}

/** Anzeige-Fach einer Stunde: Vertretungen mit Platzhalter-Fach zeigen das
 *  eigentlich geplante Fach; der Zustand steht im Badge. */
function lessonMainSubject(lesson: Lesson): string {
  if (lesson.state === 'cancelled') return lesson.originalSubject ?? lesson.subject;
  if (lesson.state === 'substitution' && lesson.subject !== lesson.originalSubject) {
    return lesson.originalSubject ?? lesson.subject;
  }
  return lesson.subject;
}

const DOT_COLOR: Record<DayDot, (colors: ReturnType<typeof useThemeColors>['colors']) => string> = {
  substitution: (colors) => colors.success,
  cancelled: (colors) => colors.priority.urgent,
  off: (colors) => colors.faint,
};

/* ------------------------------------------------------------------ Screen */

export default function TimetableScreen() {
  const { colors, isDark } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const showWeekend = useSettings((state) => state.settings.showWeekend);
  const compact = useSettings((state) => state.settings.compactTimetable);
  const timetableMode = useSettings((state) => state.settings.timetableMode);
  const { update } = useSettings();
  const layout = useLayout();
  const wide = layout.navigation !== 'bottom';

  const [selectedDay, setSelectedDay] = useState<string | null>(() => lastSelectedDay);
  const [detail, setDetail] = useState<Lesson | null>(null);
  // Kalenderansicht: weekOffset relativ zur aktuellen Woche (0 = diese Woche).
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);

  // Zwei feste Wochen ab dem Montag der aktuellen Woche — für die Listenansicht.
  const weeks = useMemo(() => {
    const monday = startOfWeek(new Date());
    const length = showWeekend ? 7 : 5;
    const make = (offset: number, label: string) => ({
      key: label,
      label,
      days: Array.from({ length }, (_, index) => toISO(addDays(monday, offset * 7 + index))),
    });
    return [make(0, 'Diese Woche'), make(1, 'Nächste Woche')];
  }, [showWeekend]);

  // Kalenderansicht: eine Woche mit weekOffset.
  const calendarWeek = useMemo(() => {
    const monday = startOfWeek(addDays(new Date(), calendarWeekOffset * 7));
    const length = showWeekend ? 7 : 5;
    return {
      days: Array.from({ length }, (_, index) => toISO(addDays(monday, index))),
      monday,
    };
  }, [calendarWeekOffset, showWeekend]);

  const allDays = useMemo(() => weeks.flatMap((week) => week.days), [weeks]);
  const todayISO = toISO(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    allDays.forEach((day) => map.set(day, []));
    calendarWeek.days.forEach((day) => map.set(day, []));
    (data?.lessons ?? []).forEach((lesson) => {
      if (map.has(lesson.date)) map.get(lesson.date)!.push(lesson);
    });
    map.forEach((lessons) => lessons.sort((a, b) => a.start.localeCompare(b.start)));
    return map;
  }, [data?.lessons, allDays, calendarWeek.days]);

  // Auswahl: zuletzt gewählten Tag wiederherstellen, sonst heute (bzw. den
  // ersten sichtbaren Tag, wenn „heute" z. B. am ausgeblendeten Wochenende liegt).
  const activeDay = selectedDay && allDays.includes(selectedDay)
    ? selectedDay
    : allDays.includes(todayISO)
      ? todayISO
      : allDays[0];

  const selectDay = (day: string) => {
    lastSelectedDay = day;
    setSelectedDay(day);
  };

  const jumpToday = () => {
    selectDay(allDays.includes(todayISO) ? todayISO : allDays[0]);
    setCalendarWeekOffset(0);
  };

  const visibleLessons = allDays.flatMap((day) => byDay.get(day) ?? []);
  const stats = useMemo(() => ({
    total: visibleLessons.length,
    cancelled: visibleLessons.filter((lesson) => lesson.state === 'cancelled').length,
    substitutions: visibleLessons.filter((lesson) => lesson.state === 'substitution').length,
  }), [visibleLessons]);

  const rangeLabel = useMemo(() => {
    const first = allDays[0] ? new Date(allDays[0]) : new Date();
    const last = allDays[allDays.length - 1] ? new Date(allDays[allDays.length - 1]) : new Date();
    const fmt = (date: Date) => `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}.`;
    const sameYear = first.getFullYear() === last.getFullYear();
    return `${fmt(first)} – ${fmt(last)}${sameYear ? '' : ` ${last.getFullYear()}`}`;
  }, [allDays]);

  // Kalenderansicht: Wochen-Label.
  const calendarRangeLabel = useMemo(() => {
    const first = calendarWeek.days[0] ? new Date(calendarWeek.days[0]) : new Date();
    const last = calendarWeek.days[calendarWeek.days.length - 1] ? new Date(calendarWeek.days[calendarWeek.days.length - 1]) : new Date();
    const fmt = (date: Date) => `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}.`;
    return `${fmt(first)} – ${fmt(last)}`;
  }, [calendarWeek.days]);

  const active = activeDay;

  const content = (
    <>
      <ScreenHeader
        title="Stundenplan"
        subtitle={timetableMode === 'calendar' ? calendarRangeLabel : `Zwei Wochen · ${rangeLabel}`}
        action={
          timetableMode === 'list' ? (
            <PressableOpacity
              onPress={jumpToday}
              className="min-h-[44px] items-center justify-center rounded-full bg-accent-amber/15 px-3.5 hover:bg-accent-amber/25"
              accessibilityRole="button"
              accessibilityLabel="Zur aktuellen Woche springen"
            >
              <Text className="text-[12px] font-extrabold text-on-amber">Heute</Text>
            </PressableOpacity>
          ) : (
            <PressableOpacity
              onPress={jumpToday}
              className="min-h-[44px] items-center justify-center rounded-full bg-accent-amber/15 px-3.5 hover:bg-accent-amber/25"
              accessibilityRole="button"
              accessibilityLabel="Zur aktuellen Woche springen"
            >
              <Text className="text-[12px] font-extrabold text-on-amber">Heute</Text>
            </PressableOpacity>
          )
        }
      />

      {/* Ansicht-Umschalter */}
      <View className="px-4 pb-3">
        <SegmentedControl<'list' | 'calendar'>
          value={timetableMode}
          onChange={(mode) => update({ timetableMode: mode })}
          options={[
            { value: 'list', label: 'Liste' },
            { value: 'calendar', label: 'Kalender' },
          ]}
        />
      </View>

      {isLoading || !data ? (
        <View className="gap-3 px-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </View>
      ) : timetableMode === 'calendar' ? (
        /* Kalenderansicht */
        <View
          className="w-full flex-1"
          style={wide ? { alignSelf: 'center', maxWidth: 780 } : undefined}
        >
          {/* Wochen-Navigation */}
          <View className="flex-row items-center justify-between px-4 pb-2">
            <PressableOpacity
              onPress={() => setCalendarWeekOffset((offset) => offset - 1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-line/50"
              accessibilityRole="button"
              accessibilityLabel="Vorherige Woche"
            >
              <ChevronLeft color={colors.ink} size={20} />
            </PressableOpacity>
            <Text className="text-[13px] font-bold text-muted">
              {calendarWeekOffset === 0 ? 'Diese Woche' : calendarWeekOffset === 1 ? 'Nächste Woche' : calendarWeekOffset === -1 ? 'Letzte Woche' : `Woche ${calendarWeekOffset > 0 ? '+' : ''}${calendarWeekOffset}`}
            </Text>
            <PressableOpacity
              onPress={() => setCalendarWeekOffset((offset) => offset + 1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-line/50"
              accessibilityRole="button"
              accessibilityLabel="Nächste Woche"
            >
              <ChevronRight color={colors.ink} size={20} />
            </PressableOpacity>
          </View>

          {/* Kalender-Raster */}
          <TimetableWeekGrid
            days={calendarWeek.days}
            lessons={calendarWeek.days.flatMap((day) => byDay.get(day) ?? [])}
            onSelectLesson={setDetail}
            showWeekend={showWeekend}
          />
        </View>
      ) : (
        /* Listenansicht (Phase 4) */
        <View
          className="w-full flex-1"
          style={wide ? { alignSelf: 'center', maxWidth: 780 } : undefined}
        >
          {/* Wochen-Übersicht: zwei antippbare Streifen übereinander */}
          <View className="gap-2.5 px-4">
            {weeks.map((week) => (
              <WeekStrip
                key={week.key}
                label={week.label}
                days={week.days}
                selected={active}
                today={todayISO}
                byDay={byDay}
                onSelectDay={selectDay}
              />
            ))}
          </View>

          {/* Statuszeile für den ganzen Zwei-Wochen-Zeitraum */}
          <View className="px-4 pb-1 pt-2.5">
            <Row className="gap-2">
              <Chip label={`${stats.total} Stunden`} variant="charcoal" tone="solid" />
              {stats.cancelled > 0 ? (
                <Chip label={`${stats.cancelled} Entfall`} color={colors.priority.urgent} tone="solid" icon={Ban} />
              ) : null}
              {stats.substitutions > 0 ? (
                <Chip label={`${stats.substitutions} Vertretung`} color={colors.success} tone="solid" icon={UserCheck} />
              ) : null}
            </Row>
          </View>

          <DayList
            day={active}
            byDay={byDay}
            compact={compact}
            isDark={isDark}
            onSelect={setDetail}
          />
        </View>
      )}

      <LessonSheet lesson={detail} onClose={() => setDetail(null)} />
    </>
  );

  return (
    <Screen>
      {wide ? (
        <AdaptiveContent dashboard className="flex-1">
          {content}
        </AdaptiveContent>
      ) : (
        content
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ Wochen-Streifen */

function WeekStrip({
  label,
  days,
  selected,
  today,
  byDay,
  onSelectDay,
}: {
  label: string;
  days: string[];
  selected: string;
  today: string;
  byDay: Map<string, Lesson[]>;
  onSelectDay: (day: string) => void;
}) {
  const { colors } = useThemeColors();
  const first = days[0] ? new Date(days[0]) : new Date();
  const last = days[days.length - 1] ? new Date(days[days.length - 1]) : new Date();
  const range = `${first.getDate()}.${String(first.getMonth() + 1).padStart(2, '0')}. – ${
    last.getDate()}.${String(last.getMonth() + 1).padStart(2, '0')}.`;

  return (
    <View className="overflow-hidden rounded-[24px] bg-surface p-3" style={{ shadowColor: colors.charcoal, shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 }}>
      <Row className="justify-between pb-2 pl-1 pr-1">
        <Row className="gap-2">
          <IconBadge icon={CalendarDays} color={colors.accent.amber} size="sm" tone="tint" />
          <Text className="text-[13.5px] font-extrabold tracking-[-0.2px] text-ink">{label}</Text>
        </Row>
        <Text className="text-[11px] font-bold text-faint" style={{ fontVariant: ['tabular-nums'] }}>
          {range}
        </Text>
      </Row>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {days.map((day) => {
          const date = new Date(day);
          const isActive = day === selected;
          const isToday = day === today;
          const lessons = byDay.get(day) ?? [];
          const dots = dayDots(lessons);
          const dotColors = dots.map((dot) => DOT_COLOR[dot](colors));
          return (
            <PressableScale
              key={day}
              onPress={() => onSelectDay(day)}
              scale={0.94}
              className={`h-[64px] w-[58px] items-center justify-center rounded-[20px] ${
                isActive
                  ? 'bg-accent-amber hover:bg-accent-amber'
                  : 'bg-line/50 hover:bg-line/70'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${formatLongDay(day)}${isToday ? ', heute' : ''}`}
            >
              <Text
                className={`text-[10px] font-extrabold uppercase tracking-wide ${
                  isActive ? 'text-on-amber/70' : 'text-faint'
                }`}
              >
                {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
              </Text>
              {/* „Heute" ist in beiden Streifen als Ring markiert — auch wenn der
                  andere Streifen/die andere Woche ausgewählt ist. */}
              <View
                className={`mt-0.5 h-7 w-7 items-center justify-center rounded-full border-[1.6px] ${
                  isToday ? (isActive ? 'border-white/70' : 'border-accent-amber') : 'border-transparent'
                }`}
              >
                <Text className={`text-[17px] font-extrabold leading-6 ${isActive ? 'text-on-amber' : 'text-ink'}`}>
                  {date.getDate()}
                </Text>
              </View>
              {/* Status-Punkte: grün = Vertretung, coral = Entfall, grau = Ausfall-Tag */}
              <View className="mt-0.5 h-[6px] flex-row items-center" style={{ gap: 3 }}>
                {dotColors.length > 0 ? (
                  dotColors.map((color, index) => (
                    <View
                      key={`${color}-${index}`}
                      className="h-[6px] w-[6px] rounded-full"
                      style={{ backgroundColor: isActive ? 'rgba(0,0,0,0.35)' : color }}
                    />
                  ))
                ) : (
                  <View className="h-[2px] w-4 rounded-full" style={{ backgroundColor: isActive ? 'rgba(0,0,0,0.18)' : 'transparent' }} />
                )}
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ Tagesliste (Farbflächen) */

function DayList({
  day,
  byDay,
  compact,
  isDark,
  onSelect,
}: {
  day: string;
  byDay: Map<string, Lesson[]>;
  compact: boolean;
  isDark: boolean;
  onSelect: (lesson: Lesson) => void;
}) {
  const { colors } = useThemeColors();
  const lessons = byDay.get(day) ?? [];
  const now = nowMinutes();
  const isToday = day === toISO(new Date());
  const reserve = useTabNavReserve();

  const cancelledCount = lessons.filter((lesson) => lesson.state === 'cancelled').length;
  const substitutionCount = lessons.filter((lesson) => lesson.state === 'substitution').length;
  const changeCount = lessons.filter((lesson) => lesson.state !== 'regular' && lesson.state !== 'cancelled').length;
  const runningCount = lessons.filter(
    (lesson) => isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end),
  ).length;

  return (
    <View className="flex-1">
      {/* Tageskopf */}
      <Row className="justify-between px-4 pb-2 pt-3">
        <Text className="max-w-[55%] text-[19px] font-extrabold tracking-[-0.3px] text-ink" numberOfLines={1}>
          {formatLongDay(day)}
        </Text>
        <Row className="flex-shrink flex-wrap justify-end gap-1.5">
          {runningCount > 0 ? <Chip label={`${runningCount} jetzt`} color={colors.accent.amber} tone="solid" /> : null}
          {cancelledCount > 0 ? <Chip label={`${cancelledCount} Entfall`} color={colors.priority.urgent} tone="solid" icon={Ban} /> : null}
          {substitutionCount > 0 ? <Chip label={`${substitutionCount} Vertretung`} color={colors.success} tone="solid" icon={UserCheck} /> : null}
          {changeCount > 0 ? <Chip label={`${changeCount} Raumwechsel`} color={colors.warning} tone="solid" icon={MoveRight} /> : null}
        </Row>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        {lessons.length === 0 ? (
          <EmptyState
            illustration="free-day"
            title="Kein Unterricht"
            hint={isToday ? 'Heute ist nichts eingetragen. Genieß den Tag.' : 'Für diesen Tag ist nichts eingetragen.'}
          />
        ) : (
          <View className="gap-2.5 pt-1">
            {lessons.map((lesson, index) => (
              <FadeInUp key={lesson.id} delay={Math.min(index, 10) * 28}>
                <LessonBlockCard lesson={lesson} compact={compact} isDark={isDark} onPress={() => onSelect(lesson)} />
              </FadeInUp>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ Stunden-Karte */

function LessonBlockCard({
  lesson,
  compact,
  isDark,
  onPress,
}: {
  lesson: Lesson;
  compact: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  const now = nowMinutes();
  const isToday = lesson.date === toISO(new Date());
  const running = isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end);
  const past = isToday && now >= minutesOf(lesson.end);
  const cancelled = lesson.state === 'cancelled';
  const substitution = lesson.state === 'substitution';
  const roomChange = lesson.state === 'room-change';

  const displaySubject = lessonMainSubject(lesson);
  const SubjectIcon = subjectIcon(displaySubject);
  const blockColor = cancelled ? colors.priority.urgent : subjectColor(displaySubject, isDark);

  const state = cancelled
    ? { label: 'Entfall', icon: Ban, color: colors.priority.urgent }
    : substitution
      ? { label: 'Vertretung', icon: UserCheck, color: colors.success }
      : roomChange
        ? { label: 'Raumwechsel', icon: MoveRight, color: colors.warning }
        : null;

  return (
    /* Vollflächige Farbblock-Karte in Fachfarbe — kein Rand, kein linker Streifen.
       Entfall als Coral-Block, damit der freie Tag auf den ersten Blick klar ist.
       Der Press-Scale kommt aus `ColorBlockCard` selbst (Phase 9: eine einzige
       Press-Interaktion pro Karte statt verschachtelter Pressables). */
    <ColorBlockCard
      color={blockColor}
      onPress={onPress}
      accessibilityLabel={`${displaySubject}, ${lesson.start} Uhr`}
      dim={past && !running && !cancelled}
      radius={28}
      style={{ padding: compact ? 12 : 14 }}
    >
      <BlockCardContent
        lesson={lesson}
        displaySubject={displaySubject}
        SubjectIcon={SubjectIcon}
        state={state}
        running={running}
        compact={compact}
      />
    </ColorBlockCard>
  );
}

function BlockCardContent({
  lesson,
  displaySubject,
  SubjectIcon,
  state,
  running,
  compact,
}: {
  lesson: Lesson;
  displaySubject: string;
  SubjectIcon: LucideIcon;
  state: { label: string; icon: LucideIcon; color: string } | null;
  running: boolean;
  compact: boolean;
}) {
  const ink = useBlockInk();
  const { colors } = useThemeColors();
  const cancelled = lesson.state === 'cancelled';
  const substitution = lesson.state === 'substitution';
  const roomChange = lesson.state === 'room-change';
  const fg = ink;

  return (
    <View className="gap-2.5">
      <Row className="gap-2.5" style={{ alignItems: 'flex-start' }}>
        <IconBadge icon={SubjectIcon} color={fg} size="md" tone="tint" />
        <BlockText
          className="min-w-0 flex-1 text-[16.5px] font-extrabold leading-[20px] tracking-[-0.2px]"
          numberOfLines={2}
          style={cancelled ? { textDecorationLine: 'line-through', opacity: 0.82 } : undefined}
        >
          {displaySubject}
        </BlockText>
        <Pill label={`${lesson.hour}. Std`} color={fg} tone="tint" className="mt-0.5 px-2.5 py-1" />
      </Row>

      {/* Status-Badge + Kommentar (auffällige Pill mit Icon statt Textzeile) */}
      {state ? (
        <Row className="flex-wrap items-center gap-2">
          <Pill
            label={state.label}
            color={state.color}
            tone="solid"
            icon={state.icon}
          />
          {lesson.comment ? (
            <BlockCaption className="min-w-0 flex-1 text-[12px] leading-4" numberOfLines={2}>
              {lesson.comment}
            </BlockCaption>
          ) : null}
        </Row>
      ) : null}

      <Row className="flex-wrap items-center gap-1.5">
        <Pill label={`${lesson.start}–${lesson.end}`} color={fg} tone="tint" icon={Clock} className="px-2.5 py-1" />
        {lesson.room ? (
          <Pill label={`Raum ${lesson.room}`} color={fg} tone="tint" icon={MapPin} className="px-2.5 py-1" />
        ) : null}
        {roomChange && lesson.originalRoom ? (
          <BlockCaption className="text-[12px] font-bold" numberOfLines={1}>
            {lesson.originalRoom} → {lesson.room}
          </BlockCaption>
        ) : null}
        {running ? (
          <Row className="ml-0.5 gap-1.5 self-center">
            <LivePulse color={fg} size={7} />
            <BlockCaption className="text-[11px] font-extrabold uppercase tracking-wide">läuft gerade</BlockCaption>
          </Row>
        ) : null}
      </Row>

      {!compact ? (
        <Row className="flex-wrap items-center gap-x-2">
          {lesson.teacher ? (
            <BlockCaption className="text-[12px]" numberOfLines={1}>
              {lesson.teacher}
              {substitution && lesson.originalTeacher && lesson.originalTeacher !== lesson.teacher
                ? ` statt ${lesson.originalTeacher}`
                : ''}
            </BlockCaption>
          ) : null}
        </Row>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Detail-Sheet */

function LessonSheet({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  const { colors, isDark } = useThemeColors();
  const { data } = useSnapshot();

  const relatedHomework = data?.homework.filter(
    (item) => lesson && item.subject.toLowerCase() === lesson.subject.toLowerCase(),
  );
  const relatedExams = data?.exams.filter(
    (item) => lesson && item.subject.toLowerCase() === lesson.subject.toLowerCase(),
  );

  return (
    <Sheet open={Boolean(lesson)} onClose={onClose} title={lesson?.subject}>
      {lesson ? <LessonSheetBody lesson={lesson} relatedHomework={relatedHomework} relatedExams={relatedExams} isDark={isDark} colors={colors} /> : null}
    </Sheet>
  );
}

function LessonSheetBody({
  lesson,
  relatedHomework,
  relatedExams,
  isDark,
  colors,
}: {
  lesson: Lesson;
  relatedHomework?: { id: string; text: string }[];
  relatedExams?: { id: string; date: string; type?: string }[];
  isDark: boolean;
  colors: ReturnType<typeof useThemeColors>['colors'];
}) {
  const cancelled = lesson.state === 'cancelled';
  const substitution = lesson.state === 'substitution';
  const roomChange = lesson.state === 'room-change';
  const displaySubject = lessonMainSubject(lesson);
  const SubjectIcon = subjectIcon(displaySubject);
  const blockColor = cancelled ? colors.priority.urgent : subjectColor(displaySubject, isDark);
  const state =
    lesson.state === 'cancelled'
      ? { label: 'Entfall', icon: Ban, color: colors.priority.urgent }
      : lesson.state === 'substitution'
        ? { label: 'Vertretung', icon: UserCheck, color: colors.success }
        : lesson.state === 'room-change'
          ? { label: 'Raumwechsel', icon: MoveRight, color: colors.warning }
          : null;

  return (
    <View className="gap-3">
      {/* Kopf im neuen Stil: ColorBlockCard in Fachfarbe */}
      <ColorBlockCard color={blockColor} style={{ padding: 16 }}>
        <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
          <SheetIconBadge icon={SubjectIcon} />
          <View className="min-w-0 flex-1">
            <BlockText className="text-[19px] font-extrabold leading-[23px] tracking-[-0.3px]" numberOfLines={2}>
              {displaySubject}
            </BlockText>
            <BlockCaption className="mt-1 text-[13px] font-bold">
              {lesson.hour}. Stunde · {lesson.start}–{lesson.end} Uhr
            </BlockCaption>
            {state ? (
              <View className="mt-2 self-start">
                <Pill label={state.label} icon={state.icon} color={state.color} tone="solid" />
              </View>
            ) : null}
            {lesson.teacher || lesson.room ? (
              <BlockCaption className="mt-1.5" numberOfLines={1}>
                {[lesson.teacher, lesson.room ? `Raum ${lesson.room}` : ''].filter(Boolean).join(' · ')}
              </BlockCaption>
            ) : null}
            {lesson.comment ? (
              <BlockCaption className="mt-2 text-[13px] leading-5" numberOfLines={3}>{lesson.comment}</BlockCaption>
            ) : null}
          </View>
        </Row>
      </ColorBlockCard>

      {lesson.state !== 'regular' ? (
        <View className="gap-2 rounded-[24px] bg-line/50 p-4">
          <Text className="text-[13px] font-extrabold text-ink">Änderung</Text>
          <Muted className="text-[13px] leading-5">
            {cancelled
              ? `${lesson.originalSubject ?? lesson.subject} entfällt.`
              : substitution
                ? `Statt ${lesson.originalSubject ?? '—'} bei ${lesson.originalTeacher ?? '—'} findet ${lesson.subject} statt.`
                : roomChange
                  ? `Raum geändert: ${lesson.originalRoom ?? '—'} → ${lesson.room ?? '—'}`
                  : null}
          </Muted>
        </View>
      ) : null}

      {relatedHomework && relatedHomework.length > 0 ? (
        <View className="gap-2 rounded-[24px] bg-line/50 p-4">
          <Row className="gap-2">
            <IconBadge icon={BookOpen} color={colors.success} size="sm" />
            <Text className="text-[13px] font-extrabold text-ink">Hausaufgaben in diesem Fach</Text>
          </Row>
          {relatedHomework.slice(0, 3).map((item) => (
            <Muted key={item.id} className="mt-1 text-[13px] leading-5">{item.text}</Muted>
          ))}
        </View>
      ) : null}

      {relatedExams && relatedExams.length > 0 ? (
        <View className="gap-2 rounded-[24px] bg-line/50 p-4">
          <Row className="gap-2">
            <IconBadge icon={AlertTriangle} color={colors.warning} size="sm" />
            <Text className="text-[13px] font-extrabold text-ink">Anstehende Arbeiten</Text>
          </Row>
          {relatedExams.map((exam) => (
            <Muted key={exam.id} className="mt-1 text-[13px]">
              {exam.date} · {exam.type ?? 'Arbeit'}
            </Muted>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Icon-Kreis im Sheet-Kopf — IconBadge liefert bereits die passende Form. */
function SheetIconBadge({ icon }: { icon: LucideIcon }) {
  const ink = useBlockInk();
  return <IconBadge icon={icon} color={ink} size="lg" tone="tint" className="mt-0.5" />;
}
