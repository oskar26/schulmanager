/**
 * Noten Screen — Redesign mit satten Farbflächen & Fach-Icon-Badges.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BookOpen, Calculator, Lock, TrendingDown, TrendingUp } from 'lucide-react-native';

import type { SubjectGrades } from '@/api/types';
import { useSnapshot } from '@/data/queries';
import { subjectIcon, subjectStyle, tint } from '@/design/subjects';
import { de, deDelta, gradeColor, requiredGrade, simulate } from '@/features/grades/calculator';
import { formatRelativeDay } from '@/lib/date';
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
  Sheet,
  Skeleton,
  Title,
} from '@/ui/primitives';
import { FadeInUp, PressableOpacity, PressableScale } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { Progress, Switch } from '@/ui/gluestack/feedback';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, radius, shadow } from '@/design/tokens';

export default function GradesScreen() {
  const { colors, isDark } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const reserve = useTabNavReserve();
  const hidden = useSettings((state) => state.settings.hideGrades);
  const update = useSettings((state) => state.update);
  const [selected, setSelected] = useState<SubjectGrades | null>(null);

  const subjects = data?.subjects ?? [];
  const withAverage = subjects.filter((subject) => subject.average != null);
  const overall = withAverage.length
    ? withAverage.reduce((sum, subject) => sum + (subject.average as number), 0) / withAverage.length
    : null;

  const best = useMemo(
    () => [...withAverage].sort((a, b) => (a.average ?? 9) - (b.average ?? 9))[0],
    [withAverage],
  );
  const worst = useMemo(
    () => [...withAverage].sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0],
    [withAverage],
  );

  return (
    <Screen adaptive="content">
      <Row className="justify-between px-4 pb-2 pt-2">
        <View>
          <Title>Noten</Title>
          <Muted className="text-[13px] font-medium">{withAverage.length} Fächer mit Bewertung</Muted>
        </View>
        <Row className="gap-2">
          <Muted className="text-[11px] font-bold">Verbergen</Muted>
          <Switch value={hidden} onValueChange={(value) => update({ hideGrades: value })} />
        </Row>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        {isLoading || !data ? (
          <View className="gap-3">
            <Skeleton className="h-32 rounded-[28px]" />
            <Skeleton className="h-24 rounded-[24px]" />
            <Skeleton className="h-24 rounded-[24px]" />
          </View>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={Lock}
            iconColor={colors.accent.violet}
            title="Keine Noten freigegeben"
            hint="Ob Familien Noten sehen dürfen, entscheidet die Schule im Modul „Noten“."
          />
        ) : (
          <>
            {/* Großer grüner / Lime Gesamtschnitt-Hero-Block */}
            <View
              className="mb-3.5 overflow-hidden rounded-[28px] p-5"
              style={{
                backgroundColor: colors.accent.lime,
                ...shadow.float,
              }}
            >
              <Row className="items-center justify-between">
                <Row className="gap-3.5">
                  <IconBadge
                    icon={TrendingUp}
                    color={colors.accent.limeDeep}
                    tone="solid"
                    size={48}
                    iconSize={24}
                  />
                  <View>
                    <Text className="text-[11px] font-extrabold uppercase tracking-[1.4px] text-on-lime/75">
                      Gesamtschnitt
                    </Text>
                    <Text className="text-[44px] font-extrabold leading-[46px] tracking-tight text-on-lime">
                      {hidden ? '•••' : overall != null ? de(overall) : '–'}
                    </Text>
                  </View>
                </Row>
                <View
                  className="items-center justify-center rounded-[20px] px-4 py-2.5"
                  style={{ backgroundColor: 'rgba(31,42,0,0.12)' }}
                >
                  <Text className="text-[24px] font-extrabold text-on-lime">
                    {hidden ? '••' : String(subjects.reduce((sum, s) => sum + s.grades.length, 0))}
                  </Text>
                  <Text className="text-[9.5px] font-extrabold uppercase tracking-wider text-on-lime/70">
                    Noten
                  </Text>
                </View>
              </Row>

              <View className="my-3.5 h-[1px] bg-on-lime/15" />

              <Row className="justify-between">
                {best ? (
                  <View className="flex-1 pr-2">
                    <Text className="text-[10px] font-extrabold uppercase tracking-[1.2px] text-on-lime/70">
                      Stärkstes Fach
                    </Text>
                    <Text className="mt-0.5 text-[16px] font-extrabold text-on-lime" numberOfLines={1}>
                      {best.subject}
                    </Text>
                    <Text className="text-[14px] font-bold text-on-lime/90">
                      {hidden ? '' : best.average != null ? `Ø ${de(best.average)}` : ''}
                    </Text>
                  </View>
                ) : null}

                {worst && worst !== best ? (
                  <View className="flex-1 pl-2">
                    <Text className="text-[10px] font-extrabold uppercase tracking-[1.2px] text-on-lime/70">
                      Größter Hebel
                    </Text>
                    <Text className="mt-0.5 text-[16px] font-extrabold text-on-lime" numberOfLines={1}>
                      {worst.subject}
                    </Text>
                    <Text className="text-[14px] font-bold text-on-lime/90">
                      {hidden ? '' : worst.average != null ? `Ø ${de(worst.average)}` : ''}
                    </Text>
                  </View>
                ) : null}
              </Row>
            </View>

            {/* Sattere Fachkarten mit Fach-Icon-Badge & größerer Notenzahl */}
            <View className="gap-2.5">
              {subjects.map((subject, index) => {
                const style = subjectStyle(subject.subject);
                const SubIcon = subjectIcon(subject.subject);
                const color = gradeColor(subject.average, subject.gradingSystem);

                const ratio =
                  subject.average == null
                    ? 0
                    : subject.gradingSystem === 1
                      ? (subject.average / 15) * 100
                      : ((6 - subject.average) / 5) * 100;

                const cardBg = tint(style.color, isDark ? 0.22 : 0.12);

                return (
                  <FadeInUp key={String(subject.subjectId)} delay={index * 30}>
                    <PressableScale
                      onPress={() => setSelected(subject)}
                      scale={0.98}
                      accessibilityRole="button"
                    >
                      <View
                        className="overflow-hidden rounded-[26px] p-4"
                        style={{
                          backgroundColor: cardBg,
                          ...shadow.card,
                        }}
                      >
                        <Row className="items-center justify-between">
                          <Row className="flex-1 gap-3.5">
                            <IconBadge
                              icon={SubIcon}
                              color={style.color}
                              tone="solid"
                              size={48}
                              iconSize={24}
                            />
                            <View className="flex-1">
                              <Text className="text-[17px] font-extrabold text-ink" numberOfLines={1}>
                                {subject.subject}
                              </Text>
                              <Muted className="mt-0.5 text-[12px] font-semibold">
                                {subject.grades.length}{' '}
                                {subject.grades.length === 1 ? 'Note' : 'Noten'} erfasst
                              </Muted>
                            </View>
                          </Row>

                          <View className="items-end">
                            <Text className="text-[26px] font-extrabold tracking-tight" style={{ color }}>
                              {hidden ? '•••' : subject.average != null ? de(subject.average) : '–'}
                            </Text>
                            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                              Schnitt
                            </Text>
                          </View>
                        </Row>

                        {/* Trendlinie / Fortschrittsbalken */}
                        <View className="mt-3">
                          <Progress value={hidden ? 0 : ratio} color={color} className="h-2" />
                        </View>

                        {/* Letzte Noten-Pills */}
                        {subject.grades.length > 0 ? (
                          <Row className="mt-2.5 gap-1.5">
                            {subject.grades.slice(0, 5).map((grade) => (
                              <Pill
                                key={grade.id}
                                label={hidden ? '•' : String(grade.value)}
                                color={style.color}
                                tone="solid"
                              />
                            ))}
                            {subject.grades.length > 5 ? (
                              <Pill
                                label={`+${subject.grades.length - 5}`}
                                color={colors.charcoal}
                                tone="tint"
                              />
                            ) : null}
                          </Row>
                        ) : null}
                      </View>
                    </PressableScale>
                  </FadeInUp>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <SubjectSheet subject={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ Detail + Rechner */

function SubjectSheet({ subject, onClose }: { subject: SubjectGrades | null; onClose: () => void }) {
  const { colors } = useThemeColors();
  const [target, setTarget] = useState(2);
  const [simulated, setSimulated] = useState<number | null>(null);

  if (!subject) return <Sheet open={false} onClose={onClose}><View /></Sheet>;

  const style = subjectStyle(subject.subject);
  const SubIcon = subjectIcon(subject.subject);
  const color = gradeColor(subject.average, subject.gradingSystem);
  const required = requiredGrade(subject, target);
  const preview = simulated != null ? simulate(subject, simulated) : null;
  const targets = subject.gradingSystem === 1 ? [15, 12, 10, 8] : [1, 1.5, 2, 2.5, 3];
  const options = subject.gradingSystem === 1 ? [15, 13, 11, 9, 7, 5] : [1, 2, 3, 4, 5, 6];

  return (
    <Sheet open onClose={onClose} title={subject.subject}>
      <View className="gap-3">
        <ColorBlockCard color={style.color} tone="tint">
          <Row className="gap-3.5">
            <IconBadge icon={SubIcon} color={style.color} size={48} iconSize={24} tone="solid" />
            <View className="flex-1">
              <Row className="justify-between">
                <View>
                  <Muted className="text-[11px] font-bold">Aktueller Schnitt</Muted>
                  <Text className="text-[32px] font-extrabold" style={{ color }}>
                    {subject.average != null ? de(subject.average) : '–'}
                  </Text>
                </View>
                <View className="items-end">
                  <Muted className="text-[11px] font-bold">Bewertungen</Muted>
                  <Text className="text-[32px] font-extrabold text-ink">{subject.grades.length}</Text>
                </View>
              </Row>
            </View>
          </Row>
        </ColorBlockCard>

        {/* Einzelnoten */}
        <Card padded={false}>
          <Text className="px-4 pt-3.5 text-[14px] font-extrabold text-ink">Einzelnoten</Text>
          {subject.grades.map((grade, index) => (
            <View key={grade.id}>
              <Row className="gap-3 px-4 py-2.5">
                <IconBadge
                  icon={BookOpen}
                  color={gradeColor(grade.numeric, subject.gradingSystem)}
                  tone="solid"
                  size={36}
                  iconSize={16}
                />
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-ink">{grade.type ?? 'Note'}</Text>
                  <Muted className="text-[11px] font-medium">
                    {grade.date ? formatRelativeDay(grade.date) : ''}
                    {grade.weight !== 1 ? ` · Gewicht ×${grade.weight}` : ''}
                  </Muted>
                </View>
                <Pill
                  label={String(grade.value)}
                  color={gradeColor(grade.numeric, subject.gradingSystem)}
                  tone="solid"
                />
              </Row>
              {index < subject.grades.length - 1 ? <Divider className="ml-14" /> : null}
            </View>
          ))}
          <View className="h-2" />
        </Card>

        {/* Rechner */}
        <Card>
          <Row className="gap-2.5">
            <IconBadge icon={Calculator} color={colors.accent.violet} size={36} iconSize={18} />
            <Text className="text-[16px] font-extrabold text-ink">Was brauche ich?</Text>
          </Row>
          <Muted className="mt-1.5 text-[12px] leading-5">
            Zielschnitt wählen — Schulflow rechnet, welche Note die nächste Arbeit (Gewicht ×2) haben muss.
          </Muted>

          <Row className="mt-3 flex-wrap gap-2">
            {targets.map((value) => (
              <PressableOpacity
                key={value}
                onPress={() => setTarget(value)}
                className={`min-h-[44px] justify-center rounded-xl px-4 ${
                  target === value ? 'bg-accent-violet' : 'bg-line/60 hover:bg-line'
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: target === value }}
              >
                <Text className={`text-[13px] font-extrabold ${target === value ? 'text-on-violet' : 'text-muted'}`}>
                  {subject.gradingSystem === 1 ? `${value} P` : de(value, 1)}
                </Text>
              </PressableOpacity>
            ))}
          </Row>

          <View className="mt-3 rounded-2xl bg-line/40 p-3.5">
            {required.possible ? (
              <Text className="text-[14px] font-bold text-ink">
                Nötige Note:{' '}
                <Text style={{ color: gradeColor(required.needed, subject.gradingSystem), fontWeight: '800' }}>
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

          <Muted className="mt-3.5 text-[12px] font-bold">Wirkung einer Note simulieren:</Muted>
          <Row className="mt-2 flex-wrap gap-2">
            {options.map((value) => (
              <PressableOpacity
                key={value}
                onPress={() => setSimulated(simulated === value ? null : value)}
                className={`h-11 w-11 items-center justify-center rounded-xl ${
                  simulated === value ? 'bg-accent-violet' : 'bg-line/60 hover:bg-line'
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: simulated === value }}
              >
                <Text className={`text-[13px] font-bold ${simulated === value ? 'text-on-violet' : 'text-muted'}`}>
                  {value}
                </Text>
              </PressableOpacity>
            ))}
          </Row>
          {preview != null ? (
            <Row className="mt-3 gap-2">
              {preview < (subject.average ?? 9) ? (
                <TrendingDown size={17} strokeWidth={2.4} color={colors.success} />
              ) : (
                <TrendingUp size={17} strokeWidth={2.4} color={colors.danger} />
              )}
              <Text className="text-[13px] font-bold text-ink">
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
