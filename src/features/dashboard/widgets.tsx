/**
 * Dashboard-Widgets.
 *
 * Jedes Widget ist eine eigenständige Karte, die nur den Snapshot bekommt.
 * Reihenfolge und Sichtbarkeit steuern die Einstellungen (`settings.widgets`),
 * dieselbe Liste versorgt später die Home-Screen-Widgets.
 *
 * Phase C — „Bento Grid / Soft Brutalism“: Jede Karte in Bento-Anatomie
 * (Farbblock, Ecken-Pfeil, Status-Pills, Emoji-frei, nur Lucide-Vektor-Icons).
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
import { subjectStyle, tint } from '@/design/subjects';
import { computeInsights, computeNow, lessonsOn, packingList } from '@/features/insights/engine';
import { useHomeworkDone } from '@/data/queries';
import { addDays, daysUntil, formatRelativeDay, minutesOf, nowMinutes, toISO } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import {
  Badge,
  Card,
  Divider,
  EmptyState,
  Muted,
  Pill,
  RoundActionButton,
  Row,
} from '@/ui/primitives';
import { LivePulse, PressableScale } from '@/ui/motion';
import { Progress } from '@/ui/gluestack/feedback';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { foregroundOn } from '@/design/tokens';

interface WidgetProps {
  snapshot: Snapshot;
}

const todayISO = () => toISO(new Date());
const tomorrowISO = () => toISO(addDays(new Date(), 1));

/* ------------------------------------------------------------------ Widget-Header */

