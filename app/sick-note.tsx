import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeBack } from '@/ui/navigation';
import { Info, Stethoscope, X } from 'lucide-react-native';

import { useCreateSickNote, useSnapshot } from '@/data/queries';
import { addDays, formatLongDay, toISO } from '@/lib/date';
import { activeLessonsOn } from '@/features/insights/engine';
import { Card, Chip, IconBadge, IconButton, Muted, Row, Screen, Title } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner } from '@/ui/gluestack/feedback';
import { useThemeColors } from '@/design/theme';

export default function SickNoteScreen() {
  const { colors } = useThemeColors();
  const dismiss = useSafeBack();
  const { data } = useSnapshot();
  const mutation = useCreateSickNote();

  const [start, setStart] = useState(toISO(new Date()));
  const [days, setDays] = useState(1);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const end = toISO(addDays(new Date(start), days - 1));
  const affected = data
    ? Array.from({ length: days }, (_, index) => toISO(addDays(new Date(start), index))).flatMap((iso) =>
        activeLessonsOn(data, iso),
      )
    : [];

  if (sent) {
    return (
      <Screen adaptive="narrow">
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-danger/15">
            <Stethoscope color={colors.danger} size={32} strokeWidth={2} />
          </View>
          <Title>Krankmeldung übermittelt</Title>
          <Muted className="text-center">
            Die Schule wurde informiert{data?.student?.firstname ? ` — gute Besserung, ${data.student.firstname}!` : '.'}
          </Muted>
          <Button action="primary" size="lg" className="mt-4" onPress={() => dismiss()}>
            <ButtonText>Fertig</ButtonText>
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen adaptive="narrow">
      <Row className="justify-between px-4 pb-2 pt-2">
        <Row className="gap-2">
          <IconButton icon={X} onPress={() => dismiss()} size={36} />
          <Title>Krankmeldung</Title>
        </Row>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <FadeInUp>
        <Card className="mb-3 bg-accent-amber/15">
          <Row className="gap-3">
            <IconBadge icon={Stethoscope} color={colors.accent.amberDeep} tone="tint" size="lg" />
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-on-amber">In zwei Schritten erledigt</Text>
              <Muted className="mt-0.5 text-[12px]">
                Zeitraum wählen, kurz begründen, absenden. Die Fehlzeiten werden automatisch als
                entschuldigt geführt, sobald die Schule bestätigt.
              </Muted>
            </View>
          </Row>
        </Card>
        </FadeInUp>

        <FadeInUp delay={30}>
        <Card className="mb-3">
          <Text className="text-[13px] font-bold text-ink">Ab wann?</Text>
          <Row className="mt-2 gap-2">
            {[0, 1, 2].map((offset) => {
              const iso = toISO(addDays(new Date(), offset));
              const active = start === iso;
              return (
                <Pressable
                  key={iso}
                  onPress={() => setStart(iso)}
                  className={`min-h-[48px] flex-1 items-center justify-center rounded-[20px] py-3 hover:opacity-90 active:opacity-80 ${active ? 'bg-accent-amber' : 'bg-line/50'}`}
                >
                  <Text className={`text-[13px] font-bold ${active ? 'text-on-amber' : 'text-muted'}`}>
                    {offset === 0 ? 'Heute' : offset === 1 ? 'Morgen' : 'Übermorgen'}
                  </Text>
                  <Text className={`text-[11px] ${active ? 'text-on-amber/80' : 'text-faint'}`}>
                    {formatLongDay(iso).split(',')[1]}
                  </Text>
                </Pressable>
              );
            })}
          </Row>

          <Text className="mt-4 text-[13px] font-bold text-ink">Wie lange?</Text>
          <Row className="mt-2 gap-2">
            {[1, 2, 3, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => setDays(value)}
                className={`min-h-[48px] flex-1 items-center justify-center rounded-[20px] py-3 hover:opacity-90 active:opacity-80 ${days === value ? 'bg-accent-amber' : 'bg-line/50'}`}
              >
                <Text className={`text-[15px] font-extrabold ${days === value ? 'text-on-amber' : 'text-muted'}`}>
                  {value}
                </Text>
                <Text className={`text-[10px] ${days === value ? 'text-on-amber/80' : 'text-faint'}`}>
                  {value === 1 ? 'Tag' : 'Tage'}
                </Text>
              </Pressable>
            ))}
          </Row>

          <Muted className="mt-3 text-[12px]">
            {formatLongDay(start)}
            {days > 1 ? ` bis ${formatLongDay(end)}` : ''}
          </Muted>
        </Card>
        </FadeInUp>

        <FadeInUp delay={60}>
        <Card className="mb-3">
          <Text className="text-[13px] font-bold text-ink">Grund (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="z. B. Erkältung mit Fieber"
            placeholderTextColor={colors.faint}
            multiline
            className="mt-2 min-h-[80px] rounded-[20px] bg-canvas p-3.5 text-[15px] text-ink"
          />
        </Card>
        </FadeInUp>

        {affected.length > 0 ? (
          <FadeInUp delay={90}>
          <Card className="mb-3">
            <Row className="gap-2">
              <Info size={16} strokeWidth={2} color={colors.accent.violet} />
              <Text className="text-[13px] font-bold text-ink">
                Betroffen: {affected.length} Unterrichtsstunden
              </Text>
            </Row>
            <Row className="mt-2 flex-wrap gap-1.5">
              {Array.from(new Set(affected.map((lesson) => lesson.subject))).map((subject) => (
                <Chip key={subject} label={subject} color={colors.accent.violet} />
              ))}
            </Row>
            <Muted className="mt-2 text-[12px]">
              Denk an die Hausaufgaben dieser Fächer — Schulflow erinnert dich nach der Genesung.
            </Muted>
          </Card>
          </FadeInUp>
        ) : null}

        <Button
          action="danger"
          size="lg"
          block
          onPress={() =>
            mutation.mutate(
              { startDate: start, endDate: end, comment },
              { onSuccess: () => setSent(true) },
            )
          }
        >
          {mutation.isPending ? <Spinner color={colors.on.coral} /> : null}
          <ButtonText>Krankmeldung absenden</ButtonText>
        </Button>
        <Muted className="mt-3 text-center text-[11px]">
          Sendet an das Modul „Krankmeldung“ der Schule. Im Demo-Modus wird nichts übertragen.
        </Muted>
      </ScrollView>
    </Screen>
  );
}
