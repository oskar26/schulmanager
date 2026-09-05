/**
 * Kalenderansicht — Wochenraster mit Zeitachse („Playful Modern“, docs/playful-modern.md §2.1).
 *
 * · Zeitachse 07:00–16:00 links (50 px), Stundenmarker linksbündig, dezente
 *   gestrichelte Horizontallinien.
 * · Fach-Karten: Pastell-Hintergrund des Fachs + 4-px-Akzentstreifen links.
 *   Zeile 1 fett: sauber abgekürzter Fachname („Mathe“ statt „Math“);
 *   Zeile 2 muted 11 px: Raum · Zeit. Nichts wird mehr mitten im Wort
 *   abgeschnitten — bei wenig Platz greift Ellipsis am Wortende.
 * · Status-Dots oben rechts: rot pulsierend = Entfall/Vertretung,
 *   grün = Hausaufgabe in diesem Fach.
 * · Hover: translateY(-2px) scale(1.02).
 *
 * Überlappungen (z. B. Vertretung direkt nach Originalstunde) werden
 * nebeneinander statt übereinander gelegt.
 */
import React, { useMemo } from 'react';
import { ScrollView, Text, View, type ViewStyle } from 'react-native';

import type { Lesson } from '@/api/types';
import { subjectColor, subjectShortName, subjectTint } from '@/design/subjects';
import { minutesOf, WEEKDAYS, WEEKDAYS_SHORT } from '@/lib/date';
import { useThemeColors } from '@/design/theme';
import { radius, shadow } from '@/design/tokens';
import { LivePulse, PressableScale } from '@/ui/motion';

/* ------------------------------------------------------------------ Konstanten */

/** Pixel pro Stunde — großzügiger als vorher, damit zwei Textzeilen passen. */
const HOUR_HEIGHT = 64;
/** Breite der Zeitachse links. */
const TIME_AXIS_WIDTH = 50;
/** Abstand zwischen Tagesspalten. */
const COLUMN_GAP = 6;
/** Feste Zeitachse 07:00–16:00; wird nur erweitert, wenn Stunden außerhalb liegen. */
const DEFAULT_AXIS_START = 7 * 60;
const DEFAULT_AXIS_END = 16 * 60;

/* ------------------------------------------------------------------ Helpers */

const safeMinutes = (hhmm: string): number => (hhmm ? minutesOf(hhmm) : 0);

interface PlacedLesson {
  lesson: Lesson;
  top: number;
  height: number;
  column: number;
  columnCount: number;
}

function computeAxisRange(lessons: Lesson[]): { start: number; end: number } {
  let earliest = DEFAULT_AXIS_START;
  let latest = DEFAULT_AXIS_END;
  for (const lesson of lessons) {
    const s = safeMinutes(lesson.start);
    const e = safeMinutes(lesson.end);
    if (s > 0 && s < earliest) earliest = Math.floor(s / 60) * 60;
    if (e > 0 && e > latest) latest = Math.ceil(e / 60) * 60;
  }
  return { start: earliest, end: latest };
}

