/**
 * Dashboard-Widgets (Redesign mit satten Farbflächen & Icon-Badges).
 *
 * Jedes Widget ist eine eigenständige Farb-Kachel mit Kategorie-spezifischer
 * Tönung (Elternbriefe = Lavendel, Klassenarbeiten = Mint, etc.), großen
 * fetten Stat-Zahlen und einheitlichen IconBadges.
 */
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  CircleAlert,
  CreditCard,
  FileText,
  FolderOpen,
  GitBranch,
  Info,
  Inbox,
  ListChecks,
  Mail,
  PartyPopper,
  Plane,
  Search,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import type { Snapshot } from '@/api/types';
import { de } from '@/features/grades/calculator';
import { subjectIcon, subjectStyle, tint } from '@/design/subjects';
import { computeInsights, computeNow, lessonsOn, packingList } from '@/features/insights/engine';
import { useHomeworkDone } from '@/data/queries';
import { addDays, daysUntil, formatRelativeDay, minutesOf, nowMinutes, toISO } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import {
  Badge,
  Card,
  ColorBlockCard,
  Divider,
  EmptyState,
  IconBadge,
  Muted,
  Pill,
  RoundActionButton,
  Row,
  StatCard,
} from '@/ui/primitives';
import { LivePulse, PressableOpacity, PressableScale } from '@/ui/motion';
import { Progress } from '@/ui/gluestack/feedback';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, radius, shadow } from '@/design/tokens';

interface WidgetProps {
  snapshot: Snapshot;
}

const todayISO = () => toISO(new Date());
const tomorrowISO = () => toISO(addDays(new Date(), 1));

/* ------------------------------------------------------------------ Widget-Header */

function WidgetHeader({
  icon: IconComponent,
  iconColor,
  title,
  action,
  onAction,
  badge,
}: {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  action?: string;
  onAction?: () => void;
  badge?: number;
}) {
  const { colors } = useThemeColors();
  const resolvedIconColor = iconColor ?? colors.accent.violet;
  return (
    <Row className="justify-between px-5 pb-2 pt-5">
      <Row className="flex-1 gap-3">
        <IconBadge icon={IconComponent} color={resolvedIconColor} size={36} iconSize={18} />
        <Text className="flex-1 text-[16px] font-extrabold text-ink" numberOfLines={1}>
          {title}
        </Text>
      </Row>
      {typeof badge === 'number' && badge > 0 ? (
        <Badge count={badge} />
      ) : action ? (
        <PressableOpacity onPress={onAction} hitSlop={14} accessibilityRole="button">
          <Text className="text-[12px] font-extrabold text-accent-amber-deep">{action}</Text>
        </PressableOpacity>
      ) : onAction ? (
        <RoundActionButton onPress={onAction} size={34} color={resolvedIconColor} accessibilityLabel={title} />
      ) : null}
    </Row>
  );
}

/* ------------------------------------------------------------------ Nächste Stunde */

