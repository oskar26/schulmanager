import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BarChart3, BookOpen, Clock, ListChecks, MapPin, Sun, User } from 'lucide-react-native';

import type { Lesson } from '@/api/types';
import { useSnapshot } from '@/data/queries';
import { subjectIcon, subjectStyle, tint } from '@/design/subjects';
import {
  WEEKDAYS_SHORT, addDays, formatLongDay, minutesOf, nowMinutes, startOfWeek, toISO,
} from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import {
  AdaptiveContent,
  AvatarStack,
  Card,
  Chip,
  ColorBlockCard,
  EmptyState,
  IconBadge,
  IconButton,
  Muted,
  Pill,
  Row,
  Screen,
  Sheet,
  Skeleton,
  Title,
} from '@/ui/primitives';
import { FadeInUp, PressableOpacity, PressableScale } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, radius, shadow } from '@/design/tokens';

type ViewMode = 'week' | 'day';

export default function TimetableScreen() {
  const { colors } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const showWeekend = useSettings((state) => state.settings.showWeekend);
  const compact = useSettings((state) => state.settings.compactTimetable);
  const layout = useLayout();

  const [mode, setMode] = useState<ViewMode>(layout.width > 620 ? 'week' : 'day');
  const [selectedDay, setSelectedDay] = useState(() => toISO(new Date()));
  const [detail, setDetail] = useState<Lesson | null>(null);
  const wide = layout.navigation !== 'bottom';

  // 2-Wochen-Stack: Woche 1 (diese Woche) & Woche 2 (nächste Woche)
  const currentMonday = useMemo(() => startOfWeek(new Date()), []);
  const nextMonday = useMemo(() => addDays(currentMonday, 7), [currentMonday]);

  const week1Days = useMemo(
    () => Array.from({ length: showWeekend ? 7 : 5 }, (_, index) => toISO(addDays(currentMonday, index))),
    [currentMonday, showWeekend],
  );

  const week2Days = useMemo(
    () => Array.from({ length: showWeekend ? 7 : 5 }, (_, index) => toISO(addDays(nextMonday, index))),
    [nextMonday, showWeekend],
  );

  const allDays = useMemo(() => [...week1Days, ...week2Days], [week1Days, week2Days]);

  const byDay = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    allDays.forEach((day) => map.set(day, []));
    (data?.lessons ?? []).forEach((lesson) => {
      if (map.has(lesson.date)) map.get(lesson.date)!.push(lesson);
    });
    map.forEach((lessons) => lessons.sort((a, b) => a.start.localeCompare(b.start)));
    return map;
  }, [data?.lessons, allDays]);

  const activeLessons = byDay.get(selectedDay) ?? [];
  const activeStats = useMemo(() => {
    return {
      total: activeLessons.length,
      cancelled: activeLessons.filter((l) => l.state === 'cancelled').length,
      substitutions: activeLessons.filter((l) => l.state === 'substitution').length,
    };
  }, [activeLessons]);

  const content = (
    <>
      <View className={`pb-2 pt-2 ${wide ? '' : 'px-4'}`}>
        <Row className="justify-between">
          <View>
            <Title className={layout.isDesktop ? 'text-[26px]' : undefined}>Stundenplan</Title>
            <Muted className="text-[13px] font-medium">2-Wochen-Übersicht · Gestapelt</Muted>
          </View>
          <Row className="gap-2">
            <PressableOpacity
              onPress={() => setSelectedDay(toISO(new Date()))}
              className="min-h-[44px] items-center justify-center rounded-2xl bg-accent-amber/20 px-4 hover:bg-accent-amber/30"
              accessibilityRole="button"
              accessibilityLabel="Zu heute springen"
            >
              <Text className="text-[12px] font-extrabold text-on-amber">Heute</Text>
            </PressableOpacity>
          </Row>
        </Row>
      </View>

      {isLoading || !data ? (
        <View className={`gap-3 ${wide ? '' : 'px-4'}`}>
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
        </View>
      ) : layout.isDesktop ? (
        <TimeGrid days={week1Days} byDay={byDay} onSelect={setDetail} />
      ) : layout.isTablet && mode === 'week' ? (
        <WeekGrid days={week1Days} byDay={byDay} compact={compact} onSelect={setDetail} />
      ) : (
        <TwoWeekStackedDayList
          week1Days={week1Days}
          week2Days={week2Days}
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

/* ------------------------------------------------------------------ 2-Wochen-Stack Ansicht */

interface TwoWeekProps {
  week1Days: string[];
  week2Days: string[];
  byDay: Map<string, Lesson[]>;
  selected: string;
  onSelectDay: (day: string) => void;
  onSelect: (lesson: Lesson) => void;
}

function TwoWeekStackedDayList({
  week1Days,
  week2Days,
  byDay,
  selected,
  onSelectDay,
  onSelect,
}: TwoWeekProps) {
  const { colors, isDark } = useThemeColors();
  const reserve = useTabNavReserve();
  const now = nowMinutes();
  const isToday = selected === toISO(new Date());
  const lessons = byDay.get(selected) ?? [];

  const runningCount = lessons.filter(
    (l) => isToday && now >= minutesOf(l.start) && now < minutesOf(l.end),
  ).length;
  const cancelledCount = lessons.filter((l) => l.state === 'cancelled').length;
  const subCount = lessons.filter((l) => l.state === 'substitution').length;

  const renderDayStrip = (days: string[], title: string) => (
    <View className="mb-2">
      <Text className="mb-1.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-muted">
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        <Row className="gap-2">
          {days.map((day) => {
            const date = new Date(day);
            const isDaySelected = day === selected;
            const dayLessons = byDay.get(day) ?? [];
            const hasSub = dayLessons.some((l) => l.state === 'substitution');
            const hasCancel = dayLessons.some((l) => l.state === 'cancelled');
            const isRealToday = day === toISO(new Date());

            return (
              <PressableScale
                key={day}
                onPress={() => onSelectDay(day)}
                scale={0.93}
                style={[
                  {
                    width: 58,
                    height: 64,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDaySelected
                      ? colors.accent.amber
                      : colors.surface,
                    ...(isDaySelected ? shadow.card : {}),
                    borderWidth: isDaySelected ? 0 : isRealToday ? 1.5 : 1,
                    borderColor: isRealToday ? colors.accent.amber : colors.line,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isDaySelected }}
              >
                <Text
                  className={`text-[10px] font-extrabold uppercase tracking-wide ${
                    isDaySelected ? 'text-on-amber' : 'text-faint'
                  }`}
                >
                  {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
                </Text>
                <Text
                  className={`mt-0.5 text-[20px] font-extrabold leading-6 ${
                    isDaySelected ? 'text-on-amber' : 'text-ink'
                  }`}
                >
                  {date.getDate()}
                </Text>

                {/* Status-Punkte direkt im Pill: grün = Vertretung, grau/rot = Ausfall */}
                <Row className="mt-1 h-2 items-center gap-1">
                  {hasSub ? (
                    <View
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: isDaySelected ? colors.on.amber : colors.success }}
                    />
                  ) : null}
                  {hasCancel ? (
                    <View
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: isDaySelected ? colors.on.amber : colors.danger }}
                    />
                  ) : null}
                  {!hasSub && !hasCancel && dayLessons.length > 0 ? (
                    <View
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: isDaySelected
                          ? colors.on.amber
                          : isDark
                            ? colors.faint
                            : colors.line,
                      }}
                    />
                  ) : null}
                </Row>
              </PressableScale>
            );
          })}
        </Row>
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1">
      {/* 2 Wochen gestapelt als zwei Streifen */}
      <View className="pt-1">
        {renderDayStrip(week1Days, 'Diese Woche')}
        {renderDayStrip(week2Days, 'Nächste Woche')}
      </View>

      {/* Ausgewählter Tag & Zusammenfassung */}
      <Row className="justify-between px-5 pb-2 pt-2">
        <Text className="text-[19px] font-extrabold tracking-tight text-ink">
          {formatLongDay(selected)}
        </Text>
        <Row className="gap-1.5">
          {runningCount > 0 ? <Pill label={`${runningCount} jetzt`} color={colors.accent.amber} tone="solid" /> : null}
          {cancelledCount > 0 ? <Pill label={`${cancelledCount} Entfall`} color={colors.danger} tone="solid" /> : null}
          {subCount > 0 ? <Pill label={`${subCount} Vertretung`} color={colors.success} tone="solid" /> : null}
        </Row>
      </Row>

      {/* Stunden-Liste als vollflächige Farbblöcke */}
      <ScrollView className="flex-1 px-4 pt-1" contentContainerStyle={{ paddingBottom: reserve }}>
        {lessons.length === 0 ? (
          <EmptyState
            icon={Sun}
            iconColor={colors.accent.amber}
            title="Kein Unterricht eingetragen"
            hint={
              isToday
                ? 'Heute ist kein Unterricht eingetragen. Genieß den Tag!'
                : 'Für diesen Tag sind keine Stunden hinterlegt.'
            }
          />
        ) : (
          <View className="gap-3">
            {lessons.map((lesson, index) => {
              const displaySubject = lessonMainSubject(lesson);
              const style = subjectStyle(displaySubject);
              const SubIcon = subjectIcon(displaySubject);
              const cancelled = lesson.state === 'cancelled';
              const substitution = lesson.state === 'substitution';
              const roomChange = lesson.state === 'room-change';
              const running = isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end);

              const cardBg = cancelled
                ? tint(colors.danger, isDark ? 0.22 : 0.12)
                : running
                  ? tint(colors.accent.amber, isDark ? 0.25 : 0.16)
                  : tint(style.color, isDark ? 0.22 : 0.14);

              return (
                <FadeInUp key={lesson.id} delay={Math.min(index, 10) * 35}>
                  <PressableScale
                    onPress={() => onSelect(lesson)}
                    className="overflow-hidden rounded-[26px] p-4"
                    style={{
                      backgroundColor: cardBg,
                      ...shadow.card,
                    }}
                  >
                    <Row className="justify-between">
                      <Row className="flex-1 gap-3">
                        <IconBadge
                          icon={SubIcon}
                          color={cancelled ? colors.danger : style.color}
                          tone="solid"
                          size={46}
                          iconSize={22}
                        />
                        <View className="flex-1">
                          <Row className="gap-2">
                            <Text
                              className="text-[18px] font-extrabold leading-[22px] text-ink"
                              style={
                                cancelled
                                  ? { textDecorationLine: 'line-through', opacity: 0.7 }
                                  : undefined
                              }
                              numberOfLines={1}
                            >
                              {displaySubject}
                            </Text>
                          </Row>
                          <Row className="mt-1 items-center gap-2">
                            <Row className="gap-1">
                              <Clock size={12} color={colors.muted} />
                              <Text className="text-[12px] font-extrabold text-muted">
                                {lesson.start}–{lesson.end}
                              </Text>
                            </Row>
                            {lesson.room ? (
                              <Row className="gap-1">
                                <MapPin size={12} color={style.color} />
                                <Text className="text-[12px] font-extrabold" style={{ color: style.color }}>
                                  Raum {lesson.room}
                                </Text>
                              </Row>
                            ) : null}
                          </Row>
                        </View>
                      </Row>

                      <View className="items-end gap-1.5">
                        <View
                          className="rounded-xl px-2 py-1"
                          style={{
                            backgroundColor: cancelled
                              ? colors.danger
                              : running
                                ? colors.accent.amber
                                : style.color,
                          }}
                        >
                          <Text
                            className="text-[11px] font-extrabold"
                            style={{
                              color: foregroundOn(
                                cancelled ? colors.danger : running ? colors.accent.amber : style.color,
                                colors,
                              ),
                            }}
                          >
                            {lesson.hour}. Std
                          </Text>
                        </View>
                      </View>
                    </Row>

                    {/* Auffällige Badges bei Vertretung / Entfall / Raumwechsel */}
                    {lesson.state !== 'regular' || lesson.teacher || running ? (
                      <Row className="mt-3 flex-wrap items-center justify-between border-t border-black/5 pt-2.5">
                        <Row className="flex-1 flex-wrap gap-1.5">
                          {cancelled ? (
                            <Pill label="Unterricht entfällt" color={colors.danger} tone="solid" />
                          ) : substitution ? (
                            <Pill label="Vertretungsstunde" color={colors.success} tone="solid" />
                          ) : roomChange ? (
                            <Pill label="Raumwechsel" color={colors.warning} tone="solid" />
                          ) : null}

                          {running ? (
                            <Pill label="JETZT LÄUFT" color={colors.accent.amber} tone="solid" />
                          ) : null}

                          {lesson.comment ? (
                            <Text className="flex-1 text-[12px] font-medium text-muted" numberOfLines={1}>
                              {lesson.comment}
                            </Text>
                          ) : null}
                        </Row>

                        {lesson.teacher ? (
                          <Row className="gap-1">
                            <User size={13} color={colors.muted} />
                            <Text className="text-[12px] font-bold text-muted">{lesson.teacher}</Text>
                          </Row>
                        ) : null}
                      </Row>
                    ) : null}
                  </PressableScale>
                </FadeInUp>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function lessonMainSubject(lesson: Lesson): string {
  if (lesson.state === 'cancelled') return lesson.originalSubject ?? lesson.subject;
  if (lesson.state === 'substitution' && lesson.subject !== lesson.originalSubject) {
    return lesson.originalSubject ?? lesson.subject;
  }
  return lesson.subject;
}

/* ------------------------------------------------------------------ Detail-Sheet */

function LessonSheet({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  const { colors } = useThemeColors();
  const style = subjectStyle(lesson?.subject);
  const SubIcon = subjectIcon(lesson?.subject);
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
          <ColorBlockCard color={style.color} tone="tint">
            <Row className="gap-3">
              <IconBadge icon={SubIcon} color={style.color} size={48} iconSize={24} tone="solid" />
              <View className="flex-1">
                <Text className="text-[18px] font-extrabold text-ink">
                  {lesson.hour}. Stunde · {lesson.start}–{lesson.end} Uhr
                </Text>
                {lesson.teacher ? (
                  <Row className="mt-1.5 gap-2">
                    <AvatarStack items={[{ name: lesson.teacher, color: style.color }]} size={24} />
                    <Muted className="flex-1 font-bold" numberOfLines={1}>
                      {lesson.teacher}
                      {lesson.room ? ` · Raum ${lesson.room}` : ''}
                    </Muted>
                  </Row>
                ) : lesson.room ? (
                  <Muted className="font-bold">Raum {lesson.room}</Muted>
                ) : null}
              </View>
            </Row>
          </ColorBlockCard>

          {lesson.state !== 'regular' ? (
            <ColorBlockCard
              color={lesson.state === 'cancelled' ? colors.danger : colors.success}
              tone="tint"
            >
              <Text className="text-[14px] font-extrabold text-ink">Besonderheit / Änderung</Text>
              <Muted className="mt-1 text-[13px] font-semibold text-ink">
                {lesson.state === 'cancelled'
                  ? `${lesson.originalSubject ?? lesson.subject} entfällt.`
                  : lesson.state === 'substitution'
                    ? `Statt ${lesson.originalSubject ?? '—'} bei ${lesson.originalTeacher ?? '—'} findet ${lesson.subject} statt.`
                    : `Raum geändert: ${lesson.originalRoom ?? '—'} → ${lesson.room ?? '—'}`}
              </Muted>
              {lesson.comment ? <Muted className="mt-1 text-[12px]">{lesson.comment}</Muted> : null}
            </ColorBlockCard>
          ) : null}

          {relatedHomework && relatedHomework.length > 0 ? (
            <Card>
              <Row className="gap-2">
                <ListChecks size={18} strokeWidth={2.4} color={colors.success} />
                <Text className="text-[14px] font-extrabold text-ink">Hausaufgaben</Text>
              </Row>
              {relatedHomework.slice(0, 3).map((item) => (
                <Muted key={item.id} className="mt-2 text-[13px] font-medium text-ink">
                  • {item.text}
                </Muted>
              ))}
            </Card>
          ) : null}

          {relatedExams && relatedExams.length > 0 ? (
            <Card>
              <Row className="gap-2">
                <BarChart3 size={18} strokeWidth={2.4} color={colors.warning} />
                <Text className="text-[14px] font-extrabold text-ink">Klassenarbeiten</Text>
              </Row>
              {relatedExams.map((exam) => (
                <Muted key={exam.id} className="mt-2 text-[13px] font-medium text-ink">
                  • {exam.date}: {exam.type ?? 'Arbeit'}
                </Muted>
              ))}
            </Card>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ Tablet & Desktop Rastern */

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
              const style = subjectStyle(lesson.subject);
              const cancelled = lesson.state === 'cancelled';
              const substitution = lesson.state === 'substitution';

              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => onSelect(lesson)}
                  style={{
                    height: compact ? 44 : 58,
                    backgroundColor: cancelled ? tint('#E05353', 0.12) : tint(style.color, 0.18),
                    borderRadius: 12,
                    padding: 4,
                    justifyContent: 'center',
                  }}
                  className="hover:opacity-85 active:opacity-70"
                >
                  <Text
                    className="text-[11px] font-bold"
                    numberOfLines={compact ? 1 : 2}
                    style={{ color: cancelled ? '#E05353' : style.color }}
                  >
                    {lesson.subject}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </Row>
    </ScrollView>
  );
}

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
                      backgroundColor: cancelled ? tint(colors.danger, 0.12) : tint(style.color, 0.20),
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
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
