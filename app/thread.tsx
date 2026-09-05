import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '@/ui/navigation';
import { MessageSquare, Send, X } from 'lucide-react-native';

import type { ChatMessage } from '@/api/types';
import { useSendMessage, useThreadMessages } from '@/data/queries';
import { formatTimeAgo } from '@/lib/date';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import {
  BlockCaption,
  BlockText,
  Card,
  ColorBlockCard,
  EmptyState,
  IconBadge,
  IconButton,
  Muted,
  Row,
  Screen,
  Skeleton,
  Title,
} from '@/ui/primitives';
import { FadeInUp, PressableOpacity } from '@/ui/motion';
import { Spinner } from '@/ui/gluestack/feedback';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, resolveThemeColor, shadow } from '@/design/tokens';

export default function ThreadScreen() {
  const { colors, isDark } = useThemeColors();
  const dismiss = useSafeBack('/inbox');
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
      {/* Kopf — Chat-App-Referenz: runder Avatar, fetter Name, Schließen-Pill */}
      <Row className="gap-3 px-4 pb-3 pt-2">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: resolveThemeColor(colors.blocks.lavender, isDark) }}
        >
          <Text
            className="text-[15px] font-extrabold"
            style={{ color: colors.onBlocks.lavender }}
          >
            {initialsOf(params.sender || params.subject || 'Schule')}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Title numberOfLines={1}>{params.sender || params.subject || 'Nachricht'}</Title>
          {params.subject && params.sender ? (
            <Muted className="text-[12px]" numberOfLines={1}>
              {params.subject}
            </Muted>
          ) : null}
        </View>
        <IconButton icon={X} onPress={() => dismiss()} size={40} background="bg-line/50" />
      </Row>

      {/* Verlauf */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 12 }}>
          {params.recipients ? (
            <FadeInUp>
            <ColorBlockCard
              color={colors.blocks.slate}
              className="mb-3"
              style={{ paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <BlockCaption className="text-[10.5px] font-extrabold uppercase tracking-[1.4px]">An</BlockCaption>
              <BlockText className="mt-0.5 text-[13.5px] leading-5">{params.recipients}</BlockText>
            </ColorBlockCard>
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
              illustration="no-messages"
              title="Keine Nachrichten im Verlauf"
              hint={params.preview ? params.preview : 'Hier erscheinen Antworten und alte Nachrichten.'}
            />
          ) : (
            [...data]
              .sort((a, b) => (a.sentAt ?? '').localeCompare(b.sentAt ?? ''))
              .map((message: ChatMessage) => (
                <Bubble key={String(message.id)} message={message} />
              ))
          )}

          {data && data.length === 0 && params.preview ? (
            <Card style={{ padding: 16 }} padded={false}>
              <Text className="text-[14px] leading-5 text-ink">{params.preview}</Text>
            </Card>
          ) : null}
        </ScrollView>

        {/* Antwortfeld */}
        {/* Antwortfeld — weiche Fläche statt Trennlinie (Kernprinzip 8) */}
        <View className="bg-surface px-3 py-3" style={shadow.float}>
          <Row className="gap-2">
            {send.isPending ? (
              <View className="h-11 w-11 items-center justify-center rounded-full bg-line/50">
                <Spinner size="small" />
              </View>
            ) : (
              <IconBadge icon={MessageSquare} color={colors.blocks.violet} tone="tint" size="lg" />
            )}
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Antworten …"
              placeholderTextColor={colors.faint}
              multiline
              accessibilityLabel="Antwort schreiben"
              className="min-h-[44px] flex-1 rounded-[20px] bg-canvas px-4 py-3 text-[14.5px] text-ink"
              onSubmitEditing={sendDraft}
            />
            <PressableOpacity
              onPress={sendDraft}
              disabled={draft.trim().length === 0 || send.isPending}
              accessibilityRole="button"
              accessibilityLabel="Antwort senden"
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  draft.trim().length === 0
                    ? colors.line
                    : resolveThemeColor(colors.blocks.amber, isDark),
              }}
            >
              <Send
                size={18}
                strokeWidth={2.4}
                color={draft.trim().length === 0 ? colors.faint : colors.onBlocks.amber}
              />
            </PressableOpacity>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Bubble (Phase 7) */

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Chat-Bubble im Farbflächen-Stil (Chat-App-Referenz): eigene Nachrichten
 * sind ein Amber-Block, fremde eine weiche Surface-Karte — beide voll rund
 * (Radius 24) mit einer „angehefteten“ Ecke auf der Sprecher-Seite.
 */
function Bubble({ message }: { message: ChatMessage }) {
  const { colors, isDark } = useThemeColors();

  if (message.isOwn) {
    const tone = resolveThemeColor(colors.blocks.amber, isDark);
    const ink = foregroundOn(tone, colors);
    return (
      <View
        className="mb-2 ml-auto max-w-[85%] px-4 py-3"
        style={{
          backgroundColor: tone,
          borderRadius: 24,
          borderBottomRightRadius: 8,
          ...shadow.card,
        }}
      >
        <Text className="text-[14.5px] font-medium leading-[20px]" style={{ color: ink }}>
          {message.text}
        </Text>
        <Text className="mt-1 self-end text-[10.5px] font-bold" style={{ color: ink, opacity: 0.7 }}>
          {formatTimeAgo(message.sentAt)}
        </Text>
      </View>
    );
  }

  return (
    <View
      className="mb-2 mr-auto max-w-[85%] bg-surface px-4 py-3"
      style={{ borderRadius: 24, borderBottomLeftRadius: 8, ...shadow.card }}
    >
      {message.sender ? (
        <Text
          className="mb-0.5 text-[11.5px] font-extrabold"
          style={{ color: resolveThemeColor(colors.blocks.violet, isDark) }}
        >
          {message.sender}
        </Text>
      ) : null}
      <Text className="text-[14.5px] leading-[20px] text-ink">{message.text}</Text>
      <Text className="mt-1 self-end text-[10.5px] font-bold text-faint">{formatTimeAgo(message.sentAt)}</Text>
    </View>
  );
}
