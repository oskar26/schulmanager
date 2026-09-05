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
  User,
  UserCheck,
  X,
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
  Skeleton, useBlockAccent,
} from '@/ui/primitives';
import { blockTint, radius } from '@/design/tokens';
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
  const homeworkSubjects = useMemo(
    () => new Set((data?.homework ?? []).filter((item) => !item.done).map((item) => item.subject.toLowerCase())),
    [data?.homework],
  );

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
              className="min-h-[44px] items-center justify-center rounded-full bg-tint-violet px-4 hover:bg-accent-violet/20"
              accessibilityRole="button"
              accessibilityLabel="Zur aktuellen Woche springen"
            >
              <Text className="text-[12.5px] font-extrabold text-accent-violet">Heute</Text>
            </PressableOpacity>
          ) : (
            <PressableOpacity
              onPress={jumpToday}
              className="min-h-[44px] items-center justify-center rounded-full bg-tint-violet px-4 hover:bg-accent-violet/20"
              accessibilityRole="button"
              accessibilityLabel="Zur aktuellen Woche springen"
            >
              <Text className="text-[12.5px] font-extrabold text-accent-violet">Heute</Text>
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
          style={wide ? { alignSelf: 'center', maxWidth: 1200 } : undefined}
        >
          {/* Wochen-Navigation */}
          <View className="flex-row items-center justify-between px-4 pb-2">
            <PressableOpacity
              onPress={() => setCalendarWeekOffset((offset) => offset - 1)}
              className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
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
              className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
              accessibilityRole="button"
              accessibilityLabel="Nächste Woche"
            >
              <ChevronRight color={colors.ink} size={20} />
            </PressableOpacity>
          </View>

          {/* Kalender-Raster */}
          <View className="flex-1 px-4">
            <TimetableWeekGrid
              days={calendarWeek.days}
              lessons={calendarWeek.days.flatMap((day) => byDay.get(day) ?? [])}
              onSelectLesson={setDetail}
              showWeekend={showWeekend}
              homeworkSubjects={homeworkSubjects}
            />
          </View>
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
    <View className="overflow-hidden rounded-[20px] border border-line bg-surface p-3" style={{ shadowColor: colors.charcoal, shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 1 }}>
      <Row className="justify-between pb-2 pl-1 pr-1">
        <Row className="gap-2">
          <IconBadge icon={CalendarDays} color={colors.accent.violet} size="sm" tone="tint" />
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
              className={`h-[64px] w-[58px] items-center justify-center rounded-[14px] ${
                isActive
                  ? 'bg-accent-violet hover:bg-accent-violet'
                  : 'bg-canvas hover:bg-line/60'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${formatLongDay(day)}${isToday ? ', heute' : ''}`}
            >
              <Text
                className={`text-[10px] font-extrabold uppercase tracking-wide ${
                  isActive ? 'text-white/75' : 'text-muted'
                }`}
              >
                {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
              </Text>
              {/* „Heute" ist in beiden Streifen als Ring markiert — auch wenn der
                  andere Streifen/die andere Woche ausgewählt ist. */}
              <View
                className={`mt-0.5 h-7 w-7 items-center justify-center rounded-full border-[1.6px] ${
                  isToday ? (isActive ? 'border-white/70' : 'border-accent-violet') : 'border-transparent'
                }`}
              >
                <Text className={`text-[17px] font-extrabold leading-6 ${isActive ? 'text-white' : 'text-ink'}`}>
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
                      style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.8)' : color }}
                    />
                  ))
                ) : (
                  <View className="h-[2px] w-4 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.35)' : 'transparent' }} />
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
          {runningCount > 0 ? <Chip label={`${runningCount} jetzt`} color={colors.accent.violet} tone="solid" /> : null}
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
    /* Pastell-Karte in Fachfarbe mit 4-px-Akzentstreifen links; Entfall in
       Rot-Tint. Der Press-Scale kommt aus `ColorBlockCard` selbst. */
    <ColorBlockCard
      color={blockColor}
      onPress={onPress}
      accessibilityLabel={`${displaySubject}, ${lesson.start} Uhr`}
      dim={past && !running && !cancelled}
      radius={radius.lg}
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
  const fg = useBlockAccent();
  const { colors } = useThemeColors();
  const cancelled = lesson.state === 'cancelled';
  const substitution = lesson.state === 'substitution';
  const roomChange = lesson.state === 'room-change';

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

/**
 * Detail-Pop-up einer Stunde. Der Titel liegt jetzt **im** Header-Banner
 * (Fachfarbe als dezenter Verlauf, padding 20, flex space-between), der
 * Close-Button sitzt oben rechts im Banner mit transparentem Kreis — kein
 * Herausbrechen mehr auf den Backdrop (Sheet-Wrapper: overflow hidden).
 */
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
    <Sheet
      open={Boolean(lesson)}
      onClose={onClose}
      header={lesson ? <LessonSheetHeader lesson={lesson} isDark={isDark} colors={colors} onClose={onClose} /> : undefined}
    >
      {lesson ? <LessonSheetBody lesson={lesson} relatedHomework={relatedHomework} relatedExams={relatedExams} isDark={isDark} colors={colors} /> : null}
    </Sheet>
  );
}

