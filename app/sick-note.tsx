import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Info, Stethoscope, X } from 'lucide-react-native';

import { useCreateSickNote, useSnapshot } from '@/data/queries';
import { addDays, formatLongDay, toISO } from '@/lib/date';
import { activeLessonsOn } from '@/features/insights/engine';
import { Card, Chip, IconButton, Muted, Row, Screen, Title } from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner } from '@/ui/gluestack/feedback';

export default function SickNoteScreen() {
  const router = useRouter();
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
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-danger/12">
            <Stethoscope color="#E24848" size={32} strokeWidth={2} />
          </View>
          <Title>Krankmeldung übermittelt</Title>
          <Muted className="text-center">
            Die Schule wurde informiert{data?.student?.firstname ? ` — gute Besserung, ${data.student.firstname}!` : '.'}
          </Muted>
          <Button action="primary" size="lg" className="mt-4" onPress={() => router.back()}>
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
          <IconButton icon={X} onPress={() => router.back()} color="#6A7086" size={36} />
          <Title>Krankmeldung</Title>
        </Row>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Card className="mb-3 bg-brand-soft">
          <Row className="gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand/15">
              <Stethoscope size={20} strokeWidth={2} color="#6C5CE7" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-brand-ink">In zwei Schritten erledigt</Text>
              <Muted className="mt-0.5 text-[12px]">
                Zeitraum wählen, kurz begründen, absenden. Die Fehlzeiten werden automatisch als
                entschuldigt geführt, sobald die Schule bestätigt.
              </Muted>
            </View>
          </Row>
        </Card>

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
                  className={`flex-1 items-center rounded-2xl py-3 ${active ? 'bg-brand' : 'bg-line/50'}`}
                >
                  <Text className={`text-[13px] font-bold ${active ? 'text-white' : 'text-muted'}`}>
                    {offset === 0 ? 'Heute' : offset === 1 ? 'Morgen' : 'Übermorgen'}
                  </Text>
                  <Text className={`text-[11px] ${active ? 'text-white/80' : 'text-faint'}`}>
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
                className={`flex-1 items-center rounded-2xl py-3 ${days === value ? 'bg-brand' : 'bg-line/50'}`}
              >
                <Text className={`text-[15px] font-extrabold ${days === value ? 'text-white' : 'text-muted'}`}>
                  {value}
                </Text>
                <Text className={`text-[10px] ${days === value ? 'text-white/80' : 'text-faint'}`}>
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

        <Card className="mb-3">
          <Text className="text-[13px] font-bold text-ink">Grund (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="z. B. Erkältung mit Fieber"
            placeholderTextColor="#9CA2B6"
            multiline
            className="mt-2 min-h-[80px] rounded-2xl border border-line bg-bg p-3 text-[15px] text-ink"
          />
        </Card>

        {affected.length > 0 ? (
          <Card className="mb-3">
            <Row className="gap-2">
              <Info size={16} strokeWidth={2} color="#48A3FF" />
              <Text className="text-[13px] font-bold text-ink">
                Betroffen: {affected.length} Unterrichtsstunden
              </Text>
            </Row>
            <Row className="mt-2 flex-wrap gap-1.5">
              {Array.from(new Set(affected.map((lesson) => lesson.subject))).map((subject) => (
                <Chip key={subject} label={subject} color="#48A3FF" />
              ))}
            </Row>
            <Muted className="mt-2 text-[12px]">
              Denk an die Hausaufgaben dieser Fächer — Schulflow erinnert dich nach der Genesung.
            </Muted>
          </Card>
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
          {mutation.isPending ? <Spinner color="#FFFFFF" /> : null}
          <ButtonText>Krankmeldung absenden</ButtonText>
        </Button>
        <Muted className="mt-3 text-center text-[11px]">
          Sendet an das Modul „Krankmeldung“ der Schule. Im Demo-Modus wird nichts übertragen.
        </Muted>
      </ScrollView>
    </Screen>
  );
}
