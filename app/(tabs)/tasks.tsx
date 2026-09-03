import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  Undo2,
} from 'lucide-react-native';

import type { Homework } from '@/api/types';
import { useHomeworkDone, useSnapshot } from '@/data/queries';
import { subjectStyle, tint } from '@/design/subjects';
import { buildStudyPlan } from '@/features/tasks/studyplan';
import { addDays, daysUntil, formatRelativeDay, toISO } from '@/lib/date';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import {
  Card,
  Chip,
  Divider,
  EmptyState,
  Muted,
  Pill,
  Row,
  Screen,
  SectionHeader,
  SegmentedControl,
  Sheet,
  Skeleton,
  Title,
} from '@/ui/primitives';
import { FadeInUp, PressableScale } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Progress } from '@/ui/gluestack/feedback';
import { useThemeColors } from '@/design/theme';
import { foregroundOn } from '@/design/tokens';
import type { ThemePalette } from '@/design/tokens';

type Tab = 'homework' | 'exams' | 'plan';

/* ------------------------------------------------------------------ Prioritäts-Farben (Phase 3) */

/**
 * Farbcodierung der Aufgaben-Karten:
 * Coral  = dringend (überfällig / heute)  ·  Amber = bald (morgen / in wenigen Tagen)
 * Lime   = erledigt / ok                 ·  Violet = entspannt (später)
 */
function priorityMeta(days: number, colors: ThemePalette) {
  if (days < 0) return { color: colors.danger, label: days === -1 ? 'Gestern fällig' : `${-days} Tage überfällig`, urgent: true };
  if (days === 0) return { color: colors.danger, label: 'Heute fällig', urgent: true };
  if (days === 1) return { color: colors.warning, label: 'Morgen fällig', urgent: true };
  if (days <= 3) return { color: colors.warning, label: `In ${days} Tagen`, urgent: true };
  return { color: colors.accent.violet, label: formatRelativeDay(toISO(addDays(new Date(), days))), urgent: false };
}

