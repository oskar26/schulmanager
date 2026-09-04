import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  Undo2,
  type LucideIcon,
} from 'lucide-react-native';

import type { Homework } from '@/api/types';
import { useHomeworkDone, useSnapshot } from '@/data/queries';
import { subjectColor, subjectIcon } from '@/design/subjects';
import { buildStudyPlan } from '@/features/tasks/studyplan';
import { addDays, daysUntil, formatRelativeDay, toISO } from '@/lib/date';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import {
  BlockCaption,
  BlockText,
  Chip,
  ColorBlockCard,
  EmptyState,
  IconBadge,
  Muted,
  Pill,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
  Sheet,
  Skeleton,
  useBlockInk,
  type IconBadgeSize,
} from '@/ui/primitives';
import { FadeInUp, PressableScale } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Progress } from '@/ui/gluestack/feedback';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, resolveThemeColor, type ThemePalette } from '@/design/tokens';

type Tab = 'homework' | 'exams' | 'plan';

/* ------------------------------------------------------------------ Prioritäts-Ampel (Phase 5) */

/**
 * Farbcodierung der Aufgaben-Karten über die festen `priority`-Tokens:
 * Coral = dringend (überfällig / heute) · Amber = bald (morgen / in wenigen
 * Tagen) · Lime = entspannt. Dieselbe Ampel steuert die Fälligkeits-Pillen,
 * die Arbeiten-Blöcke und die Legende.
 */
function priorityMeta(days: number, colors: ThemePalette) {
  if (days < 0) return { color: colors.priority.urgent, label: days === -1 ? 'Gestern fällig' : `${-days} Tage überfällig`, urgent: true };
  if (days === 0) return { color: colors.priority.urgent, label: 'Heute fällig', urgent: true };
  if (days === 1) return { color: colors.priority.soon, label: 'Morgen fällig', urgent: true };
  if (days <= 3) return { color: colors.priority.soon, label: `In ${days} Tagen`, urgent: true };
  return { color: colors.priority.ok, label: formatRelativeDay(toISO(addDays(new Date(), days))), urgent: false };
}

/** Ampel-Fläche für Arbeiten: 0–1 Tag Coral, 2–5 Tage Amber, danach Lime. */
function examTone(days: number, colors: ThemePalette): string {
  if (days <= 1) return colors.priority.urgent;
  if (days <= 5) return colors.priority.soon;
  return colors.priority.ok;
}

/* ------------------------------------------------------------------ Runde Checkbox (animiert) */

function RoundCheck({
  checked,
  ink,
  onColor,
  onPress,
  label,
}: {
  checked: boolean;
  /** Farbe des Rings/der Füllung (Vordergrund der Karte). */
  ink: string;
  /** Farbe des Häkchens (Hintergrund der Karte). */
  onColor: string;
  onPress: () => void;
  label: string;
}) {
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, { damping: 15, stiffness: 280 });
  }, [checked, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.4 + progress.value * 0.6 }],
  }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.3 + progress.value * 0.7 }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      hitSlop={8}
      scale={0.88}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          borderWidth: 2.4,
          borderColor: ink,
          opacity: checked ? 1 : 0.55,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              ...StyleSheetFill,
              borderRadius: 15,
              backgroundColor: ink,
            },
            fillStyle,
          ]}
        />
        <Animated.View style={[{ ...StyleSheetFill, alignItems: 'center', justifyContent: 'center' }, tickStyle]}>
          <Check size={18} strokeWidth={3.4} color={onColor} />
        </Animated.View>
      </View>
    </PressableScale>
  );
}

/** absoluteFillObject ohne StyleSheet-Import (RN-Web-sicher). */
const StyleSheetFill: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

/* ------------------------------------------------------------------ Screen */

