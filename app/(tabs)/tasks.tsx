import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCheck,
  Clock,
  Sparkles,
} from 'lucide-react-native';

import { useHomeworkDone, useSnapshot } from '@/data/queries';
import { subjectStyle, tint } from '@/design/subjects';
import { buildStudyPlan } from '@/features/tasks/studyplan';
import { daysUntil, formatRelativeDay } from '@/lib/date';
import {
  Card,
  Chip,
  Divider,
  EmptyState,
  Muted,
  Row,
  Screen,
  SectionHeader,
  SegmentedControl,
  Skeleton,
  Title,
} from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { Progress } from '@/ui/gluestack/feedback';

type Tab = 'homework' | 'exams' | 'plan';

export default function TasksScreen() {
  const { data, isLoading } = useSnapshot();
  const toggle = useHomeworkDone((state) => state.toggle);
  const reserve = useTabNavReserve();
  const [tab, setTab] = useState<Tab>('homework');

  const open = data?.homework.filter((item) => !item.done) ?? [];
  const done = data?.homework.filter((item) => item.done) ?? [];
  const upcomingExams = (data?.exams ?? []).filter((exam) => daysUntil(exam.date) >= 0);
  const plan = useMemo(() => (data ? buildStudyPlan(data) : []), [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof open>();
    open.forEach((item) => {
      const list = map.get(item.due) ?? [];
      list.push(item);
      map.set(item.due, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
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
            {data.homework.length > 0 ? (
              <Card className="mb-3">
                <Row className="justify-between">
                  <Text className="text-[14px] font-bold text-ink">
                    {done.length} von {data.homework.length} erledigt
                  </Text>
                  <Text className="text-[13px] font-bold text-brand">
                    {Math.round((done.length / data.homework.length) * 100)} %
                  </Text>
                </Row>
                <Progress value={(done.length / data.homework.length) * 100} className="mt-2" />
              </Card>
            ) : null}

            {grouped.length === 0 ? (
              <EmptyState
                icon={CheckCheck}
                iconColor="#22B07A"
                title="Keine offenen Aufgaben"
                hint="Alles abgehakt. Genieß den Nachmittag."
              />
            ) : (
              grouped.map(([due, items], groupIndex) => (
                <View key={due}>
                  <SectionHeader
                    title={formatRelativeDay(due)}
                    icon={daysUntil(due) < 0 ? AlertTriangle : daysUntil(due) === 0 ? Clock : CalendarDays}
                    iconColor={daysUntil(due) < 0 ? '#E24848' : daysUntil(due) === 0 ? '#E8981E' : '#48A3FF'}
                  />
                  {items.map((item, index) => {
                    const style = subjectStyle(item.subject);
                    return (
                      <FadeInUp key={item.id} delay={(groupIndex * 3 + index) * 30}>
                        <Pressable onPress={() => toggle(item.id)} className="mb-2 active:opacity-80">
                          <Card style={{ backgroundColor: tint(style.color, 0.10) }}>
                            <Row className="items-start gap-3">
                              <View
                                className="mt-0.5 h-6 w-6 items-center justify-center rounded-lg border-2"
                                style={{ borderColor: style.color }}
                              />
                              <View className="flex-1">
                                <Row className="gap-2">
                                  <Text className="text-[14px] font-bold" style={{ color: style.color }}>
                                    {item.subject}
                                  </Text>
                                  {item.teacher ? <Muted className="text-[11px]">{item.teacher}</Muted> : null}
                                </Row>
                                <Text className="mt-1 text-[14px] leading-5 text-ink">{item.text}</Text>
                              </View>
                            </Row>
                          </Card>
                        </Pressable>
                      </FadeInUp>
                    );
                  })}
                </View>
              ))
            )}

            {done.length > 0 ? (
              <>
                <SectionHeader title="Erledigt" icon={CheckCheck} iconColor="#22B07A" />
                {done.map((item) => (
                  <Pressable key={item.id} onPress={() => toggle(item.id)} className="mb-2 opacity-50">
                    <Card style={{ backgroundColor: tint('#22B07A', 0.08) }}>
                      <Row className="gap-3">
                        <View className="h-6 w-6 items-center justify-center rounded-lg bg-success">
                          <CheckCheck size={14} strokeWidth={3} color="#FFFFFF" />
                        </View>
                        <Text
                          className="flex-1 text-[14px] text-muted"
                          style={{ textDecorationLine: 'line-through' }}
                          numberOfLines={2}
                        >
                          {item.subject}: {item.text}
                        </Text>
                      </Row>
                    </Card>
                  </Pressable>
                ))}
              </>
            ) : null}
          </>
        ) : tab === 'exams' ? (
          upcomingExams.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              iconColor="#E8981E"
              title="Keine Arbeiten angekündigt"
              hint="Aktuell steht nichts an."
            />
          ) : (
            upcomingExams.map((exam, index) => {
              const style = subjectStyle(exam.subject);
              const days = daysUntil(exam.date);
              const blocks = plan.filter((block) => block.examId === exam.id);
              return (
                <FadeInUp key={exam.id} delay={index * 40}>
                  <Card className="mb-2" padded={false} style={{ backgroundColor: tint(style.color, 0.10) }}>
                    <Row className="gap-3 p-4">
                      <View
                        className="h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: tint(style.color, 0.16) }}
                      >
                        <Text className="text-[18px] font-extrabold" style={{ color: style.color }}>
                          {days === 0 ? '!' : days}
                        </Text>
                        <Text className="text-[9px] font-bold uppercase" style={{ color: style.color }}>
                          {days === 0 ? 'heute' : days === 1 ? 'Tag' : 'Tage'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[16px] font-bold text-ink">{exam.subject}</Text>
                        <Muted>
                          {formatRelativeDay(exam.date)}
                          {exam.start ? ` · ${exam.start}–${exam.end ?? ''}` : ''}
                        </Muted>
                        <Row className="mt-1.5 gap-2">
                          {exam.type ? <Chip label={exam.type} color={style.color} /> : null}
                          {blocks.length > 0 ? (
                            <Chip label={`${blocks.length} Lernblöcke geplant`} color="#6C5CE7" />
                          ) : null}
                        </Row>
                        {exam.comment ? <Muted className="mt-1.5">{exam.comment}</Muted> : null}
                      </View>
                    </Row>
                  </Card>
                </FadeInUp>
              );
            })
          )
        ) : planByDay.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            iconColor="#6C5CE7"
            title="Nichts zu lernen"
            hint="Sobald Arbeiten anstehen, plant Schulflow hier automatisch Lernblöcke."
          />
        ) : (
          <>
            <Card className="mb-3 bg-brand-soft">
              <Row className="gap-2">
                <Sparkles size={16} strokeWidth={2.1} color="#6C5CE7" />
                <Text className="text-[13px] font-bold text-brand-ink">Automatisch geplant</Text>
              </Row>
              <Muted className="mt-1 text-[12px]">
                Schulflow verteilt Lernblöcke rückwärts ab dem Prüfungstag, entlastet Tage mit langem
                Unterricht und legt den Vortag immer auf Wiederholung.
              </Muted>
            </Card>

            {planByDay.map(([date, blocks]) => (
              <View key={date}>
                <SectionHeader title={formatRelativeDay(date)} icon={CalendarDays} iconColor="#48A3FF" />
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
    </Screen>
  );
}
