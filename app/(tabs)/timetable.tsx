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
          {!layout.isDesktop ? (
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
      ) : mode === 'week' ? (
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

/* ------------------------------------------------------------------ Tagesansicht */

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

  return (
    <View className="flex-1">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-[70px] grow-0 px-4">
        <Row className="gap-2 py-2">
          {days.map((day) => {
            const date = new Date(day);
            const isActive = day === active;
            const count = byDay.get(day)?.filter((lesson) => lesson.state !== 'cancelled').length ?? 0;
            return (
              <Pressable
                key={day}
                onPress={() => onSelectDay(day)}
                className={`h-[52px] w-[52px] items-center justify-center rounded-2xl ${
                  isActive ? 'bg-accent-amber' : 'bg-surface'
                }`}
              >
                <Text className={`text-[10px] font-bold ${isActive ? 'text-on-amber/80' : 'text-faint'}`}>
                  {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
                </Text>
                <Text className={`text-[16px] font-extrabold ${isActive ? 'text-on-amber' : 'text-ink'}`}>
                  {date.getDate()}
                </Text>
                <View className={`h-1 w-1 rounded-full ${count > 0 ? (isActive ? 'bg-on-amber' : 'bg-accent-amber') : ''}`} />
              </Pressable>
            );
          })}
        </Row>
      </ScrollView>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        <Muted className="mb-2 mt-1">{formatLongDay(active)}</Muted>
        {lessons.length === 0 ? (
          <EmptyState icon={Sun} iconColor={colors.accent.violet} title="Kein Unterricht" hint="Für diesen Tag ist nichts eingetragen." />
        ) : (
          lessons.map((lesson, index) => {
            const style = subjectStyle(lesson.subject);
            const cancelled = lesson.state === 'cancelled';
            const running = isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end);

            return (
              <FadeInUp key={lesson.id} delay={index * 30}>
                <Pressable onPress={() => onSelect(lesson)} className="mb-2 active:opacity-80">
                  <Card
                    padded={false}
                    className={running ? 'border-2 border-accent-amber' : ''}
                    style={{ backgroundColor: tint(style.color, 0.10) }}
                  >
                    <Row className="gap-3 p-3">
                      <View className="w-12 items-center">
                        <Text className="text-[13px] font-bold text-ink">{lesson.start}</Text>
                        <Text className="text-[11px] text-faint">{lesson.end}</Text>
                        <View
                          className="mt-1 rounded-md px-1.5"
                          style={{ backgroundColor: tint(style.color, 0.16) }}
                        >
                          <Text className="text-[10px] font-bold" style={{ color: style.color }}>
                            {lesson.hour}.
                          </Text>
                        </View>
                      </View>

                      <View className="w-1 self-stretch rounded-full" style={{ backgroundColor: cancelled ? colors.danger : style.color }} />

                      <View className="flex-1">
                        <Text
                          className="text-[16px] font-bold text-ink"
                          style={cancelled ? { textDecorationLine: 'line-through', color: colors.faint } : undefined}
                        >
                          {cancelled ? lesson.originalSubject ?? lesson.subject : lesson.subject}
                        </Text>
                        <Muted className="mt-0.5">
                          {[lesson.teacher, lesson.room].filter(Boolean).join(' · ') || '—'}
                        </Muted>
                        {lesson.state !== 'regular' ? (
                          <Row className="mt-1.5 gap-2">
                            <Chip
                              label={
                                cancelled ? 'Entfall' : lesson.state === 'substitution' ? 'Vertretung' : 'Raumwechsel'
                              }
                              color={cancelled ? colors.danger : colors.success}
                              tone="solid"
                            />
                            {lesson.comment ? (
                              <Muted className="flex-1 text-[11px]" numberOfLines={1}>
                                {lesson.comment}
                              </Muted>
                            ) : null}
                          </Row>
                        ) : null}
                      </View>

                      {running ? <Chip label="jetzt" color={colors.accent.amber} tone="solid" /> : null}
                    </Row>
                  </Card>
                </Pressable>
              </FadeInUp>
            );
          })
        )}
      </ScrollView>
    </View>
  );
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
