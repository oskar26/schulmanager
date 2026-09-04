import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeBack } from '@/ui/navigation';
import { CalendarDays, ChevronLeft, User, Users } from 'lucide-react-native';

import type { ParentTalkRound } from '@/api/types';
import { useBookProposal, useSnapshot } from '@/data/queries';
import { formatDay, formatTime } from '@/lib/date';
import { hapticError, hapticLight, hapticSuccess } from '@/lib/haptics';
import { Card, Chip, EmptyState, IconButton, Muted, Row, Screen, Sheet, Skeleton, Title } from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner } from '@/ui/gluestack/feedback';
import { FadeInUp } from '@/ui/motion';
import { useSession } from '@/state/session';
import { useThemeColors } from '@/design/theme';

export default function ParentTalksScreen() {
  const { colors } = useThemeColors();
  const dismiss = useSafeBack();
  const { data, isLoading } = useSnapshot();
  const rounds = data?.parentTalkRounds ?? [];
  const [selected, setSelected] = useState<ParentTalkRound | null>(null);

  return (
    <Screen adaptive="content">
      <Row className="px-4 pb-2 pt-2">
        <IconButton icon={ChevronLeft} onPress={() => dismiss()} size={36} />
        <View className="ml-2 flex-1">
          <Title>Elternsprechtag</Title>
          <Muted>Gespräche mit den Lehrkräften buchen</Muted>
        </View>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : rounds.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            iconColor={colors.warning}
            title="Keine Sprechtage"
            hint="Aktuell ist keine Runde geplant — oder das Modul ist nicht gebucht."
          />
        ) : (
          rounds.map((round, index) => {
            const booked = round.appointments.filter((appointment) => !appointment.cancelled);
            return (
              <FadeInUp key={String(round.id)} delay={Math.min(index, 8) * 30}>
                <Card className="mb-2">
                  <Row className="justify-between">
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-ink">{round.label}</Text>
                      <Muted className="mt-0.5 text-[12px]">
                        {round.start ? formatDay(round.start) : ''}
                        {round.end && round.end !== round.start ? ` – ${formatDay(round.end)}` : ''}
                      </Muted>
                    </View>
                    <Chip
                      label={booked.length > 0 ? `${booked.length} gebucht` : 'keine Termine'}
                      color={booked.length > 0 ? colors.success : colors.faint}
                    />
                  </Row>

                  {booked.length > 0 ? (
                    <View className="mt-3 gap-1.5">
                      {booked.map((appointment) => (
                        <Row key={String(appointment.id)} className="gap-2 rounded-xl bg-success/10 px-3 py-2">
                          <User size={14} strokeWidth={2} color={colors.success} />
                          <Text className="flex-1 text-[13px] font-semibold text-ink">
                            {[appointment.teacher?.lastname, appointment.teacher?.firstname].filter(Boolean).join(', ') ||
                              'Lehrkraft'}
                          </Text>
                          <Text className="text-[12px] font-bold text-success">
                            {appointment.start ? formatTime(appointment.start) : ''}
                          </Text>
                        </Row>
                      ))}
                    </View>
                  ) : null}

                  {round.inscriptionStart && round.inscriptionEnd ? (
                    <Muted className="mt-2 text-[11px]">
                      Buchung möglich: {formatDay(round.inscriptionStart)} – {formatDay(round.inscriptionEnd)}
                    </Muted>
                  ) : null}

                  {round.appointments.length === 0 ? (
                    <Button
                      action="primary"
                      size="md"
                      className="mt-3"
                      onPress={() => {
                        hapticLight();
                        setSelected(round);
                      }}
                    >
                      <ButtonText>Termine ansehen</ButtonText>
                    </Button>
                  ) : null}
                </Card>
              </FadeInUp>
            );
          })
        )}
      </ScrollView>

      {selected ? (
        <BookingSheet
          round={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </Screen>
  );
}

/* ------------------------------------------------------------------ Buchung */

function BookingSheet({ round, onClose }: { round: ParentTalkRound; onClose: () => void }) {
  const { colors } = useThemeColors();
  const { api } = useSession.getState();
  const isDemo = useSession((state) => state.status !== 'connected');
  const book = useBookProposal();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ id: string; start?: string | null }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const teachers = new Map<
    string,
    { id: string; name: string }
  >();
  round.appointments.forEach((appointment) => {
    if (appointment.teacher) {
      teachers.set(String(appointment.teacher.id), {
        id: String(appointment.teacher.id),
        name:
          [appointment.teacher.lastname, appointment.teacher.firstname].filter(Boolean).join(', ') ||
          String(appointment.teacher.abbreviation ?? 'Lehrkraft'),
      });
    }
  });

  const loadSlots = async (id: string) => {
    setTeacherId(id);
    setLoadingSlots(true);
    setSlots([]);
    try {
      const proposals = isDemo
        ? demoSlots()
        : await api.availableProposals(round.id, id);
      setSlots(proposals.map((proposal) => ({ id: String(proposal.id), start: proposal.start ?? null })));
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={round.label}>
      <Muted className="mb-3 text-[12px]">
        Lehrkraft wählen, dann freie Slots laden. Gebucht wird direkt über die Schule.
      </Muted>

      <View className="gap-2">
        {[...teachers.values()].map((teacher) => (
          <Pressable
            key={teacher.id}
            onPress={() => void loadSlots(teacher.id)}
            className={`rounded-2xl border px-4 py-3 ${
              teacherId === teacher.id ? 'border-accent-amber bg-accent-amber/15' : 'border-line bg-surface'
            }`}
          >
            <Text className={`text-[14px] font-semibold ${teacherId === teacher.id ? 'text-on-amber' : 'text-ink'}`}>
              {teacher.name}
            </Text>
          </Pressable>
        ))}
        {teachers.size === 0 ? (
          <EmptyState icon={Users} iconColor={colors.warning} title="Keine Angebote" hint="In dieser Runde werden keine Termine angeboten." />
        ) : null}
      </View>

      {loadingSlots ? (
        <View className="mt-4 items-center">
          <Spinner />
        </View>
      ) : null}

      {slots.length > 0 ? (
        <View className="mt-4">
          <Text className="mb-2 text-[13px] font-bold text-ink">Freie Termine</Text>
          <View className="flex-row flex-wrap gap-2">
            {slots.map((slot) => (
              <Pressable
                key={slot.id}
                onPress={() => {
                  hapticLight();
                  book.mutate(
                    { proposalId: slot.id },
                    {
                      onSuccess: () => {
                        hapticSuccess();
                        Alert.alert('Gebucht', 'Der Termin wurde eingetragen. Er erscheint auf dem Sprechtag.');
                        onClose();
                      },
                      onError: () => {
                        hapticError();
                        Alert.alert('Buchung nicht möglich', 'Der Termin ist evtl. gerade weg — probiere einen anderen.');
                      },
                    },
                  );
                }}
                className="rounded-xl bg-accent-amber px-3.5 py-2.5 active:opacity-80"
              >
                <Text className="text-[13px] font-bold text-on-amber">
                  {slot.start ? formatDay(slot.start) : 'Termin'} · {slot.start ? formatTime(slot.start) : ''}
                </Text>
              </Pressable>
            ))}
          </View>
          {book.isPending ? (
            <Row className="mt-3 justify-center">
              <Spinner />
            </Row>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

function demoSlots() {
  const base = new Date();
  base.setDate(base.getDate() + 9);
  base.setHours(16, 0, 0, 0);
  return [0, 1, 2].map((offset) => {
    const start = new Date(base.getTime() + offset * 15 * 60_000);
    return { id: `demo-proposal-${offset}`, start: start.toISOString() };
  });
}
