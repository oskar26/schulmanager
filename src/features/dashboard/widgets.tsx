/**
 * Dashboard-Widgets — Redesign Phase 3.
 *
 * Jede Dashboard-Sektion ist eine echte Farbfläche statt einer weißen
 * Listenkarte. Reihenfolge und Sichtbarkeit bleiben vollständig im Settings-
 * Store; dieses Modul entscheidet ausschließlich über die Darstellung.
 */
import React, { useMemo } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
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
  MapPin,
  Plane,
  Search,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import type { Lesson, Snapshot } from '@/api/types';
import { useHomeworkDone, useModuleActive } from '@/data/queries';
import { categoryColor, categoryFromText } from '@/design/categories';
import { subjectColor, tint } from '@/design/subjects';
import { radius } from '@/design/tokens';
import { de } from '@/features/grades/calculator';
import { computeInsights, computeNow, lessonsOn, packingList } from '@/features/insights/engine';
import { addDays, daysUntil, formatRelativeDay, minutesOf, nowMinutes, toISO } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { Progress } from '@/ui/gluestack/feedback';
import { isMainTabHref } from '@/ui/navigation';
import { LivePulse, PressableOpacity } from '@/ui/motion';
import {
  Badge,
  BlockCaption,
  BlockText,
  ColorBlockCard,
  EmptyState,
  IconBadge,
  Pill,
  Row,
  StatCard,
  useBlockInk,
} from '@/ui/primitives';

interface WidgetProps {
  snapshot: Snapshot;
}

const todayISO = () => toISO(new Date());
const tomorrowISO = () => toISO(addDays(new Date(), 1));

/* ------------------------------------------------------------------ Gemeinsame Farbflächen-Bausteine */

/**
 * Der gemeinsame Kopf jeder Farbfläche. Der Badge-Kreis ist absichtlich lg
 * (44px): Dashboard-Icons sind keine kleinen Listenmarken mehr.
 */