export function NextLessonWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const status = computeNow(snapshot);
  const lesson = status.lesson ?? status.next;
  const style = subjectStyle(lesson?.subject);
  const SubjectIconComp = subjectIcon(lesson?.subject);

  if (!lesson) {
    return (
      <ColorBlockCard color={colors.accent.violet} tone="tint" padded={false} className="overflow-hidden">
        <WidgetHeader icon={BookOpen} iconColor={colors.accent.violet} title="Nächste Stunde" />
        <View className="px-6 pb-7 pt-2">
          <EmptyState
            icon={Sun}
            iconColor={colors.accent.amber}
            title="Kein Unterricht mehr heute"
            hint={status.label}
          />
        </View>
      </ColorBlockCard>
    );
  }

  return (
    <PressableScale onPress={() => router.push('/timetable')}>
      <ColorBlockCard color={style.color} tone="tint" floating padded={false} className="overflow-hidden">
        <View className="px-5 pb-5 pt-4">
          <Row className="justify-between">
            <Row className="gap-2">
              {status.kind === 'in-lesson' ? <LivePulse color={style.color} /> : null}
              <Text className="text-[11px] font-extrabold uppercase tracking-[1.4px]" style={{ color: style.color }}>
                {status.kind === 'in-lesson'
                  ? 'Läuft gerade'
                  : status.kind === 'break'
                    ? 'Als Nächstes'
                    : status.kind === 'before-school'
                      ? 'Schulbeginn'
                      : 'Nächste Stunde'}
              </Text>
            </Row>
            <Pill label={status.label} color={style.color} tone="solid" />
          </Row>

          <Row className="mt-3.5 gap-3.5">
            <IconBadge
              icon={SubjectIconComp}
              color={style.color}
              tone="solid"
              size={54}
              iconSize={26}
            />
            <View className="flex-1">
              <Text className="text-[21px] font-extrabold leading-[24px] tracking-tight text-ink" numberOfLines={2}>
                {lesson.subject}
              </Text>
              <Muted className="mt-1 text-[13px] font-semibold">
                {lesson.start}–{lesson.end} Uhr
                {lesson.room ? ` · Raum ${lesson.room}` : ''}
                {lesson.teacher ? ` · ${lesson.teacher}` : ''}
              </Muted>
            </View>
            <RoundActionButton
              onPress={() => router.push('/timetable')}
              size={40}
              color={style.color}
              background={colors.surface}
              accessibilityLabel="Zum Stundenplan"
            />
          </Row>

          {lesson.state !== 'regular' ? (
            <Row className="mt-3 gap-2">
              <Pill
                label={
                  lesson.state === 'cancelled'
                    ? 'Entfall'
                    : lesson.state === 'substitution'
                      ? 'Vertretung'
                      : 'Raumwechsel'
                }
                color={lesson.state === 'cancelled' ? colors.danger : colors.success}
                tone="solid"
              />
              {lesson.comment ? <Muted className="flex-1 font-semibold">{lesson.comment}</Muted> : null}
            </Row>
          ) : null}
        </View>
      </ColorBlockCard>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Insights */

const INSIGHT_ICON: Record<string, LucideIcon> = {
  positive: CheckCheck,
  warning: AlertTriangle,
  critical: CircleAlert,
  fun: Sparkles,
  neutral: Info,
};

export function InsightsWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const all = useMemo(() => computeInsights(snapshot), [snapshot]);
  const insights = all.slice(0, 4);
  if (insights.length === 0) return null;

  const toneColor: Record<string, string> = {
    positive: colors.success,
    warning: colors.warning,
    critical: colors.danger,
    fun: colors.accent.violet,
    neutral: colors.accent.violet,
  };

  return (
    <ColorBlockCard color={colors.accent.violet} tone="tint" padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={Sparkles}
        iconColor={colors.accent.violet}
        title="Smart Insights"
        action={`${insights.length} aktiv`}
      />

      {insights.map((insight, index) => {
        const Icon = INSIGHT_ICON[insight.tone] ?? Info;
        const tone = toneColor[insight.tone] ?? colors.accent.violet;
        return (
          <Pressable
            key={insight.id}
            onPress={() => insight.action && router.push(insight.action.href as never)}
            className="hover:bg-line/30 active:bg-line/50"
          >
            <Row className="gap-3.5 px-5 py-3">
              <IconBadge icon={Icon} color={tone} size={40} iconSize={19} tone="solid" />
              <View className="flex-1">
                <Text className="text-[14px] font-bold leading-5 text-ink">{insight.title}</Text>
                {insight.body ? (
                  <Text className="mt-0.5 text-[12px] leading-4 text-muted" numberOfLines={2}>
                    {insight.body}
                  </Text>
                ) : null}
              </View>
              {insight.action ? <ArrowUpRight size={17} color={colors.faint} /> : null}
            </Row>
            {index < insights.length - 1 ? <Divider className="ml-16" /> : null}
          </Pressable>
        );
      })}
      <View className="h-2" />
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Heute-Timeline */

export function TodayTimelineWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const iso = todayISO();
  let lessons = lessonsOn(snapshot, iso);
  let label = 'Heute';

  if (lessons.length === 0) {
    lessons = lessonsOn(snapshot, tomorrowISO());
    label = 'Morgen';
  }

  if (lessons.length === 0) {
    return (
      <ColorBlockCard color={colors.accent.amber} tone="tint">
        <WidgetHeader icon={CalendarDays} iconColor={colors.accent.amber} title="Stundenplan" />
        <EmptyState icon={Sun} iconColor={colors.accent.amber} title="Kein Unterricht" hint="Genieß den freien Tag." />
      </ColorBlockCard>
    );
  }

  const now = nowMinutes();
  const isToday = label === 'Heute';

  return (
    <ColorBlockCard color={colors.accent.amber} tone="tint" padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={CalendarDays}
        iconColor={colors.accent.amber}
        title={label}
        action="Ganze Woche"
        onAction={() => router.push('/timetable')}
      />

      <View className="px-5 pb-5 pt-1">
        {lessons.map((lesson) => {
          const style = subjectStyle(lesson.subject);
          const running = isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end);
          const past = isToday && now >= minutesOf(lesson.end);
          const cancelled = lesson.state === 'cancelled';

          return (
            <Row key={lesson.id} className="gap-3 py-1.5" style={{ opacity: past ? 0.45 : 1 }}>
              <View className="w-12">
                <Text className="text-[12px] font-extrabold text-ink">{lesson.start}</Text>
                <Text className="text-[10px] font-bold text-faint">{lesson.hour}. Std</Text>
              </View>

              <View className="items-center">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cancelled ? colors.danger : style.color }}
                />
                <View className="w-[2px] flex-1 bg-line" />
              </View>

              <View
                className="flex-1 rounded-2xl px-3.5 py-2.5"
                style={{
                  backgroundColor: running ? colors.surface : colors.surface,
                  ...shadow.card,
                }}
              >
                <Row className="justify-between" style={{ alignItems: 'flex-start' }}>
                  <Text
                    className="flex-1 text-[15px] font-extrabold leading-[18px] text-ink"
                    style={cancelled ? { textDecorationLine: 'line-through', color: colors.faint } : undefined}
                    numberOfLines={2}
                  >
                    {cancelled ? (lesson.originalSubject ?? lesson.subject) : lesson.subject}
                  </Text>
                  {lesson.room ? <Pill label={`R ${lesson.room}`} color={style.color} tone="tint" /> : null}
                </Row>
                {lesson.state !== 'regular' ? (
                  <Text
                    className="mt-1 text-[11px] font-bold"
                    style={{ color: cancelled ? colors.danger : colors.success }}
                  >
                    {lesson.comment ?? (lesson.state === 'substitution' ? 'Vertretung' : 'Raumwechsel')}
                  </Text>
                ) : null}
              </View>
            </Row>
          );
        })}
      </View>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Hausaufgaben */

