import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Search, X } from 'lucide-react-native';

import { de } from '@/features/grades/calculator';
import { useModuleActive, useSnapshot } from '@/data/queries';
import { subjectStyle, tint } from '@/design/subjects';
import { shadow } from '@/design/tokens';
import { formatRelativeDay } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import { Card, EmptyState, IconButton, Muted, Row, Screen, Title } from '@/ui/primitives';
import { FadeInUp, PressableScale } from '@/ui/motion';
import { useThemeColors } from '@/design/theme';
import { isMainTabHref, useSafeBack } from '@/ui/navigation';

interface Hit {
  id: string;
  kind: 'Stunde' | 'Hausaufgabe' | 'Arbeit' | 'Note' | 'Brief' | 'Nachricht' | 'Termin' | 'Aushang';
  title: string;
  subtitle: string;
  color: string;
  href?: string;
}

export default function SearchScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const dismiss = useSafeBack();
  const { data } = useSnapshot();
  const gradesOn = useModuleActive('grades');
  const [query, setQuery] = useState('');

  const hits = useMemo<Hit[]>(() => {
    if (!data || query.trim().length < 2) return [];
    const needle = query.trim().toLowerCase();
    const match = (...values: (string | undefined | null)[]) =>
      values.some((value) => value?.toLowerCase().includes(needle));

    const out: Hit[] = [];

    data.lessons
      .filter((lesson) => match(lesson.subject, lesson.teacher, lesson.room))
      .slice(0, 6)
      .forEach((lesson) =>
        out.push({
          id: `l-${lesson.id}`,
          kind: 'Stunde',
          title: `${lesson.subject} · ${lesson.hour}. Stunde`,
          subtitle: `${formatRelativeDay(lesson.date)} · ${lesson.start} · ${lesson.room ?? ''}`,
          color: subjectStyle(lesson.subject).color,
          href: '/timetable',
        }),
      );

    data.homework
      .filter((item) => match(item.subject, item.text, item.teacher))
      .forEach((item) =>
        out.push({
          id: `h-${item.id}`,
          kind: 'Hausaufgabe',
          title: `${item.subject}: ${excerpt(item.text, 50)}`,
          subtitle: `fällig ${formatRelativeDay(item.due)}`,
          color: subjectStyle(item.subject).color,
          href: '/tasks',
        }),
      );

    data.exams
      .filter((exam) => match(exam.subject, exam.type, exam.comment))
      .forEach((exam) =>
        out.push({
          id: `e-${exam.id}`,
          kind: 'Arbeit',
          title: `${exam.subject} · ${exam.type ?? 'Arbeit'}`,
          subtitle: formatRelativeDay(exam.date),
          color: colors.danger,
          href: '/tasks',
        }),
      );

    // Ein verstecktes Noten-Modul liefert keine Treffer mit einem nicht
    // erreichbaren /grades-Ziel. Das ergänzt die href:null-Sicherung der Tabs.
    if (gradesOn) {
      data.subjects
        .filter((subject) => match(subject.subject))
        .forEach((subject) =>
          out.push({
            id: `g-${subject.subjectId}`,
            kind: 'Note',
            title: `${subject.subject} · Schnitt ${subject.average != null ? de(subject.average) : '–'}`,
            subtitle: `${subject.grades.length} Bewertungen`,
            color: subjectStyle(subject.subject).color,
            href: '/grades',
          }),
        );
    }

    data.letters
      .filter((letter) => match(letter.subject, htmlToText(letter.content), letter.sender))
      .forEach((letter) =>
        out.push({
          id: `b-${letter.id}`,
          kind: 'Brief',
          title: letter.subject,
          subtitle: letter.sender ?? 'Schule',
          color: colors.accent.violet,
          href: '/inbox',
        }),
      );

    data.threads
      .filter((thread) => match(thread.subject, thread.sender, thread.preview))
      .forEach((thread) =>
        out.push({
          id: `t-${thread.id}`,
          kind: 'Nachricht',
          title: thread.subject,
          subtitle: thread.sender,
          color: colors.accent.violet,
          href: '/inbox',
        }),
      );

    data.events
      .filter((event) => match(event.title, event.location, event.categoryName))
      .forEach((event) =>
        out.push({
          id: `c-${event.id}`,
          kind: 'Termin',
          title: event.title,
          subtitle: formatRelativeDay(event.start.slice(0, 10)),
          color: event.color ?? colors.accent.violet,
          href: '/calendar',
        }),
      );

    data.tiles
      .filter((tile) => match(tile.title, htmlToText(tile.content)))
      .forEach((tile) =>
        out.push({
          id: `p-${tile.id}`,
          kind: 'Aushang',
          title: tile.title,
          subtitle: excerpt(htmlToText(tile.content), 50),
          color: colors.success,
          href: '/inbox',
        }),
      );

    return out.slice(0, 40);
  }, [colors, data, gradesOn, query]);

  const suggestions = ['Mathe', 'Sport', 'Klassenarbeit', 'Elternabend', 'Hausaufgabe'];

  return (
    <Screen adaptive="narrow">
      <Row className="gap-2 px-4 pb-3 pt-2">
        <IconButton icon={X} onPress={() => dismiss()} size={36} />
        <View className="flex-1 flex-row items-center rounded-[20px] bg-surface px-3" style={shadow.card}>
          <Search size={17} strokeWidth={2} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Fächer, Aufgaben, Briefe, Termine …"
            placeholderTextColor={colors.faint}
            className="ml-2 h-11 flex-1 text-[15px] text-ink"
          />
        </View>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {query.trim().length < 2 ? (
          <>
            <Title className="mb-2 text-[16px]">Vorschläge</Title>
            <Row className="flex-wrap gap-2">
              {suggestions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setQuery(item)}
                  className="rounded-full bg-line/60 px-3 py-2 hover:bg-line active:opacity-70"
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text className="text-[13px] font-semibold text-muted">{item}</Text>
                </Pressable>
              ))}
            </Row>
            <EmptyState art="search" iconColor={colors.accent.violet} title="Alles auf einmal durchsuchen" hint="Stundenplan, Aufgaben, Noten, Briefe, Nachrichten, Termine und Aushänge." />
          </>
        ) : hits.length === 0 ? (
          <EmptyState art="search" iconColor={colors.danger} title="Nichts gefunden" hint={`Keine Treffer für „${query}".`} />
        ) : (
          hits.map((hit, index) => (
            <FadeInUp key={hit.id} delay={Math.min(index, 8) * 30}>
              <PressableScale
                onPress={() => {
                  if (!hit.href) return;
                  // Tab-Treffer aktivieren die bereits gemountete Tab-Route;
                  // Detailseiten bleiben echte Push-Routen.
                  if (isMainTabHref(hit.href)) router.navigate(hit.href as never);
                  else router.push(hit.href as never);
                }}
                className="mb-2"
                scale={0.97}
                hoverScale={1.008}
                accessibilityRole="button"
                accessibilityLabel={`${hit.kind}: ${hit.title}`}
              >
              <Card>
                <Row className="gap-3">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: tint(hit.color, 0.16) }}
                  >
                    <Text className="text-[10px] font-bold" style={{ color: hit.color }}>
                      {hit.kind.slice(0, 2)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold leading-[17px] text-ink" numberOfLines={2}>
                      {hit.title}
                    </Text>
                    <Muted className="text-[12px]" numberOfLines={1}>
                      {hit.kind} · {hit.subtitle}
                    </Muted>
                  </View>
                  <ChevronRight size={15} strokeWidth={2} color={colors.faint} />
                </Row>
              </Card>
              </PressableScale>
            </FadeInUp>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