function placeLessons(lessons: Lesson[], axisStart: number, hourHeight: number): PlacedLesson[] {
  if (lessons.length === 0) return [];

  const sorted = [...lessons].sort(
    (a, b) => safeMinutes(a.start) - safeMinutes(b.start) || safeMinutes(a.end) - safeMinutes(b.end),
  );

  type Item = { lesson: Lesson; start: number; end: number; col: number };
  const items: Item[] = sorted.map((lesson) => ({
    lesson,
    start: safeMinutes(lesson.start),
    end: safeMinutes(lesson.end),
    col: 0,
  }));

  const groups: Item[][] = [];
  let currentGroup: Item[] = [];
  let groupEnd = -1;

  for (const item of items) {
    if (currentGroup.length > 0 && item.start >= groupEnd) {
      groups.push(currentGroup);
      currentGroup = [];
      groupEnd = -1;
    }
    const usedCols = new Set(currentGroup.filter((g) => g.end > item.start).map((g) => g.col));
    let col = 0;
    while (usedCols.has(col)) col += 1;
    item.col = col;
    currentGroup.push(item);
    if (item.end > groupEnd) groupEnd = item.end;
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  const placed: PlacedLesson[] = [];
  for (const group of groups) {
    const columnCount = Math.max(...group.map((g) => g.col)) + 1;
    for (const item of group) {
      const duration = Math.max(item.end - item.start, 15);
      const top = ((item.start - axisStart) / 60) * hourHeight;
      const height = (duration / 60) * hourHeight;
      placed.push({
        lesson: item.lesson,
        top,
        height: Math.max(height, 34),
        column: item.col,
        columnCount,
      });
    }
  }
  return placed;
}

/* ------------------------------------------------------------------ Komponente */

export function TimetableWeekGrid({
  days,
  lessons,
  onSelectLesson,
  showWeekend = false,
  homeworkSubjects,
}: {
  /** ISO-Datums-Strings der anzuzeigenden Tage (Mo–Fr oder Mo–So). */
  days: string[];
  /** Alle Stunden der Woche (gefiltert auf diese Tage). */
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  showWeekend?: boolean;
  /** Fächer (lowercase), zu denen offene Hausaufgaben existieren → grüner Dot. */
  homeworkSubjects?: Set<string>;
}) {
  const { colors, isDark } = useThemeColors();

  const visibleDays = showWeekend ? days : days.filter((_, i) => i < 5);

  const axis = useMemo(() => computeAxisRange(lessons), [lessons]);
  const totalHours = (axis.end - axis.start) / 60;
  const gridHeight = totalHours * HOUR_HEIGHT;

  const placedByDay = useMemo(() => {
    const map = new Map<string, PlacedLesson[]>();
    for (const day of visibleDays) {
      const dayLessons = lessons.filter((l) => l.date === day);
      map.set(day, placeLessons(dayLessons, axis.start, HOUR_HEIGHT));
    }
    return map;
  }, [lessons, visibleDays, axis.start]);

  const hourMarks = useMemo(() => {
    const marks: { minute: number; label: string }[] = [];
    for (let h = Math.ceil(axis.start / 60); h <= Math.floor(axis.end / 60); h++) {
      marks.push({ minute: h * 60, label: `${String(h).padStart(2, '0')}:00` });
    }
    return marks;
  }, [axis]);

  const todayISO = (() => {
    const d = new Date();
    const copy = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
    return copy.toISOString().slice(0, 10);
  })();

  const columnWidthStyle: ViewStyle = { flex: 1, minWidth: 0 };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
        overflow: 'hidden',
        ...shadow.card,
      }}
    >
      {/* Kopfzeile: Wochentage */}
      <View
        style={{
          flexDirection: 'row',
          paddingLeft: TIME_AXIS_WIDTH,
          paddingRight: 10,
          paddingTop: 12,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
          gap: COLUMN_GAP,
        }}
      >
        {visibleDays.map((day) => {
          const date = new Date(day);
          const isToday = day === todayISO;
          const dayIndex = (date.getDay() + 6) % 7;
          return (
            <View key={day} style={[columnWidthStyle, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <View
                style={{
                  minWidth: 28,
                  height: 28,
                  paddingHorizontal: 6,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? colors.accent.violet : colors.canvas,
                }}
              >
                <Text
                  className="text-[13px] font-extrabold"
                  style={{ color: isToday ? '#FFFFFF' : colors.ink, fontVariant: ['tabular-nums'] }}
                >
                  {date.getDate()}
                </Text>
              </View>
              <Text
                className="flex-shrink text-[11px] font-extrabold uppercase tracking-[0.8px]"
                style={{ color: isToday ? colors.accent.violet : colors.muted }}
                numberOfLines={1}
              >
                {visibleDays.length <= 5 ? WEEKDAYS[dayIndex] : WEEKDAYS_SHORT[dayIndex]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Scrollbarer Raster-Bereich */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', minHeight: gridHeight + 12 }}>
          {/* Zeitachse */}
          <View style={{ width: TIME_AXIS_WIDTH, position: 'relative' }}>
            {hourMarks.map((mark) => {
              const top = ((mark.minute - axis.start) / 60) * HOUR_HEIGHT;
              return (
                <View key={mark.minute} style={{ position: 'absolute', top: top - 7, left: 10 }}>
                  <Text
                    className="text-[10.5px] font-bold"
                    style={{ color: colors.muted, fontVariant: ['tabular-nums'] }}
                  >
                    {mark.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Spalten-Bereich */}
          <View style={{ flex: 1, flexDirection: 'row', position: 'relative', paddingRight: 10, gap: COLUMN_GAP }}>
            {/* Gestrichelte Stundenlinien */}
            {hourMarks.map((mark) => {
              const top = ((mark.minute - axis.start) / 60) * HOUR_HEIGHT;
              return (
                <View
                  key={`line-${mark.minute}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top,
                    left: 0,
                    right: 10,
                    height: 0,
                    borderTopWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: colors.line,
                  }}
                />
              );
            })}

            {/* Tagesspalten */}
            {visibleDays.map((day) => {
              const placed = placedByDay.get(day) ?? [];
              const isToday = day === todayISO;
              return (
                <View
                  key={day}
                  style={[
                    columnWidthStyle,
                    {
                      position: 'relative',
                      minHeight: gridHeight,
                      borderRadius: radius.md,
                      backgroundColor: isToday ? (isDark ? 'rgba(129,140,248,0.06)' : 'rgba(99,102,241,0.035)') : 'transparent',
                    },
                  ]}
                >
                  {placed.map((item) => (
                    <CalendarLessonBlock
                      key={item.lesson.id}
                      placed={item}
                      isDark={isDark}
                      hasHomework={Boolean(homeworkSubjects?.has(item.lesson.subject.toLowerCase()))}
                      onPress={() => onSelectLesson(item.lesson)}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ Block */

function CalendarLessonBlock({
  placed,
  isDark,
  hasHomework,
  onPress,
}: {
  placed: PlacedLesson;
  isDark: boolean;
  hasHomework: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  const { lesson, top, height, column, columnCount } = placed;
  const cancelled = lesson.state === 'cancelled';
  const substitution = lesson.state === 'substitution';
  const roomChange = lesson.state === 'room-change';

  const displaySubject = cancelled
    ? (lesson.originalSubject ?? lesson.subject)
    : substitution && lesson.originalSubject && lesson.subject !== lesson.originalSubject
      ? lesson.originalSubject
      : lesson.subject;

  const accent = cancelled ? colors.status.urgent : subjectColor(displaySubject, isDark);
  const background = cancelled ? (isDark ? 'rgba(248,113,113,0.14)' : '#FEF2F2') : subjectTint(displaySubject, isDark);

  const widthPercent = 100 / columnCount;
  const leftPercent = column * widthPercent;

  const name = subjectShortName(displaySubject, lesson.subjectAbbr);
  const meta = [lesson.room, lesson.start].filter(Boolean).join(' · ');

  const isCompact = height < 46;
  const tight = columnCount > 1;

  const containerStyle: ViewStyle = {
    position: 'absolute',
    top: top + 1,
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
    height: height - 3,
    paddingRight: column < columnCount - 1 ? 3 : 0,
  };

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <PressableScale
        onPress={onPress}
        scale={0.96}
        hoverScale={1.02}
        hoverLift
        style={{ flex: 1, borderRadius: radius.sm + 2 }}
        accessibilityRole="button"
        accessibilityLabel={`${displaySubject}, ${lesson.start} Uhr${lesson.room ? `, Raum ${lesson.room}` : ''}${cancelled ? ', entfällt' : ''}`}
      >
        <View
          style={{
            flex: 1,
            borderRadius: radius.sm + 2,
            overflow: 'hidden',
            backgroundColor: background,
            borderLeftWidth: 4,
            borderLeftColor: accent,
            paddingLeft: tight ? 6 : 8,
            paddingRight: 16,
            paddingVertical: isCompact ? 4 : 6,
            justifyContent: 'center',
            opacity: cancelled ? 0.85 : 1,
          }}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              color: colors.ink,
              fontSize: isCompact || tight ? 11.5 : 13,
              fontWeight: '800',
              letterSpacing: -0.2,
              lineHeight: isCompact || tight ? 14 : 16,
              textDecorationLine: cancelled ? 'line-through' : 'none',
            }}
          >
            {name}
          </Text>

          {!isCompact && meta ? (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: colors.muted,
                fontSize: 11,
                lineHeight: 14,
                fontWeight: '600',
                marginTop: 1,
                fontVariant: ['tabular-nums'],
              }}
            >
              {meta}
            </Text>
          ) : null}

          {/* Status-Dots oben rechts */}
          <View style={{ position: 'absolute', top: 5, right: 5, flexDirection: 'row', gap: 3, alignItems: 'center' }}>
            {cancelled || substitution ? (
              <LivePulse color={colors.status.urgent} size={7} />
            ) : roomChange ? (
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.status.warning }} />
            ) : null}
            {hasHomework && !cancelled ? (
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.status.success }} />
            ) : null}
          </View>
        </View>
      </PressableScale>
    </View>
  );
}