export function HomeworkWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const toggle = useHomeworkDone((state) => state.toggle);
  const open = snapshot.homework.filter((item) => !item.done).slice(0, 4);
  const total = snapshot.homework.length;
  const done = snapshot.homework.filter((item) => item.done).length;

  return (
    <ColorBlockCard color={colors.accent.coral} tone="tint" padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={ListChecks}
        iconColor={colors.accent.coral}
        title="Hausaufgaben"
        action="Alle öffnen"
        onAction={() => router.push('/tasks')}
      />

      {total > 0 ? (
        <View className="px-5 pb-2 pt-1">
          <Progress value={(done / total) * 100} />
          <Row className="mt-2 justify-between">
            <Text className="text-[12px] font-bold text-ink">
              {done} von {total} erledigt
            </Text>
            <Text className="text-[12px] font-extrabold text-accent-coral">
              {Math.round((done / total) * 100)}%
            </Text>
          </Row>
        </View>
      ) : null}

      {open.length === 0 ? (
        <EmptyState icon={PartyPopper} iconColor={colors.success} title="Alles erledigt!" hint="Keine Hausaufgaben mehr offen." />
      ) : (
        <View className="gap-2 px-5 pb-5 pt-1">
          {open.map((item) => {
            const style = subjectStyle(item.subject);
            const days = daysUntil(item.due);
            return (
              <PressableScale
                key={item.id}
                onPress={() => toggle(item.id)}
                className="rounded-2xl bg-surface p-3"
                style={shadow.card}
              >
                <Row className="gap-3">
                  <View
                    className="h-7 w-7 items-center justify-center rounded-full border-2"
                    style={{ borderColor: style.color, backgroundColor: tint(style.color, 0.12) }}
                  >
                    {item.done ? <Check size={14} color={style.color} strokeWidth={3} /> : null}
                  </View>
                  <View className="flex-1">
                    <Row className="justify-between gap-2">
                      <Text className="text-[14px] font-extrabold" style={{ color: style.color }}>
                        {item.subject}
                      </Text>
                      <Pill
                        label={formatRelativeDay(item.due)}
                        color={days <= 0 ? colors.danger : days === 1 ? colors.warning : colors.faint}
                        tone="solid"
                      />
                    </Row>
                    <Text className="mt-1 text-[13px] font-medium leading-[18px] text-ink" numberOfLines={2}>
                      {item.text}
                    </Text>
                  </View>
                </Row>
              </PressableScale>
            );
          })}
        </View>
      )}
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Klassenarbeiten */

export function ExamsWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const upcoming = snapshot.exams
    .filter((exam) => daysUntil(exam.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <ColorBlockCard color={colors.category.mint.solid} tone="tint" padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={BarChart3}
        iconColor={colors.category.mint.solid}
        title="Klassenarbeiten"
        action="Lernplan"
        onAction={() => router.push('/tasks')}
      />

      <Row className="gap-3 px-5 pb-5 pt-1">
        {upcoming.map((exam) => {
          const style = subjectStyle(exam.subject);
          const SubjectIcon = subjectIcon(exam.subject);
          const days = daysUntil(exam.date);
          const urgentColor = days <= 2 ? colors.danger : days <= 5 ? colors.warning : colors.success;

          return (
            <View
              key={exam.id}
              className="flex-1 rounded-[22px] bg-surface p-3.5"
              style={shadow.card}
            >
              <Row className="justify-between">
                <IconBadge icon={SubjectIcon} color={style.color} size={30} iconSize={15} />
                <Pill label={days === 0 ? 'Heute' : `${days} d`} color={urgentColor} tone="solid" />
              </Row>
              <Text className="mt-2 text-[30px] font-extrabold tracking-tight" style={{ color: urgentColor }}>
                {days === 0 ? '!' : days}
              </Text>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {days === 1 ? 'Tag übrig' : 'Tage übrig'}
              </Text>
              <Text className="mt-1.5 text-[14px] font-extrabold leading-[17px] text-ink" numberOfLines={2}>
                {exam.subject}
              </Text>
            </View>
          );
        })}
      </Row>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Noten */

export function GradesWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const hidden = useSettings((state) => state.settings.hideGrades);
  const withAverage = snapshot.subjects.filter((subject) => subject.average != null);
  if (withAverage.length === 0) return null;

  const overall =
    withAverage.reduce((sum, subject) => sum + (subject.average as number), 0) / withAverage.length;

  const recent = snapshot.subjects
    .flatMap((subject) => subject.grades.map((grade) => ({ ...grade, subject: subject.subject })))
    .filter((grade) => grade.date)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 3);

  return (
    <PressableScale onPress={() => router.push('/grades')}>
      <ColorBlockCard color={colors.accent.lime} tone="tint" padded={false} className="overflow-hidden">
        <WidgetHeader
          icon={BarChart3}
          iconColor={colors.accent.limeDeep}
          title="Notenübersicht"
          action={`${withAverage.length} Fächer`}
        />
        <Row className="gap-4 px-5 pb-5 pt-1">
          <View
            className="items-center justify-center rounded-[22px] px-5 py-4"
            style={{ backgroundColor: colors.accent.lime, ...shadow.card }}
          >
            <Text className="text-[34px] font-extrabold leading-[38px] text-on-lime">
              {hidden ? '•••' : de(overall)}
            </Text>
            <Text className="mt-0.5 text-[11px] font-extrabold uppercase tracking-wider text-on-lime">
              Gesamtschnitt
            </Text>
          </View>

          <View className="flex-1 gap-2">
            {recent.map((grade) => {
              const style = subjectStyle(grade.subject);
              const SubIcon = subjectIcon(grade.subject);
              return (
                <Row
                  key={`${grade.subject}-${grade.id}`}
                  className="justify-between rounded-xl bg-surface px-3 py-2"
                  style={shadow.card}
                >
                  <Row className="flex-1 gap-2">
                    <IconBadge icon={SubIcon} color={style.color} size={24} iconSize={12} />
                    <Text className="flex-1 text-[13px] font-bold text-ink" numberOfLines={1}>
                      {grade.subject}
                    </Text>
                  </Row>
                  <Pill label={hidden ? '•' : String(grade.value)} color={style.color} tone="solid" />
                </Row>
              );
            })}
          </View>
        </Row>
      </ColorBlockCard>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Elternbriefe */

export function LettersWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const pending = snapshot.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed);
  const latest = pending.length > 0 ? pending : snapshot.letters.slice(0, 2);
  if (latest.length === 0) return null;

  return (
    <ColorBlockCard color={colors.category.lavender.solid} tone="tint" padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={Mail}
        iconColor={colors.category.lavender.solid}
        title="Elternbriefe"
        badge={pending.length}
        action="Alle ansehen"
        onAction={() => router.push('/inbox')}
      />

      <View className="gap-2.5 px-5 pb-5 pt-1">
        {latest.slice(0, 3).map((letter) => (
          <PressableScale
            key={String(letter.id)}
            onPress={() => router.push('/inbox')}
            className="rounded-[20px] bg-surface p-3.5"
            style={shadow.card}
          >
            <Row className="gap-3">
              <IconBadge
                icon={Mail}
                color={colors.category.lavender.solid}
                tone="solid"
                size={40}
                iconSize={20}
              />
              <View className="flex-1">
                <Row className="justify-between gap-2">
                  <Text className="flex-1 text-[15px] font-extrabold leading-[18px] text-ink" numberOfLines={1}>
                    {letter.subject}
                  </Text>
                  {letter.requiresConfirmation && !letter.confirmed ? (
                    <Pill label="Bestätigen" color={colors.accent.amber} tone="solid" />
                  ) : null}
                </Row>
                <Muted className="mt-1 text-[12px]" numberOfLines={2}>
                  {excerpt(htmlToText(letter.content), 80)}
                </Muted>
              </View>
            </Row>
          </PressableScale>
        ))}
      </View>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Fehlzeiten */

export function AttendanceWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const total = snapshot.absences.length;
  if (total === 0) return null;
  const unexcused = snapshot.absences.filter((absence) => !absence.excused).length;

  return (
    <PressableScale onPress={() => router.push('/attendance')}>
      <ColorBlockCard color={colors.warning} tone="tint" padded={false} className="overflow-hidden">
        <WidgetHeader
          icon={FileText}
          iconColor={colors.warning}
          title="Fehlzeiten"
          onAction={() => router.push('/attendance')}
        />
        <Row className="gap-3 px-5 pb-5 pt-1">
          <StatCard
            value={total}
            label="Fehltage gesamt"
            icon={FileText}
            color={colors.charcoal}
            tone="surface"
          />
          <StatCard
            value={unexcused}
            label="Unentschuldigt"
            icon={AlertTriangle}
            color={unexcused > 0 ? colors.danger : colors.success}
            tone="solid"
          />
        </Row>
      </ColorBlockCard>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Schwarzes Brett */

export function BoardWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const tiles = snapshot.tiles.slice(0, 3);
  if (tiles.length === 0) return null;

  return (
    <ColorBlockCard color={colors.category.blue.solid} tone="tint" padded={false} className="overflow-hidden">
      <WidgetHeader icon={Inbox} iconColor={colors.category.blue.solid} title="Schwarzes Brett" />
      <View className="gap-2.5 px-5 pb-5 pt-1">
        {tiles.map((tile) => (
          <View key={String(tile.id)} className="rounded-[20px] bg-surface p-3.5" style={shadow.card}>
            <Row className="gap-2" style={{ alignItems: 'flex-start' }}>
              <IconBadge icon={Info} color={colors.category.blue.solid} size={28} iconSize={14} />
              <Text className="flex-1 text-[14px] font-extrabold leading-[18px] text-ink" numberOfLines={2}>
                {tile.title}
              </Text>
              {tile.pinned ? <Pill label="Wichtig" color={colors.warning} tone="solid" /> : null}
            </Row>
            <Text className="mt-2 text-[12px] leading-[17px] text-muted" numberOfLines={3}>
              {htmlToText(tile.content)}
            </Text>
          </View>
        ))}
      </View>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Schnellaktionen */

export function QuickActionsWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const items = packingList(snapshot, tomorrowISO());

  const actions: { icon: LucideIcon; label: string; color: string; href: string }[] = [
    { icon: Stethoscope, label: 'Krankmeldung', color: colors.danger, href: '/sick-note' },
    { icon: Plane, label: 'Beurlaubung', color: colors.accent.violet, href: '/exemption' },
    { icon: CalendarDays, label: 'Kalender', color: colors.category.blue.solid, href: '/calendar' },
    { icon: Search, label: 'Suche', color: colors.success, href: '/search' },
  ];

  const moduleActions: { id: string; icon: LucideIcon; label: string; color: string; href: string }[] = [
    { id: 'invoicing', icon: CreditCard, label: 'Zahlungen', color: colors.success, href: '/payments' },
    { id: 'documents', icon: FolderOpen, label: 'Dokumente', color: colors.accent.amber, href: '/documents' },
    { id: 'parenttalks', icon: Users, label: 'Sprechtag', color: colors.warning, href: '/parent-talks' },
    { id: 'electives', icon: GitBranch, label: 'Wahl', color: colors.accent.violet, href: '/electives' },
    { id: 'allday', icon: Sun, label: 'Ganztag', color: colors.category.orange.solid, href: '/allday' },
  ].filter((action) => snapshot.modules.length === 0 || snapshot.modules.includes(action.id));

  return (
    <ColorBlockCard color={colors.accent.amber} tone="tint" padded={false} className="overflow-hidden">
      <WidgetHeader icon={Sparkles} iconColor={colors.accent.amber} title="Schnellaktionen" />
      <View className="px-5 pb-5 pt-1">
        <Row className="gap-2.5">
          {actions.map((action) => (
            <PressableScale key={action.label} onPress={() => router.push(action.href as never)} className="flex-1">
              <View className="items-center rounded-[20px] bg-surface py-3" style={shadow.card}>
                <IconBadge icon={action.icon} color={action.color} size={44} iconSize={22} tone="solid" />
                <Text className="mt-2 text-[11px] font-extrabold text-ink">{action.label}</Text>
              </View>
            </PressableScale>
          ))}
        </Row>

        {moduleActions.length > 0 ? (
          <Row className="mt-3 gap-2.5">
            {moduleActions.slice(0, 5).map((action) => (
              <PressableScale key={action.label} onPress={() => router.push(action.href as never)} className="flex-1">
                <View className="items-center rounded-[20px] bg-surface py-3" style={shadow.card}>
                  <IconBadge icon={action.icon} color={action.color} size={44} iconSize={22} tone="solid" />
                  <Text className="mt-2 text-[11px] font-extrabold text-ink">{action.label}</Text>
                </View>
              </PressableScale>
            ))}
          </Row>
        ) : null}
      </View>

      {items.length > 0 ? (
        <View className="border-t border-line/60 px-5 pb-5 pt-3">
          <Row className="gap-2">
            <ShoppingBag size={16} strokeWidth={2.4} color={colors.accent.violet} />
            <Text className="text-[15px] font-extrabold text-ink">Für morgen einpacken</Text>
          </Row>
          <Row className="mt-2 flex-wrap gap-2">
            {items.map((item) => (
              <Pill key={item} label={item} color={colors.accent.violet} tone="solid" />
            ))}
          </Row>
        </View>
      ) : null}
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Registry */

export const WIDGET_COMPONENTS = {
  'next-lesson': NextLessonWidget,
  insights: InsightsWidget,
  'today-timeline': TodayTimelineWidget,
  homework: HomeworkWidget,
  exams: ExamsWidget,
  grades: GradesWidget,
  letters: LettersWidget,
  attendance: AttendanceWidget,
  board: BoardWidget,
  'quick-actions': QuickActionsWidget,
} as const;