function WidgetHeader({
  icon: IconComponent,
  title,
  action,
  onAction,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  action?: string;
  onAction?: () => void;
  badge?: number;
}) {
  const ink = useBlockInk();
  const actionPill = action ? <Pill label={action} color={ink} tone="tint" /> : null;

  return (
    <Row className="justify-between gap-3 px-5 pb-3 pt-5">
      <Row className="min-w-0 flex-1 gap-3">
        <IconBadge icon={IconComponent} color={ink} size="lg" tone="tint" />
        <BlockText className="flex-1 text-[18px] font-extrabold leading-[22px] tracking-[-0.3px]" numberOfLines={2}>
          {title}
        </BlockText>
      </Row>
      {typeof badge === 'number' && badge > 0 ? (
        <Badge count={badge} />
      ) : actionPill && onAction ? (
        <PressableOpacity onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={action}>
          {actionPill}
        </PressableOpacity>
      ) : actionPill ? (
        actionPill
      ) : onAction ? (
        <PressableOpacity onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${title} öffnen`}>
          <IconBadge icon={ArrowUpRight} color={ink} size="lg" tone="tint" />
        </PressableOpacity>
      ) : null}
    </Row>
  );
}

/** Dezente Gruppe innerhalb einer Farbkarte — nie eine weiße Ersatzkarte. */
function BlockInset({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: ViewStyle }) {
  const ink = useBlockInk();
  return (
    <View
      className={`rounded-[20px] ${className}`}
      style={[{ backgroundColor: tint(ink, 0.1) }, style]}
    >
      {children}
    </View>
  );
}

/** Pill mit der kontraststarken Vordergrundfarbe der umgebenden Farbfläche. */
function InkPill({ label, icon, className = '' }: { label: string; icon?: LucideIcon; className?: string }) {
  const ink = useBlockInk();
  return <Pill label={label} color={ink} tone="tint" icon={icon} className={className} />;
}

/* ------------------------------------------------------------------ Nächste Stunde */

export function NextLessonWidget({ snapshot }: WidgetProps) {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const status = computeNow(snapshot);
  const lesson = status.lesson ?? status.next;

  if (!lesson) {
    return (
      <ColorBlockCard color={colors.blocks.sky}>
        <WidgetHeader icon={BookOpen} title="Nächste Stunde" />
        <EmptyState art="lessons" title="Kein Unterricht" hint={status.label || 'Genieß den freien Tag.'} />
      </ColorBlockCard>
    );
  }

  const subjectTone = subjectColor(lesson.subject, isDark);
  return (
    <ColorBlockCard
      color={subjectTone}
      onPress={() => router.navigate('/timetable')}
      accessibilityLabel={`Stundenplan: ${lesson.subject}`}
      elevated
    >
      <NextLessonContent lesson={lesson} status={status} />
    </ColorBlockCard>
  );
}

function NextLessonContent({
  lesson,
  status,
}: {
  lesson: Lesson;
  status: ReturnType<typeof computeNow>;
}) {
  const ink = useBlockInk();
  const { colors } = useThemeColors();
  const stateLabel =
    lesson.state === 'cancelled' ? 'Entfall' : lesson.state === 'substitution' ? 'Vertretung' : 'Raumwechsel';

  return (
    <>
      <WidgetHeader icon={BookOpen} title="Nächste Stunde" action={status.label} />
      <View className="px-5 pb-5">
        <Row className="gap-3">
          <IconBadge icon={BookOpen} color={ink} size="xl" tone="tint" />
          <View className="min-w-0 flex-1 justify-center">
            <Row className="gap-2">
              {status.kind === 'in-lesson' ? <LivePulse color={ink} /> : null}
              <BlockCaption className="text-[10.5px] font-extrabold uppercase tracking-[1.4px]">
                {status.kind === 'in-lesson'
                  ? 'Läuft gerade'
                  : status.kind === 'break'
                    ? 'Als Nächstes'
                    : status.kind === 'before-school'
                      ? 'Schulbeginn'
                      : 'Nächste Stunde'}
              </BlockCaption>
            </Row>
            <BlockText className="mt-1 text-[24px] font-extrabold leading-[27px] tracking-[-0.5px]" numberOfLines={2}>
              {lesson.subject}
            </BlockText>
            <BlockCaption className="mt-0.5" numberOfLines={2}>
              {lesson.start}–{lesson.end} Uhr
              {lesson.room ? ` · ${lesson.room}` : ''}
              {lesson.teacher ? ` · ${lesson.teacher}` : ''}
            </BlockCaption>
          </View>
        </Row>

        {lesson.state !== 'regular' ? (
          <BlockInset className="mt-4 px-3 py-3">
            <Row className="gap-2.5">
              <Pill
                label={stateLabel}
                color={lesson.state === 'cancelled' ? colors.priority.urgent : ink}
                tone={lesson.state === 'cancelled' ? 'solid' : 'tint'}
                icon={lesson.state === 'cancelled' ? AlertTriangle : BookOpen}
              />
              {lesson.comment ? <BlockCaption className="flex-1" numberOfLines={2}>{lesson.comment}</BlockCaption> : null}
            </Row>
          </BlockInset>
        ) : null}
      </View>
    </>
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
    positive: colors.blocks.mint,
    warning: colors.blocks.amber,
    critical: colors.blocks.coral,
    fun: colors.blocks.violet,
    neutral: colors.blocks.sky,
  };

  return (
    <ColorBlockCard color={colors.blocks.sky} padded={false}>
      <WidgetHeader icon={Sparkles} title="Smart Insights" action={`${insights.length} von ${availableInsights.length}`} />
      <View className="gap-2 px-5 pb-5">
        {insights.map((insight) => {
          const Icon = INSIGHT_ICON[insight.tone] ?? Info;
          const tone = toneColor[insight.tone] ?? colors.blocks.sky;
          const content = <InsightPreview icon={Icon} tone={tone} title={insight.title} body={insight.body} actionable={Boolean(insight.action)} />;

          return insight.action ? (
            <Pressable
              key={insight.id}
              onPress={() => {
                const href = insight.action!.href;
                if (isMainTabHref(href)) router.navigate(href as never);
                else router.push(href as never);
              }}
              className="rounded-[20px] active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel={insight.action.label}
            >
              {content}
            </Pressable>
          ) : (
            <View key={insight.id}>{content}</View>
          );
        })}
      </View>
    </ColorBlockCard>
  );
}

function InsightPreview({
  icon: Icon,
  tone,
  title,
  body,
  actionable,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  body?: string;
  actionable: boolean;
}) {
  const ink = useBlockInk();
  return (
    <BlockInset className="px-3 py-3">
      <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
        <IconBadge icon={Icon} color={tone} size="lg" tone="solid" />
        <View className="min-w-0 flex-1 pt-0.5">
          <BlockText className="text-[14px] font-extrabold leading-5" numberOfLines={2}>{title}</BlockText>
          {body ? <BlockCaption className="mt-0.5 text-[12px] leading-4" numberOfLines={2}>{body}</BlockCaption> : null}
        </View>
        {actionable ? <IconBadge icon={ArrowUpRight} color={ink} size="lg" tone="tint" /> : null}
      </Row>
    </BlockInset>
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
      <ColorBlockCard color={colors.blocks.teal}>
        <WidgetHeader icon={CalendarDays} title="Stundenplan" />
        <EmptyState art="lessons" title="Kein Unterricht" hint="Genieß den freien Tag." />
      </ColorBlockCard>
    );
  }

  const now = nowMinutes();
  const isToday = label === 'Heute';
  return (
    <ColorBlockCard color={colors.blocks.teal} padded={false}>
      <WidgetHeader icon={CalendarDays} title={label} action="Ganze Woche" onAction={() => router.navigate('/timetable')} />
      <View className="gap-2 px-5 pb-5">
        {lessons.map((lesson) => (
          <TimelineLesson
            key={lesson.id}
            lesson={lesson}
            running={isToday && now >= minutesOf(lesson.start) && now < minutesOf(lesson.end)}
            past={isToday && now >= minutesOf(lesson.end)}
            onPress={() => router.navigate('/timetable')}
          />
        ))}
      </View>
    </ColorBlockCard>
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
  const ink = useBlockInk();
  const subjectTone = subjectColor(lesson.subject, isDark);
  const cancelled = lesson.state === 'cancelled';

  return (
    <Pressable
      onPress={onPress}
      className="rounded-[20px] active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`${lesson.subject}, ${lesson.start} Uhr`}
      style={{ opacity: past ? 0.58 : 1 }}
    >
      <BlockInset style={{ backgroundColor: tint(ink, running ? 0.18 : 0.1) }} className="px-3 py-3">
        <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
          <View className="w-9 pt-0.5">
            <BlockText className="text-[12px] font-extrabold">{lesson.start}</BlockText>
            <BlockCaption className="text-[10px]">{lesson.hour}. Std</BlockCaption>
          </View>
          <IconBadge icon={BookOpen} color={cancelled ? colors.blocks.coral : subjectTone} size="lg" tone="solid" />
          <View className="min-w-0 flex-1 pt-0.5">
            <Row className="gap-2" style={{ alignItems: 'flex-start' }}>
              <BlockText
                className="flex-1 text-[15px] font-extrabold leading-[19px]"
                style={cancelled ? { textDecorationLine: 'line-through' } : undefined}
                numberOfLines={2}
              >
                {cancelled ? (lesson.originalSubject ?? lesson.subject) : lesson.subject}
              </BlockText>
              {lesson.room ? <InkPill label={lesson.room} className="px-2 py-0.5" /> : null}
            </Row>
            {lesson.state !== 'regular' ? (
              <Pill
                label={lesson.state === 'cancelled' ? 'Entfall' : lesson.state === 'substitution' ? 'Vertretung' : 'Raumwechsel'}
                color={cancelled ? colors.priority.urgent : ink}
                tone={cancelled ? 'solid' : 'tint'}
                icon={cancelled ? AlertTriangle : BookOpen}
                className="mt-1.5"
              />
            ) : null}
            {lesson.comment ? <BlockCaption className="mt-1 text-[11px]" numberOfLines={1}>{lesson.comment}</BlockCaption> : null}
          </View>
        </Row>
      </BlockInset>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ Hausaufgaben */

export function HomeworkWidget({ snapshot }: WidgetProps) {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const toggle = useHomeworkDone((state) => state.toggle);
  const open = snapshot.homework.filter((item) => !item.done).slice(0, 4);
  const total = snapshot.homework.length;
  const done = snapshot.homework.filter((item) => item.done).length;

  return (
    <ColorBlockCard color={colors.blocks.lime} padded={false}>
      <WidgetHeader icon={ListChecks} title="Hausaufgaben" action="Alle" onAction={() => router.navigate('/tasks')} />
      {total > 0 ? (
        <View className="px-5 pb-3">
          <Progress value={(done / total) * 100} color={colors.blocks.violet} trackClassName="bg-black/10" />
          <BlockCaption className="mt-1.5 text-[11px]">{done} von {total} erledigt</BlockCaption>
        </View>
      ) : null}
      {open.length === 0 ? (
        <EmptyState art="celebrate" title="Nichts offen" hint="Alle Aufgaben erledigt." />
      ) : (
        <View className="gap-2 px-5 pb-5">
          {open.map((item) => (
            <HomeworkPreview key={item.id} item={item} isDark={isDark} onToggle={() => toggle(item.id)} />
          ))}
        </View>
      )}
    </ColorBlockCard>
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
  const ink = useBlockInk();
  const subjectTone = subjectColor(item.subject, isDark);
  const days = daysUntil(item.due);
  const dueTone = days <= 0 ? colors.priority.urgent : days === 1 ? colors.priority.soon : colors.priority.ok;

  return (
    <Pressable
      onPress={onToggle}
      className="rounded-[20px] active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`${item.subject}: als erledigt markieren`}
    >
      <BlockInset className="px-3 py-3">
        <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
          <IconBadge icon={BookOpen} color={subjectTone} size="lg" tone="solid" />
          <View className="min-w-0 flex-1 pt-0.5">
            <Row className="gap-2" style={{ alignItems: 'flex-start' }}>
              <BlockText className="flex-1 text-[14px] font-extrabold" numberOfLines={1}>{item.subject}</BlockText>
              <Pill label={formatRelativeDay(item.due)} color={dueTone} tone="solid" />
            </Row>
            <BlockCaption className="mt-1 text-[13px] leading-[18px]" numberOfLines={2}>{item.text}</BlockCaption>
          </View>
          <IconBadge icon={CheckCheck} color={ink} size="lg" tone="tint" />
        </Row>
      </BlockInset>
    </Pressable>
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
    <ColorBlockCard color={colors.blocks.mint} padded={false}>
      <WidgetHeader icon={BarChart3} title="Klassenarbeiten" action="Lernplan" onAction={() => router.navigate('/tasks')} />
      <Row className="gap-3 px-5 pb-5">
        {upcoming.map((exam) => {
          const days = daysUntil(exam.date);
          return (
            <View key={exam.id} style={{ flex: 1, minWidth: 0 }}>
              <StatCard
                value={days === 0 ? 'Heute' : days}
                caption={`${exam.subject} · ${days === 0 ? 'heute' : days === 1 ? 'Tag bis Arbeit' : 'Tage bis Arbeit'}`}
                block={subjectColor(exam.subject, isDark)}
                className="min-h-[116px]"
                style={{ minWidth: 0 }}
              />
            </View>
          );
        })}
      </Row>
    </ColorBlockCard>
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
    <ColorBlockCard
      color={colors.blocks.violet}
      onPress={() => router.navigate('/grades')}
      accessibilityLabel="Noten öffnen"
      padded={false}
    >
      <WidgetHeader icon={BarChart3} title="Noten" action={`${withAverage.length} Fächer`} />
      <Row className="gap-3 px-5 pb-5" style={{ alignItems: 'stretch' }}>
        <View style={{ width: 128, maxWidth: '42%' }}>
          <StatCard
            value={hidden ? '•••' : de(overall)}
            caption="Gesamtschnitt"
            block={colors.blocks.lime}
            className="h-full min-h-[128px]"
          />
        </View>
        <View className="min-w-0 flex-1 gap-2">
          {recent.map((grade) => (
            <GradePreview key={`${grade.subject}-${grade.id}`} subject={grade.subject} value={hidden ? '•' : grade.value} isDark={isDark} />
          ))}
        </View>
      </Row>
    </ColorBlockCard>
  );
}

function GradePreview({ subject, value, isDark }: { subject: string; value: string; isDark: boolean }) {
  const tone = subjectColor(subject, isDark);
  return (
    <BlockInset className="px-3 py-2.5">
      <Row className="gap-2">
        <IconBadge icon={BookOpen} color={tone} size="lg" tone="solid" />
        <BlockText className="min-w-0 flex-1 text-[13px] font-bold" numberOfLines={2}>{subject}</BlockText>
        <Pill label={value} color={tone} tone="solid" />
      </Row>
    </BlockInset>
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
    <ColorBlockCard color={colors.blocks.lavender} padded={false}>
      <WidgetHeader icon={Mail} title="Elternbriefe" badge={pending.length} />
      <View className="gap-2 px-5 pb-5">
        {latest.slice(0, 3).map((letter) => (
          <Pressable
            key={String(letter.id)}
            onPress={() => router.navigate('/inbox')}
            className="rounded-[20px] active:opacity-75"
            accessibilityRole="button"
            accessibilityLabel={`Elternbrief: ${letter.subject}`}
          >
            <BlockInset className="px-3 py-3">
              <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
                <IconBadge icon={Mail} color={colors.blocks.apricot} size="lg" tone="solid" />
                <View className="min-w-0 flex-1 pt-0.5">
                  <BlockText className="text-[14px] font-extrabold leading-[18px]" numberOfLines={2}>{letter.subject}</BlockText>
                  <BlockCaption className="mt-0.5 text-[12px]" numberOfLines={2}>{excerpt(htmlToText(letter.content), 80)}</BlockCaption>
                </View>
                {letter.requiresConfirmation && !letter.confirmed ? <Pill label="Offen" color={colors.priority.urgent} tone="solid" /> : null}
              </Row>
            </BlockInset>
          </Pressable>
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
    <ColorBlockCard
      color={colors.blocks.apricot}
      onPress={() => router.push('/attendance')}
      accessibilityLabel="Fehlzeiten öffnen"
      padded={false}
    >
      <WidgetHeader icon={FileText} title="Fehlzeiten" action="Ansehen" />
      <Row className="gap-3 px-5 pb-5">
        <StatCard value={total} caption="Fehltage gesamt" block={colors.blocks.sky} className="flex-1" />
        <StatCard
          value={unexcused}
          caption="unentschuldigt"
          block={unexcused > 0 ? colors.blocks.coral : colors.blocks.mint}
          className="flex-1"
        />
      </Row>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Schwarzes Brett */

export function BoardWidget({ snapshot }: WidgetProps) {
  const { isDark } = useThemeColors();
  const router = useRouter();
  const tiles = snapshot.tiles.slice(0, 3);
  if (tiles.length === 0) return null;

  // Aushänge können unterschiedlichen Bereichen zugeordnet sein. Jede Anzeige
  // bekommt deshalb ihre eigene Kategorien-Fläche (Sekretariat, Bibliothek,
  // AG, Fundsachen …) statt eines neutralen, weißen Sammelcontainers.
  return (
    <View className="gap-3">
      {tiles.map((tile, index) => {
        const category = categoryFromText(`${tile.title} ${htmlToText(tile.content)}`);
        return (
          <ColorBlockCard
            key={String(tile.id)}
            color={categoryColor(category, isDark)}
            onPress={() => router.navigate('/inbox')}
            accessibilityLabel={`Aushang: ${tile.title}`}
            padded={false}
          >
            {index === 0 ? <WidgetHeader icon={Inbox} title="Schwarzes Brett" /> : null}
            <BoardTileContent title={tile.title} content={tile.content} pinned={tile.pinned} />
          </ColorBlockCard>
        );
      })}
    </View>
  );
}

function BoardTileContent({ title, content, pinned }: { title: string; content: string; pinned?: boolean }) {
  const ink = useBlockInk();
  return (
    <View className="px-5 pb-5">
      <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
        <IconBadge icon={pinned ? MapPin : Inbox} color={ink} size="lg" tone="tint" />
        <View className="min-w-0 flex-1 pt-0.5">
          <BlockText className="text-[15px] font-extrabold leading-[19px]" numberOfLines={2}>{title}</BlockText>
          <BlockCaption className="mt-1 text-[12px] leading-[17px]" numberOfLines={3}>{htmlToText(content)}</BlockCaption>
          {pinned ? <InkPill label="Angeheftet" icon={MapPin} className="mt-2" /> : null}
        </View>
      </Row>
    </View>
  );
}

/* ------------------------------------------------------------------ Schnellaktionen */

type QuickAction = { id?: string; icon: LucideIcon; label: string; color: string; href: string };

export function QuickActionsWidget({ snapshot }: WidgetProps) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const items = packingList(snapshot, tomorrowISO());

  const actions: QuickAction[] = [
    { icon: Stethoscope, label: 'Krankmeldung', color: colors.blocks.coral, href: '/sick-note' },
    { icon: Plane, label: 'Beurlaubung', color: colors.blocks.violet, href: '/exemption' },
    { icon: CalendarDays, label: 'Kalender', color: colors.blocks.sky, href: '/calendar' },
    { icon: Search, label: 'Suche', color: colors.blocks.mint, href: '/search' },
  ];

  // Gebuchte Zusatzmodule (im Demo-Modus alle) bleiben sichtbar wie vorher.
  const moduleActions: QuickAction[] = [
    { id: 'invoicing', icon: CreditCard, label: 'Zahlungen', color: colors.blocks.mint, href: '/payments' },
    { id: 'documents', icon: FolderOpen, label: 'Dokumente', color: colors.blocks.amber, href: '/documents' },
    { id: 'parenttalks', icon: Users, label: 'Sprechtag', color: colors.blocks.sky, href: '/parent-talks' },
    { id: 'electives', icon: GitBranch, label: 'Wahl', color: colors.blocks.violet, href: '/electives' },
    { id: 'allday', icon: Sun, label: 'Ganztag', color: colors.blocks.lavender, href: '/allday' },
  ].filter((action) => snapshot.modules.length === 0 || (action.id != null && snapshot.modules.includes(action.id)));

  return (
    <ColorBlockCard color={colors.blocks.violet} padded={false}>
      <WidgetHeader icon={Sparkles} title="Schnellaktionen" />
      <View className="px-5 pb-5">
        <View className="flex-row" style={{ gap: 12 }}>
          {actions.map((action) => (
            <View key={action.label} style={{ flex: 1, minWidth: 0 }}>
              <QuickActionTile action={action} onPress={() => router.push(action.href as never)} />
            </View>
          ))}
        </View>

        {moduleActions.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap" style={{ gap: 12 }}>
            {moduleActions.map((action) => (
              <View key={action.label} style={{ flexBasis: '29%', flexGrow: 1, minWidth: 88 }}>
                <QuickActionTile action={action} onPress={() => router.push(action.href as never)} />
              </View>
            ))}
          </View>
        ) : null}

        {items.length > 0 ? <PackingPreview items={items} /> : null}
      </View>
    </ColorBlockCard>
  );
}

function QuickActionTile({ action, onPress }: { action: QuickAction; onPress: () => void }) {
  return (
    <ColorBlockCard
      color={action.color}
      onPress={onPress}
      accessibilityLabel={action.label}
      radius={radius.cardSm}
      padded={false}
      className="min-h-[108px] items-center justify-center px-2 py-3"
    >
      <QuickActionTileContent icon={action.icon} label={action.label} />
    </ColorBlockCard>
  );
}

function QuickActionTileContent({ icon, label }: { icon: LucideIcon; label: string }) {
  const ink = useBlockInk();
  return (
    <>
      <IconBadge icon={icon} color={ink} size="lg" tone="tint" />
      <BlockText className="mt-2 text-center text-[11px] font-extrabold leading-[14px]" numberOfLines={2}>{label}</BlockText>
    </>
  );
}

function PackingPreview({ items }: { items: string[] }) {
  const ink = useBlockInk();
  return (
    <BlockInset className="mt-4 px-3 py-3">
      <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
        <IconBadge icon={ShoppingBag} color={ink} size="lg" tone="tint" />
        <View className="min-w-0 flex-1">
          <BlockText className="text-[15px] font-extrabold">Für morgen einpacken</BlockText>
          <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
            {items.map((item) => <InkPill key={item} label={item} />)}
          </View>
        </View>
      </Row>
    </BlockInset>
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
