import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeBack } from '@/ui/navigation';
import { AlertCircle, CheckCircle2, ChevronLeft, FileText, Lightbulb } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { formatLongDay } from '@/lib/date';
import { Card, Chip, Divider, EmptyState, IconBadge, IconButton, Muted, Row, Screen, SectionHeader, Title } from '@/ui/primitives';
import { Progress } from '@/ui/gluestack/feedback';
import { FadeInUp } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';

export default function AttendanceScreen() {
  const { colors } = useThemeColors();
  const dismiss = useSafeBack();
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
        <IconButton icon={ChevronLeft} onPress={() => dismiss()} size={36} />
        <View className="ml-2 flex-1">
          <Title>Fehlzeiten</Title>
          <Muted>Schuljahr {new Date().getFullYear()}</Muted>
        </View>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        <Card floating>
          <Row className="gap-3">
            <View className="flex-1 items-center rounded-[20px] bg-line/40 py-3">
              <Text className="text-[24px] font-extrabold text-ink">{stats.total}</Text>
              <Muted className="text-[11px]">gesamt</Muted>
            </View>
            <View className="flex-1 items-center rounded-[20px] bg-success/15 py-3">
              <Text className="text-[24px] font-extrabold text-success">{stats.excused}</Text>
              <Muted className="text-[11px]">entschuldigt</Muted>
            </View>
            <View className="flex-1 items-center rounded-[20px] bg-danger/15 py-3">
              <Text className="text-[24px] font-extrabold text-danger">{stats.unexcused}</Text>
              <Muted className="text-[11px]">offen</Muted>
            </View>
          </Row>

          {stats.total > 0 ? (
            <>
              <Progress
                value={(stats.excused / stats.total) * 100}
                color={colors.success}
                className="mt-4"
              />
              <Muted className="mt-1.5 text-[11px]">
                {Math.round((stats.excused / stats.total) * 100)} % der Fehlzeiten sind entschuldigt
              </Muted>
            </>
          ) : null}
        </Card>

        <Card className="mt-3 bg-accent-amber/15">
          <Row className="gap-2">
            <Lightbulb size={18} strokeWidth={2.1} color={colors.accent.amberDeep} />
            <Text className="flex-1 text-[13px] leading-5 text-on-amber">
              Wichtig: Eine Krankmeldung ohne Attest-Typ entschuldigt formal noch nichts — die Schule
              wartet dann auf das Papier. Schulflow rechnet genau wie der offizielle Client:
              Beurlaubung oder Attest ⇒ entschuldigt.
            </Text>
          </Row>
        </Card>

        <SectionHeader title="Einzelne Fehlzeiten" icon={FileText} iconColor={colors.warning} />
        {absences.length === 0 ? (
          <EmptyState art="attendance" iconColor={colors.success} title="Keine Fehlzeiten" hint="Lückenlos anwesend." />
        ) : (
          <Card padded={false}>
            {absences.map((entry, index) => (
              <FadeInUp key={String(entry.id)} delay={index * 25}>
                <Row className="gap-3 px-4 py-3">
                  <IconBadge
                    icon={entry.excused ? CheckCircle2 : AlertCircle}
                    color={entry.excused ? colors.success : colors.danger}
                    tone="tint"
                    size="md"
                  />
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-ink">{formatLongDay(entry.date)}</Text>
                    <Muted className="text-[12px]">
                      {entry.from && entry.until ? `${entry.from}–${entry.until}` : 'ganzer Tag'}
                      {entry.reason ? ` · ${entry.reason}` : ''}
                    </Muted>
                  </View>
                  <Chip
                    label={entry.excused ? (entry.certificateType ?? 'entschuldigt') : 'offen'}
                    color={entry.excused ? colors.success : colors.danger}
                  />
                </Row>
                {index < absences.length - 1 ? <Divider className="ml-16" /> : null}
              </FadeInUp>
            ))}
            <View className="h-2" />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
