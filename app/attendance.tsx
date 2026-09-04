/**
 * Fehlzeiten Screen — Redesign mit satten Farbflächen & StatCards.
 */
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2, ChevronLeft, FileText, Lightbulb } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { formatLongDay } from '@/lib/date';
import {
  Card,
  Chip,
  ColorBlockCard,
  Divider,
  EmptyState,
  IconBadge,
  IconButton,
  Muted,
  Pill,
  Row,
  Screen,
  SectionHeader,
  StatCard,
  Title,
} from '@/ui/primitives';
import { Progress } from '@/ui/gluestack/feedback';
import { FadeInUp } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';
import { tint } from '@/design/subjects';
import { shadow } from '@/design/tokens';

export default function AttendanceScreen() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { data } = useSnapshot();
  const absences = data?.absences ?? [];

  const stats = useMemo(() => {
    const excused = absences.filter((entry) => entry.excused).length;
    const unexcused = absences.length - excused;
    const lateArrivals = absences.filter((entry) => entry.from && entry.until).length;
    return { total: absences.length, excused, unexcused, lateArrivals };
  }, [absences]);

  return (
    <Screen adaptive="content">
      <Row className="px-4 pb-2 pt-2">
        <IconButton icon={ChevronLeft} onPress={() => router.back()} size={36} />
        <View className="ml-2 flex-1">
          <Title>Fehlzeiten</Title>
          <Muted className="text-[13px] font-medium">Schuljahr {new Date().getFullYear()}</Muted>
        </View>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Stat-Karten oben */}
        <Row className="gap-2.5">
          <StatCard
            value={stats.total}
            label="Gesamt"
            icon={FileText}
            color={colors.charcoal}
            tone="surface"
          />
          <StatCard
            value={stats.excused}
            label="Entschuldigt"
            icon={CheckCircle2}
            color={colors.success}
            tone="solid"
          />
          <StatCard
            value={stats.unexcused}
            label="Offen"
            icon={AlertCircle}
            color={stats.unexcused > 0 ? colors.danger : colors.success}
            tone={stats.unexcused > 0 ? 'solid' : 'tint'}
          />
        </Row>

        {stats.total > 0 ? (
          <ColorBlockCard color={colors.success} tone="tint" className="mt-3">
            <Row className="justify-between">
              <Text className="text-[13px] font-extrabold text-ink">Quote entschuldigt</Text>
              <Text className="text-[14px] font-extrabold text-success">
                {Math.round((stats.excused / stats.total) * 100)} %
              </Text>
            </Row>
            <Progress
              value={(stats.excused / stats.total) * 100}
              color={colors.success}
              className="mt-2.5"
            />
          </ColorBlockCard>
        ) : null}

        <ColorBlockCard color={colors.accent.amber} tone="tint" className="mt-3">
          <Row className="gap-3">
            <IconBadge icon={Lightbulb} color={colors.accent.amber} tone="solid" size={36} iconSize={18} />
            <Text className="flex-1 text-[12.5px] font-medium leading-5 text-ink">
              Wichtig: Eine Krankmeldung ohne Attest entschuldigt formal noch nichts — die Schule
              wartet auf das Papier. Beurlaubung oder Attest ⇒ entschuldigt.
            </Text>
          </Row>
        </ColorBlockCard>

        <SectionHeader title="Einzelne Fehlzeiten" icon={FileText} iconColor={colors.warning} />
        {absences.length === 0 ? (
          <EmptyState icon={CheckCircle2} iconColor={colors.success} title="Keine Fehlzeiten" hint="Lückenlos anwesend!" />
        ) : (
          <View className="gap-2.5">
            {absences.map((entry, index) => {
              const tone = entry.excused ? colors.success : colors.danger;
              return (
                <FadeInUp key={String(entry.id)} delay={index * 25}>
                  <View
                    className="overflow-hidden rounded-[24px] p-4"
                    style={{
                      backgroundColor: tint(tone, isDark ? 0.22 : 0.12),
                      ...shadow.card,
                    }}
                  >
                    <Row className="gap-3.5">
                      <IconBadge
                        icon={entry.excused ? CheckCircle2 : AlertCircle}
                        color={tone}
                        tone="solid"
                        size={42}
                        iconSize={20}
                      />
                      <View className="flex-1">
                        <Row className="justify-between gap-2">
                          <Text className="flex-1 text-[15px] font-extrabold text-ink">
                            {formatLongDay(entry.date)}
                          </Text>
                          <Pill
                            label={entry.excused ? (entry.certificateType ?? 'entschuldigt') : 'offen'}
                            color={tone}
                            tone="solid"
                          />
                        </Row>
                        <Muted className="mt-1 text-[12px] font-semibold">
                          {entry.from && entry.until ? `${entry.from}–${entry.until} Uhr` : 'Ganzer Tag'}
                          {entry.reason ? ` · ${entry.reason}` : ''}
                        </Muted>
                      </View>
                    </Row>
                  </View>
                </FadeInUp>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
