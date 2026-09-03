import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useSnapshot } from '@/data/queries';
import { WEEKDAYS } from '@/lib/date';
import { Card, Chip, EmptyState, IconButton, Ionicons, Muted, Row, Screen, SectionHeader, Title } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';

/**
 * Ganztag/Betreuung. Die API liefert Familien bewusst nur gestrippte Angebote:
 * genutzt wird der Wochentag (JS-Nummerierung: So = 0) + Zeitraum, soweit vorhanden.
 */
export default function AlldayScreen() {
  const router = useRouter();
  const { data } = useSnapshot();
  const offers = data?.alldayOffers ?? [];

  // JS-Tag 1 (Mo) … 5 (Fr) → in der Schulreihenfolge anzeigen.
  const byWeekday = new Map<number, typeof offers>();
  for (const offer of offers) {
    if (offer.weekday == null) continue;
    const list = byWeekday.get(offer.weekday) ?? [];
    list.push(offer);
    byWeekday.set(offer.weekday, list);
  }

  return (
    <Screen>
      <Row className="px-4 pb-2 pt-2">
        <IconButton icon="close" onPress={() => router.back()} size={36} />
        <View className="ml-2 flex-1">
          <Title>Ganztag & Betreuung</Title>
          <Muted>Wann dein Kind in der Betreuung ist</Muted>
        </View>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {offers.length === 0 ? (
          <EmptyState
            emoji="🧩"
            title="Keine Betreuungszeiten"
            hint="Entweder nimmt dein Kind nicht am Ganztag teil — oder das Modul ist nicht gebucht."
          />
        ) : (
          [1, 2, 3, 4, 5, 6, 0].map((weekday, index) => {
            const dayOffers = byWeekday.get(weekday);
            if (!dayOffers || dayOffers.length === 0) return null;
            return (
              <FadeInUp key={weekday} delay={index * 30}>
                <Card className="mb-2">
                  <Row className="justify-between">
                    <Text className="text-[15px] font-bold text-ink">{WEEKDAYS[(weekday + 6) % 7]}</Text>
                    <Chip
                      label={dayOffers.length > 1 ? `${dayOffers.length} Angebote` : 'gebucht'}
                      color="#8A7CFF"
                    />
                  </Row>
                  <Row className="mt-2 gap-1.5">
                    <Ionicons name="time-outline" size={14} color="#6A7086" />
                    <Text className="flex-1 text-[13px] text-muted">
                      {dayOffers
                        .map((offer) =>
                          offer.startTime && offer.endTime
                            ? `${offer.startTime.slice(0, 5)}–${offer.endTime.slice(0, 5)}`
                            : 'ganztägig laut Schule',
                        )
                        .join(' · ')}
                    </Text>
                  </Row>
                </Card>
              </FadeInUp>
            );
          })
        )}

        <SectionHeader title="Nachricht an die Betreuung" emoji="✉️" />
        <Card>
          <Muted className="text-[12px] leading-5">
            Kurzmitteilungen an das Betreuungsteam ({(data?.alldayNotes ?? []).length} vorhanden) plane ich in einem
            der nächsten Updates ein — die Schnittstelle dafür ist schon vorbereitet.
          </Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}
