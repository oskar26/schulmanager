import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useSnapshot } from '@/data/queries';
import { formatDay } from '@/lib/date';
import { Card, Chip, Divider, EmptyState, IconButton, Ionicons, Muted, Row, Screen, SectionHeader, Title } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';

/** Deutsche Währungsformatierung aus den Dezimal-Strings der API. */
const eur = (value: number | null | undefined): string =>
  value == null
    ? '–'
    : value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export default function PaymentsScreen() {
  const router = useRouter();
  const { data } = useSnapshot();
  const invoices = data?.invoices ?? [];

  const open = invoices.filter((invoice) => !invoice.paid);
  const openSum = open.reduce((sum, invoice) => sum + Math.max(0, (invoice.sum ?? 0) - (invoice.paidSum ?? 0)), 0);

  return (
    <Screen>
      <Row className="px-4 pb-2 pt-2">
        <IconButton icon="chevron-back" onPress={() => router.back()} size={36} />
        <View className="ml-2 flex-1">
          <Title>Zahlungen</Title>
          <Muted>Rechnungen der Schule — Beträge sind Angaben der Schule</Muted>
        </View>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {open.length > 0 ? (
          <Card className="mb-3 border border-warning/40">
            <Row className="justify-between">
              <View>
                <Text className="text-[13px] font-bold text-ink">Offener Betrag</Text>
                <Muted className="text-[11px]">{open.length} {open.length === 1 ? 'Rechnung' : 'Rechnungen'}</Muted>
              </View>
              <Text className="text-[24px] font-extrabold text-warning">{eur(openSum)}</Text>
            </Row>
            <Muted className="mt-2 text-[12px]">
              Bezahlt wird direkt bei der Schule (Überweisung mit dem Verwendungszweck der Rechnung).
            </Muted>
          </Card>
        ) : null}

        {invoices.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="Keine Rechnungen"
            hint="Entweder ist alles bezahlt — oder das Modul „Zahlungen“ ist nicht gebucht."
          />
        ) : (
          invoices.map((invoice, index) => (
            <FadeInUp key={String(invoice.id)} delay={Math.min(index, 8) * 30}>
              <Card className="mb-2" padded={false}>
                <Row className="justify-between px-4 pb-2 pt-3.5">
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-ink">
                      {invoice.items[0]?.name ?? 'Rechnung'}
                      {invoice.items.length > 1 ? ` (+${invoice.items.length - 1})` : ''}
                    </Text>
                    <Muted className="mt-0.5 text-[12px]">
                      {invoice.date ? `vom ${formatDay(invoice.date)}` : ''}
                      {invoice.dueDate ? ` · fällig ${formatDay(invoice.dueDate)}` : ''}
                    </Muted>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-[16px] font-extrabold ${invoice.paid ? 'text-success' : 'text-ink'}`}
                    >
                      {eur(invoice.sum)}
                    </Text>
                    {invoice.paid ? (
                      <Chip label="bezahlt" color="#22B07A" />
                    ) : (
                      <Chip label="offen" color="#E8981E" tone="solid" />
                    )}
                  </View>
                </Row>
                {invoice.number != null || invoice.items.length > 0 ? (
                  <View className="border-t border-line px-4 py-2.5">
                    {invoice.number != null ? (
                      <Row className="gap-1.5">
                        <Ionicons name="pricetag-outline" size={13} color="#9CA2B6" />
                        <Muted className="flex-1 text-[11px]">
                          Verwendungszweck: {invoice.number}
                          {data?.student?.id != null ? ` / ${data.student.id}` : ''}
                        </Muted>
                      </Row>
                    ) : null}
                    {invoice.items.map((item) => (
                      <Row key={String(item.id)} className="justify-between py-0.5">
                        <Text className="flex-1 text-[12px] text-muted">
                          {item.paid ? '✓ ' : '· '}
                          {item.name}
                        </Text>
                        <Text className="text-[12px] font-semibold text-muted">{eur(item.amount)}</Text>
                      </Row>
                    ))}
                  </View>
                ) : null}
              </Card>
            </FadeInUp>
          ))
        )}

        <SectionHeader title="Hinweis" emoji="ℹ️" />
        <Card>
          <Muted className="text-[12px] leading-5">
            Schulflow liest die Rechnungen nur. Bezahlt wird wie bisher direkt an die Schule — Überweisung mit dem
            Verwendungszweck oben.
          </Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}
