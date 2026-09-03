import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Clock, Send, X, XCircle } from 'lucide-react-native';

import { useRequestExemption, useSnapshot } from '@/data/queries';
import { addDays, formatDay, formatLongDay, toISO } from '@/lib/date';
import { Card, Chip, Divider, IconButton, Muted, Row, Screen, Title } from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner } from '@/ui/gluestack/feedback';

export default function ExemptionScreen() {
  const router = useRouter();
  const { data } = useSnapshot();
  const mutation = useRequestExemption();

  const [start, setStart] = useState(toISO(addDays(new Date(), 7)));
  const [days, setDays] = useState(1);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const end = toISO(addDays(new Date(start), days - 1));
  const existing = data?.exemptions ?? [];

  if (sent) {
    return (
      <Screen adaptive="narrow">
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
            <Send color="#6C5CE7" size={32} strokeWidth={2} />
          </View>
          <Title>Antrag gestellt</Title>
          <Muted className="text-center">
            Die Schule entscheidet über die Beurlaubung. Du bekommst eine Benachrichtigung, sobald eine
            Antwort da ist.
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
      <Row className="px-4 pb-2 pt-2">
        <IconButton icon={X} onPress={() => router.back()} color="#6A7086" size={36} />
        <Title className="ml-2">Beurlaubung</Title>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Card className="mb-3">
          <Text className="text-[13px] font-bold text-ink">Zeitraum</Text>
          <Row className="mt-2 gap-2">
            {[3, 7, 14, 21].map((offset) => {
              const iso = toISO(addDays(new Date(), offset));
              const active = start === iso;
              return (
                <Pressable
                  key={offset}
                  onPress={() => setStart(iso)}
                  className={`flex-1 items-center rounded-2xl py-2.5 ${active ? 'bg-brand' : 'bg-line/50'}`}
                >
                  <Text className={`text-[12px] font-bold ${active ? 'text-white' : 'text-muted'}`}>
                    in {offset} T.
                  </Text>
                </Pressable>
              );
            })}
          </Row>

          <Row className="mt-3 gap-2">
            {[1, 2, 3, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => setDays(value)}
                className={`flex-1 items-center rounded-2xl py-2.5 ${days === value ? 'bg-brand' : 'bg-line/50'}`}
              >
                <Text className={`text-[13px] font-bold ${days === value ? 'text-white' : 'text-muted'}`}>
                  {value} {value === 1 ? 'Tag' : 'Tage'}
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
          <Text className="text-[13px] font-bold text-ink">Begründung *</Text>
          <Muted className="text-[11px]">Die Schule verlangt hier eine Angabe.</Muted>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="z. B. Familienfeier, Facharzttermin, Wettkampf"
            placeholderTextColor="#9CA2B6"
            multiline
            className="mt-2 min-h-[90px] rounded-2xl border border-line bg-bg p-3 text-[15px] text-ink"
          />
        </Card>

        {existing.length > 0 ? (
          <Card className="mb-3" padded={false}>
            <Text className="px-4 pt-3 text-[13px] font-bold text-ink">Bisherige Anträge</Text>
            {existing.map((entry, index) => (
              <View key={String(entry.id)}>
                <Row className="gap-3 px-4 py-3">
                  {entry.granted === null ? (
                    <Clock size={18} strokeWidth={2} color="#E8981E" />
                  ) : entry.granted ? (
                    <CheckCircle2 size={18} strokeWidth={2} color="#22B07A" />
                  ) : (
                    <XCircle size={18} strokeWidth={2} color="#E24848" />
                  )}
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-ink">{entry.comment ?? 'Beurlaubung'}</Text>
                    <Muted className="text-[11px]">
                      {formatDay(entry.startDate)}
                      {entry.endDate !== entry.startDate ? ` – ${formatDay(entry.endDate)}` : ''}
                    </Muted>
                    {entry.feedback ? <Muted className="mt-0.5 text-[11px]">„{entry.feedback}"</Muted> : null}
                  </View>
                  <Chip
                    label={entry.granted === null ? 'offen' : entry.granted ? 'genehmigt' : 'abgelehnt'}
                    color={entry.granted === null ? '#E8981E' : entry.granted ? '#22B07A' : '#E24848'}
                  />
                </Row>
                {index < existing.length - 1 ? <Divider className="ml-12" /> : null}
              </View>
            ))}
            <View className="h-2" />
          </Card>
        ) : null}

        <Button
          action="primary"
          size="lg"
          block
          disabled={comment.trim().length === 0}
          onPress={() =>
            mutation.mutate({ startDate: start, endDate: end, comment }, { onSuccess: () => setSent(true) })
          }
        >
          {mutation.isPending ? <Spinner color="#FFFFFF" /> : null}
          <ButtonText>Antrag absenden</ButtonText>
        </Button>
      </ScrollView>
    </Screen>
  );
}
