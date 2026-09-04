/**
 * Aufgaben Screen (Hausaufgaben, Arbeiten, Lernplan) — Redesign mit satten Farbflächen.
 */
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
import { subjectIcon, subjectStyle, tint } from '@/design/subjects';
import { buildStudyPlan } from '@/features/tasks/studyplan';
import { addDays, daysUntil, formatRelativeDay, toISO } from '@/lib/date';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import {
  Card,
  Chip,
  ColorBlockCard,
  Divider,
  EmptyState,
  IconBadge,
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
import { foregroundOn, radius, shadow } from '@/design/tokens';
import type { ThemePalette } from '@/design/tokens';

type Tab = 'homework' | 'exams' | 'plan';

function priorityMeta(days: number, colors: ThemePalette) {
  if (days < 0) return { color: colors.danger, label: days === -1 ? 'Gestern fällig' : `${-days} Tage überfällig`, urgent: true };
  if (days === 0) return { color: colors.danger, label: 'Heute fällig', urgent: true };
  if (days === 1) return { color: colors.warning, label: 'Morgen fällig', urgent: true };
  if (days <= 3) return { color: colors.warning, label: `In ${days} Tagen`, urgent: true };
  return { color: colors.accent.violet, label: formatRelativeDay(toISO(addDays(new Date(), days))), urgent: false };
}

export default function TasksScreen() {
  const { colors, isDark } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const toggle = useHomeworkDone((state) => state.toggle);
  const reserve = useTabNavReserve();
  const [tab, setTab] = useState<Tab>('homework');
  const [detail, setDetail] = useState<Homework | null>(null);

  const homework = data?.homework ?? [];
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
            <Skeleton className="h-24 rounded-[24px]" />
            <Skeleton className="h-24 rounded-[24px]" />
          </View>
        ) : tab === 'homework' ? (
          <>
            {homework.length > 0 ? (
              <ColorBlockCard color={colors.accent.amber} tone="tint" className="mb-3" padded={false}>
                <View className="p-4">
                  <Row className="justify-between">
                    <Text className="text-[14px] font-extrabold text-ink">
                      {done.length} von {homework.length} erledigt
                    </Text>
                    <Text className="text-[14px] font-extrabold text-accent-amber-deep">
                      {Math.round((done.length / homework.length) * 100)} %
                    </Text>
                  </Row>
                  <Progress
                    value={(done.length / homework.length) * 100}
                    className="mt-2.5"
                    color={done.length === homework.length ? colors.success : undefined}
                  />
                </View>
              </ColorBlockCard>
            ) : null}

            {grouped.length === 0 ? (
              <EmptyState
                icon={CheckCheck}
                iconColor={colors.success}
                title="Keine offenen Aufgaben!"
                hint="Alles erledigt. Genieß den Nachmittag."
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
                    <View className="gap-2.5">
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
                  </View>
                );
              })
            )}

            {done.length > 0 ? (
              <View className="mt-4">
                <SectionHeader title="Erledigt" icon={CheckCheck} iconColor={colors.success} />
                <View className="gap-2">
                  {done.map((item) => (
                    <DoneHomeworkCard key={item.id} item={item} onToggle={() => markDone(item)} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : tab === 'exams' ? (
          upcomingExams.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              iconColor={colors.warning}
              title="Keine anstehenden Arbeiten"
              hint="Aktuell stehen keine Prüfungen an."
            />
          ) : (
            <View className="gap-3 pt-2">
              {upcomingExams.map((exam, index) => {
                const style = subjectStyle(exam.subject);
                const SubIcon = subjectIcon(exam.subject);
                const days = daysUntil(exam.date);
                const tone = days <= 2 ? colors.danger : days <= 5 ? colors.warning : colors.category.mint.solid;
                const blocks = plan.filter((block) => block.examId === exam.id);

                return (
                  <FadeInUp key={exam.id} delay={index * 40}>
                    <ColorBlockCard
                      color={tone}
                      tone="tint"
                      padded={false}
                      className="overflow-hidden"
                    >
                      <View className="p-4">
                        <Row className="gap-3.5">
                          <IconBadge
                            icon={SubIcon}
                            color={tone}
                            tone="solid"
                            size={52}
                            iconSize={24}
                          />

                          <View className="flex-1">
                            <Row className="justify-between gap-2">
                              <Text className="flex-1 text-[18px] font-extrabold text-ink" numberOfLines={1}>
                                {exam.subject}
                              </Text>
                              <Pill
                                label={days === 0 ? 'Heute' : `${days} Tage`}
                                color={tone}
                                tone="solid"
                              />
                            </Row>
                            <Muted className="mt-0.5 text-[12px] font-semibold">
                              {formatRelativeDay(exam.date)}
                              {exam.start && exam.end ? ` · ${exam.start}–${exam.end} Uhr` : ''}
                            </Muted>
                            <Row className="mt-2 flex-wrap gap-2">
                              {exam.type ? <Pill label={exam.type} color={style.color} tone="tint" /> : null}
                              {blocks.length > 0 ? (
                                <Pill label={`${blocks.length} Lernblöcke`} color={colors.accent.violet} tone="tint" />
                              ) : null}
                            </Row>
                          </View>

                          <PressableScale
                            onPress={() => setTab('plan')}
                            accessibilityLabel="Zum Lernplan"
                            className="justify-center"
                            scale={0.9}
                          >
                            <View
                              className="h-10 w-10 items-center justify-center rounded-full bg-surface"
                              style={shadow.card}
                            >
                              <ArrowUpRight size={18} strokeWidth={2.4} color={colors.charcoal} />
                            </View>
                          </PressableScale>
                        </Row>

                        {exam.comment ? (
                          <Muted className="mt-2 text-[12px] font-medium">{exam.comment}</Muted>
                        ) : null}
                      </View>
                    </ColorBlockCard>
                  </FadeInUp>
                );
              })}
            </View>
          )
        ) : planByDay.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            iconColor={colors.accent.violet}
            title="Keine Lernblöcke nötig"
            hint="Sobald Arbeiten anstehen, plant Schulflow hier automatisch passende Lerneinheiten."
          />
        ) : (
          <>
            <ColorBlockCard color={colors.accent.violet} tone="tint" className="mb-3">
              <Row className="gap-2.5">
                <IconBadge icon={Sparkles} color={colors.accent.violet} size={32} iconSize={16} />
                <Text className="text-[14px] font-extrabold text-accent-violet">Automatisch geplant</Text>
              </Row>
              <Muted className="mt-1.5 text-[12px] leading-5 text-ink">
                Schulflow verteilt Lernblöcke rückwärts ab dem Prüfungstag, entlastet Tage mit langem
                Unterricht und legt den Vortag immer auf gezielte Wiederholung.
              </Muted>
            </ColorBlockCard>

            {planByDay.map(([date, blocks]) => (
              <View key={date}>
                <SectionHeader title={formatRelativeDay(date)} icon={CalendarDays} iconColor={colors.accent.violet} />
                <View className="gap-2.5">
                  {blocks.map((block) => {
                    const style = subjectStyle(block.subject);
                    const SubIcon = subjectIcon(block.subject);
                    return (
                      <ColorBlockCard key={block.id} color={style.color} tone="tint" padded={false}>
                        <Row className="gap-3.5 px-4 py-3.5">
                          <IconBadge icon={SubIcon} color={style.color} size={42} iconSize={20} tone="solid" />
                          <View className="flex-1">
                            <Text className="text-[15px] font-extrabold text-ink">{block.subject}</Text>
                            <Muted className="text-[12px] font-medium">{block.focus}</Muted>
                          </View>
                          <Pill label={`${block.minutes} min`} color={style.color} tone="solid" />
                        </Row>
                      </ColorBlockCard>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <HomeworkSheet
        item={detail}
        onClose={() => setDetail(null)}
        onToggle={() => (detail ? markDone(detail) : undefined)}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ Farbblock-Karten */

function OpenHomeworkCard({
  item,
  onOpen,
  onToggle,
}: {
  item: Homework;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const style = subjectStyle(item.subject);
  const SubIcon = subjectIcon(item.subject);
  const days = daysUntil(item.due);
  const meta = priorityMeta(days, colors);

  const cardBg = tint(style.color, isDark ? 0.22 : 0.14);

  return (
    <PressableScale onPress={onOpen} scale={0.98} accessibilityRole="button">
      <View
        className="overflow-hidden rounded-[26px] p-4"
        style={{
          backgroundColor: cardBg,
          ...shadow.card,
        }}
      >
        <Row className="justify-between" style={{ alignItems: 'flex-start' }}>
          <Row className="flex-1 gap-3">
            <IconBadge icon={SubIcon} color={style.color} tone="solid" size={44} iconSize={22} />
            <View className="flex-1">
              <Row className="justify-between gap-2">
                <Text className="text-[15px] font-extrabold text-ink">{item.subject}</Text>
                <Pill label={meta.label} color={meta.color} tone="solid" />
              </Row>
              <Text className="mt-1.5 text-[15px] font-medium leading-[21px] text-ink">{item.text}</Text>
              <Muted className="mt-1.5 text-[11px] font-semibold">
                {[item.teacher, item.assigned ? `Aufgegeben ${formatRelativeDay(item.assigned)}` : '']
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </Muted>
            </View>
          </Row>

          {/* Größere, runde Checkbox mit Fülleffekt */}
          <PressableScale
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityLabel={`${item.subject}: als erledigt markieren`}
            className="ml-2 mt-1 justify-center"
            hitSlop={10}
            scale={0.88}
          >
            <View
              className="h-9 w-9 items-center justify-center rounded-full bg-surface"
              style={{
                borderWidth: 2.5,
                borderColor: style.color,
                ...shadow.card,
              }}
            >
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: tint(style.color, 0.25) }}
              />
            </View>
          </PressableScale>
        </Row>
      </View>
    </PressableScale>
  );
}

function DoneHomeworkCard({ item, onToggle }: { item: Homework; onToggle: () => void }) {
  const { colors, isDark } = useThemeColors();
  const style = subjectStyle(item.subject);

  return (
    <PressableScale onPress={onToggle} scale={0.98} accessibilityRole="button">
      <View
        className="overflow-hidden rounded-[24px] p-3.5"
        style={{
          backgroundColor: tint(colors.success, isDark ? 0.20 : 0.12),
          ...shadow.card,
        }}
      >
        <Row className="gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-success">
            <Check size={16} strokeWidth={3.2} color={foregroundOn(colors.success, colors)} />
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-[14px] font-extrabold" style={{ color: style.color }}>
              {item.subject}
            </Text>
            <Text
              className="text-[13px] leading-[17px] text-ink/70"
              style={{ textDecorationLine: 'line-through' }}
            >
              {item.text}
            </Text>
          </View>
          <Undo2 size={18} strokeWidth={2.4} color={colors.faint} />
        </Row>
      </View>
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
  const SubIcon = subjectIcon(item?.subject);
  const days = item ? daysUntil(item.due) : 0;
  const meta = item ? priorityMeta(days, colors) : null;

  return (
    <Sheet open={Boolean(item)} onClose={onClose} title={item?.subject}>
      {item && meta ? (
        <View className="gap-3">
          <ColorBlockCard color={style.color} tone="tint">
            <Row className="gap-3.5">
              <IconBadge icon={SubIcon} color={style.color} size={48} iconSize={24} tone="solid" />
              <View className="flex-1">
                <Row className="flex-wrap items-center gap-2">
                  <Text className="text-[18px] font-extrabold text-ink">{item.subject}</Text>
                  <Pill label={meta.label} color={meta.color} tone="solid" />
                </Row>
                {item.teacher ? <Muted className="mt-1 font-bold">{item.teacher}</Muted> : null}
              </View>
            </Row>
          </ColorBlockCard>

          <Card>
            <Text className="text-[15px] font-medium leading-6 text-ink">{item.text}</Text>
            <Divider className="my-3" />
            <Muted className="font-semibold">
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
