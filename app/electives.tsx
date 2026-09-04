import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeBack } from '@/ui/navigation';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';

import type { Elective, Election } from '@/api/types';
import { useSavePriorities, useSnapshot } from '@/data/queries';
import { formatDay } from '@/lib/date';
import { hapticError, hapticLight, hapticSuccess } from '@/lib/haptics';
import { Card, Chip, EmptyState, IconButton, Muted, Row, Screen, Title } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner } from '@/ui/gluestack/feedback';
import { useThemeColors } from '@/design/theme';

export default function ElectivesScreen() {
  const { colors } = useThemeColors();
  const dismiss = useSafeBack();
  const { data } = useSnapshot();
  const elections = data?.elections ?? [];
  const [ranked, setRanked] = useState<Record<string, Elective[]>>({});
  const save = useSavePriorities();

  useEffect(() => {
    // Startreihenfolge: wie geliefert (Reihenfolge der Schule).
    setRanked((prev) => {
      const next = { ...prev };
      for (const election of elections) {
        if (!next[String(election.id)]) next[String(election.id)] = election.electives;
      }
      return next;
    });
  }, [elections]);

  const move = (election: Election, index: number, direction: -1 | 1) => {
    hapticLight();
    setRanked((prev) => {
      const list = [...(prev[String(election.id)] ?? election.electives)];
      const target = index + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, [String(election.id)]: list };
    });
  };

  const submit = (election: Election) => {
    const list = ranked[String(election.id)] ?? election.electives;
    save.mutate(
      { election, ranked: list.slice(0, election.prioritiesPerStudent ?? list.length) },
      {
        onSuccess: () => {
          hapticSuccess();
          Alert.alert('Gespeichert', 'Deine Wünsche wurden übermittelt.');
        },
        onError: () => {
          hapticError();
          Alert.alert('Nicht gespeichert', 'Die Wahl ist evtl. schon geschlossen. Probier es später erneut.');
        },
      },
    );
  };

  return (
    <Screen adaptive="narrow">
      <Row className="px-4 pb-2 pt-2">
        <IconButton icon={X} onPress={() => dismiss()} size={36} />
        <View className="ml-2 flex-1">
          <Title>Wahlfächer</Title>
          <Muted>Wünsche sortieren und abgeben</Muted>
        </View>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {elections.length === 0 ? (
          <EmptyState
            illustration="nothing-here"
            title="Keine Wahlen offen"
            hint="Wenn deine Schule Wahlfächer anbietet, erscheinen sie hier."
          />
        ) : (
          elections.map((election, index) => {
            const list = ranked[String(election.id)] ?? election.electives;
            const max = Math.min(election.prioritiesPerStudent ?? list.length, list.length);
            const closed = Boolean(election.finalized);
            return (
              <FadeInUp key={String(election.id)} delay={Math.min(index, 6) * 40}>
              <Card className="mb-3">
                <Row className="justify-between">
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-ink">{election.name}</Text>
                    {election.description ? (
                      <Muted className="mt-0.5 text-[12px]">{election.description}</Muted>
                    ) : null}
                    {election.end ? (
                      <Muted className="mt-0.5 text-[11px]">Frist: {formatDay(election.end.slice(0, 10))}</Muted>
                    ) : null}
                  </View>
                  {closed ? (
                    <Chip label="abgeschlossen" color={colors.faint} />
                  ) : (
                    <Chip label={`${max} Wünsche`} color={colors.accent.violet} />
                  )}
                </Row>

                {closed ? (
                  <Muted className="mt-3 text-[12px]">
                    Die Zuteilung ist bereits abgeschlossen — Änderungen sind nicht mehr möglich.
                  </Muted>
                ) : (
                  <>
                    <View className="mt-3 gap-2">
                      {list.map((elective, index) => (
                        <Row key={String(elective.id)} className="gap-2">
                          <View
                            className={`h-8 w-8 items-center justify-center rounded-full ${
                              index < max ? 'bg-accent-violet' : 'bg-line/50'
                            }`}
                          >
                            <Text
                              className={`text-[13px] font-extrabold ${index < max ? 'text-on-violet' : 'text-faint'}`}
                            >
                              {index + 1}
                            </Text>
                          </View>
                          <Text className="flex-1 text-[14px] font-semibold text-ink">{elective.name}</Text>
                          <IconButton
                            icon={ChevronUp}
                            size={30}
                            background="transparent"
                            onPress={() => move(election, index, -1)}
                          />
                          <IconButton
                            icon={ChevronDown}
                            size={30}
                            background="transparent"
                            onPress={() => move(election, index, 1)}
                          />
                        </Row>
                      ))}
                    </View>

                    <Button
                      action="primary"
                      size="lg"
                      block
                      className="mt-4"
                      onPress={() => submit(election)}
                    >
                      {save.isPending ? <Spinner color={colors.on.amber} /> : null}
                      <ButtonText>Wünsche abgeben</ButtonText>
                    </Button>
                  </>
                )}
              </Card>
              </FadeInUp>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
