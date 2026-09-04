/**
 * Postfach Screen (Briefe, Nachrichten, Schwarzes Brett) — Redesign mit satten Farbflächen.
 */
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  BookMarked,
  CheckCheck,
  Download,
  Inbox,
  Landmark,
  Mail,
  MailOpen,
  MapPin,
  MessagesSquare,
  Package,
  Paperclip,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import type { Letter, MessageThread, Tile } from '@/api/types';
import { useSession } from '@/state/session';
import { useConfirmLetter, useMarkThreadRead, useModuleActive, useSnapshot } from '@/data/queries';
import { tint } from '@/design/subjects';
import { useThemeColors } from '@/design/theme';
import { downloadStoredFile } from '@/api/downloads';
import { formatRelativeDay, formatTimeAgo } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import { hapticError, hapticLight, hapticSuccess } from '@/lib/haptics';
import {
  Card,
  Chip,
  ColorBlockCard,
  Divider,
  EmptyState,
  IconBadge,
  Muted,
  Pill,
  Row,
  Screen,
  SegmentedControl,
  Sheet,
  Skeleton,
  Title,
} from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Avatar, Spinner } from '@/ui/gluestack/feedback';
import { FadeInUp, PressableScale } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { ErrorBoundary } from '@/ui/error-boundary';
import { foregroundOn, radius, shadow } from '@/design/tokens';

type Tab = 'letters' | 'messages' | 'board';

/** Kategoriestil für Aushänge auf dem Schwarzen Brett */
function tileCategoryStyle(tile: Tile, colors: ReturnType<typeof useThemeColors>['colors']): {
  color: string;
  icon: LucideIcon;
  categoryLabel: string;
} {
  const text = `${tile.title} ${tile.content}`.toLowerCase();
  if (text.includes('bibliothek') || text.includes('bücherei') || text.includes('buch') || text.includes('lesen')) {
    return { color: colors.category.green.solid, icon: BookMarked, categoryLabel: 'Bibliothek' };
  }
  if (text.includes('ag') || text.includes('anmeldung') || text.includes('kurs') || text.includes('theater') || text.includes('chor') || text.includes('orchester')) {
    return { color: colors.category.purple.solid, icon: Sparkles, categoryLabel: 'AG & Freizeit' };
  }
  if (text.includes('fundsache') || text.includes('fundbüro') || text.includes('verloren') || text.includes('gefunden') || text.includes('jacke')) {
    return { color: colors.category.orange.solid, icon: Package, categoryLabel: 'Fundsachen' };
  }
  if (text.includes('sekretariat') || text.includes('schulleitung') || text.includes('rektor') || text.includes('büro') || text.includes('verwaltung') || text.includes('ordnung')) {
    return { color: colors.category.blue.solid, icon: Landmark, categoryLabel: 'Sekretariat' };
  }
  return { color: colors.category.sky.solid, icon: MapPin, categoryLabel: 'Aushang' };
}

