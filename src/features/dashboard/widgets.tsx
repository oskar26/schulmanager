/**
 * Dashboard-Widgets — „Playful Modern Canvas“ (docs/playful-modern.md).
 *
 * Jede Dashboard-Sektion ist eine weiße Bento-Karte (Radius 20, feiner Rand)
 * mit farbigem Icon-Container im Kopf. Farbe lebt in Akzenten: Icon-Kacheln,
 * 4-px-Left-Borders der Unterkarten, Pills und Fortschrittsbalken — nie mehr
 * als Vollton-Fläche. Reihenfolge und Sichtbarkeit bleiben im Settings-Store;
 * dieses Modul entscheidet ausschließlich über die Darstellung.
 *
 * Jedes Widget exportiert zusätzlich eine `span` (12-Spalten-Raster), damit
 * `app/(tabs)/index.tsx` die Bento-Zeilen ohne Löcher packen kann.
 */
import React, { useMemo } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
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
  Clock,
  CreditCard,
  FileText,
  FolderOpen,
  GitBranch,
  Info,
  Inbox,
  ListChecks,
  Mail,
  MapPin,
  Plane,
  Search,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Sun,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import type { Lesson, Snapshot } from '@/api/types';
import { useHomeworkDone, useModuleActive } from '@/data/queries';
import { categoryColor, categoryFromText } from '@/design/categories';
import { subjectColor, subjectIcon, tint } from '@/design/subjects';
import { blockTint, radius } from '@/design/tokens';
import { de } from '@/features/grades/calculator';
import { computeInsights, computeNow, lessonsOn, packingList } from '@/features/insights/engine';
import { addDays, daysUntil, formatRelativeDay, minutesOf, nowMinutes, toISO } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { Progress } from '@/ui/gluestack/feedback';
import { isMainTabHref } from '@/ui/navigation';
import { LivePulse, PressableOpacity, PressableScale } from '@/ui/motion';
import {
  Badge,
  Card,
  CardSubtitle,
  CardTitle,
  ColorBlockCard,
  EmptyState,
  IconBadge,
  Pill,
  Row,
} from '@/ui/primitives';

interface WidgetProps {
  snapshot: Snapshot;
}

const todayISO = () => toISO(new Date());
const tomorrowISO = () => toISO(addDays(new Date(), 1));

/* ------------------------------------------------------------------ Gemeinsame Bausteine */

/**
 * Kopf jeder Bento-Karte: farbiger Icon-Container (36 px, Radius 10, Pastell-
 * Hintergrund + farbiges Icon), einzeiliger Titel mit Ellipsis, optional
 * Untertitel, rechts Aktion/Badge.
 */
