import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useSnapshot } from '@/data/queries';
import { formatLongDay } from '@/lib/date';
import { Card, Chip, Divider, EmptyState, IconButton, Ionicons, Muted, Row, Screen, SectionHeader, Title } from '@/ui/primitives';
import { Progress } from '@/ui/gluestack/feedback';
import { FadeInUp } from '@/ui/motion';

export default function AttendanceScreen() {
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
        <IconButton icon="chevron-back" onPress={() => router.back()} color="#6A7086" size={36} />
        <View className="ml-2 flex-1">
          <Title>Fehlzeiten</Title>
          <Muted>Schuljahr {new Date().getFullYear()}</Muted>
        </View>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        <Card floating>
          <Row className="gap-3">
            <View className="flex-1 items-center rounded-2xl bg-line/40 py-3">
              <Text className="text-[24px] font-extrabold text-ink">{stats.total}</Text>
              <Muted className="text-[11px]">gesamt</Muted>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-success/12 py-3">
              <Text className="text-[24px] font-extrabold text-success">{stats.excused}</Text>
              <Muted className="text-[11px]">entschuldigt</Muted>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-danger/12 py-3">
              <Text className="text-[24px] font-extrabold text-danger">{stats.unexcused}</Text>
              <Muted className="text-[11px]">offen</Muted>
            </View>
          </Row>

          {stats.total > 0 ? (
            <>
              <Progress
                value={(stats.excused / stats.total) * 100}
                color="#22B07A"
                className="mt-4"
              />
              <Muted className="mt-1.5 text-[11px]">
                {Math.round((stats.excused / stats.total) * 100)} % der Fehlzeiten sind entschuldigt
              </Muted>
            </>
          ) : null}
        </Card>

        <Card className="mt-3 bg-brand-soft">
          <Row className="gap-2">
            <Ionicons name="bulb-outline" size={17} color="#3C2FA0" />
            <Text className="flex-1 text-[13px] leading-5 text-brand-ink">
              Wichtig: Eine Krankmeldung ohne Attest-Typ entschuldigt formal noch nichts — die Schule
              wartet dann auf das Papier. Schulflow rechnet genau wie der offizielle Client:
              Beurlaubung oder Attest ⇒ entschuldigt.
            </Text>
          </Row>
        </Card>

        <SectionHeader title="Einzelne Fehlzeiten" emoji="🗂️" />
        {absences.length === 0 ? (
          <EmptyState emoji="🎉" title="Keine Fehlzeiten" hint="Lückenlos anwesend." />
        ) : (
          <Card padded={false}>
            {absences.map((entry, index) => (
              <FadeInUp key={String(entry.id)} delay={index * 25}>
                <Row className="gap-3 px-4 py-3">
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-xl ${
                      entry.excused ? 'bg-success/12' : 'bg-danger/12'
                    }`}
                  >
                    <Ionicons
                      name={entry.excused ? 'checkmark' : 'alert'}
                      size={17}
                      color={entry.excused ? '#22B07A' : '#E24848'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-ink">{formatLongDay(entry.date)}</Text>
                    <Muted className="text-[12px]">
                      {entry.from && entry.until ? `${entry.from}–${entry.until}` : 'ganzer Tag'}
                      {entry.reason ? ` · ${entry.reason}` : ''}
                    </Muted>
                  </View>
                  <Chip
                    label={entry.excused ? (entry.certificateType ?? 'entschuldigt') : 'offen'}
                    color={entry.excused ? '#22B07A' : '#E24848'}
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
