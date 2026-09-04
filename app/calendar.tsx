/**
 * Kalender Screen (Termine, Ferien und Klassenarbeiten).
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, ChevronLeft, ChevronRight, Link2 } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { useSession } from '@/state/session';
import { shareIcalUrl } from '@/api/downloads';
import { tint } from '@/design/subjects';
import {
  MONTHS, WEEKDAYS_SHORT, addDays, daysUntil, formatRelativeDay, startOfWeek, toISO,
} from '@/lib/date';
import { htmlToText } from '@/lib/html';
import {
  Card,
  Chip,
  ColorBlockCard,
  EmptyState,
  IconBadge,
  IconButton,
  Muted,
  Pill,
  Row,
  Screen,
  SegmentedControl,
  Sheet,
  Title,
} from '@/ui/primitives';
import { FadeInUp, PressableScale } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';
import { shadow } from '@/design/tokens';

type Mode = 'list' | 'month';

export default function CalendarScreen() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { data } = useSnapshot();
  const [mode, setMode] = useState<Mode>('list');
  const [monthOffset, setMonthOffset] = useState(0);
  type Entry = {
    id: string; date: string; title: string; time: string; color: string;
    kind: string; description?: string; location?: string;
  };
  const [selected, setSelected] = useState<Entry | null>(null);

  const events = data?.events ?? [];
  const exams = data?.exams ?? [];

  const merged = useMemo<Entry[]>(
    () =>
      [
        ...events.map((event) => ({
          id: String(event.id),
          date: event.start.slice(0, 10),
          title: event.title,
          time: event.allDay ? 'ganztägig' : new Date(event.start).toTimeString().slice(0, 5),
          color: event.color ?? (event.isHoliday ? colors.accent.amber : colors.accent.violet),
          kind: event.isHoliday ? 'Ferien' : (event.categoryName ?? 'Termin'),
          description: event.description ?? undefined,
          location: event.location ?? undefined,
        })),
        ...exams.map((exam) => ({
          id: `exam-${exam.id}`,
          date: exam.date,
          title: `${exam.subject}: ${exam.type ?? 'Arbeit'}`,
          time: exam.start ?? '',
          color: colors.danger,
          kind: 'Leistungsnachweis',
          description: exam.comment,
          location: undefined as string | undefined,
        })),
      ]
        .filter((entry) => daysUntil(entry.date) >= -7)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, exams, colors],
  );

  const monthDate = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }, [monthOffset]);

  const grid = useMemo(() => {
    const first = startOfWeek(monthDate);
    return Array.from({ length: 42 }, (_, index) => toISO(addDays(first, index)));
  }, [monthDate]);

  return (
    <Screen adaptive="content">
      <Row className="px-4 pb-2 pt-2">
        <IconButton icon={ChevronLeft} onPress={() => router.back()} size={36} />
        <View className="ml-2 flex-1">
          <Title>Kalender</Title>
          <Muted className="text-[13px] font-medium">Termine, Ferien und Arbeiten</Muted>
        </View>
        <IconButton
          icon={Link2}
          size={36}
          color={colors.accent.violet}
          onPress={async () => {
            try {
              const { api } = useSession.getState();
              const url = await api.icalToken();
              if (url) await shareIcalUrl(url);
            } catch {
              /* Im Demo-Modus gibt es keinen echten iCal-Link */
            }
          }}
        />
      </Row>

      <View className="px-4 pb-3">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'list', label: 'Liste' },
            { value: 'month', label: 'Monat' },
          ]}
        />
      </View>

      {mode === 'month' ? (
        <View className="mb-3 px-4">
          <Row className="justify-between pb-2">
            <IconButton icon={ChevronLeft} size={32} onPress={() => setMonthOffset((v) => v - 1)} />
            <Text className="text-[16px] font-extrabold text-ink">
              {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
            </Text>
            <IconButton icon={ChevronRight} size={32} onPress={() => setMonthOffset((v) => v + 1)} />
          </Row>
          <Row>
            {WEEKDAYS_SHORT.map((day) => (
              <Text key={day} className="flex-1 text-center text-[11px] font-extrabold text-faint">
                {day}
              </Text>
            ))}
          </Row>
          <View className="mt-1 flex-row flex-wrap">
            {grid.map((iso) => {
              const dayEvents = merged.filter((entry) => entry.date === iso);
              const inMonth = new Date(iso).getMonth() === monthDate.getMonth();
              const isToday = iso === toISO(new Date());
              return (
                <Pressable
                  key={iso}
                  onPress={() => dayEvents[0] && setSelected(dayEvents[0])}
                  style={{ width: `${100 / 7}%` }}
                  className="aspect-square items-center justify-center p-0.5 hover:opacity-85 active:opacity-70"
                >
                  <View
                    className={`h-full w-full items-center justify-center rounded-2xl ${
                      isToday ? 'bg-accent-amber' : dayEvents.length > 0 ? 'bg-surface' : ''
                    }`}
                    style={dayEvents.length > 0 || isToday ? shadow.card : undefined}
                  >
                    <Text
                      className={`text-[12px] font-extrabold ${
                        isToday ? 'text-on-amber' : inMonth ? 'text-ink' : 'text-faint'
                      }`}
                    >
                      {new Date(iso).getDate()}
                    </Text>
                    <Row className="mt-0.5 gap-0.5">
                      {dayEvents.slice(0, 3).map((entry) => (
                        <View
                          key={entry.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: isToday ? colors.on.amber : entry.color }}
                        />
                      ))}
                    </Row>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {merged.length === 0 ? (
          <EmptyState icon={CalendarDays} iconColor={colors.accent.violet} title="Keine Termine" />
        ) : (
          <View className="gap-2.5">
            {merged.map((entry, index) => (
              <FadeInUp key={entry.id} delay={index * 25}>
                <PressableScale
                  onPress={() => setSelected(entry)}
                  scale={0.98}
                  accessibilityRole="button"
                >
                  <View
                    className="overflow-hidden rounded-[24px] p-3.5"
                    style={{
                      backgroundColor: tint(entry.color, isDark ? 0.22 : 0.12),
                      ...shadow.card,
                    }}
                  >
                    <Row className="gap-3.5">
                      <View
                        className="w-14 items-center justify-center rounded-[18px] py-2"
                        style={{ backgroundColor: entry.color }}
                      >
                        <Text className="text-[18px] font-extrabold text-white">
                          {new Date(entry.date).getDate()}
                        </Text>
                        <Text className="text-[10px] font-extrabold uppercase text-white/90">
                          {MONTHS[new Date(entry.date).getMonth()].slice(0, 3)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-extrabold leading-[18px] text-ink" numberOfLines={2}>
                          {entry.title}
                        </Text>
                        <Muted className="mt-0.5 text-[12px] font-medium">
                          {formatRelativeDay(entry.date)}
                          {entry.time ? ` · ${entry.time}` : ''}
                          {entry.location ? ` · ${entry.location}` : ''}
                        </Muted>
                        <Row className="mt-2">
                          <Pill label={entry.kind} color={entry.color} tone="solid" />
                        </Row>
                      </View>
                    </Row>
                  </View>
                </PressableScale>
              </FadeInUp>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title}>
        {selected ? (
          <View className="gap-3">
            <Row className="gap-2">
              <Pill label={selected.kind} color={selected.color} tone="solid" />
              <Muted className="font-bold">{formatRelativeDay(selected.date)}</Muted>
            </Row>
            {selected.description ? (
              <Text className="text-[15px] leading-6 text-ink">{htmlToText(selected.description)}</Text>
            ) : (
              <Muted>Keine weiteren Angaben.</Muted>
            )}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