export function WidgetHeader({
  icon: IconComponent,
  title,
  subtitle,
  color,
  action,
  onAction,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Akzentfarbe des Icon-Containers. */
  color: string;
  action?: string;
  onAction?: () => void;
  badge?: number;
}) {
  const { colors, isDark } = useThemeColors();
  const accent = color;
  return (
    <Row className="justify-between gap-3 px-5 pb-3 pt-5">
      <Row className="min-w-0 flex-1 gap-3">
        <IconTile icon={IconComponent} color={accent} />
        <View className="min-w-0 flex-1">
          <CardTitle>{title}</CardTitle>
          {subtitle ? <CardSubtitle numberOfLines={1} className="mt-0 text-[12.5px]">{subtitle}</CardSubtitle> : null}
        </View>
      </Row>
      {typeof badge === 'number' && badge > 0 ? (
        <Badge count={badge} />
      ) : action && onAction ? (
        <PressableOpacity onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={action}>
          <View
            className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
            style={{ backgroundColor: blockTint(accent, isDark) }}
          >
            <Text className="text-[12px] font-extrabold" style={{ color: accent }} numberOfLines={1}>
              {action}
            </Text>
            <ArrowUpRight size={13} strokeWidth={2.6} color={accent} />
          </View>
        </PressableOpacity>
      ) : action ? (
        <Text className="max-w-[45%] text-[12px] font-bold text-muted" numberOfLines={1}>
          {action}
        </Text>
      ) : onAction ? (
        <PressableOpacity onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${title} öffnen`}>
          <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.elevated }}>
            <ArrowUpRight size={16} strokeWidth={2.4} color={colors.ink} />
          </View>
        </PressableOpacity>
      ) : null}
    </Row>
  );
}

/** 36×36-Icon-Container (Radius 10) mit Pastell-Hintergrund und farbigem Icon. */
export function IconTile({
  icon: IconComponent,
  color,
  size = 36,
  iconSize,
  style,
}: {
  icon: LucideIcon;
  color: string;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
}) {
  const { isDark } = useThemeColors();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          backgroundColor: blockTint(color, isDark),
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <IconComponent size={iconSize ?? Math.round(size * 0.5)} strokeWidth={2.2} color={color} />
    </View>
  );
}

/** Unterkarte in einer Bento-Box: App-Hintergrund, Radius 14, optional 4-px-Akzentstreifen. */
function SubCard({
  children,
  accent,
  className = '',
  style,
}: {
  children: React.ReactNode;
  accent?: string;
  className?: string;
  style?: ViewStyle;
}) {
  const { colors } = useThemeColors();
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: colors.canvas,
          borderRadius: radius.md,
          borderLeftWidth: accent ? 4 : 0,
          borderLeftColor: accent,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Kleines Meta-Badge (Zeit, Raum, Lehrer) — Pastell mit farbigem Icon. */
function MetaBadge({ icon: Icon, label, color }: { icon: LucideIcon; label: string; color: string }) {
  const { isDark } = useThemeColors();
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5"
      style={{ backgroundColor: blockTint(color, isDark), maxWidth: '100%' }}
    >
      <Icon size={13} strokeWidth={2.4} color={color} />
      <Text className="flex-shrink text-[12px] font-bold text-ink" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ Nächste Stunde */

export function NextLessonWidget({ snapshot }: WidgetProps) {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const status = computeNow(snapshot);
  const lesson = status.lesson ?? status.next;

  if (!lesson) {
    return (
      <Card padded={false} className="h-full">
        <WidgetHeader icon={BookOpen} title="Nächster Unterricht" color={colors.blocks.sky} />
        <EmptyState illustration="free-day" title="Kein Unterricht" hint={status.label || 'Genieß den freien Tag.'} />
      </Card>
    );
  }

  const accent = subjectColor(lesson.subject, isDark);
  const SubjectIcon = subjectIcon(lesson.subject);
  const kicker =
    status.kind === 'in-lesson'
      ? 'Läuft gerade'
      : status.kind === 'break'
        ? 'Als Nächstes'
        : status.kind === 'before-school'
          ? 'Schulbeginn'
          : 'Nächste Stunde';
  const subtitle = status.kind === 'free-day' ? formatRelativeDay(lesson.date) : status.label;
  const stateLabel =
    lesson.state === 'cancelled' ? 'Entfall' : lesson.state === 'substitution' ? 'Vertretung' : 'Raumwechsel';

  return (
    <ColorBlockCard
      color={accent}
      padded={false}
      onPress={() => router.navigate('/timetable')}
      accessibilityLabel={`Stundenplan: ${lesson.subject}`}
      className="h-full"
    >
      <WidgetHeader icon={BookOpen} title="Nächster Unterricht" subtitle={subtitle} color={accent} />
      <View className="px-5 pb-5">
        <Row className="gap-3">
          <IconTile icon={SubjectIcon} color={accent} size={56} />
          <View className="min-w-0 flex-1 justify-center">
            <Row className="gap-2">
              {status.kind === 'in-lesson' ? <LivePulse color={accent} /> : null}
              <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.4px]" style={{ color: accent }} numberOfLines={1}>
                {kicker}
              </Text>
            </Row>
            <Text className="mt-0.5 text-[24px] font-extrabold leading-[28px] tracking-[-0.5px] text-ink" numberOfLines={2}>
              {lesson.subject}
            </Text>
          </View>
        </Row>

        <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }}>
          <MetaBadge icon={Clock} label={`${lesson.start} Uhr`} color={accent} />
          {lesson.room ? <MetaBadge icon={MapPin} label={lesson.room} color={accent} /> : null}
          {lesson.teacher ? <MetaBadge icon={User} label={lesson.teacher} color={accent} /> : null}
        </View>

        {lesson.state !== 'regular' ? (
          <Row className="mt-3 gap-2.5">
            <Pill
              label={stateLabel}
              color={lesson.state === 'cancelled' ? colors.status.urgent : colors.status.success}
              tone="solid"
              icon={lesson.state === 'cancelled' ? AlertTriangle : BookOpen}
            />
            {lesson.comment ? (
              <Text className="flex-1 text-[12px] font-medium text-muted" numberOfLines={2}>
                {lesson.comment}
              </Text>
            ) : null}
          </Row>
        ) : null}
      </View>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Smart Insights */

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
  const gradesOn = useModuleActive('grades');
  const all = useMemo(() => computeInsights(snapshot), [snapshot]);
  // Insight-Regeln können Noten erwähnen, obwohl das Modul für dieses Konto
  // nicht gebucht ist. Diese CTA darf dann nicht auf einen href:null-Tab zeigen.
  const availableInsights = all.filter((insight) => gradesOn || insight.action?.href !== '/grades');
  const insights = availableInsights.slice(0, 4);
  if (insights.length === 0) return null;

  const toneColor: Record<string, string> = {
    positive: colors.status.success,
    warning: colors.status.warning,
    critical: colors.status.urgent,
    fun: colors.blocks.violet,
    neutral: colors.status.info,
  };

  return (
    <Card padded={false} className="h-full">
      <WidgetHeader
        icon={Sparkles}
        title="Smart Insights"
        color={colors.blocks.violet}
        action={`${insights.length} von ${availableInsights.length}`}
      />
      <View className="gap-2 px-5 pb-5">
        {insights.map((insight) => {
          const Icon = INSIGHT_ICON[insight.tone] ?? Info;
          const tone = toneColor[insight.tone] ?? colors.status.info;
          const content = (
            <SubCard accent={tone} className="px-3 py-3">
              <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
                <IconTile icon={Icon} color={tone} size={32} />
                <View className="min-w-0 flex-1">
                  <Text className="text-[14px] font-bold leading-5 text-ink" numberOfLines={2}>{insight.title}</Text>
                  {insight.body ? (
                    <Text className="mt-0.5 text-[12px] leading-4 text-muted" numberOfLines={2}>{insight.body}</Text>
                  ) : null}
                </View>
                {insight.action ? <ArrowUpRight size={16} strokeWidth={2.4} color={colors.faint} /> : null}
              </Row>
            </SubCard>
          );

          return insight.action ? (
            <PressableScale
              key={insight.id}
              onPress={() => {
                const href = insight.action!.href;
                if (isMainTabHref(href)) router.navigate(href as never);
                else router.push(href as never);
              }}
              scale={0.98}
              hoverScale={1.01}
              style={{ borderRadius: radius.md }}
              accessibilityRole="button"
              accessibilityLabel={insight.action.label}
            >
              {content}
            </PressableScale>
          ) : (
            <View key={insight.id}>{content}</View>
          );
        })}
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ Stundenplan-Preview */

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
      <Card padded={false} className="h-full">
        <WidgetHeader icon={CalendarDays} title="Stundenplan" color={colors.blocks.teal} />
        <EmptyState illustration="free-day" title="Kein Unterricht" hint="Genieß den freien Tag." />
      </Card>
    );
  }

  const now = nowMinutes();
  const isToday = label === 'Heute';
  return (
    <Card padded={false} className="h-full">
      <WidgetHeader
        icon={CalendarDays}
        title="Stundenplan"
        subtitle={label}
        color={colors.blocks.teal}
        action="Woche"
        onAction={() => router.navigate('/timetable')}
      />
      <View className="gap-1.5 px-5 pb-5">
        {lessons.slice(0, 6).map((lesson) => (
          <TimelineLesson
            key={lesson.id}
            lesson={lesson}
            running={isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end)}
            past={isToday && now >= minutesOf(lesson.end)}
            onPress={() => router.navigate('/timetable')}
          />
        ))}
        {lessons.length > 6 ? (
          <Text className="pt-1 text-[12px] font-semibold text-muted">+ {lessons.length - 6} weitere</Text>
        ) : null}
      </View>
    </Card>
  );
}

function TimelineLesson({
  lesson,
  running,
  past,
  onPress,
}: {
  lesson: Lesson;
  running: boolean;
  past: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const cancelled = lesson.state === 'cancelled';
  const accent = cancelled ? colors.status.urgent : subjectColor(lesson.subject, isDark);

  return (
    <PressableScale
      onPress={onPress}
      scale={0.98}
      hoverScale={1.01}
      accessibilityRole="button"
      accessibilityLabel={`${lesson.subject}, ${lesson.start} Uhr`}
      style={{ opacity: past ? 0.55 : 1, borderRadius: radius.md }}
    >
      <SubCard
        accent={accent}
        className="px-3 py-2.5"
        style={running ? { backgroundColor: blockTint(accent, isDark) } : undefined}
      >
        <Row className="gap-3">
          <Text className="w-11 text-[12px] font-extrabold text-ink" style={{ fontVariant: ['tabular-nums'] }}>
            {lesson.start}
          </Text>
          <View className="min-w-0 flex-1">
            <Text
              className="text-[14px] font-bold text-ink"
              style={cancelled ? { textDecorationLine: 'line-through', color: colors.muted } : undefined}
              numberOfLines={1}
            >
              {cancelled ? (lesson.originalSubject ?? lesson.subject) : lesson.subject}
            </Text>
            <Text className="text-[11px] font-medium text-muted" numberOfLines={1}>
              {[lesson.room, lesson.teacher].filter(Boolean).join(' · ') || `${lesson.hour}. Std`}
            </Text>
          </View>
          {running ? <LivePulse color={accent} size={7} /> : null}
          {lesson.state !== 'regular' ? (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: cancelled ? colors.status.urgent : colors.status.success,
              }}
            />
          ) : null}
        </Row>
      </SubCard>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Hausaufgaben-Stream */

export function HomeworkWidget({ snapshot }: WidgetProps) {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const toggle = useHomeworkDone((state) => state.toggle);
  const open = snapshot.homework
    .filter((item) => !item.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4);
  const total = snapshot.homework.length;
  const done = snapshot.homework.filter((item) => item.done).length;

  return (
    <Card padded={false} className="h-full">
      <WidgetHeader
        icon={ListChecks}
        title="Hausaufgaben"
        subtitle={total > 0 ? `${done} von ${total} erledigt` : undefined}
        color={colors.blocks.mint}
        action="Alle"
        onAction={() => router.navigate('/tasks')}
      />
      {total > 0 ? (
        <View className="px-5 pb-3">
          <Progress value={(done / total) * 100} color={colors.blocks.mint} />
        </View>
      ) : null}
      {open.length === 0 ? (
        <EmptyState illustration="all-done" title="Nichts offen" hint="Alle Aufgaben erledigt." />
      ) : (
        <View className="gap-2 px-5 pb-5">
          {open.map((item) => (
            <HomeworkPreview key={item.id} item={item} isDark={isDark} onToggle={() => toggle(item.id)} />
          ))}
        </View>
      )}
    </Card>
  );
}

function HomeworkPreview({
  item,
  isDark,
  onToggle,
}: {
  item: Snapshot['homework'][number];
  isDark: boolean;
  onToggle: () => void;
}) {
  const { colors } = useThemeColors();
  const accent = subjectColor(item.subject, isDark);
  const SubjectIcon = subjectIcon(item.subject);
  const days = daysUntil(item.due);
  const dueTone = days <= 0 ? colors.status.urgent : days === 1 ? colors.status.warning : colors.status.success;

  return (
    <SubCard accent={accent} className="px-3 py-3">
      <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
        <IconTile icon={SubjectIcon} color={accent} size={36} />
        <View className="min-w-0 flex-1">
          <Row className="gap-2">
            <Text className="flex-1 text-[14px] font-bold text-ink" numberOfLines={1}>{item.subject}</Text>
            <Pill
              label={days <= 0 ? 'Heute fällig' : days === 1 ? 'Morgen' : formatRelativeDay(item.due)}
              color={dueTone}
              tone="tint"
              className="px-2.5 py-1"
            />
          </Row>
          <Text className="mt-0.5 text-[13px] leading-[18px] text-muted" numberOfLines={2}>{item.text}</Text>
        </View>
        <PressableOpacity
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${item.subject}: als erledigt markieren`}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: colors.line,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Check size={14} strokeWidth={3} color={colors.faint} />
          </View>
        </PressableOpacity>
      </Row>
    </SubCard>
  );
}

/* ------------------------------------------------------------------ Klassenarbeiten */

export function ExamsWidget({ snapshot }: WidgetProps) {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const upcoming = snapshot.exams
    .filter((exam) => daysUntil(exam.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <Card padded={false} className="h-full">
      <WidgetHeader
        icon={BarChart3}
        title="Klassenarbeiten"
        color={colors.blocks.amber}
        action="Lernplan"
        onAction={() => router.navigate('/tasks')}
      />
      <View className="flex-row flex-wrap px-5 pb-5" style={{ gap: 10 }}>
        {upcoming.map((exam) => {
          const days = daysUntil(exam.date);
          const accent = subjectColor(exam.subject, isDark);
          return (
            <View key={exam.id} style={{ flexGrow: 1, flexBasis: 120, minWidth: 0 }}>
              <SubCard accent={accent} className="px-3.5 py-3">
                <Text className="text-[28px] font-extrabold leading-[32px] tracking-[-0.8px]" style={{ color: accent }} numberOfLines={1}>
                  {days === 0 ? 'Heute' : days}
                </Text>
                <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.1px] text-muted" numberOfLines={1}>
                  {days === 0 ? 'ist es soweit' : days === 1 ? 'Tag' : 'Tage'}
                </Text>
                <Text className="mt-1.5 text-[13px] font-bold text-ink" numberOfLines={1}>{exam.subject}</Text>
                <Text className="text-[11px] font-medium text-muted" numberOfLines={1}>{exam.type ?? 'Arbeit'}</Text>
              </SubCard>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ Noten */

export function GradesWidget({ snapshot }: WidgetProps) {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const hidden = useSettings((state) => state.settings.hideGrades);
  const gradesOn = useModuleActive('grades');
  const withAverage = snapshot.subjects.filter((subject) => subject.average != null);
  if (!gradesOn || withAverage.length === 0) return null;

  const overall = withAverage.reduce((sum, subject) => sum + (subject.average as number), 0) / withAverage.length;
  const recent = snapshot.subjects
    .flatMap((subject) => subject.grades.map((grade) => ({ ...grade, subject: subject.subject })))
    .filter((grade) => grade.date)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 3);

  return (
    <Card padded={false} className="h-full">
      <WidgetHeader
        icon={BarChart3}
        title="Noten"
        subtitle={`${withAverage.length} Fächer`}
        color={colors.blocks.violet}
        onAction={() => router.navigate('/grades')}
      />
      <Row className="gap-3 px-5 pb-5" style={{ alignItems: 'stretch' }}>
        <View style={{ width: 118 }}>
          <SubCard accent={colors.blocks.violet} className="h-full justify-center px-3.5 py-3">
            <Text className="text-[34px] font-extrabold leading-[38px] tracking-[-1px]" style={{ color: colors.blocks.violet }} numberOfLines={1} adjustsFontSizeToFit>
              {hidden ? '•••' : de(overall)}
            </Text>
            <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.1px] text-muted">Schnitt</Text>
          </SubCard>
        </View>
        <View className="min-w-0 flex-1 gap-2">
          {recent.map((grade) => {
            const accent = subjectColor(grade.subject, isDark);
            return (
              <SubCard key={`${grade.subject}-${grade.id}`} accent={accent} className="px-3 py-2">
                <Row className="gap-2">
                  <Text className="min-w-0 flex-1 text-[13px] font-bold text-ink" numberOfLines={1}>{grade.subject}</Text>
                  <Pill label={hidden ? '•' : grade.value} color={accent} tone="solid" className="px-2.5 py-0.5" />
                </Row>
              </SubCard>
            );
          })}
        </View>
      </Row>
    </Card>
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
    <Card padded={false} className="h-full">
      <WidgetHeader
        icon={Mail}
        title="Elternbriefe"
        subtitle={pending.length > 0 ? `${pending.length} unbestätigt` : 'Neueste'}
        color={colors.blocks.lavender}
        badge={pending.length}
      />
      <View className="gap-2 px-5 pb-5">
        {latest.slice(0, 3).map((letter) => {
          const open = letter.requiresConfirmation && !letter.confirmed;
          return (
            <PressableScale
              key={String(letter.id)}
              onPress={() => router.navigate('/inbox')}
              scale={0.98}
              hoverScale={1.01}
              style={{ borderRadius: radius.md }}
              accessibilityRole="button"
              accessibilityLabel={`Elternbrief: ${letter.subject}`}
            >
              <SubCard accent={open ? colors.status.warning : colors.blocks.lavender} className="px-3 py-3">
                <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
                  <IconTile icon={Mail} color={colors.blocks.lavender} size={32} />
                  <View className="min-w-0 flex-1">
                    <Text className="text-[14px] font-bold leading-[18px] text-ink" numberOfLines={2}>{letter.subject}</Text>
                    <Text className="mt-0.5 text-[12px] text-muted" numberOfLines={2}>{excerpt(htmlToText(letter.content), 80)}</Text>
                  </View>
                  {open ? <Pill label="Offen" color={colors.status.warning} tone="tint" className="px-2.5 py-1" /> : null}
                </Row>
              </SubCard>
            </PressableScale>
          );
        })}
      </View>
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
    <Card padded={false} className="h-full">
      <WidgetHeader icon={FileText} title="Fehlzeiten" color={colors.blocks.sky} action="Ansehen" onAction={() => router.push('/attendance')} />
      <Row className="gap-3 px-5 pb-5">
        <View className="flex-1">
          <SubCard accent={colors.blocks.sky} className="px-3.5 py-3">
            <Text className="text-[28px] font-extrabold leading-[32px]" style={{ color: colors.blocks.sky }}>{total}</Text>
            <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.1px] text-muted">Fehltage</Text>
          </SubCard>
        </View>
        <View className="flex-1">
          <SubCard accent={unexcused > 0 ? colors.status.urgent : colors.status.success} className="px-3.5 py-3">
            <Text className="text-[28px] font-extrabold leading-[32px]" style={{ color: unexcused > 0 ? colors.status.urgent : colors.status.success }}>{unexcused}</Text>
            <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.1px] text-muted">unentschuldigt</Text>
          </SubCard>
        </View>
      </Row>
    </Card>
  );
}

/* ------------------------------------------------------------------ Schwarzes Brett */

export function BoardWidget({ snapshot }: WidgetProps) {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const tiles = snapshot.tiles.slice(0, 3);
  if (tiles.length === 0) return null;

  return (
    <Card padded={false} className="h-full">
      <WidgetHeader icon={Inbox} title="Schwarzes Brett" color={colors.blocks.apricot} onAction={() => router.navigate('/inbox')} />
      <View className="gap-2 px-5 pb-5">
        {tiles.map((tile) => {
          const category = categoryFromText(`${tile.title} ${htmlToText(tile.content)}`);
          const accent = categoryColor(category, isDark);
          return (
            <PressableScale
              key={String(tile.id)}
              onPress={() => router.navigate('/inbox')}
              scale={0.98}
              hoverScale={1.01}
              style={{ borderRadius: radius.md }}
              accessibilityRole="button"
              accessibilityLabel={`Aushang: ${tile.title}`}
            >
              <SubCard accent={accent} className="px-3 py-3">
                <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
                  <IconTile icon={tile.pinned ? MapPin : Inbox} color={accent} size={32} />
                  <View className="min-w-0 flex-1">
                    <Text className="text-[14px] font-bold leading-[18px] text-ink" numberOfLines={2}>{tile.title}</Text>
                    <Text className="mt-0.5 text-[12px] leading-4 text-muted" numberOfLines={2}>{htmlToText(tile.content)}</Text>
                  </View>
                </Row>
              </SubCard>
            </PressableScale>
          );
        })}
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ Schnellaktionen */

type QuickAction = { id?: string; icon: LucideIcon; label: string; color: string; href: string };

/**
 * Subtiles weißes Panel mit einem 2-spaltigen Icon-Grid: helle Buttons mit
 * 36-px-Icon-Container in der Familienfarbe, Text dunkel und lesbar.
 */
export function QuickActionsWidget({ snapshot }: WidgetProps) {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const items = packingList(snapshot, tomorrowISO());

  const actions: QuickAction[] = [
    { icon: Stethoscope, label: 'Krankmeldung', color: colors.blocks.coral, href: '/sick-note' },
    { icon: CalendarDays, label: 'Kalender', color: colors.blocks.sky, href: '/calendar' },
    { icon: Plane, label: 'Beurlaubung', color: colors.blocks.violet, href: '/exemption' },
    { icon: Search, label: 'Suche', color: colors.blocks.slate, href: '/search' },
  ];

  // Gebuchte Zusatzmodule (im Demo-Modus alle) bleiben sichtbar wie vorher.
  const moduleActions: QuickAction[] = [
    { id: 'documents', icon: FolderOpen, label: 'Dokumente', color: colors.blocks.amber, href: '/documents' },
    { id: 'invoicing', icon: CreditCard, label: 'Zahlungen', color: colors.blocks.mint, href: '/payments' },
    { id: 'parenttalks', icon: Users, label: 'Sprechtag', color: colors.blocks.teal, href: '/parent-talks' },
    { id: 'electives', icon: GitBranch, label: 'Wahl', color: colors.blocks.lavender, href: '/electives' },
    { id: 'allday', icon: Sun, label: 'Ganztag', color: colors.blocks.sun, href: '/allday' },
  ].filter((action) => snapshot.modules.length === 0 || (action.id != null && snapshot.modules.includes(action.id)));

  const all = [...actions, ...moduleActions];

  return (
    <Card padded={false} className="h-full">
      <WidgetHeader icon={Sparkles} title="Schnellaktionen" color={colors.blocks.amber} />
      <View className="px-5 pb-5">
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {all.map((action) => (
            <View key={action.label} style={{ flexBasis: '48%', flexGrow: 1, minWidth: 140 }}>
              <QuickActionButton action={action} onPress={() => router.push(action.href as never)} />
            </View>
          ))}
        </View>

        {items.length > 0 ? (
          <SubCard accent={colors.blocks.amber} className="mt-4 px-3 py-3">
            <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
              <IconTile icon={ShoppingBag} color={colors.blocks.amber} size={32} />
              <View className="min-w-0 flex-1">
                <Text className="text-[13px] font-bold text-ink">Für morgen einpacken</Text>
                <View className="mt-1.5 flex-row flex-wrap" style={{ gap: 6 }}>
                  {items.map((item) => (
                    <View key={item} className="rounded-md px-2 py-1" style={{ backgroundColor: tint(colors.blocks.amber, isDark ? 0.22 : 0.12) }}>
                      <Text className="text-[11.5px] font-bold text-ink">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Row>
          </SubCard>
        ) : null}
      </View>
    </Card>
  );
}

function QuickActionButton({ action, onPress }: { action: QuickAction; onPress: () => void }) {
  const { colors } = useThemeColors();
  return (
    <PressableScale
      onPress={onPress}
      scale={0.97}
      hoverScale={1.01}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      style={{ borderRadius: radius.md }}
    >
      <View
        className="flex-row items-center gap-2.5 px-3 py-2.5"
        style={{
          backgroundColor: colors.canvas,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line,
          minHeight: 56,
        }}
      >
        <IconTile icon={action.icon} color={action.color} size={36} />
        <Text className="min-w-0 flex-1 text-[13px] font-bold text-ink" numberOfLines={1}>
          {action.label}
        </Text>
      </View>
    </PressableScale>
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

export type WidgetKey = keyof typeof WIDGET_COMPONENTS;

/**
 * Spaltenbreite jedes Widgets im 12-Spalten-Bento-Grid (Desktop). Auf Tablet
 * werden Spans ≥ 6 zu 12 (eine Karte pro Zeile) bzw. < 6 zu 6 (zwei pro Zeile);
 * auf dem Phone ist alles 12.
 */
export const WIDGET_SPANS: Record<WidgetKey, number> = {
  'next-lesson': 4,
  insights: 5,
  'today-timeline': 3,
  homework: 7,
  exams: 5,
  letters: 4,
  grades: 4,
  board: 4,
  attendance: 3,
  'quick-actions': 5,
};
