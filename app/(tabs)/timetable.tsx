import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import type { Lesson } from '@/api/types';
import { useSnapshot } from '@/data/queries';
import { subjectStyle, tint } from '@/design/subjects';
import {
  WEEKDAYS_SHORT, addDays, formatLongDay, minutesOf, nowMinutes, startOfWeek, toISO,
} from '@/lib/date';
import { Card, Chip, EmptyState, IconButton, Muted, Row, Screen, Sheet, Skeleton, Title } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useSettings } from '@/state/settings';

type ViewMode = 'week' | 'day';

export default function TimetableScreen() {
  const { data, isLoading } = useSnapshot();
  const showWeekend = useSettings((state) => state.settings.showWeekend);
  const compact = useSettings((state) => state.settings.compactTimetable);
  const { width } = useWindowDimensions();

  const [weekOffset, setWeekOffset] = useState(0);
  const [mode, setMode] = useState<ViewMode>(width > 620 ? 'week' : 'day');
  const [selectedDay, setSelectedDay] = useState(() => toISO(new Date()));
  const [detail, setDetail] = useState<Lesson | null>(null);

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

  return (
    <Screen>
      <View className="px-4 pb-2 pt-2">
        <Row className="justify-between">
          <View>
            <Title>Stundenplan</Title>
            <Muted>
              {weekOffset === 0 ? 'Diese Woche' : weekOffset === 1 ? 'Nächste Woche' : weekLabel} · {weekLabel}
            </Muted>
          </View>
          <Row className="gap-2">
            <IconButton icon="chevron-back" onPress={() => setWeekOffset((value) => value - 1)} color="#6A7086" size={36} />
            <Pressable
              onPress={() => setWeekOffset(0)}
              className="h-9 items-center justify-center rounded-xl bg-brand-soft px-3"
            >
              <Text className="text-[12px] font-bold text-brand-ink">Heute</Text>
            </Pressable>
            <IconButton icon="chevron-forward" onPress={() => setWeekOffset((value) => value + 1)} color="#6A7086" size={36} />
          </Row>
        </Row>

        <Row className="mt-3 gap-2">
          <Chip label={`${stats.total} Stunden`} color="#6C5CE7" />
          {stats.cancelled > 0 ? <Chip label={`${stats.cancelled} Entfall`} color="#E24848" /> : null}
          {stats.substitutions > 0 ? <Chip label={`${stats.substitutions} Vertretung`} color="#22B07A" /> : null}
          <View className="flex-1" />
          <Pressable
            onPress={() => setMode(mode === 'week' ? 'day' : 'week')}
            className="rounded-xl bg-line/60 px-3 py-1.5"
          >
            <Text className="text-[11px] font-bold text-muted">{mode === 'week' ? 'Tagesansicht' : 'Wochenansicht'}</Text>
          </Pressable>
        </Row>
      </View>

      {isLoading || !data ? (
        <View className="gap-3 px-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </View>
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

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 12, paddingBottom: 110 }}>
      <Row className="gap-1.5">
        {days.map((day) => {
          const date = new Date(day);
          const isToday = day === today;
          return (
            <View key={day} className="flex-1 items-center">
              <Text className={`text-[11px] font-bold ${isToday ? 'text-brand' : 'text-faint'}`}>
                {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
              </Text>
              <View
                className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full ${isToday ? 'bg-brand' : ''}`}
              >
                <Text className={`text-[12px] font-bold ${isToday ? 'text-white' : 'text-muted'}`}>
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
  const style = subjectStyle(lesson.subject);
  const cancelled = lesson.state === 'cancelled';
  const substitution = lesson.state === 'substitution';

  return (
    <Pressable
      onPress={onPress}
      style={{
        height: compact ? 44 : 58,
        backgroundColor: cancelled ? 'rgba(226,72,72,0.10)' : tint(style.color, 0.16),
        borderLeftWidth: 3,
        borderLeftColor: cancelled ? '#E24848' : substitution ? '#22B07A' : style.color,
      }}
      className="justify-center rounded-xl px-1.5 active:opacity-70"
    >
      <Text
        className="text-[11px] font-bold"
        numberOfLines={1}
        style={{
          color: cancelled ? '#E24848' : style.color,
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
  const active = days.includes(selected) ? selected : days[0];
  const lessons = byDay.get(active) ?? [];
  const now = nowMinutes();
  const isToday = active === toISO(new Date());

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
                  isActive ? 'bg-brand' : 'bg-surface'
                }`}
              >
                <Text className={`text-[10px] font-bold ${isActive ? 'text-white/80' : 'text-faint'}`}>
                  {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
                </Text>
                <Text className={`text-[16px] font-extrabold ${isActive ? 'text-white' : 'text-ink'}`}>
                  {date.getDate()}
                </Text>
                <View className={`h-1 w-1 rounded-full ${count > 0 ? (isActive ? 'bg-white' : 'bg-brand') : ''}`} />
              </Pressable>
            );
          })}
        </Row>
      </ScrollView>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 110 }}>
        <Muted className="mb-2 mt-1">{formatLongDay(active)}</Muted>
        {lessons.length === 0 ? (
          <EmptyState emoji="🌴" title="Kein Unterricht" hint="Für diesen Tag ist nichts eingetragen." />
        ) : (
          lessons.map((lesson, index) => {
            const style = subjectStyle(lesson.subject);
            const cancelled = lesson.state === 'cancelled';
            const running = isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end);

            return (
              <FadeInUp key={lesson.id} delay={index * 30}>
                <Pressable onPress={() => onSelect(lesson)} className="mb-2 active:opacity-80">
                  <Card padded={false} className={running ? 'border-2 border-brand' : ''}>
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

                      <View className="w-1 self-stretch rounded-full" style={{ backgroundColor: cancelled ? '#E24848' : style.color }} />

                      <View className="flex-1">
                        <Text
                          className="text-[16px] font-bold text-ink"
                          style={cancelled ? { textDecorationLine: 'line-through', color: '#9CA2B6' } : undefined}
                        >
                          {style.emoji} {cancelled ? lesson.originalSubject ?? lesson.subject : lesson.subject}
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
                              color={cancelled ? '#E24848' : '#22B07A'}
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

                      {running ? <Chip label="jetzt" color="#6C5CE7" tone="solid" /> : null}
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
              <Text className="text-[30px]">{style.emoji}</Text>
              <View className="flex-1">
                <Text className="text-[17px] font-bold text-ink">
                  {lesson.hour}. Stunde · {lesson.start}–{lesson.end}
                </Text>
                <Muted>{[lesson.teacher, lesson.room].filter(Boolean).join(' · ')}</Muted>
              </View>
            </Row>
          </Card>

          {lesson.state !== 'regular' ? (
            <Card>
              <Text className="text-[13px] font-bold text-ink">Änderung</Text>
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
              <Text className="text-[13px] font-bold text-ink">📝 Hausaufgaben in diesem Fach</Text>
              {relatedHomework.slice(0, 3).map((item) => (
                <Muted key={item.id} className="mt-1.5">
                  {item.text}
                </Muted>
              ))}
            </Card>
          ) : null}

          {relatedExams && relatedExams.length > 0 ? (
            <Card>
              <Text className="text-[13px] font-bold text-ink">📊 Anstehende Arbeiten</Text>
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