export default function TasksScreen() {
  const { colors } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const toggle = useHomeworkDone((state) => state.toggle);
  const reserve = useTabNavReserve();
  const [tab, setTab] = useState<Tab>('homework');
  const [detail, setDetail] = useState<Homework | null>(null);

  const homework = data?.homework ?? []; // done-Flag ist in useSnapshot bereits eingemischt
  const open = useMemo(() => homework.filter((item) => !item.done), [homework]);
  const done = useMemo(() => homework.filter((item) => item.done), [homework]);
  const upcomingExams = (data?.exams ?? []).filter((exam) => daysUntil(exam.date) >= 0);
  const plan = useMemo(() => (data ? buildStudyPlan(data) : []), [data]);

  // Gruppierung nach Fälligkeit: aufsteigend nach ISO-Datum ⇒ Überfälliges zuerst,
  // „Heute“/„Morgen“ direkt darüber; pro Tag stabil nach Fach sortiert.
  const grouped = useMemo(() => {
    const sorted = [...open].sort(
      (a, b) => a.due.localeCompare(b.due) || a.subject.localeCompare(b.subject),
    );
    const map = new Map<string, Homework[]>();
    sorted.forEach((item) => {
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
      <ScreenHeader title="Aufgaben" subtitle="Hausaufgaben, Arbeiten und dein Lernplan" />
      <View className="px-4 pb-3">
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
          <HomeworkTab
            open={open}
            done={done}
            grouped={grouped}
            colors={colors}
            onOpen={(item) => {
              hapticLight();
              setDetail(item);
            }}
            onToggle={markDone}
          />
        ) : tab === 'exams' ? (
          <ExamsTab upcomingExams={upcomingExams} plan={plan} colors={colors} onGoPlan={() => setTab('plan')} />
        ) : planByDay.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            iconColor={colors.accent.violet}
            title="Nichts zu lernen"
            hint="Sobald Arbeiten anstehen, plant Schulflow hier automatisch Lernblöcke."
          />
        ) : (
          <PlanTab planByDay={planByDay} />
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

/* ------------------------------------------------------------------ Hausaufgaben */

function HomeworkTab({
  open,
  done,
  grouped,
  colors,
  onOpen,
  onToggle,
}: {
  open: Homework[];
  done: Homework[];
  grouped: [string, Homework[]][];
  colors: ReturnType<typeof useThemeColors>['colors'];
  onOpen: (item: Homework) => void;
  onToggle: (item: Homework) => void;
}) {
  const total = open.length + done.length;

  return (
    <>
      {total > 0 ? <HomeworkProgress open={open.length} done={done.length} total={total} /> : null}

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
            days < 0 ? colors.priority.urgent : days <= 1 ? colors.priority.soon : colors.priority.ok;
          const HeaderIcon = days < 0 ? AlertTriangle : days === 0 ? Clock : CalendarDays;
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
                  <HomeworkTaskCard
                    item={item}
                    done={false}
                    onOpen={() => onOpen(item)}
                    onToggle={() => onToggle(item)}
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
            <HomeworkTaskCard
              key={item.id}
              item={item}
              done
              onOpen={() => onOpen(item)}
              onToggle={() => onToggle(item)}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

/** Fortschritts-Block — Lime-Fläche mit großer Prozentzahl (StatCard-Logik). */
function HomeworkProgress({ open, done, total }: { open: number; done: number; total: number }) {
  const { colors, isDark } = useThemeColors();
  const percent = Math.round((done / total) * 100);
  const ink = foregroundOn(resolveThemeColor(colors.blocks.lime, isDark), colors);

  return (
    <ColorBlockCard color={colors.blocks.lime} className="mb-3" style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
      <Row className="gap-4">
        <View className="min-w-0 flex-1">
          <BlockText className="text-[15.5px] font-extrabold leading-5">
            {done === total ? 'Alles erledigt!' : open === 0 ? 'Gleich geschafft' : 'Aufgaben-Fortschritt'}
          </BlockText>
          <Progress
            value={(done / total) * 100}
            className="mt-2.5"
            trackClassName="bg-black/10"
            color={colors.blocks.violet}
          />
          <BlockCaption className="mt-2 text-[11.5px]">
            {done} von {total} erledigt{open > 0 ? ` · ${open} offen` : ''}
          </BlockCaption>
        </View>
        <View className="items-end justify-center">
          <Text className="text-[34px] font-extrabold leading-9 tracking-[-1px]" style={{ color: ink, fontVariant: ['tabular-nums'] }}>
            {percent}%
          </Text>
          <BlockCaption className="text-center">erledigt</BlockCaption>
        </View>
      </Row>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Aufgaben-Karte (Farbblock) */

/** Icon-Badge auf einer Farbfläche: ruhiger 14-%-Tint in Vordergrundfarbe. */
function OnBlockBadge({
  icon,
  size = 'md',
  className = '',
}: {
  icon: LucideIcon;
  size?: IconBadgeSize;
  className?: string;
}) {
  const ink = useBlockInk();
  return <IconBadge icon={icon} color={ink} size={size} tone="tint" className={className} />;
}

function HomeworkTaskCard({
  item,
  done,
  onOpen,
  onToggle,
}: {
  item: Homework;
  done: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const subjectTone = subjectColor(item.subject, isDark);
  const ink = foregroundOn(subjectTone, colors);
  const days = daysUntil(item.due);
  const meta = priorityMeta(days, colors);
  const SubjectIcon = subjectIcon(item.subject);

  // Wenn Ampel- und Fachfarbe dieselbe Familie sind, bekommt die Pille einen
  // weißen Ring, damit die Fälligkeit nicht in der Fläche verschwindet.
  const pillRing: StyleProp<ViewStyle> =
    meta.color.toUpperCase() === subjectTone.toUpperCase()
      ? { borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' }
      : undefined;

  return (
    <ColorBlockCard
      color={subjectTone}
      dim={done}
      className="mb-2.5"
      style={{ padding: 16 }}
    >
      <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
        {/* Große, runde Checkbox mit Fülleffekt */}
        <RoundCheck
          checked={done}
          ink={ink}
          onColor={subjectTone}
          onPress={onToggle}
          label={`${item.subject}: ${done ? 'wieder öffnen' : 'als erledigt markieren'}`}
        />

        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${item.subject}: Details öffnen`}
          className="min-w-0 flex-1 hover:opacity-90 active:opacity-75"
        >
          <Row className="gap-2" style={{ alignItems: 'flex-start' }}>
            <OnBlockBadge icon={SubjectIcon} size="md" className="mt-0.5" />
            <BlockText
              className="min-w-0 flex-1 text-[15.5px] font-extrabold leading-[19px]"
              numberOfLines={1}
              style={done ? { textDecorationLine: 'line-through', opacity: 0.75 } : undefined}
            >
              {item.subject}
            </BlockText>
            <Pill
              label={done ? 'Erledigt' : meta.label}
              color={done ? colors.priority.ok : meta.color}
              tone="solid"
              icon={done ? CheckCheck : meta.urgent ? AlertTriangle : Clock}
              className="px-2.5 py-1"
              style={done ? undefined : pillRing}
            />
          </Row>

          <BlockText
            className={`mt-2 text-[15px] leading-[21px] ${done ? '' : 'font-semibold'}`}
            numberOfLines={done ? 2 : 3}
            style={done ? { textDecorationLine: 'line-through', opacity: 0.8 } : undefined}
          >
            {item.text}
          </BlockText>

          <Row className="mt-2 flex-wrap items-center gap-1.5">
            {item.teacher ? <BlockCaption className="text-[11.5px]">{item.teacher}</BlockCaption> : null}
            {item.assigned ? (
              <BlockCaption className="text-[11.5px]">aufgegeben am {formatRelativeDay(item.assigned)}</BlockCaption>
            ) : null}
            {done ? <Undo2 size={13} strokeWidth={2.4} color={ink} style={{ opacity: 0.6 }} /> : null}
          </Row>
        </Pressable>
      </Row>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Arbeiten */

function ExamsTab({
  upcomingExams,
  plan,
  colors,
  onGoPlan,
}: {
  upcomingExams: { id: string; subject: string; date: string; start?: string; end?: string; type?: string; comment?: string }[];
  plan: { examId: string }[];
  colors: ReturnType<typeof useThemeColors>['colors'];
  onGoPlan: () => void;
}) {
  if (upcomingExams.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        iconColor={colors.warning}
        title="Keine Arbeiten angekündigt"
        hint="Aktuell steht nichts an."
      />
    );
  }

  return (
    <>
      {/* Ampel-Legende: gleiche Tokens wie auf den Karten */}
      <Row className="mb-3 flex-wrap gap-1.5">
        <Chip label="dringend" color={colors.priority.urgent} tone="solid" icon={AlertTriangle} />
        <Chip label="bald" color={colors.priority.soon} tone="solid" icon={Clock} />
        <Chip label="entspannt" color={colors.priority.ok} tone="solid" icon={CheckCheck} />
      </Row>

      {upcomingExams.map((exam, index) => {
        const days = daysUntil(exam.date);
        const tone = examTone(days, colors);
        return (
          <FadeInUp key={exam.id} delay={index * 40}>
            <ExamCard exam={exam} days={days} tone={tone} blockCount={plan.filter((block) => block.examId === exam.id).length} onGoPlan={onGoPlan} />
          </FadeInUp>
        );
      })}
    </>
  );
}

function ExamCard({
  exam,
  days,
  tone,
  blockCount,
  onGoPlan,
}: {
  exam: { id: string; subject: string; date: string; start?: string; end?: string; type?: string; comment?: string };
  days: number;
  tone: string;
  blockCount: number;
  onGoPlan: () => void;
}) {
  const { colors } = useThemeColors();
  const ink = foregroundOn(tone, colors);
  const SubjectIcon = subjectIcon(exam.subject);

  return (
    <ColorBlockCard color={tone} className="mb-2.5" style={{ padding: 16 }}>
      <Row className="gap-4" style={{ alignItems: 'stretch' }}>
        {/* Countdown als riesige Zahl + Caption */}
        <View className="w-[96px] shrink-0 justify-center" style={{ minWidth: 0 }}>
          <Text
            className="text-center text-[52px] font-extrabold leading-[54px] tracking-[-1.5px]"
            style={{ color: ink, fontVariant: ['tabular-nums'] }}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {days === 0 ? '!' : days}
          </Text>
          <Text
            className="mt-1 text-center text-[9.5px] font-extrabold uppercase tracking-[1.1px]"
            style={{ color: ink, opacity: 0.72 }}
            numberOfLines={2}
          >
            {days === 0 ? 'Heute' : days === 1 ? 'Tag bis Arbeit' : 'Tage bis Arbeit'}
          </Text>
        </View>

        <View className="min-w-0 flex-1">
          <Row className="gap-2.5">
            <OnBlockBadge icon={SubjectIcon} size="lg" />
            <BlockText className="min-w-0 flex-1 self-center text-[17px] font-extrabold leading-[21px]" numberOfLines={2}>
              {exam.subject}
            </BlockText>
          </Row>
          <BlockCaption className="mt-1.5 text-[12px]">
            {formatRelativeDay(exam.date)}
            {exam.start && exam.end ? ` · ${exam.start}–${exam.end} Uhr` : exam.start ? ` · ${exam.start} Uhr` : ''}
          </BlockCaption>
          <Row className="mt-2 flex-wrap gap-1.5">
            {exam.type ? <Pill label={exam.type} color={ink} tone="tint" icon={BarChart3} className="px-2.5 py-1" /> : null}
            {blockCount > 0 ? (
              <Pill label={`${blockCount} Lernblöcke`} color={ink} tone="tint" icon={Sparkles} className="px-2.5 py-1" />
            ) : null}
          </Row>
          {exam.comment ? (
            <BlockCaption className="mt-1.5 text-[12px] leading-4" numberOfLines={2}>{exam.comment}</BlockCaption>
          ) : null}
        </View>

        <PressableScale
          onPress={onGoPlan}
          accessibilityLabel="Zum Lernplan"
          scale={0.9}
          className="self-center"
          hitSlop={6}
        >
          <IconBadge icon={ArrowUpRight} color={ink} size="lg" tone="tint" />
        </PressableScale>
      </Row>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Lernplan */

function PlanTab({ planByDay }: { planByDay: [string, { id: string; date: string; subject: string; minutes: number; focus: string }[]][] }) {
  const { colors } = useThemeColors();

  return (
    <>
      <ColorBlockCard color={colors.blocks.violet} className="mb-3" style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
          <OnBlockBadge icon={Sparkles} size="lg" />
          <View className="min-w-0 flex-1">
            <BlockText className="text-[15px] font-extrabold">Automatisch geplant</BlockText>
            <BlockCaption className="mt-0.5 text-[12px] leading-4">
              Schulflow verteilt Lernblöcke rückwärts ab dem Prüfungstag, entlastet Tage mit langem Unterricht und
              legt den Vortag immer auf Wiederholung.
            </BlockCaption>
          </View>
        </Row>
      </ColorBlockCard>

      {planByDay.map(([date, blocks]) => (
        <View key={date}>
          <SectionHeader title={formatRelativeDay(date)} icon={CalendarDays} iconColor={colors.accent.violet} />
          <View className="gap-2">
            {blocks.map((block) => (
              <PlanBlockCard key={block.id} subject={block.subject} focus={block.focus} minutes={block.minutes} />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

/** Lernblock als Farbfläche in Fachfarbe mit fetter Dauer-Pill. */
function PlanBlockCard({ subject, focus, minutes }: { subject: string; focus: string; minutes: number }) {
  const { colors, isDark } = useThemeColors();
  const subjectTone = subjectColor(subject, isDark);
  const ink = foregroundOn(subjectTone, colors);
  const SubjectIcon = subjectIcon(subject);

  return (
    <ColorBlockCard color={subjectTone} radius={24} style={{ padding: 13 }}>
      <Row className="gap-3">
        <OnBlockBadge icon={SubjectIcon} size="md" />
        <View className="min-w-0 flex-1">
          <BlockText className="text-[15px] font-extrabold leading-[19px]" numberOfLines={1}>{subject}</BlockText>
          <BlockCaption className="text-[11.5px]">{focus}</BlockCaption>
        </View>
        <Pill label={`${minutes} min`} color={ink} tone="solid" icon={Clock} className="px-2.5 py-1" />
      </Row>
    </ColorBlockCard>
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
  const { colors, isDark } = useThemeColors();
  const style = subjectColor(item?.subject ?? '', isDark);
  const days = item ? daysUntil(item.due) : 0;
  const meta = item ? priorityMeta(days, colors) : null;
  const SubjectIcon = subjectIcon(item?.subject);

  return (
    <Sheet open={Boolean(item)} onClose={onClose} title={item?.subject}>
      {item && meta ? (
        <View className="gap-3">
          {/* Kopf im neuen Stil: ColorBlockCard in Fachfarbe */}
          <ColorBlockCard color={style} style={{ padding: 18 }}>
            <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
              <OnBlockBadge icon={SubjectIcon} size="lg" className="mt-0.5" />
              <View className="min-w-0 flex-1">
                <BlockText className="text-[20px] font-extrabold leading-[24px] tracking-[-0.3px]" numberOfLines={2}>
                  {item.subject}
                </BlockText>
                {item.teacher ? <BlockCaption className="mt-1">{item.teacher}</BlockCaption> : null}
                <View className="mt-2 self-start">
                  <Pill label={meta.label} color={meta.color} tone="solid" icon={meta.urgent ? AlertTriangle : Clock} />
                </View>
              </View>
            </Row>
          </ColorBlockCard>

          <View className="gap-2 rounded-[24px] bg-line/50 p-4">
            <Text className="text-[15px] font-semibold leading-6 text-ink">{item.text}</Text>
            <Muted className="mt-1 text-[12px]">
              Fällig: {formatRelativeDay(item.due)}
              {item.assigned ? ` · Aufgegeben: ${formatRelativeDay(item.assigned)}` : ''}
            </Muted>
          </View>

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