export default function TasksScreen() {
  const { colors } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const toggle = useHomeworkDone((state) => state.toggle);
  const reserve = useTabNavReserve();
  const [tab, setTab] = useState<Tab>('homework');
  const [detail, setDetail] = useState<Homework | null>(null);

  const homework = data?.homework ?? []; // done-Flag ist in useSnapshot bereits eingemischt
  const open = homework.filter((item) => !item.done);
  const done = homework.filter((item) => item.done);
  const upcomingExams = (data?.exams ?? []).filter((exam) => daysUntil(exam.date) >= 0);
  const plan = useMemo(() => (data ? buildStudyPlan(data) : []), [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof open>();
    [...open]
      .sort((a, b) => a.due.localeCompare(b.due))
      .forEach((item) => {
        const list = map.get(item.due) ?? [];
        list.push(item);
        map.set(item.due, list);
      });
    return Array.from(map.entries());
  }, [open]);

  const planByDay = useMemo(() => {
    const map = new Map<string, typeof plan>();
    plan.forEach((block) => {
      const list = map.get(block.date) ?? [];
      list.push(block);
      map.set(block.date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [plan]);

  const markDone = (item: Homework) => {
    hapticSuccess();
    toggle(item.id);
    setDetail((current) => (current && current.id === item.id ? null : current));
  };

  return (
    <Screen adaptive="content">
      <View className="px-4 pb-3 pt-2">
        <Title>Aufgaben</Title>
        <Muted className="mb-3">Hausaufgaben, Arbeiten und dein Lernplan</Muted>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'homework', label: 'Hausaufgaben', badge: open.length },
            { value: 'exams', label: 'Arbeiten', badge: upcomingExams.length },
            { value: 'plan', label: 'Lernplan' },
          ]}
        />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        {isLoading || !data ? (
          <View className="gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </View>
        ) : tab === 'homework' ? (
          <>
            {homework.length > 0 ? (
              <Card className="mb-3" padded={false}>
                <View className="flex-row items-center gap-3 p-4">
                  <View className="flex-1">
                    <Row className="justify-between">
                      <Text className="text-[13px] font-bold text-ink">
                        {done.length} von {homework.length} erledigt
                      </Text>
                      <Text
                        className="text-[13px] font-extrabold"
                        style={{ color: done.length === homework.length ? colors.success : colors.accent.amberDeep }}
                      >
                        {Math.round((done.length / homework.length) * 100)} %
                      </Text>
                    </Row>
                    <Progress
                      value={(done.length / homework.length) * 100}
                      className="mt-2"
                      color={done.length === homework.length ? colors.success : undefined}
                    />
                  </View>
                </View>
              </Card>
            ) : null}

            {grouped.length === 0 ? (
              <EmptyState
                icon={CheckCheck}
                iconColor={colors.success}
                title="Keine offenen Aufgaben"
                hint="Alles abgehakt. Genieß den Nachmittag."
              />
            ) : (
              grouped.map(([due, items], groupIndex) => {
                const days = daysUntil(due);
                const headerColor =
                  days < 0 ? colors.danger : days <= 1 ? colors.warning : colors.accent.violet;
                const HeaderIcon =
                  days < 0 ? AlertTriangle : days === 0 ? Clock : CalendarDays;
                return (
                  <View key={due}>
                    <SectionHeader
                      title={formatRelativeDay(due)}
                      icon={HeaderIcon}
                      iconColor={headerColor}
                      action={days < 0 ? `${-days} Tag(e) überfällig` : undefined}
                    />
                    {items.map((item, index) => (
                      <FadeInUp key={item.id} delay={(groupIndex * 3 + index) * 30}>
                        <OpenHomeworkCard
                          item={item}
                          onOpen={() => {
                            hapticLight();
                            setDetail(item);
                          }}
                          onToggle={() => markDone(item)}
                        />
                      </FadeInUp>
                    ))}
                  </View>
                );
              })
            )}

            {done.length > 0 ? (
              <>
                <SectionHeader title="Erledigt" icon={CheckCheck} iconColor={colors.success} />
                {done.map((item) => (
                  <DoneHomeworkCard key={item.id} item={item} onToggle={() => markDone(item)} />
                ))}
              </>
            ) : null}
          </>
        ) : tab === 'exams' ? (
          upcomingExams.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              iconColor={colors.warning}
              title="Keine Arbeiten angekündigt"
              hint="Aktuell steht nichts an."
            />
          ) : (
            <>
              <View className="mb-3">
                <Chip
                  label="Coral = dringend · Amber = bald · Lime = entspannt"
                  color={colors.faint}
                />
              </View>
              {upcomingExams.map((exam, index) => {
                const style = subjectStyle(exam.subject);
                const days = daysUntil(exam.date);
                const tone = days <= 1 ? colors.danger : days <= 5 ? colors.warning : colors.success;
                const blocks = plan.filter((block) => block.examId === exam.id);
                return (
                  <FadeInUp key={exam.id} delay={index * 40}>
                    <Card
                      className="mb-2 overflow-hidden"
                      padded={false}
                      style={{
                        backgroundColor: tint(tone, 0.07),
                        borderWidth: 1,
                        borderColor: tint(tone, 0.3),
                      }}
                    >
                      <View className="flex-row">
                        <View style={{ width: 4, backgroundColor: tone }} />
                        <View className="flex-1 p-4">
                          <Row className="gap-3">
                            <View
                              className="h-14 w-14 items-center justify-center rounded-2xl"
                              style={{ backgroundColor: tint(tone, 0.16) }}
                            >
                              <Text className="text-[18px] font-extrabold" style={{ color: tone }}>
                                {days === 0 ? '!' : days}
                              </Text>
                              <Text className="text-[9px] font-bold uppercase" style={{ color: tone }}>
                                {days === 0 ? 'heute' : days === 1 ? 'Tag' : 'Tage'}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Row className="justify-between gap-2">
                                <Text className="flex-1 text-[16px] font-bold text-ink">{exam.subject}</Text>
                                <Muted className="text-[11px]">
                                  {exam.start ? `${exam.start} Uhr` : ''}
                                </Muted>
                              </Row>
                              <Muted>
                                {formatRelativeDay(exam.date)}
                                {exam.start && exam.end ? ` · ${exam.start}–${exam.end}` : ''}
                              </Muted>
                              <Row className="mt-1.5 flex-wrap gap-2">
                                {exam.type ? <Chip label={exam.type} color={style.color} /> : null}
                                {blocks.length > 0 ? (
                                  <Chip label={`${blocks.length} Lernblöcke`} color={colors.accent.violet} />
                                ) : null}
                              </Row>
                            </View>
                          </Row>
                          {exam.comment ? (
                            <Muted className="mt-2 text-[12px]">{exam.comment}</Muted>
                          ) : null}
                        </View>
                        <PressableScale
                          onPress={() => setTab('plan')}
                          accessibilityLabel="Zum Lernplan"
                          className="justify-center pr-4 pl-2"
                          scale={0.9}
                        >
                          <View
                            className="h-10 w-10 items-center justify-center rounded-full"
                            style={{ backgroundColor: tint(colors.accent.violet, 0.14) }}
                          >
                            <ArrowUpRight size={18} strokeWidth={2.2} color={colors.accent.violet} />
                          </View>
                        </PressableScale>
                      </View>
                    </Card>
                  </FadeInUp>
                );
              })}
            </>
          )
        ) : planByDay.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            iconColor={colors.accent.violet}
            title="Nichts zu lernen"
            hint="Sobald Arbeiten anstehen, plant Schulflow hier automatisch Lernblöcke."
          />
        ) : (
          <>
            <Card className="mb-3 bg-accent-violet/15">
              <Row className="gap-2">
                <Sparkles size={16} strokeWidth={2.1} color={colors.accent.violet} />
                <Text className="text-[13px] font-bold text-accent-violet">Automatisch geplant</Text>
              </Row>
              <Muted className="mt-1 text-[12px]">
                Schulflow verteilt Lernblöcke rückwärts ab dem Prüfungstag, entlastet Tage mit langem
                Unterricht und legt den Vortag immer auf Wiederholung.
              </Muted>
            </Card>

            {planByDay.map(([date, blocks]) => (
              <View key={date}>
                <SectionHeader title={formatRelativeDay(date)} icon={CalendarDays} iconColor={colors.accent.violet} />
                <Card padded={false}>
                  {blocks.map((block, index) => {
                    const style = subjectStyle(block.subject);
                    return (
                      <View key={block.id}>
                        <Row className="gap-3 px-4 py-3">
                          <View
                            className="h-9 w-9 items-center justify-center rounded-xl"
                            style={{ backgroundColor: tint(style.color, 0.16) }}
                          >
                            <BookOpen size={17} strokeWidth={2.1} color={style.color} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[14px] font-semibold text-ink">{block.subject}</Text>
                            <Muted className="text-[12px]">{block.focus}</Muted>
                          </View>
                          <Chip label={`${block.minutes} min`} color={style.color} />
                        </Row>
                        {index < blocks.length - 1 ? <Divider className="ml-16" /> : null}
                      </View>
                    );
                  })}
                </Card>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Detail-Sheet einer offenen Hausaufgabe */}
      <HomeworkSheet
        item={detail}
        onClose={() => setDetail(null)}
        onToggle={() => (detail ? markDone(detail) : undefined)}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ Karten (Phase 3) */

function OpenHomeworkCard({
  item,
  onOpen,
  onToggle,
}: {
  item: Homework;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { colors } = useThemeColors();
  const style = subjectStyle(item.subject);
  const days = daysUntil(item.due);
  const meta = priorityMeta(days, colors);

  return (
    <Card
      className="mb-2 overflow-hidden"
      padded={false}
      style={{
        backgroundColor: meta.urgent ? tint(meta.color, 0.08) : 'transparent',
        borderWidth: 1,
        borderColor: meta.urgent ? tint(meta.color, 0.32) : colors.line,
      }}
    >
      <View className="flex-row">
        <View style={{ width: 4, backgroundColor: meta.urgent ? meta.color : style.color }} />
        <Pressable onPress={onOpen} className="flex-1 py-3 pl-3.5 pr-2 active:opacity-70" accessibilityRole="button">
          <Row className="gap-2" style={{ alignItems: 'flex-start' }}>
            <Text className="text-[13px] font-extrabold" style={{ color: style.color }}>
              {item.subject}
            </Text>
            <View className="flex-1" />
            <Pill label={meta.label} color={meta.color} tone={meta.urgent ? 'solid' : 'tint'} />
          </Row>
          <Text className="mt-1.5 text-[15px] leading-[21px] text-ink">{item.text}</Text>
          <Muted className="mt-1.5 text-[11px]">
            {[item.teacher, item.assigned ? `aufgegeben am ${formatRelativeDay(item.assigned)}` : '']
              .filter(Boolean)
              .join(' · ') || '—'}
          </Muted>
        </Pressable>
        {/* Action-Button: direkt abhaken */}
        <PressableScale
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`${item.subject}: als erledigt markieren`}
          className="justify-center pl-1.5 pr-3.5"
          scale={0.85}
        >
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{
              backgroundColor: days < 0 ? meta.color : 'transparent',
              borderWidth: 2.5,
              borderColor: meta.urgent ? meta.color : tint(meta.color, 0.6),
            }}
          >
            {days < 0 ? (
              <AlertTriangle size={13} strokeWidth={2.6} color={foregroundOn(meta.color, colors)} />
            ) : null}
          </View>
        </PressableScale>
      </View>
    </Card>
  );
}

function DoneHomeworkCard({ item, onToggle }: { item: Homework; onToggle: () => void }) {
  const { colors } = useThemeColors();
  const style = subjectStyle(item.subject);
  return (
    <PressableScale onPress={onToggle} className="mb-2" scale={0.98} accessibilityRole="button">
      <Card
        className="overflow-hidden"
        padded={false}
        style={{
          backgroundColor: tint(colors.success, 0.06),
          borderWidth: 1,
          borderColor: tint(colors.success, 0.28),
        }}
      >
        <View className="flex-row">
          <View style={{ width: 4, backgroundColor: colors.success }} />
          <Row className="flex-1 gap-3 py-3 pl-3.5 pr-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-success">
              <Check size={14} strokeWidth={3.2} color={foregroundOn(colors.success, colors)} />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-[13px] font-bold" style={{ color: style.color }}>
                {item.subject}
              </Text>
              <Text
                className="text-[13px] leading-[17px] text-muted"
                style={{ textDecorationLine: 'line-through' }}
              >
                {item.text}
              </Text>
            </View>
            <Undo2 size={16} strokeWidth={2.2} color={colors.faint} />
          </Row>
        </View>
      </Card>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Detail-Sheet */

function HomeworkSheet({
  item,
  onClose,
  onToggle,
}: {
  item: Homework | null;
  onClose: () => void;
  onToggle: () => void;
}) {
  const { colors } = useThemeColors();
  const style = subjectStyle(item?.subject);
  const days = item ? daysUntil(item.due) : 0;
  const meta = item ? priorityMeta(days, colors) : null;

  return (
    <Sheet open={Boolean(item)} onClose={onClose} title={item?.subject}>
      {item && meta ? (
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
                <Row className="flex-wrap items-center gap-2">
                  <Text className="text-[17px] font-bold text-ink">{item.subject}</Text>
                  <Pill label={meta.label} color={meta.color} tone={meta.urgent ? 'solid' : 'tint'} />
                </Row>
                {item.teacher ? <Muted className="mt-1">{item.teacher}</Muted> : null}
              </View>
            </Row>
          </Card>

          <Card>
            <Text className="text-[15px] leading-6 text-ink">{item.text}</Text>
            <Divider className="my-3" />
            <Muted>
              Fällig: {formatRelativeDay(item.due)}
              {item.assigned ? ` · Aufgegeben: ${formatRelativeDay(item.assigned)}` : ''}
            </Muted>
          </Card>

          <Button action="success" size="lg" block onPress={onToggle}>
            <Check size={18} strokeWidth={2.6} color={foregroundOn(colors.success, colors)} />
            <ButtonText>Als erledigt markieren</ButtonText>
          </Button>
          <Button action="ghost" block onPress={onClose}>
            <ButtonText>Schließen</ButtonText>
          </Button>
        </View>
      ) : null}
    </Sheet>
  );
}
