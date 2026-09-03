import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MessageSquare, Send, X } from 'lucide-react-native';

import type { ChatMessage } from '@/api/types';
import { useSendMessage, useThreadMessages } from '@/data/queries';
import { formatTimeAgo } from '@/lib/date';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { Card, EmptyState, IconButton, Muted, Row, Screen, Skeleton, Title } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { Avatar, Spinner } from '@/ui/gluestack/feedback';
import { useThemeColors } from '@/design/theme';

export default function ThreadScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    subscriptionId: string;
    threadId: string;
    subject?: string;
    sender?: string;
    recipients?: string;
    preview?: string;
  }>();

  const subscriptionId = params.subscriptionId;
  const { data, isLoading } = useThreadMessages(subscriptionId);
  const send = useSendMessage();
  const [draft, setDraft] = useState('');

  const sendDraft = () => {
    const text = draft.trim();
    if (!text || !params.threadId || !subscriptionId) return;
    hapticLight();
    send.mutate(
      { subscriptionId, threadId: params.threadId, text },
      {
        onSuccess: () => {
          setDraft('');
          hapticSuccess();
        },
      },
    );
  };

  return (
    <Screen adaptive="narrow" edges={['top', 'bottom']}>
      {/* Kopf */}
      <Row className="justify-between px-4 pb-2 pt-2">
        <Row className="gap-2">
          <IconButton icon={X} onPress={() => router.back()} size={36} />
          <View className="flex-1">
            <Title numberOfLines={2}>{params.sender || params.subject || 'Nachricht'}</Title>
            {params.subject && params.sender ? (
              <Muted className="text-[12px]" numberOfLines={1}>
                {params.subject}
              </Muted>
            ) : null}
          </View>
        </Row>
      </Row>

      {/* Verlauf */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 12 }}>
          {params.recipients ? (
            <FadeInUp>
            <Card className="mb-3">
              <Muted className="text-[11px]">An</Muted>
              <Text className="mt-0.5 text-[13px] leading-5 text-muted">{params.recipients}</Text>
            </Card>
            </FadeInUp>
          ) : null}

          {isLoading ? (
            <View className="gap-2">
              <Skeleton className="h-16 w-4/5" />
              <Skeleton className="ml-auto h-12 w-1/2" />
              <Skeleton className="h-16 w-3/4" />
            </View>
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              iconColor={colors.accent.violet}
              title="Keine Nachrichten im Verlauf"
              hint={params.preview ? params.preview : 'Hier erscheinen Antworten und alte Nachrichten.'}
            />
          ) : (
            [...data]
              .sort((a, b) => (a.sentAt ?? '').localeCompare(b.sentAt ?? ''))
              .map((message: ChatMessage) => (
                <View
                  key={String(message.id)}
                  className={`mb-2 max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    message.isOwn ? 'ml-auto bg-accent-amber' : 'bg-surface'
                  }`}
                  style={message.isOwn ? undefined : { shadowColor: colors.charcoal, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
                >
                  {!message.isOwn && message.sender ? (
                    <Text className="mb-0.5 text-[11px] font-bold text-accent-amber-deep">{message.sender}</Text>
                  ) : null}
                  <Text className={`text-[14px] leading-5 ${message.isOwn ? 'text-on-amber' : 'text-ink'}`}>
                    {message.text}
                  </Text>
                  <Text
                    className={`mt-1 self-end text-[10px] ${message.isOwn ? 'text-on-amber/70' : 'text-faint'}`}
                  >
                    {formatTimeAgo(message.sentAt)}
                  </Text>
                </View>
              ))
          )}

          {data && data.length === 0 && params.preview ? (
            <Card>
              <Text className="text-[14px] leading-5 text-ink">{params.preview}</Text>
            </Card>
          ) : null}
        </ScrollView>

        {/* Antwortfeld */}
        <View className="border-t border-line bg-surface px-3 py-2.5">
          <Row className="gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-amber/15">
              {send.isPending ? (
                <Spinner size="small" />
              ) : (
                <MessageSquare size={16} strokeWidth={2} color={colors.accent.violet} />
              )}
            </View>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Antworten …"
              placeholderTextColor={colors.faint}
              multiline
              className="flex-1 rounded-2xl bg-canvas px-3.5 py-2.5 text-[14px] text-ink"
              onSubmitEditing={sendDraft}
            />
            <Pressable
              onPress={sendDraft}
              disabled={draft.trim().length === 0 || send.isPending}
              className={`h-11 w-11 items-center justify-center rounded-2xl ${
                draft.trim().length === 0 ? 'bg-line/50' : 'bg-accent-amber hover:opacity-90 active:opacity-80'
              }`}
            >
              <Send size={18} strokeWidth={2} color={draft.trim().length === 0 ? colors.faint : colors.on.amber} />
            </Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
