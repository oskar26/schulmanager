/**
 * Phase 15 · Kalenderansicht — Wochenraster mit Zeitachse.
 *
 * Wochentage als Spalten (Mo–Fr, optional Sa/So), Zeitachse sticky links,
 * farbige vertikale Blöcke exakt über ihrer Zeitspanne. Kompakte Kürzel
 * für Fach/Lehrer/Raum. Freistunden bleiben als Lücke sichtbar.
 *
 * Überlappungen (z. B. Vertretung direkt nach Originalstunde) werden
 * nebeneinander statt übereinander gelegt.
 */
import React, { useMemo } from 'react';
import { ScrollView, Text, View, type ViewStyle } from 'react-native';
import { Ban, MoveRight, UserCheck, type LucideIcon } from 'lucide-react-native';

import type { Lesson } from '@/api/types';
import { subjectColor } from '@/design/subjects';
import { minutesOf, WEEKDAYS_SHORT } from '@/lib/date';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, resolveThemeColor } from '@/design/tokens';
import { tint } from '@/design/subjects';
import { PressableScale } from '@/ui/motion';

/* ------------------------------------------------------------------ Konstanten */

/** Pixel pro Stunde — Basisraster. */
const HOUR_HEIGHT = 44;
/** Breite der Zeitachse links. */
const TIME_AXIS_WIDTH = 44;
/** Oberer/unterer Puffer im Raster (Minuten). */
const AXIS_PADDING_MINUTES = 30;
/** Mindestens angezeigte Stundenachse, damit leere Tage nicht komisch wirken. */
const DEFAULT_AXIS_START = 7 * 60; // 07:00
const DEFAULT_AXIS_END = 15 * 60;   // 15:00

/* ------------------------------------------------------------------ Helpers */

/** `HH:MM` in Minuten seit Mitternacht; leere Strings → 0. */
const safeMinutes = (hhmm: string): number => {
  if (!hhmm) return 0;
  return minutesOf(hhmm);
};

interface PlacedLesson {
  lesson: Lesson;
  top: number;
  height: number;
  /** Spalte innerhalb der Überlappungsgruppe (0 = links). */
  column: number;
  /** Anzahl der Spalten in der Überlappungsgruppe. */
  columnCount: number;
}

/**
 * Ermittelt die Zeitachse (Start/Ende in Minuten) aus den vorhandenen Stunden.
 * Fällt auf sinnvolle Defaults zurück, wenn keine Stunden vorhanden sind.
 */
function computeAxisRange(lessons: Lesson[]): { start: number; end: number } {
  if (lessons.length === 0) {
    return { start: DEFAULT_AXIS_START, end: DEFAULT_AXIS_END };
  }
  let earliest = DEFAULT_AXIS_START;
  let latest = DEFAULT_AXIS_END;
  for (const lesson of lessons) {
    const s = safeMinutes(lesson.start);
    const e = safeMinutes(lesson.end);
    if (s > 0 && s < earliest) earliest = s;
    if (e > 0 && e > latest) latest = e;
  }
  return {
    start: Math.max(0, earliest - AXIS_PADDING_MINUTES),
    end: latest + AXIS_PADDING_MINUTES,
  };
}

/**
 * Legt Stunden pixelgenau in ihre Zeitspanne und löst Überlappungen in Spalten auf.
 * Pro Tag separat aufrufen.
 */
