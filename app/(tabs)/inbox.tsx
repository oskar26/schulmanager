import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { Letter, MessageThread, Tile } from '@/api/types';
import { useConfirmLetter, useSnapshot } from '@/data/queries';
import { formatTimeAgo } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import {
  Card, Chip, Divider, EmptyState, Ionicons, Muted, Row, Screen, SegmentedControl, Sheet, Skeleton, Title,
} from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Avatar, Spinner } from '@/ui/gluestack/feedback';

type Tab = 'letters' | 'messages' | 'board';

export default function InboxScreen() {
  const { data, isLoading } = useSnapshot();
  const [tab, setTab] = useState<Tab>('letters');
  const [letter, setLetter] = useState<Letter | null>(null);
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [tile, setTile] = useState<Tile | null>(null);

  const pending = data?.letters.filter((item) => item.requiresConfirmation && !item.confirmed).length ?? 0;
  const unread = data?.threads.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0;

  return (
    <Screen>
      <View className="px-4 pb-3 pt-2">
        <Title>Postfach</Title>
        <Muted className="mb-3">Elternbriefe, Nachrichten und Aushänge</Muted>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'letters', label: 'Briefe', badge: pending },
            { value: 'messages', label: 'Nachrichten', badge: unread },
            { value: 'board', label: 'Brett' },
          ]}
        />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 110 }}>
        {isLoading || !data ? (
          <View className="gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </View>
        ) : tab === 'letters' ? (
          data.letters.length === 0 ? (
            <EmptyState emoji="📭" title="Keine Elternbriefe" />
          ) : (
            data.letters.map((item, index) => {
              const needsAction = item.requiresConfirmation && !item.confirmed;
              return (
                <FadeInUp key={String(item.id)} delay={index * 30}>
                  <Pressable onPress={() => setLetter(item)} className="mb-2 active:opacity-80">
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
                            {excerpt(htmlToText(item.content), 90)}
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
        ) : tab === 'messages' ? (
          data.threads.length === 0 ? (
            <EmptyState emoji="💬" title="Keine Nachrichten" hint="Das Modul „Nachrichten“ ist evtl. nicht gebucht." />
          ) : (
            data.threads.map((item, index) => (
              <FadeInUp key={String(item.id)} delay={index * 30}>
                <Pressable onPress={() => setThread(item)} className="mb-2 active:opacity-80">
                  <Card>
                    <Row className="gap-3">
                      <Avatar name={item.sender || 'Schule'} size={40} color="#48A3FF" />
                      <View className="flex-1">
                        <Row className="justify-between">
                          <Text className="flex-1 text-[15px] font-bold text-ink" numberOfLines={1}>
                            {item.sender || 'Schule'}
                          </Text>
                          <Muted className="text-[11px]">{formatTimeAgo(item.lastMessageAt)}</Muted>
                        </Row>
                        <Text className="text-[13px] font-semibold text-muted" numberOfLines={1}>
                          {item.subject}
                        </Text>
                        {item.preview ? (
                          <Muted className="mt-0.5 text-[12px]" numberOfLines={1}>
                            {item.preview}
                          </Muted>
                        ) : null}
                      </View>
                      {item.unreadCount > 0 ? (
                        <View className="h-6 min-w-[24px] items-center justify-center rounded-full bg-coral px-1.5">
                          <Text className="text-[11px] font-bold text-white">{item.unreadCount}</Text>
                        </View>
                      ) : null}
                    </Row>
                  </Card>
                </Pressable>
              </FadeInUp>
            ))
          )
        ) : data.tiles.length === 0 ? (
          <EmptyState emoji="📌" title="Kein Aushang" />
        ) : (
          data.tiles.map((item, index) => (
            <FadeInUp key={String(item.id)} delay={index * 30}>
              <Pressable onPress={() => setTile(item)} className="mb-2 active:opacity-80">
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

      <LetterSheet letter={letter} onClose={() => setLetter(null)} />

      <Sheet open={Boolean(thread)} onClose={() => setThread(null)} title={thread?.subject}>
        {thread ? (
          <View className="gap-3">
            <Card>
              <Muted className="text-[11px]">Von</Muted>
              <Text className="text-[15px] font-bold text-ink">{thread.sender}</Text>
              {thread.recipients ? (
                <>
                  <Muted className="mt-2 text-[11px]">An</Muted>
                  <Text className="text-[13px] text-muted">{thread.recipients}</Text>
                </>
              ) : null}
            </Card>
            {thread.preview ? (
              <Card>
                <Text className="text-[14px] leading-5 text-ink">{thread.preview}</Text>
                <Muted className="mt-2 text-[11px]">{formatTimeAgo(thread.lastMessageAt)}</Muted>
              </Card>
            ) : null}
            <Muted className="text-center text-[12px]">
              Antworten ist im Demo-Modus deaktiviert.
            </Muted>
          </View>
        ) : null}
      </Sheet>

      <Sheet open={Boolean(tile)} onClose={() => setTile(null)} title={tile?.title}>
        {tile ? <Text className="text-[15px] leading-6 text-ink">{htmlToText(tile.content)}</Text> : null}
      </Sheet>
    </Screen>
  );
}

function LetterSheet({ letter, onClose }: { letter: Letter | null; onClose: () => void }) {
  const confirm = useConfirmLetter();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Sheet open={Boolean(letter)} onClose={onClose} title={letter?.subject}>
      {letter ? (
        <View className="gap-3">
          <Row className="gap-2">
            <Chip label={letter.sender ?? 'Schule'} color="#6C5CE7" />
            <Muted className="text-[11px]">{formatTimeAgo(letter.createdAt)}</Muted>
          </Row>

          <Text className="text-[15px] leading-6 text-ink">{htmlToText(letter.content)}</Text>

          {letter.attachments && letter.attachments.length > 0 ? (
            <Card padded={false}>
              {letter.attachments.map((file, index) => (
                <View key={String(file.id)}>
                  <Row className="gap-3 px-4 py-3">
                    <Ionicons name="document-attach-outline" size={18} color="#6C5CE7" />
                    <Text className="flex-1 text-[14px] text-ink">{file.name}</Text>
                    <Ionicons name="download-outline" size={18} color="#9CA2B6" />
                  </Row>
                  {index < (letter.attachments?.length ?? 0) - 1 ? <Divider className="ml-12" /> : null}
                </View>
              ))}
            </Card>
          ) : null}

          {letter.requiresConfirmation && !letter.confirmed && !confirmed ? (
            <Button
              action="primary"
              size="lg"
              block
              onPress={() => {
                confirm.mutate(String(letter.id), { onSuccess: () => setConfirmed(true) });
              }}
            >
              {confirm.isPending ? <Spinner color="#FFFFFF" /> : null}
              <ButtonText>Kenntnisnahme bestätigen</ButtonText>
            </Button>
          ) : (
            <Row className="justify-center gap-2 rounded-2xl bg-success/10 py-3">
              <Ionicons name="checkmark-circle" size={18} color="#22B07A" />
              <Text className="text-[14px] font-semibold text-success">Bestätigt</Text>
            </Row>
          )}
        </View>
      ) : null}
    </Sheet>
  );
}
