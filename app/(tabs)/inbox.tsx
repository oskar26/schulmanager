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
import {
  categoryColor,
  categoryFromText,
  categoryIcon,
  categoryLabel,
  type CategoryKey,
} from '@/design/categories';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, resolveThemeColor } from '@/design/tokens';
import { downloadStoredFile } from '@/api/downloads';
import { formatRelativeDay, formatTimeAgo } from '@/lib/date';
import { excerpt, htmlToText } from '@/lib/html';
import { hapticError, hapticLight, hapticSuccess } from '@/lib/haptics';
import {
  BlockCaption,
  BlockText,
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
  ScreenHeader,
  SegmentedControl,
  Sheet,
  Skeleton,
  useBlockInk,
} from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner } from '@/ui/gluestack/feedback';
import { FadeInUp } from '@/ui/motion';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { ErrorBoundary } from '@/ui/error-boundary';

type Tab = 'letters' | 'messages' | 'board';

export default function InboxScreen() {
  const { colors, isDark } = useThemeColors();
  const { data, isLoading } = useSnapshot();
  const reserve = useTabNavReserve();
  const [tab, setTab] = useState<Tab>('letters');
  const [letter, setLetter] = useState<Letter | null>(null);
  const [tile, setTile] = useState<Tile | null>(null);
  const router = useRouter();

  /**
   * Bug (Phase 7): Die Tab-Badges zählten stur alle Briefe mit
   * `requiresConfirmation`, auch wenn der Server sie als bestätigt
   * zurückgeliefert hat, aber `confirmed` als String/`0` kam. Jetzt strikt
   * über `Boolean()` normalisiert — und in einem `useMemo`, damit die Zahl
   * nicht bei jedem Tastendruck neu durch die Liste läuft.
   */
  const pending = useMemo(
    () =>
      (data?.letters ?? []).filter(
        (item) => Boolean(item.requiresConfirmation) && !Boolean(item.confirmed),
      ).length,
    [data?.letters],
  );
  const unread = useMemo(
    () => (data?.threads ?? []).reduce((sum, item) => sum + Math.max(0, item.unreadCount ?? 0), 0),
    [data?.threads],
  );

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
      <ScreenHeader title="Postfach" subtitle="Elternbriefe, Nachrichten und Aushänge" />
      {tabs.length > 1 ? (
        <View className="px-4 pb-3">
          <SegmentedControl<Tab> options={tabs} value={activeTab} onChange={setTab} />
        </View>
      ) : null}

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: reserve }}>
        {isLoading || !data ? (
          <View className="gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </View>
        ) : tabs.length === 0 ? (
          <EmptyState
            icon={Inbox}
            iconColor={colors.blocks.violet}
            title="Postfach nicht gebucht"
            hint="Deine Schule hat weder Elternbriefe, Nachrichten noch Aushänge freigeschaltet."
          />
        ) : activeTab === 'letters' ? (
          data.letters.length === 0 ? (
            <EmptyState icon={MailOpen} iconColor={colors.blocks.lavender} title="Keine Elternbriefe" />
          ) : (
            data.letters.map((item, index) => (
              <LetterCard
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
            <EmptyState
              icon={MessagesSquare}
              iconColor={colors.blocks.violet}
              title="Keine Nachrichten"
              hint="Das Modul „Nachrichten“ ist evtl. nicht gebucht."
            />
          ) : (
            data.threads.map((item, index) => (
              <ThreadCard
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
            ))
          )
        ) : data.tiles.length === 0 ? (
          <EmptyState icon={MapPin} iconColor={colors.blocks.amber} title="Kein Aushang" />
        ) : (
          data.tiles.map((item, index) => (
            <BoardCard
              key={String(item.id)}
              tile={item}
              index={index}
              onOpen={() => {
                hapticLight();
                setTile(item);
              }}
            />
          ))
        )}
      </ScrollView>

      <ErrorBoundary label="Brief" inline>
        <LetterSheet letter={letter} onClose={() => setLetter(null)} />
      </ErrorBoundary>

      <Sheet open={Boolean(tile)} onClose={() => setTile(null)} title={tile?.title}>
        {tile ? (
          <View className="gap-3">
            {(() => {
              const category = categoryFromText(`${tile.title} ${htmlToText(tile.content)}`);
              return (
                <Pill
                  label={categoryLabel(category)}
                  color={resolveThemeColor(categoryColor(category, isDark), isDark)}
                  tone="solid"
                  icon={categoryIcon(category)}
                />
              );
            })()}
            <Text className="text-[15px] leading-6 text-ink">{htmlToText(tile.content)}</Text>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Brett (Phase 7) */

/**
 * Brett-Aushang als vollflächige Kategorie-Karte: Die Farbe kommt aus
 * `categories.ts` (Sekretariat = Sky, Bibliothek = Mint, AG = Violet,
 * Fundsachen = Amber, Fallback Lavendel) und wird pro Eintrag abgeleitet —
 * ein Brett kann mehrere Bereiche mischen (Entscheidung #10).
 */
function BoardCard({ tile, index, onOpen }: { tile: Tile; index: number; onOpen: () => void }) {
  const { isDark } = useThemeColors();
  const category: CategoryKey = categoryFromText(`${tile.title} ${htmlToText(tile.content)}`);
  const tone = categoryColor(category, isDark);

  return (
    <FadeInUp delay={Math.min(index, 8) * 30}>
      <ColorBlockCard
        color={tone}
        onPress={onOpen}
        accessibilityLabel={`Aushang: ${tile.title}`}
        className="mb-2.5"
        style={{ padding: 16 }}
      >
        <BoardCardBody tile={tile} category={category} />
      </ColorBlockCard>
    </FadeInUp>
  );
}

function BoardCardBody({ tile, category }: { tile: Tile; category: CategoryKey }) {
  const ink = useBlockInk();
  return (
    <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
      <IconBadge icon={tile.pinned ? MapPin : categoryIcon(category)} color={ink} tone="tint" size="lg" />
      <View className="min-w-0 flex-1">
        <BlockText className="text-[15.5px] font-extrabold leading-[20px]" numberOfLines={2}>
          {tile.title}
        </BlockText>
        <BlockCaption className="mt-1 text-[12.5px] leading-[18px]" numberOfLines={3}>
          {htmlToText(tile.content)}
        </BlockCaption>
        <Row className="mt-2 flex-wrap gap-1.5">
          <Pill label={categoryLabel(category)} color={ink} tone="tint" icon={categoryIcon(category)} className="px-2.5 py-1" />
          {tile.pinned ? <Pill label="Angeheftet" color={ink} tone="tint" icon={MapPin} className="px-2.5 py-1" /> : null}
        </Row>
      </View>
    </Row>
  );
}

/* ------------------------------------------------------------------ Brief-Karte (Phase 7) */

/**
 * Brief-Karte im Farbflächen-Stil: Grundfamilie ist **Lavendel** (Kategorie
 * „Elternbriefe“). Briefe mit offener Bestätigung heben sich als
 * Coral-Akzentfläche ab, bestätigte in Mint — Randfarben-Only ist entfallen.
 */
function LetterCard({
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

  const needsAction = Boolean(letter.requiresConfirmation) && !letter.confirmed && !justConfirmed;
  const isConfirmed = Boolean(letter.requiresConfirmation) && (Boolean(letter.confirmed) || justConfirmed);

  const tone = resolveThemeColor(
    needsAction ? colors.blocks.coral : isConfirmed ? colors.blocks.mint : colors.blocks.lavender,
    isDark,
  );
  const ink = foregroundOn(tone, colors);
  const StatusIcon = needsAction ? AlertCircle : isConfirmed ? CheckCheck : MailOpen;

  /**
   * Bug (Phase 7 · Race-Condition): Bei schnellem Doppeltippen liefen zwei
   * `confirm`-Mutationen parallel; die zweite bekam vom Server einen Fehler
   * und der Nutzer sah trotz erfolgreicher Bestätigung eine Fehlermeldung.
   * Der Guard blockt weitere Aufrufe, solange eine Mutation läuft oder die
   * Bestätigung lokal bereits durch ist.
   */
  const quickConfirm = () => {
    if (confirm.isPending || justConfirmed || !needsAction) return;
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
      <ColorBlockCard color={tone} className="mb-2.5" padded={false}>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`Brief öffnen: ${letter.subject}`}
          className="px-4 pb-3.5 pt-4 hover:opacity-90 active:opacity-80"
        >
          <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
            <IconBadge icon={StatusIcon} color={ink} tone="tint" size="lg" />
            <View className="min-w-0 flex-1">
              <Row className="gap-2" style={{ alignItems: 'flex-start' }}>
                <BlockText className="min-w-0 flex-1 text-[15.5px] font-extrabold leading-[20px]" numberOfLines={2}>
                  {letter.subject}
                </BlockText>
                <BlockCaption className="text-[11px]">{formatTimeAgo(letter.createdAt)}</BlockCaption>
              </Row>
              <BlockCaption className="mt-1 text-[12.5px] leading-[18px]" numberOfLines={2}>
                {letter.content
                  ? excerpt(htmlToText(letter.content), 90)
                  : `${letter.sender ?? 'Schule'} · zum Lesen antippen`}
              </BlockCaption>
              <Row className="mt-2 flex-wrap gap-1.5">
                <Pill label={letter.sender ?? 'Schule'} color={ink} tone="tint" className="px-2.5 py-1" />
                {needsAction ? (
                  <Pill label="Bestätigung nötig" color={ink} tone="tint" icon={AlertCircle} className="px-2.5 py-1" />
                ) : null}
                {isConfirmed ? (
                  <Pill label="bestätigt" color={ink} tone="tint" icon={CheckCheck} className="px-2.5 py-1" />
                ) : null}
              </Row>
            </View>
          </Row>
        </Pressable>

        {/* Action-Zeile: Brief direkt bestätigen, ohne ihn zu öffnen */}
        {needsAction ? (
          <View
            className="flex-row items-center justify-between gap-3 px-4 py-3"
            style={{ backgroundColor: tint(ink, 0.12) }}
          >
            <BlockCaption className="min-w-0 flex-1 text-[11.5px]">
              Kenntnisnahme wird direkt an die Schule gesendet.
            </BlockCaption>
            <Button size="sm" action="primary" disabled={confirm.isPending} onPress={quickConfirm}>
              {confirm.isPending ? <Spinner color={colors.on.amber} size="small" /> : null}
              <ButtonText>Bestätigen</ButtonText>
            </Button>
          </View>
        ) : null}
      </ColorBlockCard>
    </FadeInUp>
  );
}

/* ------------------------------------------------------------------ Thread-Karte (Phase 7) */

/**
 * Nachrichten-Karte im Chat-App-Stil: ungelesene Threads sind ein
 * **Charcoal-Block** (maximale Aufmerksamkeit), gelesene bleiben eine ruhige
 * Surface-Karte. Avatare sind voll rund.
 */
function ThreadCard({ thread, index, onOpen }: { thread: MessageThread; index: number; onOpen: () => void }) {
  const { colors, isDark } = useThemeColors();
  const markRead = useMarkThreadRead();
  const unread = (thread.unreadCount ?? 0) > 0;

  const open = () => {
    // Bug (Phase 7): `markRead` wurde bei jedem Tap erneut gefeuert, auch
    // während die vorherige Mutation noch lief — der Badge sprang zurück.
    if (unread && !markRead.isPending) markRead.mutate(String(thread.subscriptionId));
    onOpen();
  };

  const initials = (thread.sender || 'Schule')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (unread) {
    const tone = resolveThemeColor(colors.blocks.charcoal, isDark);
    const ink = foregroundOn(tone, colors);
    return (
      <FadeInUp delay={Math.min(index, 8) * 30}>
        <ColorBlockCard
          color={tone}
          onPress={open}
          accessibilityLabel={`Ungelesene Nachricht von ${thread.sender || 'Schule'} öffnen`}
          className="mb-2.5"
          style={{ padding: 16 }}
        >
          <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: resolveThemeColor(colors.blocks.amber, isDark) }}
            >
              <Text className="text-[15px] font-extrabold" style={{ color: colors.onBlocks.amber }}>
                {initials}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Row className="gap-2">
                <BlockText className="min-w-0 flex-1 text-[15.5px] font-extrabold leading-5" numberOfLines={1}>
                  {thread.sender || 'Schule'}
                </BlockText>
                <BlockCaption className="text-[11px]">{formatTimeAgo(thread.lastMessageAt)}</BlockCaption>
              </Row>
              <BlockText className="mt-0.5 text-[13.5px] font-semibold" numberOfLines={1}>
                {thread.subject}
              </BlockText>
              {thread.preview ? (
                <BlockCaption className="mt-1 text-[12.5px] leading-[18px]" numberOfLines={2}>
                  {thread.preview}
                </BlockCaption>
              ) : null}
              <Row className="mt-2 gap-1.5">
                <Pill
                  label={`${thread.unreadCount} neu`}
                  color={resolveThemeColor(colors.blocks.amber, isDark)}
                  tone="solid"
                  className="px-2.5 py-1"
                />
              </Row>
            </View>
          </Row>
        </ColorBlockCard>
      </FadeInUp>
    );
  }

  return (
    <FadeInUp delay={Math.min(index, 8) * 30}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Nachricht von ${thread.sender || 'Schule'} öffnen`}
        className="mb-2.5 hover:opacity-90 active:opacity-80"
      >
        <Card style={{ padding: 16 }} padded={false}>
          <Row className="gap-3" style={{ alignItems: 'flex-start' }}>
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: tint(resolveThemeColor(colors.blocks.lavender, isDark), 0.3) }}
            >
              <Text
                className="text-[15px] font-extrabold"
                style={{ color: resolveThemeColor(colors.blocks.violet, isDark) }}
              >
                {initials}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Row className="gap-2">
                <Text className="min-w-0 flex-1 text-[15px] font-bold text-ink" numberOfLines={1}>
                  {thread.sender || 'Schule'}
                </Text>
                <Muted className="text-[11px]">{formatTimeAgo(thread.lastMessageAt)}</Muted>
              </Row>
              <Text className="mt-0.5 text-[13px] font-semibold text-muted" numberOfLines={1}>
                {thread.subject}
              </Text>
              {thread.preview ? (
                <Muted className="mt-1 text-[12.5px] leading-[18px]" numberOfLines={2}>
                  {thread.preview}
                </Muted>
              ) : null}
            </View>
          </Row>
        </Card>
      </Pressable>
    </FadeInUp>
  );
}

/* ------------------------------------------------------------------ Brief-Detail */

function LetterSheet({ letter, onClose }: { letter: Letter | null; onClose: () => void }) {
  const { colors, isDark } = useThemeColors();
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
    // Bug (Phase 7): Beim schnellen Wechsel zwischen zwei Briefen konnte die
    // langsamere Antwort die neuere überschreiben. `cancelled` verwirft
    // Antworten, die nicht mehr zum offenen Brief gehören.
    let cancelled = false;
    setContent(null);
    setAttachments([]);
    void api
      .letterDetail(letter.id)
      .then((detail) => {
        if (cancelled) return;
        setContent(detail?.content ?? '');
        setAttachments(detail?.attachments ?? []);
      })
      .catch(() => {
        if (!cancelled) setContent('');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter?.id, isDemo]);

  const needsAction = Boolean(letter?.requiresConfirmation) && !letter?.confirmed && !localConfirmed;

  const download = async (file: NonNullable<Letter['attachments']>[number]) => {
    // Bug (Phase 7): Mehrfaches Tippen startete denselben Download parallel.
    if (downloading) return;
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

  const lavender = resolveThemeColor(colors.blocks.lavender, isDark);

  return (
    <Sheet open={open} onClose={onClose} title={letter?.subject}>
      {letter ? (
        <View className="gap-3">
          <ColorBlockCard color={lavender} style={{ padding: 16 }}>
            <Row className="gap-3">
              <IconBadge icon={MailOpen} color={foregroundOn(lavender, colors)} tone="tint" size="lg" />
              <View className="min-w-0 flex-1">
                <BlockText className="text-[15px] font-extrabold" numberOfLines={1}>
                  {letter.sender ?? 'Schule'}
                </BlockText>
                <BlockCaption className="mt-0.5 text-[12px]">{formatTimeAgo(letter.createdAt)}</BlockCaption>
              </View>
            </Row>
          </ColorBlockCard>

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
              <Text className="px-4 pt-4 text-[13px] font-extrabold uppercase tracking-[1.2px] text-muted">
                Umfrage
              </Text>
              {letter.questions.map((question, qIndex) => (
                <View key={String(question.id)}>
                  <View className="px-4 py-3">
                    <Text className="text-[14px] font-bold text-ink">{question.question}</Text>
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
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            className="min-h-[48px] justify-center rounded-[20px] px-4 py-2.5 hover:opacity-90 active:opacity-80"
                            style={{
                              backgroundColor: active
                                ? resolveThemeColor(colors.blocks.amber, isDark)
                                : tint(colors.line, 0.9),
                            }}
                          >
                            <Text
                              className="text-[13.5px] font-bold"
                              style={{ color: active ? colors.onBlocks.amber : colors.ink }}
                            >
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  {qIndex < (letter.questions?.length ?? 0) - 1 ? <Divider className="ml-4" /> : null}
                </View>
              ))}
              {letter.answerDeadline ? (
                <Muted className="px-4 pb-4">Frist: {formatRelativeDay(letter.answerDeadline.slice(0, 10))}</Muted>
              ) : null}
            </Card>
          ) : null}

          {/* Anhänge */}
          {attachments && attachments.length > 0 ? (
            <Card padded={false}>
              {attachments.map((file, index) => (
                <View key={String(file.id)}>
                  <Pressable
                    onPress={() => void download(file)}
                    disabled={Boolean(downloading)}
                    accessibilityRole="button"
                    accessibilityLabel={`Anhang herunterladen: ${file.name}`}
                    className="hover:bg-line/30 active:bg-line/50"
                    style={downloading && downloading !== String(file.id) ? { opacity: 0.5 } : undefined}
                  >
                    <Row className="gap-3 px-4 py-3.5">
                      <IconBadge icon={Paperclip} color={colors.blocks.violet} tone="tint" size="md" />
                      <Text className="flex-1 text-[14px] font-semibold text-ink" numberOfLines={1}>
                        {file.name}
                      </Text>
                      {downloading === String(file.id) ? (
                        <Spinner />
                      ) : (
                        <Download size={18} strokeWidth={2.2} color={colors.faint} />
                      )}
                    </Row>
                  </Pressable>
                  {index < attachments.length - 1 ? <Divider className="ml-16" /> : null}
                </View>
              ))}
            </Card>
          ) : null}

          {needsAction ? (
            <Button
              action="primary"
              size="lg"
              block
              disabled={confirm.isPending}
              onPress={() => {
                // Race-Condition-Guard wie in der Listenkarte.
                if (confirm.isPending || localConfirmed) return;
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
            <Row
              className="justify-center gap-2 rounded-[20px] py-3.5"
              style={{ backgroundColor: tint(resolveThemeColor(colors.blocks.mint, isDark), 0.35) }}
            >
              <CheckCheck size={18} strokeWidth={2.4} color={colors.success} />
              <Text className="text-[14px] font-bold text-ink">
                {letter.confirmed || localConfirmed ? 'Bestätigt' : 'Keine Bestätigung nötig'}
              </Text>
            </Row>
          )}

          <Chip label="Bestätigungen gehen direkt an die Schule." color={colors.faint} />
        </View>
      ) : null}
    </Sheet>
  );
}
