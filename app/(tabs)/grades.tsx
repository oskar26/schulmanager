import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import {
  Calculator,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';

import type { SubjectGrades } from '@/api/types';
import { useModuleActive, useSnapshot } from '@/data/queries';
import { subjectColor, subjectIcon, tint } from '@/design/subjects';
import {
  de,
  deDelta,
  gradeColor,
  gradeRatio,
  gradeTrend,
  requiredGrade,
  simulate,
} from '@/features/grades/calculator';
import { QualityBar, Sparkline } from '@/features/grades/sparkline';
import { formatRelativeDay } from '@/lib/date';
import {
  BlockCaption,
  BlockText,
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
  ScreenHeader,
  SectionHeader,
  Sheet,
  Skeleton,
  StatNumber,
  useBlockInk,
} from '@/ui/primitives';
import { FadeInUp, PressableOpacity } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { Switch } from '@/ui/gluestack/feedback';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, resolveThemeColor } from '@/design/tokens';

/** Platzhalter, solange „Noten verbergen“ aktiv ist. */
const MASK = '•••';

export default function GradesScreen() {
  const { colors, isDark } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const gradesOn = useModuleActive('grades');
  const reserve = useTabNavReserve();
  const hidden = useSettings((state) => state.settings.hideGrades);
  const update = useSettings((state) => state.update);
  const [selected, setSelected] = useState<SubjectGrades | null>(null);

  const subjects = data?.subjects ?? [];

  /**
   * Bug (Phase 6): Fächer ohne Bewertung liefen als „–“-Karten zwischen den
   * bewerteten mit und verwässerten die Liste. Sie stehen jetzt als eigene,
   * ruhige Gruppe unten.
   */
  const rated = useMemo(
    () => subjects.filter((subject) => subject.average != null && subject.grades.length > 0),
    [subjects],
  );
  const unrated = useMemo(
    () => subjects.filter((subject) => subject.average == null || subject.grades.length === 0),
    [subjects],
  );

  const gradeCount = useMemo(
    () => subjects.reduce((sum, subject) => sum + subject.grades.length, 0),
    [subjects],
  );

  /**
   * Bug (Phase 6): Der Gesamtschnitt wurde als ungewichtetes Mittel der
   * Fachschnitte gebildet und dabei implizit auf zwei Nachkommastellen
   * gerundet **angezeigt**, obwohl schon der Zwischenwert gerundet war.
   * Jetzt: ein Durchgang, Rundung ausschließlich in der Ausgabe (`de`).
   * Fächer mit Punktesystem werden getrennt gemittelt und nicht mit
   * 1–6-Noten vermischt (ein Schnitt aus „2,0“ und „12 P“ wäre sinnlos).
   */
  const overall = useMemo(() => {
    const dominantSystem: 0 | 1 =
      rated.filter((subject) => subject.gradingSystem === 1).length > rated.length / 2 ? 1 : 0;
    const usable = rated.filter((subject) => subject.gradingSystem === dominantSystem);
    if (usable.length === 0) return null;
    const sum = usable.reduce((total, subject) => total + (subject.average as number), 0);
    return { value: sum / usable.length, system: dominantSystem, count: usable.length };
  }, [rated]);

  const ranked = useMemo(
    () =>
      [...rated].sort((a, b) => gradeRatio(b.average, b.gradingSystem) - gradeRatio(a.average, a.gradingSystem)),
    [rated],
  );
  const best = ranked[0];
  // Bug: `worst !== best` verglich Objektidentität — bei nur einem bewerteten
  // Fach stand dasselbe Fach zweimal im Hero. Jetzt über die Fach-Id.
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;

  // `href: null` blendet den Tab aus. Ein externer Deep-Link auf /grades
  // bleibt trotzdem möglich; statt einer versteckten, nicht navigierbaren
  // Tab-Route landet er zuverlässig auf dem Start-Tab.
  if (!gradesOn) return <Redirect href="/" />;

  const limeInk = foregroundOn(resolveThemeColor(colors.blocks.lime, isDark), colors);

  return (
    <Screen adaptive="content">
      <ScreenHeader
        title="Noten"
        subtitle={`${rated.length} ${rated.length === 1 ? 'Fach' : 'Fächer'} mit Bewertung`}
        action={(
          <Row className="gap-2">
            <Muted className="text-[11px]">verbergen</Muted>
            <Switch
              value={hidden}
              onValueChange={(value) => update({ hideGrades: value })}
              accessibilityLabel="Noten verbergen"
            />
          </Row>
        )}
      />

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        {isLoading || !data ? (
          <View className="gap-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </View>
        ) : subjects.length === 0 ? (
          <EmptyState
            illustration="locked"
            title="Keine Noten sichtbar"
            hint="Ob Familien Noten sehen dürfen, entscheidet die Schule im Modul „Noten“."
          />
        ) : (
          <>
            {/* Hero: Gesamtschnitt als riesige Zahl auf Lime-Farbfläche */}
            <ColorBlockCard
              color={colors.blocks.lime}
              elevated
              padded={false}
              className="mb-3"
              radius={32}
            >
              <View className="flex-row items-center gap-4 px-5 pb-4 pt-5">
                <IconBadge
                  icon={TrendingUp}
                  color={limeInk}
                  tone="tint"
                  size="lg"
                />
                <View className="min-w-0 flex-1">
                  <BlockCaption className="text-[10.5px] font-extrabold uppercase tracking-[1.6px]">
                    Gesamtschnitt
                  </BlockCaption>
                  <StatNumber
                    size="lg"
                    style={{ color: limeInk, fontVariant: ['tabular-nums'] }}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {hidden
                      ? MASK
                      : overall
                        ? overall.system === 1
                          ? `${de(overall.value, 1)} P`
                          : de(overall.value)
                        : '–'}
                  </StatNumber>
                </View>
                <View className="items-end">
                  <StatNumber
                    size="md"
                    style={{ color: limeInk, fontVariant: ['tabular-nums'] }}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {hidden ? '••' : String(gradeCount)}
                  </StatNumber>
                  <BlockCaption className="text-[10.5px] font-extrabold uppercase tracking-[1.2px]">
                    Noten
                  </BlockCaption>
                </View>
              </View>

              {best ? (
                <View className="flex-row px-5 pb-5">
                  <HeroFact
                    label="Stärkstes Fach"
                    subject={best}
                    hidden={hidden}
                  />
                  {worst ? (
                    <>
                      <View className="w-4" />
                      <HeroFact label="Größter Hebel" subject={worst} hidden={hidden} />
                    </>
                  ) : null}
                </View>
              ) : null}
            </ColorBlockCard>

            {rated.map((subject, index) => (
              <FadeInUp key={String(subject.subjectId)} delay={Math.min(index, 8) * 30}>
                <SubjectCard
                  subject={subject}
                  hidden={hidden}
                  onOpen={() => setSelected(subject)}
                />
              </FadeInUp>
            ))}

            {unrated.length > 0 ? (
              <>
                <SectionHeader
                  title="Noch ohne Note"
                  icon={Sparkles}
                  iconColor={colors.blocks.slate}
                />
                {unrated.map((subject) => (
                  <Card key={String(subject.subjectId)} className="mb-2">
                    <Row className="gap-3">
                      <IconBadge
                        icon={subjectIcon(subject.subject)}
                        color={subjectColor(subject.subject, isDark)}
                        tone="tint"
                        size="md"
                      />
                      <View className="min-w-0 flex-1">
                        <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
                          {subject.subject}
                        </Text>
                        <Muted className="text-[12px]">Noch keine Bewertung eingetragen</Muted>
                      </View>
                    </Row>
                  </Card>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <SubjectSheet subject={selected} hidden={hidden} onClose={() => setSelected(null)} />
    </Screen>
  );
}

/** Kleine Kennzahl im Hero („Stärkstes Fach“ / „Größter Hebel“). */
function HeroFact({
  label,
  subject,
  hidden,
}: {
  label: string;
  subject: SubjectGrades;
  hidden: boolean;
}) {
  const ink = useBlockInk();
  return (
    <View className="min-w-0 flex-1 rounded-[20px] px-3.5 py-3" style={{ backgroundColor: tint(ink, 0.12) }}>
      <BlockCaption className="text-[10px] font-extrabold uppercase tracking-[1.2px]">{label}</BlockCaption>
      <BlockText className="mt-0.5 text-[15px] font-extrabold leading-5" numberOfLines={1}>
        {subject.subject}
      </BlockText>
      <Text className="mt-0.5 text-[17px] font-extrabold" style={{ color: ink, fontVariant: ['tabular-nums'] }}>
        {hidden
          ? MASK
          : subject.average != null
            ? subject.gradingSystem === 1
              ? `${de(subject.average, 1)} P`
              : de(subject.average)
            : '–'}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ Fach-Karte (Phase 6) */

/**
 * Fach-Karte im Farbflächen-Stil: vollflächig in der gesättigten Fachfarbe
 * (kein 14-%-Tint mehr), Fach-Icon-Badge, riesige Notenzahl und — ab drei
 * datierten Noten — eine Mini-Trendlinie. Sonst bleibt die Qualitätsleiste
 * als Balken-Fallback.
 */
function SubjectCard({
  subject,
  hidden,
  onOpen,
}: {
  subject: SubjectGrades;
  hidden: boolean;
  onOpen: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const tone = subjectColor(subject.subject, isDark);
  const ink = foregroundOn(tone, colors);
  const SubjectIcon = subjectIcon(subject.subject);
  const trend = gradeTrend(subject);
  const hasTrend = trend.points.length >= 3;

  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendLabel =
    trend.direction === 'up' ? 'besser' : trend.direction === 'down' ? 'schlechter' : 'stabil';

  return (
    <ColorBlockCard
      color={tone}
      onPress={onOpen}
      accessibilityLabel={`${subject.subject}: Noten-Details öffnen`}
      className="mb-2.5"
      style={{ padding: 16 }}
    >
      <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
        <IconBadge icon={SubjectIcon} color={ink} tone="tint" size="lg" />

        <View className="min-w-0 flex-1">
          <Row className="gap-2">
            <BlockText className="min-w-0 flex-1 text-[15.5px] font-extrabold leading-5" numberOfLines={1}>
              {subject.subject}
            </BlockText>
            {hasTrend && !hidden ? (
              <Pill
                label={trendLabel}
                color={ink}
                tone="tint"
                icon={TrendIcon}
                className="px-2.5 py-1"
              />
            ) : null}
          </Row>

          <BlockCaption className="mt-0.5 text-[11.5px]">
            {subject.grades.length} {subject.grades.length === 1 ? 'Bewertung' : 'Bewertungen'}
            {subject.teacher ? ` · ${subject.teacher}` : ''}
          </BlockCaption>

          {/* Riesige Notenzahl — deutlich gewichtiger als die Noten-Chips */}
          <Row className="mt-1.5 items-end gap-3">
            <StatNumber
              size="md"
              style={{ color: ink, fontVariant: ['tabular-nums'] }}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {hidden
                ? MASK
                : subject.average != null
                  ? subject.gradingSystem === 1
                    ? `${de(subject.average, 1)}`
                    : de(subject.average)
                  : '–'}
            </StatNumber>
            {subject.gradingSystem === 1 && !hidden ? (
              <BlockCaption className="mb-2 text-[12px] font-extrabold uppercase tracking-[1.2px]">
                Punkte
              </BlockCaption>
            ) : null}
            <View className="flex-1" />
            {hasTrend ? (
              <Sparkline
                values={trend.points}
                system={subject.gradingSystem}
                color={ink}
                hidden={hidden}
              />
            ) : null}
          </Row>

          {hasTrend ? null : (
            <View className="mt-2.5">
              <QualityBar
                ratio={gradeRatio(subject.average, subject.gradingSystem)}
                color={ink}
                hidden={hidden}
              />
            </View>
          )}

          <Row className="mt-2.5 flex-wrap gap-1.5">
            {subject.grades.slice(0, 6).map((grade) => (
              <View
                key={grade.id}
                className="rounded-[20px] px-2 py-0.5"
                style={{ backgroundColor: tint(ink, 0.16) }}
              >
                <Text className="text-[11px] font-extrabold" style={{ color: ink }}>
                  {hidden ? '•' : grade.value}
                </Text>
              </View>
            ))}
            {subject.grades.length > 6 ? (
              <BlockCaption className="self-center text-[11px] font-bold">
                +{subject.grades.length - 6}
              </BlockCaption>
            ) : null}
          </Row>
        </View>
      </Row>
    </ColorBlockCard>
  );
}

/* ------------------------------------------------------------------ Detail + Rechner */

function SubjectSheet({
  subject,
  hidden,
  onClose,
}: {
  subject: SubjectGrades | null;
  hidden: boolean;
  onClose: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const [target, setTarget] = useState(2);
  const [simulated, setSimulated] = useState<number | null>(null);

  // Beim Fachwechsel Rechner-Zustand zurücksetzen — sonst blieb die Simulation
  // eines anderen Fachs stehen (Bug Phase 6).
  const subjectKey = subject ? String(subject.subjectId) : null;
  React.useEffect(() => {
    setSimulated(null);
    setTarget(subject?.gradingSystem === 1 ? 12 : 2);
  }, [subjectKey, subject?.gradingSystem]);

  if (!subject) return <Sheet open={false} onClose={onClose}><View /></Sheet>;

  const tone = subjectColor(subject.subject, isDark);
  const ink = foregroundOn(tone, colors);
  const SubjectIcon = subjectIcon(subject.subject);
  const required = requiredGrade(subject, target);
  const preview = simulated != null ? simulate(subject, simulated) : null;
  const targets = subject.gradingSystem === 1 ? [15, 12, 10, 8] : [1, 1.5, 2, 2.5, 3];
  const options = subject.gradingSystem === 1 ? [15, 13, 11, 9, 7, 5] : [1, 2, 3, 4, 5, 6];
  const trend = gradeTrend(subject);

  return (
    <Sheet open onClose={onClose} title={subject.subject}>
      <View className="gap-3">
        {/* Kopf im Farbflächen-Stil: Fachfarbe, Icon-Badge, riesige Zahl */}
        <ColorBlockCard color={tone} radius={28} style={{ padding: 18 }}>
          <Row className="gap-3">
            <IconBadge icon={SubjectIcon} color={ink} tone="tint" size="lg" />
            <View className="min-w-0 flex-1">
              <BlockCaption className="text-[10.5px] font-extrabold uppercase tracking-[1.4px]">
                Aktueller Schnitt
              </BlockCaption>
              <StatNumber
                size="md"
                style={{ color: ink, fontVariant: ['tabular-nums'] }}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {hidden ? MASK : subject.average != null ? de(subject.average) : '–'}
              </StatNumber>
            </View>
            <View className="items-end justify-center">
              <StatNumber
                size="md"
                style={{ color: ink, fontVariant: ['tabular-nums'] }}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {subject.grades.length}
              </StatNumber>
              <BlockCaption className="text-[10.5px] font-extrabold uppercase tracking-[1.2px]">
                Bewertungen
              </BlockCaption>
            </View>
          </Row>
          {trend.points.length >= 3 ? (
            <View className="mt-3">
              <Sparkline
                values={trend.points}
                system={subject.gradingSystem}
                color={ink}
                width={240}
                height={46}
                hidden={hidden}
              />
              <BlockCaption className="mt-1 text-[11.5px]">
                {trend.direction === 'flat'
                  ? 'Verlauf stabil'
                  : `Tendenz ${trend.direction === 'up' ? 'aufwärts' : 'abwärts'} · ${deDelta(trend.delta, 1)} gegenüber dem Start`}
              </BlockCaption>
            </View>
          ) : null}
        </ColorBlockCard>

        {/* Einzelnoten */}
        <Card padded={false}>
          <Text className="px-4 pt-4 text-[13px] font-extrabold uppercase tracking-[1.2px] text-muted">
            Einzelnoten
          </Text>
          {subject.grades.length === 0 ? (
            <EmptyState illustration="no-grades" title="Noch keine Note" hint="Sobald eine Note eingetragen ist, erscheint sie hier." />
          ) : (
            subject.grades.map((grade, index) => (
              <View key={grade.id}>
                <Row className="gap-3 px-4 py-3">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: tint(gradeColor(grade.numeric, subject.gradingSystem), 0.18) }}
                  >
                    <Text
                      className="text-[13px] font-extrabold"
                      style={{ color: gradeColor(grade.numeric, subject.gradingSystem) }}
                    >
                      {hidden ? '•' : grade.value}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-ink">{grade.type ?? 'Note'}</Text>
                    <Muted className="text-[11.5px]">
                      {grade.date ? formatRelativeDay(grade.date) : 'ohne Datum'}
                      {grade.weight !== 1 ? ` · Gewicht ×${grade.weight}` : ''}
                    </Muted>
                  </View>
                </Row>
                {index < subject.grades.length - 1 ? <Divider className="ml-16" /> : null}
              </View>
            ))
          )}
          <View className="h-3" />
        </Card>

        {/* Rechner */}
        <Card>
          <Row className="gap-2.5">
            <IconBadge icon={Calculator} color={colors.blocks.violet} tone="tint" size="md" />
            <Text className="text-[15px] font-extrabold text-ink">Was brauche ich?</Text>
          </Row>
          <Muted className="mt-1.5 text-[12px]">
            Zielschnitt wählen — Schulflow rechnet, welche Note die nächste Arbeit (Gewicht ×2) haben muss.
          </Muted>

          <Row className="mt-3 flex-wrap gap-2">
            {targets.map((value) => (
              <PressableOpacity
                key={value}
                onPress={() => setTarget(value)}
                className={`min-h-[44px] justify-center rounded-[20px] px-4 ${
                  target === value ? '' : 'bg-line/60 hover:bg-line'
                }`}
                style={target === value ? { backgroundColor: resolveThemeColor(colors.blocks.violet, isDark) } : undefined}
                accessibilityRole="button"
                accessibilityState={{ selected: target === value }}
              >
                <Text
                  className="text-[13px] font-extrabold"
                  style={{ color: target === value ? colors.onBlocks.violet : colors.muted }}
                >
                  {subject.gradingSystem === 1 ? `${value} P` : de(value, 1)}
                </Text>
              </PressableOpacity>
            ))}
          </Row>

          <View className="mt-3 rounded-[20px] bg-line/40 p-3.5">
            {required.possible ? (
              <Text className="text-[14px] font-bold text-ink">
                Nötige Note:{' '}
                <Text style={{ color: gradeColor(required.needed, subject.gradingSystem) }}>
                  {subject.gradingSystem === 1
                    ? `${Math.ceil(required.needed)} Punkte`
                    : de(required.needed, 1)}
                </Text>
              </Text>
            ) : (
              <Text className="text-[14px] font-bold text-danger">
                Mit einer Arbeit nicht mehr erreichbar — aber zwei gute Noten schaffen es.
              </Text>
            )}
          </View>

          <Muted className="mt-3 text-[12px]">Wirkung einer Note simulieren:</Muted>
          <Row className="mt-2 flex-wrap gap-2">
            {options.map((value) => (
              <PressableOpacity
                key={value}
                onPress={() => setSimulated(simulated === value ? null : value)}
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  simulated === value ? '' : 'bg-line/60 hover:bg-line'
                }`}
                style={simulated === value ? { backgroundColor: resolveThemeColor(colors.blocks.violet, isDark) } : undefined}
                accessibilityRole="button"
                accessibilityState={{ selected: simulated === value }}
              >
                <Text
                  className="text-[13.5px] font-extrabold"
                  style={{ color: simulated === value ? colors.onBlocks.violet : colors.muted }}
                >
                  {value}
                </Text>
              </PressableOpacity>
            ))}
          </Row>
          {preview != null ? (
            <Row className="mt-3 gap-2">
              {preview < (subject.average ?? 9) ? (
                <TrendingDown size={16} strokeWidth={2.4} color={colors.success} />
              ) : (
                <TrendingUp size={16} strokeWidth={2.4} color={colors.danger} />
              )}
              <Text className="text-[13.5px] font-bold text-ink">
                Neuer Schnitt: {de(preview)}{' '}
                <Text className="text-muted">({deDelta(preview - (subject.average ?? 0))})</Text>
              </Text>
            </Row>
          ) : null}
        </Card>

        <Chip
          label="Berechnung ist eine Schätzung — die Schule kann andere Gewichtungen nutzen."
          color={colors.faint}
        />
      </View>
    </Sheet>
  );
}
