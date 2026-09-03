import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { Letter, MessageThread, Tile } from '@/api/types';
import { useSession } from '@/state/session';
import { useConfirmLetter, useMarkThreadRead, useModuleActive, useSnapshot } from '@/data/queries';
import { subjectStyle } from '@/design/subjects';
import { downloadStoredFile } from '@/api/downloads';
import { formatRelativeDay, formatTimeAgo } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import { hapticError, hapticLight, hapticSuccess } from '@/lib/haptics';
import { Card, Chip, Divider, EmptyState, Ionicons, Muted, Row, Screen, SectionHeader, SegmentedControl, Sheet, Skeleton, Title } from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Avatar, Spinner } from '@/ui/gluestack/feedback';
import { FadeInUp } from '@/ui/motion';
import { ErrorBoundary } from '@/ui/error-boundary';

type Tab = 'letters' | 'messages' | 'board';

export default function InboxScreen() {
  const { data, isLoading } = useSnapshot();
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

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 110 }}>
        {isLoading || !data ? (
          <View className="gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </View>
        ) : tabs.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="Postfach nicht gebucht"
            hint="Deine Schule hat weder Elternbriefe, Nachrichten noch Aushänge freigeschaltet."
          />
        ) : activeTab === 'letters' ? (
          data.letters.length === 0 ? (
            <EmptyState emoji="📭" title="Keine Elternbriefe" />
          ) : (
            data.letters.map((item, index) => {
              const needsAction = item.requiresConfirmation && !item.confirmed;
              return (
                <FadeInUp key={String(item.id)} delay={Math.min(index, 8) * 30}>
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      setLetter(item);
                    }}
                    className="mb-2 active:opacity-80"
                  >
                    <Card className={needsAction ? 'border border-warning/40' : ''}>
                      <Row className="gap-3">
                        <View
                          className={`h-10 w-10 items-center justify-center rounded-2xl ${
                            needsAction ? 'bg-warning/15' : 'bg-brand-soft'
                          }`}
                        >
                          <Ionicons
                            name={needsAction ? 'alert-circle-outline' : 'mail-open-outline'}
                            size={19}
                            color={needsAction ? '#E8981E' : '#6C5CE7'}
                          />
                        </View>
                        <View className="flex-1">
                          <Row className="justify-between">
                            <Text className="flex-1 text-[15px] font-bold text-ink" numberOfLines={1}>
                              {item.subject}
                            </Text>
                            <Muted className="text-[11px]">{formatTimeAgo(item.createdAt)}</Muted>
                          </Row>
                          <Muted className="mt-0.5" numberOfLines={2}>
                            {item.content
                              ? excerpt(htmlToText(item.content), 90)
                              : `${item.sender ?? 'Schule'} · zum Lesen antippen`}
                          </Muted>
                          <Row className="mt-2 gap-2">
                            <Chip label={item.sender ?? 'Schule'} color="#9CA2B6" />
                            {needsAction ? <Chip label="Bestätigung nötig" color="#E8981E" tone="solid" /> : null}
                            {item.confirmed ? <Chip label="bestätigt" color="#22B07A" /> : null}
                          </Row>
                        </View>
                      </Row>
                    </Card>
                  </Pressable>
                </FadeInUp>
              );
            })
          )
        ) : activeTab === 'messages' ? (
          data.threads.length === 0 ? (
            <EmptyState emoji="💬" title="Keine Nachrichten" hint="Das Modul „Nachrichten“ ist evtl. nicht gebucht." />
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
          <EmptyState emoji="📌" title="Kein Aushang" />
        ) : (
          data.tiles.map((item, index) => (
            <FadeInUp key={String(item.id)} delay={Math.min(index, 8) * 30}>
              <Pressable
                onPress={() => {
                  hapticLight();
                  setTile(item);
                }}
                className="mb-2 active:opacity-80"
              >
                <Card>
                  <Row className="gap-2">
                    {item.pinned ? <Text>📍</Text> : null}
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

/* ------------------------------------------------------------------ Thread-Zeile */

function ThreadRow({ thread, index, onOpen }: { thread: MessageThread; index: number; onOpen: () => void }) {
  const markRead = useMarkThreadRead();
  return (
    <FadeInUp delay={Math.min(index, 8) * 30}>
      <Pressable
        onPress={() => {
          if (thread.unreadCount > 0) markRead.mutate(String(thread.subscriptionId));
          onOpen();
        }}
        className="mb-2 active:opacity-80"
      >
        <Card>
          <Row className="gap-3">
            <Avatar name={thread.sender || 'Schule'} size={40} color="#48A3FF" />
            <View className="flex-1">
              <Row className="justify-between">
                <Text className="flex-1 text-[15px] font-bold text-ink" numberOfLines={1}>
                  {thread.sender || 'Schule'}
                </Text>
                <Muted className="text-[11px]">{formatTimeAgo(thread.lastMessageAt)}</Muted>
              </Row>
              <Text className="text-[13px] font-semibold text-muted" numberOfLines={1}>
                {thread.subject}
              </Text>
              {thread.preview ? (
                <Muted className="mt-0.5 text-[12px]" numberOfLines={1}>
                  {thread.preview}
                </Muted>
              ) : null}
            </View>
            {thread.unreadCount > 0 ? (
              <View className="h-6 min-w-[24px] items-center justify-center rounded-full bg-coral px-1.5">
                <Text className="text-[11px] font-bold text-white">{thread.unreadCount}</Text>
              </View>
            ) : null}
          </Row>
        </Card>
      </Pressable>
    </FadeInUp>
  );
}

/* ------------------------------------------------------------------ Brief-Detail */

function LetterSheet({ letter, onClose }: { letter: Letter | null; onClose: () => void }) {
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
            <Chip label={letter.sender ?? 'Schule'} color="#6C5CE7" />
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
                            className={`rounded-xl border px-3 py-2.5 ${
                              active ? 'border-brand bg-brand-soft' : 'border-line bg-bg'
                            }`}
                          >
                            <Text className={`text-[13px] ${active ? 'font-bold text-brand-ink' : 'text-ink'}`}>
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
                  <Pressable onPress={() => void download(file)} className="active:bg-line/30">
                    <Row className="gap-3 px-4 py-3">
                      <Ionicons name="document-attach-outline" size={18} color="#6C5CE7" />
                      <Text className="flex-1 text-[14px] text-ink">{file.name}</Text>
                      {downloading === String(file.id) ? (
                        <Spinner />
                      ) : (
                        <Ionicons name="download-outline" size={18} color="#9CA2B6" />
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
              {confirm.isPending ? <Spinner color="#FFFFFF" /> : null}
              <ButtonText>Kenntnisnahme bestätigen</ButtonText>
            </Button>
          ) : (
            <Row className="justify-center gap-2 rounded-2xl bg-success/10 py-3">
              <Ionicons name="checkmark-circle" size={18} color="#22B07A" />
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
