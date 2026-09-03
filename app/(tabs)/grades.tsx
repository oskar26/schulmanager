import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BookOpen, Calculator, Lock, TrendingDown, TrendingUp } from 'lucide-react-native';

import type { SubjectGrades } from '@/api/types';
import { useSnapshot } from '@/data/queries';
import { subjectStyle, tint } from '@/design/subjects';
import { de, deDelta, gradeColor, requiredGrade, simulate } from '@/features/grades/calculator';
import { formatRelativeDay } from '@/lib/date';
import {
  Card, Chip, Divider, EmptyState, Muted, Row, Screen, Sheet, Skeleton, Title,
} from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { Progress, Switch } from '@/ui/gluestack/feedback';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { shadow } from '@/design/tokens';

export default function GradesScreen() {
  const { colors } = useThemeColors();
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
          <Muted>{withAverage.length} Fächer mit Bewertung</Muted>
        </View>
        <Row className="gap-2">
          <Muted className="text-[11px]">verbergen</Muted>
          <Switch value={hidden} onValueChange={(value) => update({ hideGrades: value })} />
        </Row>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        {isLoading || !data ? (
          <View className="gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </View>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={Lock}
            iconColor={colors.accent.violet}
            title="Keine Noten sichtbar"
            hint="Ob Familien Noten sehen dürfen, entscheidet die Schule im Modul „Noten“."
          />
        ) : (
          <>
            {/* Phase 3: Erfolgs-Hero in Lime mit Schnitt, bestem Fach und größtem Hebel */}
            <Card
              className="mb-3 overflow-hidden"
              padded={false}
              style={{
                backgroundColor: colors.accent.lime,
                borderWidth: 0,
                ...shadow.float,
              }}
            >
              <View className="flex-row items-center gap-4 p-4">
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'rgba(31,42,0,0.10)' }}
                >
                  <TrendingUp size={22} strokeWidth={2.2} color={colors.on.lime} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-extrabold uppercase tracking-[1.6px] text-on-lime/65">
                    Gesamtschnitt
                  </Text>
                  <Text className="text-[40px] font-extrabold leading-[42px] tracking-tight text-on-lime">
                    {hidden ? '•••' : overall != null ? de(overall) : '–'}
                  </Text>
                </View>
                <View className="items-end">
                  <View
                    className="rounded-2xl px-3.5 py-2.5"
                    style={{ backgroundColor: 'rgba(31,42,0,0.12)' }}
                  >
                    <Text className="text-[22px] font-extrabold leading-[24px] text-on-lime">
                      {hidden ? '••' : String(subjects.reduce((sum, s) => sum + s.grades.length, 0))}
                    </Text>
                    <Text className="text-[9px] font-extrabold uppercase tracking-wider text-on-lime/60">
                      Noten erfasst
                    </Text>
                  </View>
                </View>
              </View>

              <View className="h-[1px] bg-on-lime/15" />

              <View className="flex-row">
                {best ? (
                  <View className="flex-1 gap-0.5 px-4 py-3">
                    <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-on-lime/60">
                      Stärkstes Fach
                    </Text>
                    <Text className="text-[15px] font-extrabold leading-5 text-on-lime" numberOfLines={1}>
                      {best.subject}
                    </Text>
                    <Text className="text-[13px] font-bold text-on-lime/80">
                      {hidden ? '' : best.average != null ? de(best.average) : ''}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-1 px-4 py-3" />
                )}
                <View className="w-[1px] bg-on-lime/15" />
                {worst && worst !== best ? (
                  <View className="flex-1 gap-0.5 px-4 py-3">
                    <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-on-lime/60">
                      Größter Hebel
                    </Text>
                    <Text className="text-[15px] font-extrabold leading-5 text-on-lime" numberOfLines={1}>
                      {worst.subject}
                    </Text>
                    <Text className="text-[13px] font-bold text-on-lime/80">
                      {hidden ? '' : worst.average != null ? de(worst.average) : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>

            {subjects.map((subject, index) => {
              const style = subjectStyle(subject.subject);
              const color = gradeColor(subject.average, subject.gradingSystem);
              // Balkenlänge: 1,0 = voll, 6,0 = leer
              const ratio =
                subject.average == null
                  ? 0
                  : subject.gradingSystem === 1
                    ? (subject.average / 15) * 100
                    : ((6 - subject.average) / 5) * 100;

              return (
                <FadeInUp key={String(subject.subjectId)} delay={index * 30}>
                  <Pressable onPress={() => setSelected(subject)} className="mb-2 active:opacity-80">
                    <Card style={{ backgroundColor: tint(style.color, 0.10) }}>
                      <Row className="gap-3">
                        <View
                          className="h-11 w-11 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: tint(style.color, 0.16) }}
                        >
                          <BookOpen size={20} strokeWidth={2.1} color={style.color} />
                        </View>
                        <View className="flex-1">
                          <Row className="justify-between">
                            <Text className="text-[15px] font-bold text-ink">{subject.subject}</Text>
                            <Text className="text-[16px] font-extrabold" style={{ color }}>
                              {hidden ? '•••' : subject.average != null ? de(subject.average) : '–'}
                            </Text>
                          </Row>
                          <Progress value={hidden ? 0 : ratio} color={color} className="mt-2" />
                          <Row className="mt-1.5 gap-1.5">
                            {subject.grades.slice(0, 5).map((grade) => (
                              <View
                                key={grade.id}
                                className="rounded-md px-1.5 py-0.5"
                                style={{ backgroundColor: tint(color, 0.14) }}
                              >
                                <Text className="text-[10px] font-bold" style={{ color }}>
                                  {hidden ? '•' : grade.value}
                                </Text>
                              </View>
                            ))}
                            {subject.grades.length > 5 ? (
                              <Muted className="text-[10px]">+{subject.grades.length - 5}</Muted>
                            ) : null}
                          </Row>
                        </View>
                      </Row>
                    </Card>
                  </Pressable>
                </FadeInUp>
              );
            })}
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
  const color = gradeColor(subject.average, subject.gradingSystem);
  const required = requiredGrade(subject, target);
  const preview = simulated != null ? simulate(subject, simulated) : null;
  const targets = subject.gradingSystem === 1 ? [15, 12, 10, 8] : [1, 1.5, 2, 2.5, 3];
  const options = subject.gradingSystem === 1 ? [15, 13, 11, 9, 7, 5] : [1, 2, 3, 4, 5, 6];

  return (
    <Sheet open onClose={onClose} title={subject.subject}>
      <View className="gap-3">
        <Card style={{ backgroundColor: tint(color, 0.12) }}>
          <Row className="justify-between">
            <View>
              <Muted className="text-[11px]">Aktueller Schnitt</Muted>
              <Text className="text-[28px] font-extrabold" style={{ color }}>
                {subject.average != null ? de(subject.average) : '–'}
              </Text>
            </View>
            <View className="items-end">
              <Muted className="text-[11px]">Bewertungen</Muted>
              <Text className="text-[28px] font-extrabold text-ink">{subject.grades.length}</Text>
            </View>
          </Row>
        </Card>

        {/* Einzelnoten */}
        <Card padded={false}>
          <Text className="px-4 pt-3 text-[13px] font-bold text-ink">Einzelnoten</Text>
          {subject.grades.map((grade, index) => (
            <View key={grade.id}>
              <Row className="gap-3 px-4 py-2.5">
                <View
                  className="h-8 w-8 items-center justify-center rounded-xl"
                  style={{ backgroundColor: tint(gradeColor(grade.numeric, subject.gradingSystem), 0.16) }}
                >
                  <Text
                    className="text-[13px] font-extrabold"
                    style={{ color: gradeColor(grade.numeric, subject.gradingSystem) }}
                  >
                    {grade.value}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-semibold text-ink">{grade.type ?? 'Note'}</Text>
                  <Muted className="text-[11px]">
                    {grade.date ? formatRelativeDay(grade.date) : ''}
                    {grade.weight !== 1 ? ` · Gewicht ×${grade.weight}` : ''}
                  </Muted>
                </View>
              </Row>
              {index < subject.grades.length - 1 ? <Divider className="ml-14" /> : null}
            </View>
          ))}
          <View className="h-2" />
        </Card>

        {/* Rechner */}
        <Card>
          <Row className="gap-2">
            <View
              className="h-8 w-8 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: tint(colors.accent.violet, 0.14) }}
            >
              <Calculator size={16} strokeWidth={2.1} color={colors.accent.violet} />
            </View>
            <Text className="text-[15px] font-bold text-ink">Was brauche ich?</Text>
          </Row>
          <Muted className="mt-1 text-[12px]">
            Zielschnitt wählen — Schulflow rechnet, welche Note die nächste Arbeit (Gewicht ×2) haben muss.
          </Muted>

          <Row className="mt-3 flex-wrap gap-2">
            {targets.map((value) => (
              <Pressable
                key={value}
                onPress={() => setTarget(value)}
                className={`rounded-xl px-3 py-1.5 ${target === value ? 'bg-accent-violet' : 'bg-line/60'}`}
              >
                <Text className={`text-[12px] font-bold ${target === value ? 'text-on-violet' : 'text-muted'}`}>
                  {subject.gradingSystem === 1 ? `${value} P` : de(value, 1)}
                </Text>
              </Pressable>
            ))}
          </Row>

          <View className="mt-3 rounded-2xl bg-line/40 p-3">
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
              <Pressable
                key={value}
                onPress={() => setSimulated(simulated === value ? null : value)}
                className={`h-9 w-9 items-center justify-center rounded-xl ${
                  simulated === value ? 'bg-accent-violet' : 'bg-line/60'
                }`}
              >
                <Text className={`text-[13px] font-bold ${simulated === value ? 'text-on-violet' : 'text-muted'}`}>
                  {value}
                </Text>
              </Pressable>
            ))}
          </Row>
          {preview != null ? (
            <Row className="mt-3 gap-2">
              {preview < (subject.average ?? 9) ? (
                <TrendingDown size={16} strokeWidth={2.1} color={colors.success} />
              ) : (
                <TrendingUp size={16} strokeWidth={2.1} color={colors.danger} />
              )}
              <Text className="text-[13px] font-semibold text-ink">
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