function LessonSheetHeader({
  lesson,
  isDark,
  colors,
  onClose,
}: {
  lesson: Lesson;
  isDark: boolean;
  colors: ReturnType<typeof useThemeColors>['colors'];
  onClose: () => void;
}) {
  const cancelled = lesson.state === 'cancelled';
  const displaySubject = lessonMainSubject(lesson);
  const SubjectIcon = subjectIcon(displaySubject);
  const accent = cancelled ? colors.status.urgent : subjectColor(displaySubject, isDark);
  const state =
    lesson.state === 'cancelled'
      ? { label: 'Entfall', icon: Ban }
      : lesson.state === 'substitution'
        ? { label: 'Vertretung', icon: UserCheck }
        : lesson.state === 'room-change'
          ? { label: 'Raumwechsel', icon: MoveRight }
          : null;

  return (
    <View style={{ backgroundColor: accent, position: 'relative', overflow: 'hidden' }}>
      {/* Dezenter Verlauf: hellerer Licht-Blob rechts oben. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -90,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: 'rgba(255,255,255,0.16)',
        }}
      />
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Row className="min-w-0 flex-1 gap-3">
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SubjectIcon size={22} strokeWidth={2.2} color="#FFFFFF" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[20px] font-extrabold leading-[24px] tracking-[-0.3px] text-white" numberOfLines={1} ellipsizeMode="tail">
              {displaySubject}
            </Text>
            <Text className="mt-0.5 text-[12.5px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }} numberOfLines={1}>
              {lesson.hour}. Stunde · {lesson.start}–{lesson.end} Uhr
            </Text>
          </View>
        </Row>
        <PressableScale
          onPress={onClose}
          scale={0.9}
          accessibilityRole="button"
          accessibilityLabel="Schließen"
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} strokeWidth={2.6} color="#FFFFFF" />
        </PressableScale>
      </View>
      {state ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, marginTop: -6 }}>
          <View
            className="flex-row items-center gap-1.5 self-start rounded-full px-3 py-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
          >
            <state.icon size={13} strokeWidth={2.6} color="#FFFFFF" />
            <Text className="text-[12px] font-extrabold text-white">{state.label}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Unterkarte im Modal-Inhalt: App-Hintergrund, Radius 14, Icon-Container. */
function SheetSection({
  icon: Icon,
  color,
  title,
  children,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  const { colors, isDark } = useThemeColors();
  return (
    <View style={{ backgroundColor: colors.canvas, borderRadius: radius.md, padding: 14, gap: 8 }}>
      <Row className="gap-2.5">
        <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: blockTint(color, isDark), alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} strokeWidth={2.3} color={color} />
        </View>
        <Text className="flex-1 text-[14px] font-bold text-ink" numberOfLines={1}>{title}</Text>
      </Row>
      {children}
    </View>
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
  relatedHomework?: { id: string; text: string; due?: string }[];
  relatedExams?: { id: string; date: string; type?: string }[];
  isDark: boolean;
  colors: ReturnType<typeof useThemeColors>['colors'];
}) {
  const cancelled = lesson.state === 'cancelled';
  const substitution = lesson.state === 'substitution';
  const roomChange = lesson.state === 'room-change';
  const displaySubject = lessonMainSubject(lesson);
  const accent = cancelled ? colors.status.urgent : subjectColor(displaySubject, isDark);

  const facts: { icon: LucideIcon; label: string }[] = [
    { icon: Clock, label: `${lesson.start}–${lesson.end} Uhr` },
    ...(lesson.room ? [{ icon: MapPin, label: `Raum ${lesson.room}` }] : []),
    ...(lesson.teacher ? [{ icon: User, label: lesson.teacher }] : []),
  ];

  return (
    <View className="gap-3 pt-4">
      {/* Fakten als Badges */}
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {facts.map((fact) => (
          <View
            key={fact.label}
            className="flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ backgroundColor: blockTint(accent, isDark) }}
          >
            <fact.icon size={13} strokeWidth={2.4} color={accent} />
            <Text className="text-[12.5px] font-bold text-ink" numberOfLines={1}>{fact.label}</Text>
          </View>
        ))}
      </View>

      {lesson.comment ? (
        <Muted className="text-[13px] leading-5">{lesson.comment}</Muted>
      ) : null}

      {lesson.state !== 'regular' ? (
        <SheetSection icon={AlertTriangle} color={cancelled ? colors.status.urgent : colors.status.warning} title="Änderung">
          <Muted className="text-[13px] leading-5">
            {cancelled
              ? `${lesson.originalSubject ?? lesson.subject} entfällt.`
              : substitution
                ? `Statt ${lesson.originalSubject ?? '—'} bei ${lesson.originalTeacher ?? '—'} findet ${lesson.subject} statt.`
                : roomChange
                  ? `Raum geändert: ${lesson.originalRoom ?? '—'} → ${lesson.room ?? '—'}`
                  : null}
          </Muted>
        </SheetSection>
      ) : null}

      {relatedHomework && relatedHomework.length > 0 ? (
        <SheetSection icon={BookOpen} color={colors.status.success} title="Hausaufgaben in diesem Fach">
          {relatedHomework.slice(0, 3).map((item) => (
            <Row key={item.id} className="gap-2.5" style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.status.success, marginTop: 7 }} />
              <View className="min-w-0 flex-1">
                <Text className="text-[13px] leading-5 text-ink" numberOfLines={3}>{item.text}</Text>
                {item.due ? <Muted className="text-[11.5px]">{formatLongDay(item.due)}</Muted> : null}
              </View>
            </Row>
          ))}
        </SheetSection>
      ) : null}

      {relatedExams && relatedExams.length > 0 ? (
        <SheetSection icon={AlertTriangle} color={colors.status.warning} title="Anstehende Arbeiten">
          {relatedExams.map((exam) => (
            <Row key={exam.id} className="gap-2.5">
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.status.warning }} />
              <Text className="flex-1 text-[13px] text-ink" numberOfLines={1}>
                {formatLongDay(exam.date)} · {exam.type ?? 'Arbeit'}
              </Text>
            </Row>
          ))}
        </SheetSection>
      ) : null}
    </View>
  );
}
