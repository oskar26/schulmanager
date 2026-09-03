import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  CheckCheck,
  Download,
  Inbox,
  MailOpen,
  MapPin,
  MessagesSquare,
  Paperclip,
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
import { Card, Chip, Divider, EmptyState, Muted, Row, Screen, SectionHeader, SegmentedControl, Sheet, Skeleton, Title } from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Avatar, Spinner } from '@/ui/gluestack/feedback';
import { FadeInUp } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { ErrorBoundary } from '@/ui/error-boundary';

type Tab = 'letters' | 'messages' | 'board';

export default function InboxScreen() {
  const { colors } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const reserve = useTabNavReserve();
  const [tab, setTab] = useState<Tab>('letters');
  const [letter, setLetter] = useState<Letter | null>(null);
  const [tile, setTile] = useState<Tile | null>(null);
  const router = useRouter();

  const pending = data?.letters.filter((item) => item.requiresConfirmation && !item.confirmed).length ?? 0;
  const unread = data?.threads.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0;

  // Sparten nur bei gebuchtem Modul — wie das offizielle Menü der Schule.
  const lettersOn = useModuleActive('letters');
  const messengerOn = useModuleActive('messenger');
  const boardOn = (data?.tiles.length ?? 1) > 0;

  const tabs: { value: Tab; label: string; badge?: number }[] = [
    ...(lettersOn ? [{ value: 'letters' as const, label: 'Briefe', badge: pending }] : []),
    ...(messengerOn ? [{ value: 'messages' as const, label: 'Nachrichten', badge: unread }] : []),
    ...(boardOn ? [{ value: 'board' as const, label: 'Brett' }] : []),
  ];

  // Aktive Sparte muss immer eine sichtbare sein (z. B. nach Modulwechsel).
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
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
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
            data.letters.map((item, index) => (
              <LetterRow
                key={String(item.id)}
                letter={item}
                index={index}
                onOpen={() => {
                  hapticLight();
                  setLetter(item);
                }}
              />
            ))
          )
        ) : activeTab === 'messages' ? (
          data.threads.length === 0 ? (
            <EmptyState icon={MessagesSquare} iconColor={colors.accent.violet} title="Keine Nachrichten" hint="Das Modul „Nachrichten“ ist evtl. nicht gebucht." />
          ) : (
            data.threads.map((item, index) => (
              <ThreadRow key={String(item.subscriptionId)} thread={item} index={index} onOpen={() => {
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
              }} />
            ))
          )
        ) : data.tiles.length === 0 ? (
          <EmptyState icon={MapPin} iconColor={colors.warning} title="Kein Aushang" />
        ) : (
          data.tiles.map((item, index) => (
            <FadeInUp key={String(item.id)} delay={Math.min(index, 8) * 30}>
              <Pressable
                onPress={() => {
                  hapticLight();
                  setTile(item);
                }}
                className="mb-2 hover:opacity-90 active:opacity-80"
              >
                <Card>
                  <Row className="gap-2">
                    {item.pinned ? <MapPin size={15} strokeWidth={2.1} color={colors.warning} /> : null}
                    <Text className="flex-1 text-[15px] font-bold text-ink">{item.title}</Text>
                  </Row>
                  <Muted className="mt-1" numberOfLines={3}>
                    {htmlToText(item.content)}
                  </Muted>
                </Card>
              </Pressable>
            </FadeInUp>
          ))
        )}
      </ScrollView>

      <ErrorBoundary label="Brief" inline>
        <LetterSheet letter={letter} onClose={() => setLetter(null)} />
      </ErrorBoundary>

      <Sheet open={Boolean(tile)} onClose={() => setTile(null)} title={tile?.title}>
        {tile ? <Text className="text-[15px] leading-6 text-ink">{htmlToText(tile.content)}</Text> : null}
      </Sheet>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Brief-Zeile (Phase 3) */

/**
 * Farbcodierte Prioritäts-Karten fürs Postfach:
 * Amber = Aktion nötig (Bestätigung offen) · Lime = erledigt/bestätigt ·
 * Coral = neue Nachrichten (Ungelesen) · Violet = gelesen/neutral.
 * Briefe mit offener Bestätigung haben eine Inline-Action „Bestätigen“.
 */