/**
 * Bento-Kopfzeile einer Karte: Lucide-Icon in getönter Kachel + Titel,
 * rechts Badge, Text-Link oder runder Ecken-Pfeil.
 */
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
    <Row className="justify-between px-5 pb-1 pt-5">
      <Row className="flex-1 gap-2.5">
        <View
          className="h-8 w-8 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: tint(resolvedIconColor, 0.14) }}
        >
          <IconComponent size={17} strokeWidth={2.2} color={resolvedIconColor} />
        </View>
        <Text className="flex-1 text-[15px] font-bold text-ink" numberOfLines={1}>
          {title}
        </Text>
      </Row>
      {typeof badge === 'number' && badge > 0 ? (
        <Badge count={badge} />
      ) : action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-[12px] font-semibold text-accent-amber-deep">{action}</Text>
        </Pressable>
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

  if (!lesson) {
    return (
      <Card className="overflow-hidden">
        <WidgetHeader icon={BookOpen} iconColor={colors.accent.violet} title="Nächste Stunde" />
        <View className="px-6 pb-8 pt-2">
          <EmptyState
            icon={Sun}
            iconColor={colors.accent.violet}
            title="Kein Unterricht"
            hint={status.label}
          />
        </View>
      </Card>
    );
  }

  return (
    <PressableScale onPress={() => router.push('/timetable')}>
      <Card className="overflow-hidden" floating padded={false}>
        <View style={{ backgroundColor: tint(style.color, 0.16) }} className="px-4 pb-4 pt-4">
          <Row className="justify-between">
            <Row className="gap-2">
              {status.kind === 'in-lesson' ? <LivePulse color={style.color} /> : null}
              <Text className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: style.color }}>
                {status.kind === 'in-lesson'
                  ? 'Läuft gerade'
                  : status.kind === 'break'
                    ? 'Als Nächstes'
                    : status.kind === 'before-school'
                      ? 'Schulbeginn'
                      : 'Nächste Stunde'}
              </Text>
            </Row>
            <Text className="text-[11px] font-bold" style={{ color: style.color }}>
              {status.label}
            </Text>
          </Row>

          <Row className="mt-3 gap-3">
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: style.color }}
            >
              <BookOpen color={foregroundOn(style.color, colors)} size={24} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="text-[20px] font-extrabold leading-[22px] tracking-tight text-ink" numberOfLines={2}>
                {lesson.subject}
              </Text>
              <Muted>
                {lesson.start}–{lesson.end} Uhr
                {lesson.room ? ` · ${lesson.room}` : ''}
                {lesson.teacher ? ` · ${lesson.teacher}` : ''}
              </Muted>
            </View>
            <RoundActionButton
              onPress={() => router.push('/timetable')}
              size={38}
              color={style.color}
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
              {lesson.comment ? <Muted className="flex-1">{lesson.comment}</Muted> : null}
            </Row>
          ) : null}
        </View>
      </Card>
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
  // Bugfix: computeInsights lief einmal pro Render (teils doppelt) — jetzt memoized.
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
    <Card padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={Sparkles}
        iconColor={colors.accent.violet}
        title="Smart Insights"
        action={`${insights.length} von ${all.length}`}
      />

      {insights.map((insight, index) => {
        const Icon = INSIGHT_ICON[insight.tone] ?? Info;
        const tone = toneColor[insight.tone] ?? colors.accent.violet;
        return (
          <Pressable
            key={insight.id}
            onPress={() => insight.action && router.push(insight.action.href as never)}
            className="active:bg-line/40"
          >
            <Row className="gap-3 px-5 py-3">
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: tint(tone, 0.14) }}
              >
                <Icon size={17} strokeWidth={2.1} color={tone} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold leading-5 text-ink">{insight.title}</Text>
                {insight.body ? (
                  <Text className="mt-0.5 text-[12px] leading-4 text-muted" numberOfLines={2}>
                    {insight.body}
                  </Text>
                ) : null}
              </View>
              {insight.action ? <ArrowUpRight size={15} color={colors.faint} /> : null}
            </Row>
            {index < insights.length - 1 ? <Divider className="ml-16" /> : null}
          </Pressable>
        );
      })}
      <View className="h-2" />
    </Card>
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
      <Card>
        <WidgetHeader icon={CalendarDays} iconColor={colors.accent.violet} title="Stundenplan" />
        <EmptyState icon={Sun} iconColor={colors.accent.violet} title="Kein Unterricht" hint="Genieß den freien Tag." />
      </Card>
    );
  }

  const now = nowMinutes();
  const isToday = label === 'Heute';

  return (
    <Card padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={CalendarDays}
        iconColor={colors.accent.violet}
        title={label}
        action="Ganze Woche"
        onAction={() => router.push('/timetable')}
      />

      <View className="px-5 pb-5">
        {lessons.map((lesson) => {
          const style = subjectStyle(lesson.subject);
          const running = isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end);
          const past = isToday && now >= minutesOf(lesson.end);
          const cancelled = lesson.state === 'cancelled';

          return (
            <Row key={lesson.id} className="gap-3 py-1.5" style={{ opacity: past ? 0.45 : 1 }}>
              <View className="w-11">
                <Text className="text-[12px] font-bold text-muted">{lesson.start}</Text>
                <Text className="text-[10px] text-faint">{lesson.hour}. Std</Text>
              </View>

              <View className="items-center">
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: cancelled ? colors.danger : style.color }}
                />
                <View className="w-[2px] flex-1 bg-line" />
              </View>

              <View
                className="flex-1 rounded-2xl px-3 py-2"
                style={{
                  backgroundColor: running ? tint(style.color, 0.18) : 'transparent',
                  borderWidth: running ? 0 : 1,
                  borderColor: colors.line,
                }}
              >
                <Row className="justify-between" style={{ alignItems: 'flex-start' }}>
                  <Text
                    className="flex-1 text-[14px] font-semibold leading-[17px] text-ink"
                    style={cancelled ? { textDecorationLine: 'line-through', color: colors.faint } : undefined}
                    numberOfLines={2}
                  >
                    {cancelled ? (lesson.originalSubject ?? lesson.subject) : lesson.subject}
                  </Text>
                  {lesson.room ? <Muted className="ml-2 text-[11px]">{lesson.room}</Muted> : null}
                </Row>
                {lesson.state !== 'regular' ? (
                  <Text
                    className="mt-0.5 text-[11px] font-semibold"
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
    </Card>
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
    <Card padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={ListChecks}
        iconColor={colors.success}
        title="Hausaufgaben"
        action="Alle"
        onAction={() => router.push('/tasks')}
      />

      {total > 0 ? (
        <View className="px-5 pb-2">
          <Progress value={(done / total) * 100} />
          <Muted className="mt-1.5 text-[11px]">
            {done} von {total} erledigt
          </Muted>
        </View>
      ) : null}

      {open.length === 0 ? (
        <EmptyState icon={PartyPopper} iconColor={colors.success} title="Nichts offen" hint="Alle Aufgaben erledigt." />
      ) : (
        open.map((item) => {
          const style = subjectStyle(item.subject);
          const days = daysUntil(item.due);
          return (
            <Pressable key={item.id} onPress={() => toggle(item.id)} className="active:bg-line/40">
              <Row className="gap-3 px-5 py-2.5">
                <View
                  className="h-5 w-5 items-center justify-center rounded-md border-2"
                  style={{ borderColor: style.color }}
                />
                <View className="flex-1">
                  <Row className="gap-2">
                    <Text className="text-[13px] font-bold" style={{ color: style.color }}>
                      {item.subject}
                    </Text>
                    <Pill
                      label={formatRelativeDay(item.due)}
                      color={days <= 0 ? colors.danger : days === 1 ? colors.warning : colors.faint}
                    />
                  </Row>
                  <Text className="mt-0.5 text-[13px] leading-[18px] text-muted" numberOfLines={2}>
                    {item.text}
                  </Text>
                </View>
              </Row>
            </Pressable>
          );
        })
      )}
      <View className="h-2" />
    </Card>
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
    <Card padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={BarChart3}
        iconColor={colors.warning}
        title="Klassenarbeiten"
        action="Lernplan"
        onAction={() => router.push('/tasks')}
      />

      <Row className="gap-3 px-5 pb-5">
        {upcoming.map((exam) => {
          const style = subjectStyle(exam.subject);
          const days = daysUntil(exam.date);
          return (
            <View
              key={exam.id}
              className="flex-1 rounded-2xl p-3"
              style={{ backgroundColor: tint(style.color, 0.14) }}
            >
              <Text className="text-[22px] font-extrabold" style={{ color: style.color }}>
                {days === 0 ? 'heute' : days}
              </Text>
              {days > 0 ? (
                <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: style.color }}>
                  {days === 1 ? 'Tag' : 'Tage'}
                </Text>
              ) : null}
              <Text className="mt-1.5 text-[13px] font-bold leading-[15px] text-ink" numberOfLines={2}>
                {exam.subject}
              </Text>
              <Muted className="text-[11px]" numberOfLines={1}>
                {exam.type ?? 'Arbeit'}
              </Muted>
            </View>
          );
        })}
      </Row>
    </Card>
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
      <Card>
        <WidgetHeader icon={BarChart3} iconColor={colors.accent.violet} title="Noten" action={`${withAverage.length} Fächer`} />
        <Row className="mt-1 gap-4 px-1">
          <View className="items-center rounded-2xl bg-accent-lime px-4 py-3">
            <Text className="text-[26px] font-extrabold text-on-lime">
              {hidden ? '•••' : de(overall)}
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-on-lime">Schnitt</Text>
          </View>

          <View className="flex-1 gap-1.5">
            {recent.map((grade) => {
              const style = subjectStyle(grade.subject);
              return (
                <Row key={`${grade.subject}-${grade.id}`} className="justify-between">
                  <Text className="flex-1 text-[13px] leading-[16px] text-ink" numberOfLines={2}>
                    {grade.subject}
                  </Text>
                  <View
                    className="min-w-[26px] items-center rounded-lg px-1.5 py-0.5"
                    style={{ backgroundColor: tint(style.color, 0.18) }}
                  >
                    <Text className="text-[12px] font-bold" style={{ color: style.color }}>
                      {hidden ? '•' : grade.value}
                    </Text>
                  </View>
                </Row>
              );
            })}
          </View>
        </Row>
      </Card>
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
    <Card padded={false} className="overflow-hidden">
      <WidgetHeader
        icon={Mail}
        iconColor={colors.accent.violet}
        title="Elternbriefe"
        badge={pending.length}
      />

      {latest.slice(0, 3).map((letter) => (
        <Pressable
          key={String(letter.id)}
          onPress={() => router.push('/inbox')}
          className="active:bg-line/40"
        >
          <Row className="gap-3 px-5 py-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent-violet/15">
              <Mail size={17} strokeWidth={2.1} color={colors.accent.violet} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold leading-[17px] text-ink" numberOfLines={2}>
                {letter.subject}
              </Text>
              <Muted className="text-[12px]" numberOfLines={1}>
                {excerpt(htmlToText(letter.content), 60)}
              </Muted>
            </View>
            {letter.requiresConfirmation && !letter.confirmed ? (
              <View className="h-2 w-2 rounded-full bg-accent-coral" />
            ) : null}
          </Row>
        </Pressable>
      ))}
      <View className="h-2" />
    </Card>
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
      <Card>
        <WidgetHeader
          icon={FileText}
          iconColor={colors.warning}
          title="Fehlzeiten"
          onAction={() => router.push('/attendance')}
        />
        <Row className="mt-1 gap-3 px-1">
          <View className="flex-1 rounded-2xl bg-line/40 p-3">
            <Text className="text-[22px] font-extrabold text-ink">{total}</Text>
            <Muted className="text-[11px]">Fehltage gesamt</Muted>
          </View>
          <View
            className="flex-1 rounded-2xl p-3"
            style={{ backgroundColor: tint(unexcused > 0 ? colors.danger : colors.success, 0.14) }}
          >
            <Text
              className="text-[22px] font-extrabold"
              style={{ color: unexcused > 0 ? colors.danger : colors.success }}
            >
              {unexcused}
            </Text>
            <Muted className="text-[11px]">unentschuldigt</Muted>
          </View>
        </Row>
      </Card>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Schwarzes Brett */

export function BoardWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const tiles = snapshot.tiles.slice(0, 3);
  if (tiles.length === 0) return null;

  return (
    <Card padded={false} className="overflow-hidden">
      <WidgetHeader icon={Inbox} iconColor={colors.accent.violet} title="Schwarzes Brett" />
      {tiles.map((tile, index) => (
        <View key={String(tile.id)}>
          <View className="px-5 py-2.5">
            <Row className="gap-2" style={{ alignItems: 'flex-start' }}>
              {tile.pinned ? <Sun size={12} color={colors.warning} /> : null}
              <Text className="flex-1 text-[14px] font-semibold leading-[17px] text-ink" numberOfLines={2}>
                {tile.title}
              </Text>
            </Row>
            <Text className="mt-0.5 text-[12px] leading-[17px] text-muted" numberOfLines={3}>
              {htmlToText(tile.content)}
            </Text>
          </View>
          {index < tiles.length - 1 ? <Divider className="ml-4" /> : null}
        </View>
      ))}
      <View className="h-2" />
    </Card>
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
    { icon: CalendarDays, label: 'Kalender', color: colors.accent.violet, href: '/calendar' },
    { icon: Search, label: 'Suche', color: colors.success, href: '/search' },
  ];

  // Gebuchte Zusatzmodule (im Demo-Modus alle) als zweite Reihe.
  const moduleActions: { id: string; icon: LucideIcon; label: string; color: string; href: string }[] = [
    { id: 'invoicing', icon: CreditCard, label: 'Zahlungen', color: colors.success, href: '/payments' },
    { id: 'documents', icon: FolderOpen, label: 'Dokumente', color: colors.accent.amber, href: '/documents' },
    { id: 'parenttalks', icon: Users, label: 'Sprechtag', color: colors.warning, href: '/parent-talks' },
    { id: 'electives', icon: GitBranch, label: 'Wahl', color: colors.accent.violet, href: '/electives' },
    { id: 'allday', icon: Sun, label: 'Ganztag', color: colors.accent.violet, href: '/allday' },
  ].filter((action) => snapshot.modules.length === 0 || snapshot.modules.includes(action.id));

  return (
    <Card padded={false} className="overflow-hidden">
      <WidgetHeader icon={Sparkles} iconColor={colors.accent.violet} title="Schnellaktionen" />
      <View className="px-5 pb-5 pt-1">
        <Row className="gap-3">
          {actions.map((action) => (
            <PressableScale key={action.label} onPress={() => router.push(action.href as never)} className="flex-1">
              <Card className="items-center py-3.5" padded={false}>
                <View
                  className="h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: tint(action.color, 0.14) }}
                >
                  <action.icon size={19} strokeWidth={2.1} color={action.color} />
                </View>
                <Text className="mt-1.5 text-[11px] font-semibold text-ink">{action.label}</Text>
              </Card>
            </PressableScale>
          ))}
        </Row>

        {moduleActions.length > 0 ? (
          <Row className="mt-3 gap-3">
            {moduleActions.slice(0, 5).map((action) => (
              <PressableScale key={action.label} onPress={() => router.push(action.href as never)} className="flex-1">
                <Card className="items-center py-3.5" padded={false}>
                  <View
                    className="h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: tint(action.color, 0.14) }}
                  >
                    <action.icon size={19} strokeWidth={2.1} color={action.color} />
                  </View>
                  <Text className="mt-1.5 text-[11px] font-semibold text-ink">{action.label}</Text>
                </Card>
              </PressableScale>
            ))}
          </Row>
        ) : null}
      </View>

      {items.length > 0 ? (
        <View className="border-t border-line px-5 pt-3 pb-5">
          <Row className="gap-2">
            <ShoppingBag size={15} strokeWidth={2.1} color={colors.accent.violet} />
            <Text className="text-[15px] font-bold text-ink">Für morgen einpacken</Text>
          </Row>
          <Row className="mt-2 flex-wrap gap-2">
            {items.map((item) => (
              <Pill key={item} label={item} color={colors.accent.violet} />
            ))}
          </Row>
        </View>
      ) : null}
    </Card>
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
