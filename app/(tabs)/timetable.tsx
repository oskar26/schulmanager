import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BarChart3, BookOpen, ListChecks, Sun } from 'lucide-react-native';

import type { Lesson } from '@/api/types';
import { useSnapshot } from '@/data/queries';
import { subjectStyle, tint } from '@/design/subjects';
import {
  WEEKDAYS_SHORT, addDays, formatLongDay, minutesOf, nowMinutes, startOfWeek, toISO,
} from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import { AdaptiveContent, AvatarStack, Card, Chip, EmptyState, IconButton, Muted, Row, Screen, Sheet, Skeleton, Title } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { shadow } from '@/design/tokens';

type ViewMode = 'week' | 'day';

export default function TimetableScreen() {
  const { colors } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const showWeekend = useSettings((state) => state.settings.showWeekend);
  const compact = useSettings((state) => state.settings.compactTimetable);
  const layout = useLayout();

  const [weekOffset, setWeekOffset] = useState(0);
  const [mode, setMode] = useState<ViewMode>(layout.width > 620 ? 'week' : 'day');
  const [selectedDay, setSelectedDay] = useState(() => toISO(new Date()));
  const [detail, setDetail] = useState<Lesson | null>(null);
  const wide = layout.navigation !== 'bottom';

  const monday = useMemo(() => addDays(startOfWeek(new Date()), weekOffset * 7), [weekOffset]);
  const days = useMemo(
    () => Array.from({ length: showWeekend ? 7 : 5 }, (_, index) => toISO(addDays(monday, index))),
    [monday, showWeekend],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    days.forEach((day) => map.set(day, []));
    (data?.lessons ?? []).forEach((lesson) => {
      if (map.has(lesson.date)) map.get(lesson.date)!.push(lesson);
    });
    map.forEach((lessons) => lessons.sort((a, b) => a.start.localeCompare(b.start)));
    return map;
  }, [data?.lessons, days]);

  const weekLabel = `${monday.getDate()}.${monday.getMonth() + 1}. – ${addDays(monday, days.length - 1).getDate()}.${
    addDays(monday, days.length - 1).getMonth() + 1
  }.`;

  const stats = useMemo(() => {
    const lessons = days.flatMap((day) => byDay.get(day) ?? []);
    return {
      total: lessons.length,
      cancelled: lessons.filter((lesson) => lesson.state === 'cancelled').length,
      substitutions: lessons.filter((lesson) => lesson.state === 'substitution').length,
    };
  }, [byDay, days]);

  const content = (
    <>
      <View className={`pb-2 pt-2 ${wide ? '' : 'px-4'}`}>
        <Row className="justify-between">
          <View>
            <Title className={layout.isDesktop ? 'text-[26px]' : undefined}>Stundenplan</Title>
            <Muted>
              {weekOffset === 0 ? 'Diese Woche' : weekOffset === 1 ? 'Nächste Woche' : weekLabel} · {weekLabel}
            </Muted>
          </View>
          <Row className="gap-2">
            <IconButton icon="chevron-back" onPress={() => setWeekOffset((value) => value - 1)} color={colors.muted} size={36} />
            <Pressable
              onPress={() => setWeekOffset(0)}
              className="h-9 items-center justify-center rounded-xl bg-accent-amber/15 px-3"
            >
              <Text className="text-[12px] font-bold text-on-amber">Heute</Text>
            </Pressable>
            <IconButton icon="chevron-forward" onPress={() => setWeekOffset((value) => value + 1)} color={colors.muted} size={36} />
          </Row>
        </Row>

        <Row className="mt-3 gap-2">
          <Chip label={`${stats.total} Stunden`} variant="charcoal" tone="solid" />
          {stats.cancelled > 0 ? <Chip label={`${stats.cancelled} Entfall`} color={colors.danger} /> : null}
          {stats.substitutions > 0 ? <Chip label={`${stats.substitutions} Vertretung`} color={colors.success} /> : null}
          <View className="flex-1" />
          {/* Phase 3: Auf Phones gibt es nur die vertikale Tages-Timeline — keine
              Mini-Kacheln mehr, die Fächernamen abschneiden. Tablets dürfen weiter
              zwischen Wochen- und Tagesraster wechseln. */}
          {layout.isTablet ? (
            <Pressable
              onPress={() => setMode(mode === 'week' ? 'day' : 'week')}
              className="rounded-xl bg-line/60 px-3 py-1.5"
            >
              <Text className="text-[11px] font-bold text-muted">{mode === 'week' ? 'Tagesansicht' : 'Wochenansicht'}</Text>
            </Pressable>
          ) : null}
        </Row>
      </View>

      {isLoading || !data ? (
        <View className={`gap-3 ${wide ? '' : 'px-4'}`}>
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </View>
      ) : layout.isDesktop ? (
        // Auf Desktop: echtes Stundenplan-Raster mit Zeitleiste und Jetzt-Marker.
        <TimeGrid days={days} byDay={byDay} onSelect={setDetail} />
      ) : layout.isTablet && mode === 'week' ? (
        <WeekGrid days={days} byDay={byDay} compact={compact} onSelect={setDetail} />
      ) : (
        <DayList
          days={days}
          byDay={byDay}
          selected={selectedDay}
          onSelectDay={setSelectedDay}
          onSelect={setDetail}
        />
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

/* ------------------------------------------------------------------ Wochenraster */

function WeekGrid({
  days,
  byDay,
  compact,
  onSelect,
}: {
  days: string[];
  byDay: Map<string, Lesson[]>;
  compact: boolean;
  onSelect: (lesson: Lesson) => void;
}) {
  const maxRows = Math.max(...days.map((day) => byDay.get(day)?.length ?? 0), 0);
  const today = toISO(new Date());
  const reserve = useTabNavReserve();

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 12, paddingBottom: reserve }}>
      <Row className="gap-1.5">
        {days.map((day) => {
          const date = new Date(day);
          const isToday = day === today;
          return (
            <View key={day} className="flex-1 items-center">
              <Text className={`text-[11px] font-bold ${isToday ? 'text-accent-amber-deep' : 'text-faint'}`}>
                {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
              </Text>
              <View
                className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full ${isToday ? 'bg-accent-amber' : ''}`}
              >
                <Text className={`text-[12px] font-bold ${isToday ? 'text-on-amber' : 'text-muted'}`}>
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </Row>

      <Row className="mt-2 items-start gap-1.5">
        {days.map((day) => (
          <View key={day} className="flex-1 gap-1.5">
            {Array.from({ length: maxRows }, (_, row) => {
              const lesson = byDay.get(day)?.[row];
              if (!lesson) return <View key={row} style={{ height: compact ? 44 : 58 }} />;
              return (
                <LessonCell key={lesson.id} lesson={lesson} compact={compact} onPress={() => onSelect(lesson)} />
              );
            })}
          </View>
        ))}
      </Row>
    </ScrollView>
  );
}

function LessonCell({
  lesson,
  compact,
  onPress,
}: {
  lesson: Lesson;
  compact: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  const style = subjectStyle(lesson.subject);
  const cancelled = lesson.state === 'cancelled';
  const substitution = lesson.state === 'substitution';

  return (
    <Pressable
      onPress={onPress}
      style={{
        height: compact ? 44 : 58,
        backgroundColor: cancelled ? tint(colors.danger, 0.10) : tint(style.color, 0.16),
        borderLeftWidth: 3,
        borderLeftColor: cancelled ? colors.danger : substitution ? colors.success : style.color,
      }}
      className="justify-center rounded-xl px-1.5 active:opacity-70"
    >
      <Text
        className="text-[11px] font-bold"
        numberOfLines={compact ? 1 : 2}
        adjustsFontSizeToFit={compact}
        minimumFontScale={0.8}
        style={{
          color: cancelled ? colors.danger : style.color,
          textDecorationLine: cancelled ? 'line-through' : 'none',
        }}
      >
        {lesson.subjectAbbr ?? (cancelled ? lesson.originalSubject ?? lesson.subject : lesson.subject)}
      </Text>
      {!compact ? (
        <>
          <Text className="text-[9px] text-muted" numberOfLines={1}>
            {lesson.start}
          </Text>
          {lesson.room ? (
            <Text className="text-[9px] text-faint" numberOfLines={1}>
              {lesson.room}
            </Text>
          ) : null}
        </>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ Tagesansicht (Phase 3) */

/**
 * Vertikale Tages-Timeline mit horizontalen Tages-Pills — das Phone-Erlebnis
 * des Stundenplans. Fächer stehen voll lesbar in Karten (kein Mini-Kachel-
 * Raster), Zeit läuft in einer eigenen Spalte neben einer farbigen Spur.
 */
function DayList({
  days,
  byDay,
  selected,
  onSelectDay,
  onSelect,
}: {
  days: string[];
  byDay: Map<string, Lesson[]>;
  selected: string;
  onSelectDay: (day: string) => void;
  onSelect: (lesson: Lesson) => void;
}) {
  const { colors } = useThemeColors();
  const active = days.includes(selected) ? selected : days[0];
  const lessons = byDay.get(active) ?? [];
  const now = nowMinutes();
  const isToday = active === toISO(new Date());
  const reserve = useTabNavReserve();

  const changeCount = lessons.filter((l) => l.state !== 'regular' && l.state !== 'cancelled').length;
  const cancelledCount = lessons.filter((l) => l.state === 'cancelled').length;
  const runningCount = lessons.filter(
    (l) => isToday && now >= minutesOf(l.start) && now < minutesOf(l.end),
  ).length;

  return (
    <View className="flex-1">
      {/* Horizontale Tages-Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-[76px] grow-0 px-4">
        <Row className="gap-2 py-2">
          {days.map((day) => {
            const date = new Date(day);
            const isActive = day === active;
            const count = byDay.get(day)?.filter((lesson) => lesson.state !== 'cancelled').length ?? 0;
            return (
              <Pressable
                key={day}
                onPress={() => onSelectDay(day)}
                className={`h-[62px] w-[56px] items-center justify-center rounded-[18px] ${
                  isActive ? 'bg-accent-amber' : 'border border-line bg-surface'
                }`}
                style={isActive ? shadow.card : undefined}
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wide ${
                    isActive ? 'text-on-amber/70' : 'text-faint'
                  }`}
                >
                  {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
                </Text>
                <Text className={`text-[19px] font-extrabold leading-6 ${isActive ? 'text-on-amber' : 'text-ink'}`}>
                  {date.getDate()}
                </Text>
                <View
                  className="h-[5px] w-[5px] rounded-full"
                  style={{
                    backgroundColor: count > 0 ? (isActive ? colors.on.amber : colors.accent.amber) : 'transparent',
                  }}
                />
              </Pressable>
            );
          })}
        </Row>
      </ScrollView>

      {/* Tageskopf: Datum + Änderungs-Statistik */}
      <Row className="justify-between px-4 pb-2 pt-1">
        <Text className="text-[19px] font-extrabold tracking-tight text-ink">{formatLongDay(active)}</Text>
        <Row className="gap-1.5">
          {runningCount > 0 ? <Chip label={`${runningCount} jetzt`} color={colors.accent.amber} tone="solid" /> : null}
          {cancelledCount > 0 ? <Chip label={`${cancelledCount} Entfall`} color={colors.danger} /> : null}
          {changeCount > 0 ? <Chip label={`${changeCount} Änderung`} color={colors.success} /> : null}
        </Row>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        {lessons.length === 0 ? (
          <EmptyState
            icon={Sun}
            iconColor={colors.accent.violet}
            title="Kein Unterricht"
            hint={
              isToday
                ? 'Heute ist nichts eingetragen. Genieß den Tag.'
                : 'Für diesen Tag ist nichts eingetragen.'
            }
          />
        ) : (
          <View className="pt-1">
            {lessons.map((lesson, index) => {
              const displaySubject = lessonMainSubject(lesson);
              const style = subjectStyle(displaySubject);
              const cancelled = lesson.state === 'cancelled';
              const substitution = lesson.state === 'substitution';
              const roomChange = lesson.state === 'room-change';
              const running = isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end);
              const past = isToday && now >= minutesOf(lesson.end);
              const accentColor = cancelled
                ? colors.danger
                : running
                  ? colors.accent.amber
                  : substitution
                    ? colors.success
                    : style.color;
              const stateChip =
                lesson.state === 'cancelled'
                  ? { label: 'Entfall', color: colors.danger, tone: 'solid' as const }
                  : lesson.state === 'substitution'
                    ? { label: 'Vertretung', color: colors.success, tone: 'solid' as const }
                    : lesson.state === 'room-change'
                      ? { label: 'Raumwechsel', color: colors.warning, tone: 'solid' as const }
                      : null;

              return (
                <FadeInUp key={lesson.id} delay={Math.min(index, 10) * 28}>
                  <View className="mb-2.5 flex-row">
                    {/* Zeitspalte */}
                    <View className="w-[52px] items-end pr-2.5 pt-3.5">
                      <Text className="text-[13px] font-bold text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                        {lesson.start}
                      </Text>
                      <Text className="text-[10px] font-semibold text-faint" style={{ fontVariant: ['tabular-nums'] }}>
                        {lesson.end}
                      </Text>
                    </View>

                    {/* Spur: Punkt + Linie */}
                    <View className="w-4 items-center">
                      <View
                        className="mt-2 h-[10px] w-[10px] rounded-full border-2"
                        style={{
                          backgroundColor: cancelled ? colors.surface : running ? colors.accent.amber : colors.surface,
                          borderColor: cancelled ? colors.danger : running ? colors.accent.amber : style.color,
                        }}
                      />
                      {index < lessons.length - 1 ? (
                        <View
                          className="w-[2px] flex-1 rounded-full"
                          style={{ backgroundColor: past ? colors.line : tint(style.color, 0.35) }}
                        />
                      ) : null}
                    </View>

                    {/* Karte mit voll lesbarem Fach */}
                    <Pressable
                      onPress={() => onSelect(lesson)}
                      className="flex-1 active:opacity-80"
                      style={{ opacity: past && !running && lesson.state === 'regular' ? 0.55 : 1 }}
                    >
                      <Card
                        padded={false}
                        className="overflow-hidden"
                        style={{
                          backgroundColor: cancelled
                            ? tint(colors.danger, 0.07)
                            : running
                              ? tint(colors.accent.amber, 0.10)
                              : tint(style.color, 0.08),
                          borderWidth: running ? 1.5 : 1,
                          borderColor: running
                            ? colors.accent.amber
                            : cancelled
                              ? tint(colors.danger, 0.45)
                              : colors.line,
                        }}
                      >
                        <View className="flex-row">
                          {/* Farbige Akzentkante */}
                          <View
                            style={{
                              width: 4,
                              backgroundColor: accentColor,
                              borderTopLeftRadius: 18,
                              borderBottomLeftRadius: 18,
                            }}
                          />
                          <View className="flex-1 gap-1 p-3">
                            <Row className="gap-2" style={{ alignItems: 'flex-start' }}>
                              <Text
                                className="flex-1 text-[16px] font-extrabold leading-[19px] text-ink"
                                numberOfLines={2}
                                style={
                                  cancelled
                                    ? { textDecorationLine: 'line-through', color: colors.faint }
                                    : undefined
                                }
                              >
                                {displaySubject}
                              </Text>
                              <View
                                className="mt-0.5 rounded-lg px-1.5 py-0.5"
                                style={{ backgroundColor: cancelled ? tint(colors.danger, 0.14) : tint(style.color, 0.16) }}
                              >
                                <Text
                                  className="text-[10px] font-extrabold"
                                  style={{ color: cancelled ? colors.danger : style.color }}
                                >
                                  {lesson.hour}. Std
                                </Text>
                              </View>
                            </Row>

                            {stateChip ? (
                              <View className="flex-row flex-wrap items-center gap-1.5 pt-0.5">
                                <Chip label={stateChip.label} color={stateChip.color} tone={stateChip.tone} />
                                {lesson.comment ? (
                                  <Text className="flex-1 text-[11.5px] leading-4 text-muted" numberOfLines={2}>
                                    {lesson.comment}
                                  </Text>
                                ) : null}
                              </View>
                            ) : null}

                            <Row className="flex-wrap gap-x-2 gap-y-0.5">
                              {lesson.teacher ? (
                                <Text className="text-[12px] font-semibold text-muted">{lesson.teacher}</Text>
                              ) : null}
                              {lesson.room ? (
                                <Text className="text-[12px] font-bold" style={{ color: style.color }}>
                                  Raum {lesson.room}
                                </Text>
                              ) : null}
                              {substitution && lesson.originalTeacher && lesson.originalTeacher !== lesson.teacher ? (
                                <Text className="text-[12px] text-faint">statt {lesson.originalTeacher}</Text>
                              ) : null}
                              {roomChange && lesson.originalRoom ? (
                                <Text className="text-[12px] font-bold" style={{ color: colors.warning }}>
                                  {lesson.originalRoom} → {lesson.room}
                                </Text>
                              ) : null}
                            </Row>

                            {running ? (
                              <View className="self-start pt-0.5">
                                <Chip label="läuft gerade" color={colors.accent.amber} tone="solid" />
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  </View>
                </FadeInUp>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Anzeige-Fach einer Stunde: Bei Vertretungen mit Platzhalter-Fach
 * (z. B. `subject = 'Vertretung'` + `originalSubject = 'Biologie'`) zeigt die
 * Timeline das eigentliche Fach und markiert den Zustand über den Chip.
 */
function lessonMainSubject(lesson: Lesson): string {
  if (lesson.state === 'cancelled') return lesson.originalSubject ?? lesson.subject;
  if (lesson.state === 'substitution' && lesson.subject !== lesson.originalSubject) {
    return lesson.originalSubject ?? lesson.subject;
  }
  return lesson.subject;
}

/* ------------------------------------------------------------------ Detail */

function LessonSheet({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  const { colors } = useThemeColors();
  const style = subjectStyle(lesson?.subject);
  const { data } = useSnapshot();

  const relatedHomework = data?.homework.filter(
    (item) => lesson && item.subject.toLowerCase() === lesson.subject.toLowerCase(),
  );
  const relatedExams = data?.exams.filter(
    (item) => lesson && item.subject.toLowerCase() === lesson.subject.toLowerCase(),
  );

  return (
    <Sheet open={Boolean(lesson)} onClose={onClose} title={lesson?.subject}>
      {lesson ? (
        <View className="gap-3">
          <Card style={{ backgroundColor: tint(style.color, 0.12) }}>
            <Row className="gap-3">
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: tint(style.color, 0.16) }}
              >
                <BookOpen size={22} strokeWidth={2.1} color={style.color} />
              </View>
              <View className="flex-1">
                <Text className="text-[17px] font-bold text-ink">
                  {lesson.hour}. Stunde · {lesson.start}–{lesson.end}
                </Text>
                {lesson.teacher ? (
                  <Row className="mt-1.5 gap-2">
                    <AvatarStack
                      items={[{ name: lesson.teacher, color: style.color }]}
                      size={22}
                    />
                    <Muted className="flex-1" numberOfLines={1}>
                      {lesson.teacher}
                      {lesson.room ? ` · ${lesson.room}` : ''}
                    </Muted>
                  </Row>
                ) : lesson.room ? (
                  <Muted>{lesson.room}</Muted>
                ) : null}
              </View>
            </Row>
          </Card>

          {lesson.state !== 'regular' ? (
            <Card>
              <Text className="text-[13px] font-bold text-ink">Änderung</Text>
              {lesson.state === 'substitution' && (lesson.originalTeacher || lesson.teacher) ? (
                <Row className="mt-2 gap-2">
                  <AvatarStack
                    items={[
                      lesson.originalTeacher ? { name: lesson.originalTeacher, color: colors.faint } : null,
                      lesson.teacher ? { name: lesson.teacher, color: style.color } : null,
                    ].filter(Boolean) as { name: string; color: string }[]}
                    size={24}
                  />
                </Row>
              ) : null}
              <Muted className="mt-1">
                {lesson.state === 'cancelled'
                  ? `${lesson.originalSubject ?? lesson.subject} entfällt.`
                  : lesson.state === 'substitution'
                    ? `Statt ${lesson.originalSubject ?? '—'} bei ${lesson.originalTeacher ?? '—'} findet ${lesson.subject} statt.`
                    : `Raum geändert: ${lesson.originalRoom ?? '—'} → ${lesson.room ?? '—'}`}
              </Muted>
              {lesson.comment ? <Muted className="mt-1">{lesson.comment}</Muted> : null}
            </Card>
          ) : null}

          {relatedHomework && relatedHomework.length > 0 ? (
            <Card>
              <Row className="gap-2">
                <ListChecks size={16} strokeWidth={2.1} color={colors.success} />
                <Text className="text-[13px] font-bold text-ink">Hausaufgaben in diesem Fach</Text>
              </Row>
              {relatedHomework.slice(0, 3).map((item) => (
                <Muted key={item.id} className="mt-1.5">
                  {item.text}
                </Muted>
              ))}
            </Card>
          ) : null}

          {relatedExams && relatedExams.length > 0 ? (
            <Card>
              <Row className="gap-2">
                <BarChart3 size={16} strokeWidth={2.1} color={colors.warning} />
                <Text className="text-[13px] font-bold text-ink">Anstehende Arbeiten</Text>
              </Row>
              {relatedExams.map((exam) => (
                <Muted key={exam.id} className="mt-1.5">
                  {exam.date} · {exam.type ?? 'Arbeit'}
                </Muted>
              ))}
            </Card>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ Rasteransicht (Desktop) */

const PX_PER_MINUTE = 1.35;
const RULER_WIDTH = 56;

function TimeGrid({
  days,
  byDay,
  onSelect,
}: {
  days: string[];
  byDay: Map<string, Lesson[]>;
  onSelect: (lesson: Lesson) => void;
}) {
  const { colors } = useThemeColors();
  const today = toISO(new Date());
  const now = nowMinutes();
  const reserve = useTabNavReserve();

  const all = days.flatMap((day) => byDay.get(day) ?? []);
  const startMinute = Math.max(6 * 60, Math.min(8 * 60, ...all.map((l) => minutesOf(l.start))) - 15);
  const endMinute = Math.min(19 * 60, Math.max(15 * 60, ...all.map((l) => minutesOf(l.end))) + 15);
  const totalMinutes = Math.max(60, endMinute - startMinute);
  const height = totalMinutes * PX_PER_MINUTE;

  const hourMarks: number[] = [];
  for (let m = Math.ceil(startMinute / 60) * 60; m < endMinute; m += 60) hourMarks.push(m);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: reserve }}>
      {/* Wochentage-Kopf */}
      <Row className="pt-1" style={{ paddingLeft: RULER_WIDTH }}>
        {days.map((day) => {
          const date = new Date(day);
          const isToday = day === today;
          return (
            <View key={day} className="flex-1 items-center pb-2">
              <Text className={`text-[11px] font-bold ${isToday ? 'text-accent-amber-deep' : 'text-faint'}`}>
                {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
              </Text>
              <View
                className={`mt-0.5 h-7 w-7 items-center justify-center rounded-full ${isToday ? 'bg-accent-amber' : ''}`}
              >
                <Text className={`text-[13px] font-bold ${isToday ? 'text-on-amber' : 'text-muted'}`}>
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </Row>

      <View style={{ height, flexDirection: 'row' }}>
        {/* Zeitleiste */}
        <View style={{ width: RULER_WIDTH, position: 'relative' }}>
          {hourMarks.map((m) => (
            <Text
              key={m}
              className="text-[11px] font-semibold text-faint"
              style={{ position: 'absolute', top: (m - startMinute) * PX_PER_MINUTE - 7, right: 8, fontVariant: ['tabular-nums'] }}
            >
              {String(Math.floor(m / 60)).padStart(2, '0')}:00
            </Text>
          ))}
        </View>

        {/* Tages-Spalten */}
        {days.map((day) => {
          const lessons = byDay.get(day) ?? [];
          const isToday = day === today;
          const showNow = isToday && now >= startMinute && now <= endMinute;
          return (
            <View
              key={day}
              className={`flex-1 overflow-hidden rounded-2xl ${isToday ? 'bg-accent-amber/10' : ''}`}
              style={{ position: 'relative', marginHorizontal: 2 }}
            >
              {hourMarks.map((m) => (
                <View
                  key={m}
                  className="bg-line/70"
                  style={{ position: 'absolute', top: (m - startMinute) * PX_PER_MINUTE, left: 0, right: 0, height: 1 }}
                />
              ))}

              {lessons.map((lesson) => {
                const top = (minutesOf(lesson.start) - startMinute) * PX_PER_MINUTE;
                const span = Math.max(30, (minutesOf(lesson.end) - minutesOf(lesson.start)) * PX_PER_MINUTE);
                const style = subjectStyle(lesson.subject);
                const cancelled = lesson.state === 'cancelled';
                const substitution = lesson.state === 'substitution';
                const running = isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end);
                return (
                  <Pressable
                    key={lesson.id}
                    onPress={() => onSelect(lesson)}
                    className="hover:opacity-85 active:opacity-70"
                    style={{
                      position: 'absolute',
                      top: top + 1,
                      height: span - 2,
                      left: 3,
                      right: 3,
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: cancelled ? tint(colors.danger, 0.10) : tint(style.color, 0.16),
                      borderLeftWidth: 3,
                      borderLeftColor: cancelled ? colors.danger : substitution ? colors.success : style.color,
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      className="text-[11.5px] font-bold"
                      style={{
                        color: cancelled ? colors.danger : style.color,
                        textDecorationLine: cancelled ? 'line-through' : 'none',
                      }}
                    >
                      {cancelled ? lesson.originalSubject ?? lesson.subject : lesson.subject}
                    </Text>
                    {span > 42 ? (
                      <Text className="text-[10px] text-muted" style={{ fontVariant: ['tabular-nums'] }}>
                        {lesson.start}–{lesson.end}
                        {lesson.room ? ` · ${lesson.room}` : ''}
                      </Text>
                    ) : null}
                    {span > 60 && lesson.teacher ? (
                      <Text numberOfLines={1} className="text-[10px] text-faint">
                        {lesson.teacher}
                      </Text>
                    ) : null}
                    {running ? (
                      <View className="mt-0.5 self-start rounded-md bg-accent-amber px-1.5 py-0.5">
                        <Text className="text-[9px] font-extrabold text-on-amber">JETZT</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}

              {showNow ? (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: (now - startMinute) * PX_PER_MINUTE,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: colors.danger,
                    borderRadius: 1,
                    zIndex: 5,
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      left: -3,
                      top: -3,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.danger,
                    }}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