function LetterRow({
  letter,
  index,
  onOpen,
}: {
  letter: Letter;
  index: number;
  onOpen: () => void;
}) {
  const { colors } = useThemeColors();
  const confirm = useConfirmLetter();
  const [justConfirmed, setJustConfirmed] = useState(false);

  const needsAction = letter.requiresConfirmation && !letter.confirmed && !justConfirmed;
  const isConfirmed = Boolean(letter.requiresConfirmation && (letter.confirmed || justConfirmed));
  const tone = needsAction ? colors.warning : isConfirmed ? colors.success : colors.accent.violet;

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

  return (
    <FadeInUp delay={Math.min(index, 8) * 30}>
      <Card
        padded={false}
        className="mb-2 overflow-hidden"
        style={{
          backgroundColor: needsAction || isConfirmed ? tint(tone, 0.06) : colors.surface,
          borderWidth: 1,
          borderColor: needsAction || isConfirmed ? tint(tone, 0.4) : colors.line,
        }}
      >
        <View className="flex-row">
          <View style={{ width: 4, backgroundColor: tone }} />
          <Pressable onPress={onOpen} className="flex-1 py-3 pl-3.5 pr-4 hover:opacity-90 active:opacity-70">
            <Row className="gap-3">
              <View
                className="h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: tint(tone, 0.16) }}
              >
                {needsAction ? (
                  <AlertCircle size={19} strokeWidth={2.1} color={tone} />
                ) : isConfirmed ? (
                  <CheckCheck size={19} strokeWidth={2.3} color={tone} />
                ) : (
                  <MailOpen size={19} strokeWidth={2.1} color={tone} />
                )}
              </View>
              <View className="flex-1">
                <Row className="justify-between gap-2">
                  <Text className="flex-1 text-[15px] font-bold text-ink" numberOfLines={2}>
                    {letter.subject}
                  </Text>
                  <Muted className="self-start text-[11px]">{formatTimeAgo(letter.createdAt)}</Muted>
                </Row>
                <Muted className="mt-0.5" numberOfLines={2}>
                  {letter.content
                    ? excerpt(htmlToText(letter.content), 90)
                    : `${letter.sender ?? 'Schule'} · zum Lesen antippen`}
                </Muted>
                <Row className="mt-2 flex-wrap gap-2">
                  <Chip label={letter.sender ?? 'Schule'} color={colors.faint} />
                  {needsAction ? (
                    <Chip label="Bestätigung nötig" color={colors.warning} tone="solid" />
                  ) : null}
                  {isConfirmed ? <Chip label="bestätigt" color={colors.success} tone="solid" /> : null}
                </Row>
              </View>
            </Row>
          </Pressable>
        </View>

        {/* Action-Button: Brief direkt bestätigen, ohne ihn zu öffnen */}
        {needsAction ? (
          <View
            className="flex-row items-center justify-between gap-3 border-t px-4 py-2"
            style={{ borderColor: tint(tone, 0.3) }}
          >
            <Muted className="flex-1 text-[11px]">
              Kenntnisnahme wird direkt an die Schule gesendet.
            </Muted>
            <Button size="sm" action="primary" disabled={confirm.isPending} onPress={quickConfirm}>
              {confirm.isPending ? <Spinner color={colors.on.amber} size="small" /> : null}
              <ButtonText>Bestätigen</ButtonText>
            </Button>
          </View>
        ) : null}
      </Card>
    </FadeInUp>
  );
}

/* ------------------------------------------------------------------ Thread-Zeile */

function ThreadRow({ thread, index, onOpen }: { thread: MessageThread; index: number; onOpen: () => void }) {
  const { colors } = useThemeColors();
  const markRead = useMarkThreadRead();
  const unread = thread.unreadCount > 0;
  return (
    <FadeInUp delay={Math.min(index, 8) * 30}>
      <Card
        padded={false}
        className="mb-2 overflow-hidden"
        style={{
          backgroundColor: unread ? tint(colors.accent.coral, 0.06) : colors.surface,
          borderWidth: 1,
          borderColor: unread ? tint(colors.accent.coral, 0.35) : colors.line,
        }}
      >
        <View className="flex-row">
          <View
            style={{ width: 4, backgroundColor: unread ? colors.accent.coral : 'transparent' }}
          />
          <Pressable
            onPress={() => {
              if (unread) markRead.mutate(String(thread.subscriptionId));
              onOpen();
            }}
            className="flex-1 py-3 pl-3.5 pr-4 hover:opacity-90 active:opacity-70"
          >
            <Row className="gap-3">
              <Avatar name={thread.sender || 'Schule'} size={40} color={unread ? colors.accent.coral : colors.accent.violet} />
              <View className="flex-1">
                <Row className="justify-between">
                  <Text
                    className={`flex-1 text-[15px] text-ink ${unread ? 'font-extrabold' : 'font-bold'}`}
                    numberOfLines={1}
                  >
                    {thread.sender || 'Schule'}
                  </Text>
                  <Muted className="text-[11px]">{formatTimeAgo(thread.lastMessageAt)}</Muted>
                </Row>
                <Text className={`text-[13px] text-muted ${unread ? 'font-semibold' : ''}`} numberOfLines={1}>
                  {thread.subject}
                </Text>
                {thread.preview ? (
                  <Muted className="mt-0.5 text-[12px]" numberOfLines={2}>
                    {thread.preview}
                  </Muted>
                ) : null}
                <Row className="mt-1.5 gap-2">
                  {unread ? <Chip label="Neu" color={colors.accent.coral} tone="solid" /> : null}
                  <Chip label="Nachricht" color={colors.accent.violet} />
                </Row>
              </View>
              {unread ? (
                <View className="h-6 min-w-[24px] items-center justify-center rounded-full bg-accent-coral px-1.5">
                  <Text className="text-[11px] font-bold text-on-coral">{thread.unreadCount}</Text>
                </View>
              ) : null}
            </Row>
          </Pressable>
        </View>
      </Card>
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

  // Detail bei jedem Öffnen nachladen (HTML-Text + Anhänge stecken nicht in der Liste).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <Chip label={letter.sender ?? 'Schule'} color={colors.accent.violet} />
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
                // Antworten in `formData` — Schlüssel ist die **Frage-Id als String**.
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