export default function InboxScreen() {
  const { colors, isDark } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const reserve = useTabNavReserve();
  const [tab, setTab] = useState<Tab>('letters');
  const [letter, setLetter] = useState<Letter | null>(null);
  const [tile, setTile] = useState<Tile | null>(null);
  const router = useRouter();

  const pending = data?.letters.filter((item) => item.requiresConfirmation && !item.confirmed).length ?? 0;
  const unread = data?.threads.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0;

  const lettersOn = useModuleActive('letters');
  const messengerOn = useModuleActive('messenger');
  const boardOn = (data?.tiles.length ?? 1) > 0;

  const tabs: { value: Tab; label: string; badge?: number }[] = [
    ...(lettersOn ? [{ value: 'letters' as const, label: 'Briefe', badge: pending }] : []),
    ...(messengerOn ? [{ value: 'messages' as const, label: 'Nachrichten', badge: unread }] : []),
    ...(boardOn ? [{ value: 'board' as const, label: 'Brett' }] : []),
  ];

  const activeTab = tabs.some((option) => option.value === tab) ? tab : (tabs[0]?.value ?? tab);

  return (
    <Screen adaptive="content">
      <View className="px-4 pb-3 pt-2">
        <Title>Postfach</Title>
        <Muted className="mb-3">Elternbriefe, Nachrichten und Aushänge</Muted>
        {tabs.length > 1 ? (
          <SegmentedControl<Tab> options={tabs} value={activeTab} onChange={setTab} />
        ) : null}
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        {isLoading || !data ? (
          <View className="gap-3">
            <Skeleton className="h-24 rounded-[24px]" />
            <Skeleton className="h-24 rounded-[24px]" />
          </View>
        ) : tabs.length === 0 ? (
          <EmptyState
            icon={Inbox}
            iconColor={colors.accent.violet}
            title="Postfach nicht gebucht"
            hint="Deine Schule hat weder Elternbriefe, Nachrichten noch Aushänge freigeschaltet."
          />
        ) : activeTab === 'letters' ? (
          data.letters.length === 0 ? (
            <EmptyState icon={MailOpen} iconColor={colors.accent.violet} title="Keine Elternbriefe" />
          ) : (
            <View className="gap-2.5">
              {data.letters.map((item, index) => (
                <LetterRow
                  key={String(item.id)}
                  letter={item}
                  index={index}
                  onOpen={() => {
                    hapticLight();
                    setLetter(item);
                  }}
                />
              ))}
            </View>
          )
        ) : activeTab === 'messages' ? (
          data.threads.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              iconColor={colors.accent.violet}
              title="Keine Nachrichten"
              hint="Aktuell liegen keine Chat-Verläufe vor."
            />
          ) : (
            <View className="gap-2.5">
              {data.threads.map((item, index) => (
                <ThreadRow
                  key={String(item.subscriptionId)}
                  thread={item}
                  index={index}
                  onOpen={() => {
                    hapticLight();
                    router.push({
                      pathname: '/thread',
                      params: {
                        subscriptionId: String(item.subscriptionId),
                        threadId: String(item.id),
                        subject: item.subject,
                        sender: item.sender,
                        recipients: item.recipients ?? '',
                        preview: item.preview ?? '',
                      },
                    });
                  }}
                />
              ))}
            </View>
          )
        ) : data.tiles.length === 0 ? (
          <EmptyState icon={MapPin} iconColor={colors.warning} title="Keine Aushänge" />
        ) : (
          <View className="gap-3">
            {data.tiles.map((item, index) => {
              const cat = tileCategoryStyle(item, colors);
              return (
                <FadeInUp key={String(item.id)} delay={Math.min(index, 8) * 30}>
                  <PressableScale
                    onPress={() => {
                      hapticLight();
                      setTile(item);
                    }}
                    scale={0.98}
                    accessibilityRole="button"
                  >
                    <View
                      className="overflow-hidden rounded-[26px] p-4"
                      style={{
                        backgroundColor: tint(cat.color, isDark ? 0.22 : 0.12),
                        ...shadow.card,
                      }}
                    >
                      <Row className="gap-3.5">
                        <IconBadge
                          icon={cat.icon}
                          color={cat.color}
                          tone="solid"
                          size={46}
                          iconSize={22}
                        />
                        <View className="flex-1">
                          <Row className="justify-between gap-2">
                            <Text className="flex-1 text-[16px] font-extrabold text-ink" numberOfLines={2}>
                              {item.title}
                            </Text>
                            <Pill label={cat.categoryLabel} color={cat.color} tone="solid" />
                          </Row>
                          <Text className="mt-2 text-[13px] leading-5 text-ink/80" numberOfLines={3}>
                            {htmlToText(item.content)}
                          </Text>
                          {item.pinned ? (
                            <Row className="mt-2.5 gap-1.5">
                              <Pill label="Wichtig / Angepinnt" color={colors.warning} tone="solid" />
                            </Row>
                          ) : null}
                        </View>
                      </Row>
                    </View>
                  </PressableScale>
                </FadeInUp>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ErrorBoundary label="Brief" inline>
        <LetterSheet letter={letter} onClose={() => setLetter(null)} />
      </ErrorBoundary>

      <Sheet open={Boolean(tile)} onClose={() => setTile(null)} title={tile?.title}>
        {tile ? (
          <View className="gap-3">
            <Text className="text-[15px] leading-6 text-ink">{htmlToText(tile.content)}</Text>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Brief-Zeile (Farbfläche) */

function LetterRow({
  letter,
  index,
  onOpen,
}: {
  letter: Letter;
  index: number;
  onOpen: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const confirm = useConfirmLetter();
  const [justConfirmed, setJustConfirmed] = useState(false);

  const needsAction = letter.requiresConfirmation && !letter.confirmed && !justConfirmed;
  const isConfirmed = Boolean(letter.requiresConfirmation && (letter.confirmed || justConfirmed));
  const tone = needsAction
    ? colors.accent.amber
    : isConfirmed
      ? colors.success
      : colors.category.lavender.solid;

  const quickConfirm = () => {
    confirm.mutate(
      { letterId: String(letter.id), studentStatusId: letter.studentStatusId },
      {
        onSuccess: () => {
          hapticSuccess();
          setJustConfirmed(true);
        },
        onError: () => {
          hapticError();
          Alert.alert(
            'Bestätigung nicht möglich',
            'Der Server hat die Bestätigung abgelehnt. Prüfe, ob die Frist schon abgelaufen ist.',
          );
        },
      },
    );
  };

  const cardBg = tint(tone, isDark ? 0.22 : 0.12);

  return (
    <FadeInUp delay={Math.min(index, 8) * 30}>
      <View
        className="overflow-hidden rounded-[26px]"
        style={{
          backgroundColor: cardBg,
          ...shadow.card,
        }}
      >
        <PressableScale onPress={onOpen} scale={0.98} className="p-4" accessibilityRole="button">
          <Row className="gap-3.5">
            <IconBadge
              icon={needsAction ? AlertCircle : isConfirmed ? CheckCheck : Mail}
              color={tone}
              tone="solid"
              size={46}
              iconSize={22}
            />
            <View className="flex-1">
              <Row className="justify-between gap-2">
                <Text className="flex-1 text-[16px] font-extrabold leading-[19px] text-ink" numberOfLines={2}>
                  {letter.subject}
                </Text>
                <Muted className="self-start text-[11px] font-bold">
                  {formatTimeAgo(letter.createdAt)}
                </Muted>
              </Row>
              <Muted className="mt-1 text-[12.5px] leading-[17px] text-ink/75" numberOfLines={2}>
                {letter.content
                  ? excerpt(htmlToText(letter.content), 90)
                  : `${letter.sender ?? 'Schule'} · zum Lesen antippen`}
              </Muted>
              <Row className="mt-2.5 flex-wrap gap-2">
                <Pill label={letter.sender ?? 'Schule'} color={colors.charcoal} tone="tint" />
                {needsAction ? (
                  <Pill label="Bestätigung nötig" color={colors.accent.amber} tone="solid" />
                ) : null}
                {isConfirmed ? (
                  <Pill label="Kenntnisnahme bestätigt" color={colors.success} tone="solid" />
                ) : null}
              </Row>
            </View>
          </Row>
        </PressableScale>

        {needsAction ? (
          <View
            className="flex-row items-center justify-between gap-3 border-t border-black/5 bg-surface/80 px-4 py-2.5"
          >
            <Muted className="flex-1 text-[11.5px] font-medium">
              Kenntnisnahme direkt senden:
            </Muted>
            <Button size="sm" action="primary" disabled={confirm.isPending} onPress={quickConfirm}>
              {confirm.isPending ? <Spinner color={colors.on.amber} size="small" /> : null}
              <ButtonText>Bestätigen</ButtonText>
            </Button>
          </View>
        ) : null}
      </View>
    </FadeInUp>
  );
}

/* ------------------------------------------------------------------ Thread-Zeile */

function ThreadRow({ thread, index, onOpen }: { thread: MessageThread; index: number; onOpen: () => void }) {
  const { colors, isDark } = useThemeColors();
  const markRead = useMarkThreadRead();
  const unread = thread.unreadCount > 0;
  const tone = unread ? colors.accent.coral : colors.accent.violet;

  return (
    <FadeInUp delay={Math.min(index, 8) * 30}>
      <PressableScale
        onPress={() => {
          if (unread) markRead.mutate(String(thread.subscriptionId));
          onOpen();
        }}
        scale={0.98}
        accessibilityRole="button"
      >
        <View
          className="overflow-hidden rounded-[26px] p-4"
          style={{
            backgroundColor: tint(tone, isDark ? 0.22 : 0.12),
            ...shadow.card,
          }}
        >
          <Row className="gap-3.5">
            <Avatar
              name={thread.sender || 'Schule'}
              size={46}
              color={unread ? colors.accent.coral : colors.accent.violet}
            />
            <View className="flex-1">
              <Row className="justify-between">
                <Text
                  className="flex-1 text-[16px] font-extrabold text-ink"
                  numberOfLines={1}
                >
                  {thread.sender || 'Schule'}
                </Text>
                <Muted className="text-[11px] font-bold">{formatTimeAgo(thread.lastMessageAt)}</Muted>
              </Row>
              <Text className={`mt-0.5 text-[14px] font-bold text-ink ${unread ? 'font-extrabold' : ''}`} numberOfLines={1}>
                {thread.subject}
              </Text>
              {thread.preview ? (
                <Muted className="mt-1 text-[12px] leading-4 text-ink/70" numberOfLines={2}>
                  {thread.preview}
                </Muted>
              ) : null}
              <Row className="mt-2.5 gap-2">
                {unread ? (
                  <Pill label={`${thread.unreadCount} neu`} color={colors.accent.coral} tone="solid" />
                ) : null}
                <Pill label="Nachricht" color={colors.accent.violet} tone="tint" />
              </Row>
            </View>
          </Row>
        </View>
      </PressableScale>
    </FadeInUp>
  );
}

/* ------------------------------------------------------------------ Brief-Detail */

function LetterSheet({ letter, onClose }: { letter: Letter | null; onClose: () => void }) {
  const { colors } = useThemeColors();
  const confirm = useConfirmLetter();
  const { api } = useSession.getState();
  const isDemo = useSession((state) => state.status !== 'connected');
  const [content, setContent] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Letter['attachments']>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const [localConfirmed, setLocalConfirmed] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const open = Boolean(letter);

  React.useEffect(() => {
    if (!letter) return;
    setAnswers({});
    setLocalConfirmed(false);
    if (isDemo || loadedId === String(letter.id)) return;
    const id = String(letter.id);
    setLoadedId(id);
    void api
      .letterDetail(letter.id)
      .then((detail) => {
        setContent(detail?.content ?? '');
        setAttachments(detail?.attachments ?? []);
      })
      .catch(() => setContent(''));
  }, [letter?.id, isDemo]);

  const needsAction = letter?.requiresConfirmation && !letter?.confirmed && !localConfirmed;

  const download = async (file: NonNullable<Letter['attachments']>[number]) => {
    try {
      setDownloading(String(file.id));
      const result = await downloadStoredFile(api, file.file);
      hapticSuccess();
      if (result.mode === 'unknown') {
        Alert.alert(
          'Anhang geladen — aber verschlüsselt',
          'Diese Datei konnte nicht automatisch entschlüsselt werden. Sie liegt im App-Cache.',
        );
      }
    } catch {
      hapticError();
      Alert.alert('Download fehlgeschlagen', 'Prüfe deine Verbindung und versuche es erneut.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={letter?.subject}>
      {letter ? (
        <View className="gap-3">
          <Row className="gap-2">
            <Pill label={letter.sender ?? 'Schule'} color={colors.accent.violet} tone="solid" />
            <Muted className="text-[11px]">{formatTimeAgo(letter.createdAt)}</Muted>
          </Row>

          {letter.content || content ? (
            <Text className="text-[15px] leading-6 text-ink">{htmlToText(letter.content || content || '')}</Text>
          ) : (
            <View className="gap-1">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </View>
          )}

          {/* Umfrage */}
          {letter.questions && letter.questions.length > 0 ? (
            <Card padded={false}>
              <Text className="px-4 pt-3 text-[13px] font-bold text-ink">Umfrage</Text>
              {letter.questions.map((question, qIndex) => (
                <View key={String(question.id)}>
                  <Divider className="ml-4" />
                  <View className="px-4 py-3">
                    <Text className="text-[14px] font-semibold text-ink">{question.question}</Text>
                    <View className="mt-2 gap-1.5">
                      {question.options?.map((option) => {
                        const active = answers[String(question.id)] === option;
                        return (
                          <Pressable
                            key={String(option) + qIndex}
                            onPress={() => {
                              hapticLight();
                              setAnswers((prev) => ({ ...prev, [String(question.id)]: option }));
                            }}
                            className={`rounded-xl border px-3 py-2.5 hover:opacity-85 active:opacity-70 ${
                              active ? 'border-accent-amber bg-accent-amber/15' : 'border-line bg-canvas'
                            }`}
                          >
                            <Text className={`text-[13px] ${active ? 'font-bold text-on-amber' : 'text-ink'}`}>
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ))}
              {letter.answerDeadline ? (
                <Muted className="px-4 pb-3">Frist: {formatRelativeDay(letter.answerDeadline.slice(0, 10))}</Muted>
              ) : null}
            </Card>
          ) : null}

          {/* Anhänge */}
          {attachments && attachments.length > 0 ? (
            <Card padded={false}>
              {attachments.map((file, index) => (
                <View key={String(file.id)}>
                  <Pressable onPress={() => void download(file)} className="hover:bg-line/30 active:bg-line/50">
                    <Row className="gap-3 px-4 py-3">
                      <Paperclip size={18} strokeWidth={2} color={colors.accent.violet} />
                      <Text className="flex-1 text-[14px] text-ink">{file.name}</Text>
                      {downloading === String(file.id) ? (
                        <Spinner />
                      ) : (
                        <Download size={18} strokeWidth={2} color={colors.faint} />
                      )}
                    </Row>
                  </Pressable>
                  {index < attachments.length - 1 ? <Divider className="ml-12" /> : null}
                </View>
              ))}
            </Card>
          ) : null}

          {needsAction ? (
            <Button
              action="primary"
              size="lg"
              block
              onPress={() => {
                confirm.mutate(
                  { letterId: String(letter.id), studentStatusId: letter.studentStatusId },
                  {
                    onSuccess: () => {
                      hapticSuccess();
                      setLocalConfirmed(true);
                    },
                    onError: () => {
                      hapticError();
                      Alert.alert(
                        'Bestätigung nicht möglich',
                        isDemo
                          ? 'Im Demo-Modus wird nichts an die Schule gesendet.'
                          : 'Der Server hat die Bestätigung abgelehnt. Prüfe, ob die Frist schon abgelaufen ist.',
                      );
                    },
                  },
                );
              }}
            >
              {confirm.isPending ? <Spinner color={colors.on.amber} /> : null}
              <ButtonText>Kenntnisnahme bestätigen</ButtonText>
            </Button>
          ) : (
            <Row className="justify-center gap-2 rounded-2xl bg-success/10 py-3">
              <CheckCheck size={18} strokeWidth={2.2} color={colors.success} />
              <Text className="text-[14px] font-semibold text-success">
                {letter.confirmed || localConfirmed ? 'Bestätigt' : 'Keine Bestätigung nötig'}
              </Text>
            </Row>
          )}
        </View>
      ) : null}
    </Sheet>
  );
}