function placeLessons(
  lessons: Lesson[],
  axisStart: number,
  hourHeight: number,
): PlacedLesson[] {
  if (lessons.length === 0) return [];

  const sorted = [...lessons].sort(
    (a, b) => safeMinutes(a.start) - safeMinutes(b.start) || safeMinutes(a.end) - safeMinutes(b.end),
  );

  // Überlappungsgruppen finden (Greedy-Intervallfärbung).
  type Item = { lesson: Lesson; start: number; end: number; col: number };
  const items: Item[] = sorted.map((lesson) => ({
    lesson,
    start: safeMinutes(lesson.start),
    end: safeMinutes(lesson.end),
    col: 0,
  }));

  // Jede Gruppe von sich überlappenden Intervallen bekommt Spalten.
  const groups: Item[][] = [];
  let currentGroup: Item[] = [];
  let groupEnd = -1;

  for (const item of items) {
    if (currentGroup.length > 0 && item.start >= groupEnd) {
      groups.push(currentGroup);
      currentGroup = [];
      groupEnd = -1;
    }
    // Nächste freie Spalte in der aktuellen Gruppe finden.
    const usedCols = new Set(currentGroup.filter((g) => g.end > item.start).map((g) => g.col));
    let col = 0;
    while (usedCols.has(col)) col += 1;
    item.col = col;
    currentGroup.push(item);
    if (item.end > groupEnd) groupEnd = item.end;
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  // Spaltenanzahl pro Gruppe bestimmen und Positionen berechnen.
  const placed: PlacedLesson[] = [];
  for (const group of groups) {
    const columnCount = Math.max(...group.map((g) => g.col)) + 1;
    for (const item of group) {
      const duration = Math.max(item.end - item.start, 15); // Mindesthöhe
      const top = ((item.start - axisStart) / 60) * hourHeight;
      const height = (duration / 60) * hourHeight;
      placed.push({
        lesson: item.lesson,
        top,
        height: Math.max(height, 28),
        column: item.col,
        columnCount,
      });
    }
  }
  return placed;
}

/** Kürzt einen Fächernamen auf max. 4 Zeichen für das Raster. */
function subjectAbbr(lesson: Lesson): string {
  if (lesson.subjectAbbr && lesson.subjectAbbr.length <= 5) return lesson.subjectAbbr;
  const name = lesson.subject;
  if (name.length <= 4) return name;
  return name.slice(0, 4);
}

/* ------------------------------------------------------------------ Komponente */

export function TimetableWeekGrid({
  days,
  lessons,
  onSelectLesson,
  showWeekend = false,
}: {
  /** ISO-Datums-Strings der anzuzeigenden Tage (Mo–Fr oder Mo–So). */
  days: string[];
  /** Alle Stunden der Woche (gefiltert auf diese Tage). */
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  showWeekend?: boolean;
}) {
  const { colors, isDark } = useThemeColors();

  const visibleDays = showWeekend ? days : days.filter((_, i) => i < 5);
  const dayCount = visibleDays.length;

  const axis = useMemo(() => computeAxisRange(lessons), [lessons]);
  const totalHours = (axis.end - axis.start) / 60;
  const gridHeight = totalHours * HOUR_HEIGHT;

  // Stunden pro Tag gruppieren und platzieren.
  const placedByDay = useMemo(() => {
    const map = new Map<string, PlacedLesson[]>();
    for (const day of visibleDays) {
      const dayLessons = lessons.filter((l) => l.date === day);
      map.set(day, placeLessons(dayLessons, axis.start, HOUR_HEIGHT));
    }
    return map;
  }, [lessons, visibleDays, axis.start]);

  // Stundenmarkierungen für die Zeitachse.
  const hourMarks = useMemo(() => {
    const marks: { minute: number; label: string }[] = [];
    const startHour = Math.ceil(axis.start / 60);
    const endHour = Math.floor(axis.end / 60);
    for (let h = startHour; h <= endHour; h++) {
      marks.push({ minute: h * 60, label: `${h}` });
    }
    return marks;
  }, [axis]);

  const todayISO = (() => {
    const d = new Date();
    const copy = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
    return copy.toISOString().slice(0, 10);
  })();

  return (
    <View className="flex-1">
      {/* Kopfzeile: Wochentage */}
      <View style={{ flexDirection: 'row', paddingLeft: TIME_AXIS_WIDTH }}>
        {visibleDays.map((day, index) => {
          const date = new Date(day);
          const isToday = day === todayISO;
          const dayIndex = (date.getDay() + 6) % 7;
          return (
            <View
              key={day}
              style={{ flex: 1, alignItems: 'center', paddingBottom: 6, paddingTop: 4 }}
            >
              <Text
                className="text-[10px] font-extrabold uppercase tracking-wide"
                style={{ color: isToday ? colors.accent.amber : colors.faint }}
              >
                {WEEKDAYS_SHORT[dayIndex]}
              </Text>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                  backgroundColor: isToday ? colors.accent.amber : 'transparent',
                  borderWidth: isToday ? 0 : 1.5,
                  borderColor: isToday ? 'transparent' : colors.faint + '40',
                }}
              >
                <Text
                  className="text-[13px] font-extrabold"
                  style={{ color: isToday ? colors.on.amber : colors.ink }}
                >
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Scrollbarer Raster-Bereich */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', minHeight: gridHeight }}>
          {/* Zeitachse (sticky links über separate View) */}
          <View style={{ width: TIME_AXIS_WIDTH, position: 'relative' }}>
            {hourMarks.map((mark) => {
              const top = ((mark.minute - axis.start) / 60) * HOUR_HEIGHT;
              return (
                <View
                  key={mark.minute}
                  style={{
                    position: 'absolute',
                    top: top - 7,
                    left: 0,
                    right: 4,
                    alignItems: 'flex-end',
                  }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: colors.faint, fontVariant: ['tabular-nums'] }}
                  >
                    {mark.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Spalten-Bereich */}
          <View style={{ flex: 1, flexDirection: 'row', position: 'relative' }}>
            {/* Horizontale Stundenlinien */}
            {hourMarks.map((mark) => {
              const top = ((mark.minute - axis.start) / 60) * HOUR_HEIGHT;
              return (
                <View
                  key={`line-${mark.minute}`}
                  style={{
                    position: 'absolute',
                    top,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: colors.line,
                  }}
                />
              );
            })}

            {/* Tagesspalten */}
            {visibleDays.map((day) => {
              const placed = placedByDay.get(day) ?? [];
              return (
                <View
                  key={day}
                  style={{ flex: 1, position: 'relative', minHeight: gridHeight }}
                >
                  {placed.map((item) => (
                    <CalendarLessonBlock
                      key={item.lesson.id}
                      placed={item}
                      isDark={isDark}
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
  onPress,
}: {
  placed: PlacedLesson;
  isDark: boolean;
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

  const blockColor = cancelled
    ? colors.priority.urgent
    : subjectColor(displaySubject, isDark);
  const resolved = resolveThemeColor(blockColor, isDark);
  const fg = foregroundOn(resolved, colors);

  // Breite bei Überlappungen aufteilen.
  const widthPercent = 100 / columnCount;
  const leftPercent = column * widthPercent;

  const stateIcon: LucideIcon | null = cancelled
    ? Ban
    : substitution
      ? UserCheck
      : roomChange
        ? MoveRight
        : null;

  const stateColor = cancelled
    ? colors.priority.urgent
    : substitution
      ? colors.success
      : roomChange
        ? colors.warning
        : null;

  // Kompakte Kürzel
  const abbr = subjectAbbr(lesson);
  const teacher = lesson.teacher ? lesson.teacher.slice(0, 6) : '';
  const room = lesson.room ? lesson.room.slice(0, 8) : '';

  const isCompact = height < 52;

  const containerStyle: ViewStyle = {
    position: 'absolute',
    top,
    left: `${leftPercent + 0.5}%`,
    width: `${widthPercent - 1}%`,
    height,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: resolved,
    paddingHorizontal: 4,
    paddingVertical: 3,
    justifyContent: 'center',
  };

  return (
    <PressableScale
      onPress={onPress}
      scale={0.95}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={`${displaySubject}, ${lesson.start} Uhr${cancelled ? ', entfällt' : ''}`}
    >
      {/* Fach-Kürzel */}
      <Text
        numberOfLines={1}
        style={{
          color: fg,
          fontSize: isCompact ? 10 : 12,
          fontWeight: '800',
          letterSpacing: -0.2,
          textDecorationLine: cancelled ? 'line-through' : 'none',
          opacity: cancelled ? 0.8 : 1,
        }}
      >
        {abbr}
      </Text>

      {!isCompact ? (
        <>
          {/* Lehrer + Raum */}
          <Text
            numberOfLines={1}
            style={{
              color: fg,
              fontSize: 9,
              fontWeight: '600',
              opacity: 0.75,
              marginTop: 1,
            }}
          >
            {[teacher, room].filter(Boolean).join(' · ')}
          </Text>

          {/* Status-Punkt */}
          {stateIcon && stateColor ? (
            <View
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: stateColor,
              }}
            />
          ) : null}
        </>
      ) : (
        <>
          {/* Kompakter Status-Punkt */}
          {stateIcon && stateColor ? (
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: stateColor,
              }}
            />
          ) : null}
        </>
      )}
    </PressableScale>
  );
}
