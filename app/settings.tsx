/**
 * Einstellungen Screen — Redesign mit satten Farbflächen & großen Icon-Badges.
 */
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  FlaskConical,
  Info,
  LayoutGrid,
  Lock,
  Palette,
  Phone,
  Rocket,
  School,
  Shield,
  Trash2,
  UserRound,
} from 'lucide-react-native';

import { useModuleActive, useSnapshot } from '@/data/queries';
import { WEB_USES_CORS_PROXY } from '@/api/client';
import { requestPermission, syncNotifications } from '@/features/notifications/scheduler';
import { getNativeIsland } from '@/features/island/bridge';
import {
  Card,
  Chip,
  ColorBlockCard,
  IconBadge,
  IconButton,
  Muted,
  Pill,
  Row,
  Screen,
  SectionHeader,
  Title,
} from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner, Switch } from '@/ui/gluestack/feedback';
import { useSession } from '@/state/session';
import { DEFAULT_SETTINGS, WIDGET_META, useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, radius, shadow } from '@/design/tokens';
import { PressableScale } from '@/ui/motion';

export default function SettingsScreen() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { data } = useSnapshot();
  const {
    settings,
    update,
    updateNotifications,
    toggleWidget,
    moveWidget,
    setCredentials,
    getCredentials,
    clearCredentials,
  } = useSettings();
  const { status, error, connect, disconnect, accountChoices, twoFactor } = useSession();

  const [email, setEmail] = useState(settings.email);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void getCredentials().then((stored) => {
      if (stored) {
        setEmail(stored.email);
        setPassword(stored.password);
      }
    });
  }, [getCredentials]);

  const connected = status === 'connected';

  const handleConnect = async () => {
    setNotice(null);
    await setCredentials(email.trim(), password);
    const ok = await connect(email.trim(), password, code ? { twoFactorCode: code } : undefined);
    setNotice(ok ? 'Verbunden. Deine echten Schuldaten werden geladen.' : null);
  };

  const handleDisconnect = async () => {
    await disconnect();
    await clearCredentials();
    setPassword('');
    setNotice('Abgemeldet. Schulflow zeigt wieder den Demo-Datensatz.');
  };

  const handleTestNotifications = async () => {
    if (!data) return;
    const count = await syncNotifications(data, settings.notifications, { force: true });
    setNotice(
      Platform.OS === 'web'
        ? 'Benachrichtigungen gibt es nur in der nativen App.'
        : `${count} Benachrichtigungen geplant.`,
    );
  };

  const nativeIsland = Platform.OS !== 'web' ? getNativeIsland() : null;

  const gradesOn = useModuleActive('grades');
  const messengerOn = useModuleActive('messenger');
  const lettersOn = useModuleActive('letters');

  const handleToggleIsland = async (value: boolean) => {
    update({ liveIsland: value });
    if (value && Platform.OS === 'android') {
      const granted = await requestPermission();
      if (!granted) {
        setNotice(
          'Benachrichtigungen sind blockiert. Die Insel läuft nur in der App, bis du sie in den Systemeinstellungen erlaubst.',
        );
      }
    }
  };

  return (
    <Screen adaptive="content">
      <Row className="justify-between px-4 pb-2 pt-2">
        <Row className="gap-2.5">
          <IconButton icon="chevron-back" onPress={() => router.back()} color={colors.muted} size={40} />
          <Title>Einstellungen</Title>
        </Row>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ---------------------------------------------------------- Konto */}
        <View className="mb-4 mt-2">
          <ColorBlockCard color={colors.accent.amber} tone="tint" padded={false} className="overflow-hidden">
            <View className="p-5">
              <Row className="gap-3">
                <IconBadge icon={Lock} color={colors.accent.amber} tone="solid" size={44} iconSize={22} />
                <View className="flex-1">
                  <Text className="text-[17px] font-extrabold text-ink">Schulmanager-Konto</Text>
                  <Muted className="text-[12px] font-medium">Direkt & verschlüsselt gespeichert</Muted>
                </View>
                {connected ? (
                  <Pill label="Verbunden" color={colors.success} tone="solid" />
                ) : (
                  <Pill label="Demo-Modus" color={colors.accent.amber} tone="solid" />
                )}
              </Row>

              <Muted className="mt-3 text-[12px] leading-5 text-ink/80">
                Schulflow meldet sich direkt bei Schulmanager Online an. Zugangsdaten liegen
                verschlüsselt auf deinem Gerät ({Platform.OS === 'web' ? 'Browser-Speicher' : 'Keychain / Keystore'}).
              </Muted>

              <Text className="mb-1.5 mt-4 text-[12px] font-extrabold text-ink">E-Mail-Adresse</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@beispiel.de"
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="h-12 rounded-2xl bg-surface px-4 text-[15px] font-semibold text-ink"
                style={shadow.card}
              />

              <Text className="mb-1.5 mt-3 text-[12px] font-extrabold text-ink">Passwort</Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.faint}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="h-12 rounded-2xl bg-surface px-4 pr-12 text-[15px] font-semibold text-ink"
                  style={shadow.card}
                />
                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  className="absolute right-3.5 top-3"
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? (
                    <EyeOff size={20} strokeWidth={2.2} color={colors.faint} />
                  ) : (
                    <Eye size={20} strokeWidth={2.2} color={colors.faint} />
                  )}
                </Pressable>
              </View>

              {twoFactor ? (
                <>
                  <Text className="mb-1.5 mt-3 text-[12px] font-extrabold text-ink">
                    {twoFactor === 'email' ? 'Code aus der E-Mail' : 'Code aus der Authenticator-App'}
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor={colors.faint}
                    keyboardType="number-pad"
                    className="h-12 rounded-2xl bg-surface px-4 text-[15px] font-bold text-ink"
                    style={shadow.card}
                  />
                </>
              ) : null}

              {accountChoices?.length ? (
                <View className="mt-3 gap-2">
                  <Muted className="text-[12px] font-bold">Mehrere Konten gefunden — bitte auswählen:</Muted>
                  {accountChoices.map((account) => (
                    <Pressable
                      key={String(account.userId)}
                      onPress={() => void connect(email, password, { userId: account.userId })}
                      className="rounded-2xl bg-surface p-3"
                      style={shadow.card}
                    >
                      <Text className="text-[14px] font-extrabold text-ink">
                        {account.firstname} {account.lastname}
                      </Text>
                      <Muted className="text-[12px]">{account.institutionName}</Muted>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {error ? (
                <Row className="mt-3 gap-2 rounded-2xl bg-danger/15 p-3">
                  <AlertTriangle size={17} strokeWidth={2.2} color={colors.danger} />
                  <Text className="flex-1 text-[12px] font-bold text-danger">{error}</Text>
                </Row>
              ) : null}
              {notice ? (
                <Row className="mt-3 gap-2 rounded-2xl bg-success/15 p-3">
                  <CheckCircle2 size={17} strokeWidth={2.2} color={colors.success} />
                  <Text className="flex-1 text-[12px] font-bold text-success">{notice}</Text>
                </Row>
              ) : null}

              <Row className="mt-4 gap-2.5">
                <Button
                  action={connected ? 'surface' : 'primary'}
                  size="md"
                  block={!connected}
                  onPress={handleConnect}
                  className="flex-1"
                >
                  {status === 'connecting' ? <Spinner color={colors.on.amber} /> : null}
                  <ButtonText>{connected ? 'Erneut verbinden' : 'Verbinden'}</ButtonText>
                </Button>
                {connected ? (
                  <Button action="danger" size="md" onPress={handleDisconnect}>
                    <ButtonText>Abmelden</ButtonText>
                  </Button>
                ) : null}
              </Row>

              <Row className="mt-4 justify-between rounded-2xl bg-surface p-3" style={shadow.card}>
                <Row className="gap-3">
                  <IconBadge icon={FlaskConical} color={colors.accent.amber} size={36} iconSize={18} />
                  <View>
                    <Text className="text-[14px] font-extrabold text-ink">Demo-Modus</Text>
                    <Muted className="text-[11px]">Beispieldaten anzeigen</Muted>
                  </View>
                </Row>
                <Switch
                  value={settings.demoMode}
                  onValueChange={(value) => update({ demoMode: value })}
                />
              </Row>
            </View>
          </ColorBlockCard>
        </View>

        {/* ---------------------------------------------------------- Schule */}
        {data?.institution ? (
          <View className="mb-4">
            <ColorBlockCard color={colors.category.purple.solid} tone="tint" padded={false} className="overflow-hidden">
              <View className="p-5">
                <Row className="gap-3">
                  <IconBadge icon={School} color={colors.category.purple.solid} tone="solid" size={44} iconSize={22} />
                  <View className="flex-1">
                    <Text className="text-[17px] font-extrabold text-ink">{data.institution.name ?? 'Schule'}</Text>
                    <Muted className="text-[12px]">
                      {[data.institution.street, data.institution.city].filter(Boolean).join(', ')}
                    </Muted>
                  </View>
                </Row>

                <View className="mt-3 gap-2">
                  <Row className="justify-between rounded-2xl bg-surface p-3" style={shadow.card}>
                    <Row className="gap-2.5">
                      <IconBadge icon={UserRound} color={colors.category.purple.solid} size={32} iconSize={16} />
                      <View>
                        <Text className="text-[13px] font-bold text-ink">
                          {`${data.student?.firstname ?? ''} ${data.student?.lastname ?? ''}`.trim() || 'Schüler:in'}
                        </Text>
                        <Muted className="text-[11px]">
                          {data.student?.className ? `Klasse ${data.student.className}` : 'Eingeschrieben'}
                        </Muted>
                      </View>
                    </Row>
                  </Row>

                  <View className="rounded-2xl bg-surface p-3" style={shadow.card}>
                    <Text className="text-[12px] font-extrabold uppercase tracking-wider text-muted">
                      Freigeschaltete Module
                    </Text>
                    <Row className="mt-2 flex-wrap gap-1.5">
                      {(data.modules ?? []).map((module) => (
                        <Pill key={module} label={module} color={colors.category.purple.solid} tone="tint" />
                      ))}
                    </Row>
                  </View>
                </View>
              </View>
            </ColorBlockCard>
          </View>
        ) : null}

        {/* ---------------------------------------------------------- Erscheinungsbild */}
        <View className="mb-4">
          <ColorBlockCard color={colors.category.lavender.solid} tone="tint" padded={false} className="overflow-hidden">
            <View className="p-5">
              <Row className="gap-3">
                <IconBadge icon={Palette} color={colors.category.lavender.solid} tone="solid" size={44} iconSize={22} />
                <View className="flex-1">
                  <Text className="text-[17px] font-extrabold text-ink">Erscheinungsbild</Text>
                  <Muted className="text-[12px]">Theming, Farbschema und Layout</Muted>
                </View>
              </Row>

              <Text className="mb-2 mt-4 text-[12px] font-extrabold uppercase tracking-wider text-muted">
                Farbschema
              </Text>
              <Row className="gap-2">
                {(['system', 'light', 'dark'] as const).map((option) => (
                  <PressableScale
                    key={option}
                    onPress={() => update({ theme: option })}
                    className={`min-h-[46px] flex-1 items-center justify-center rounded-2xl ${
                      settings.theme === option ? 'bg-accent-amber' : 'bg-surface'
                    }`}
                    style={shadow.card}
                    accessibilityRole="button"
                    accessibilityState={{ selected: settings.theme === option }}
                  >
                    <Text
                      className={`text-[14px] font-extrabold ${
                        settings.theme === option ? 'text-on-amber' : 'text-muted'
                      }`}
                    >
                      {option === 'system' ? 'System' : option === 'light' ? 'Hell' : 'Dunkel'}
                    </Text>
                  </PressableScale>
                ))}
              </Row>

              <View className="mt-3 gap-2">
                <Row className="justify-between rounded-2xl bg-surface p-3.5" style={shadow.card}>
                  <View className="flex-1 pr-2">
                    <Text className="text-[14px] font-extrabold text-ink">Kompakter Stundenplan</Text>
                    <Muted className="text-[11px]">Mehr Stunden auf einen Blick</Muted>
                  </View>
                  <Switch
                    value={settings.compactTimetable}
                    onValueChange={(value) => update({ compactTimetable: value })}
                  />
                </Row>

                <Row className="justify-between rounded-2xl bg-surface p-3.5" style={shadow.card}>
                  <View className="flex-1 pr-2">
                    <Text className="text-[14px] font-extrabold text-ink">Wochenende anzeigen</Text>
                    <Muted className="text-[11px]">Samstag & Sonntag im Plan</Muted>
                  </View>
                  <Switch
                    value={settings.showWeekend}
                    onValueChange={(value) => update({ showWeekend: value })}
                  />
                </Row>

                <Row className="justify-between rounded-2xl bg-surface p-3.5" style={shadow.card}>
                  <View className="flex-1 pr-2">
                    <Text className="text-[14px] font-extrabold text-ink">Haptisches Feedback</Text>
                    <Muted className="text-[11px]">Sanfte Vibration bei Taps</Muted>
                  </View>
                  <Switch
                    value={settings.hapticFeedback}
                    onValueChange={(value) => update({ hapticFeedback: value })}
                  />
                </Row>
              </View>
            </View>
          </ColorBlockCard>
        </View>

        {/* ---------------------------------------------------------- Dashboard-Widgets */}
        <View className="mb-4">
          <ColorBlockCard color={colors.category.blue.solid} tone="tint" padded={false} className="overflow-hidden">
            <View className="p-5">
              <Row className="gap-3">
                <IconBadge icon={LayoutGrid} color={colors.category.blue.solid} tone="solid" size={44} iconSize={22} />
                <View className="flex-1">
                  <Text className="text-[17px] font-extrabold text-ink">Dashboard-Widgets</Text>
                  <Muted className="text-[12px]">Kacheln aktivieren & sortieren</Muted>
                </View>
              </Row>

              <View className="mt-3 gap-2">
                {settings.widgets
                  .filter((widget) => widget.id !== 'grades' || gradesOn)
                  .map((widget) => {
                    const meta = WIDGET_META[widget.id];
                    return (
                      <Row
                        key={widget.id}
                        className="justify-between rounded-2xl bg-surface p-3"
                        style={shadow.card}
                      >
                        <View className="flex-1 pr-2">
                          <Text className="text-[14px] font-extrabold text-ink">{meta.title}</Text>
                          <Muted className="text-[11px] font-medium">{meta.description}</Muted>
                        </View>
                        <Row className="gap-1.5">
                          <IconButton
                            icon="chevron-up"
                            size={32}
                            background="bg-line/40"
                            color={colors.muted}
                            onPress={() => moveWidget(widget.id, -1)}
                          />
                          <IconButton
                            icon="chevron-down"
                            size={32}
                            background="bg-line/40"
                            color={colors.muted}
                            onPress={() => moveWidget(widget.id, 1)}
                          />
                          <Switch
                            value={widget.enabled}
                            onValueChange={() => toggleWidget(widget.id)}
                          />
                        </Row>
                      </Row>
                    );
                  })}
              </View>
            </View>
          </ColorBlockCard>
        </View>

        {/* ---------------------------------------------------------- Benachrichtigungen */}
        <View className="mb-4">
          <ColorBlockCard color={colors.warning} tone="tint" padded={false} className="overflow-hidden">
            <View className="p-5">
              <Row className="gap-3">
                <IconBadge icon={Bell} color={colors.warning} tone="solid" size={44} iconSize={22} />
                <View className="flex-1">
                  <Text className="text-[17px] font-extrabold text-ink">Benachrichtigungen</Text>
                  <Muted className="text-[12px]">Lokale Alarme für wichtige Ereignisse</Muted>
                </View>
              </Row>

              <View className="mt-3 gap-2">
                {(
                  [
                    ['substitutions', 'Vertretung & Entfall', 'Sofort bei Planänderung', 'core'],
                    ['firstHourCancelled', 'Ausschlafen-Alarm', 'Erste Stunde entfällt', 'core'],
                    ['homeworkDue', 'Hausaufgaben fällig', 'Abends vorher um 18:00', 'core'],
                    ['examCountdown', 'Klassenarbeiten', '7, 3 und 1 Tag vorher', 'core'],
                    ['newLetter', 'Neue Elternbriefe', 'Sofort', 'letters'],
                    ['letterReminder', 'Erinnerung Bestätigung', 'Nach 48h ohne Bestätigung', 'letters'],
                    ['newMessage', 'Neue Nachrichten', 'Sofort', 'messenger'],
                    ['newGrade', 'Neue Noten', 'Sofort bei Eintrag', 'grades'],
                    ['morningBriefing', 'Morgen-Briefing', 'Stunden & Packliste', 'core'],
                    ['weeklyReview', 'Wochenrückblick', 'Sonntags 18:00', 'core'],
                    ['unexcusedAbsence', 'Unentschuldigte Fehlzeit', 'Sofort', 'core'],
                  ] as const
                )
                  .filter(
                    ([, , , module]) =>
                      module === 'core' ||
                      (module === 'grades' && gradesOn) ||
                      (module === 'messenger' && messengerOn) ||
                      (module === 'letters' && lettersOn),
                  )
                  .map(([key, title, subtitle]) => (
                    <Row
                      key={key}
                      className="justify-between rounded-2xl bg-surface p-3"
                      style={shadow.card}
                    >
                      <View className="flex-1 pr-2">
                        <Text className="text-[13.5px] font-extrabold text-ink">{title}</Text>
                        <Muted className="text-[11px]">{subtitle}</Muted>
                      </View>
                      <Switch
                        value={settings.notifications[key] as boolean}
                        onValueChange={(value) => updateNotifications({ [key]: value } as never)}
                      />
                    </Row>
                  ))}

                <View className="mt-2 rounded-2xl bg-surface p-3.5" style={shadow.card}>
                  <Muted className="text-[11.5px] font-medium">
                    Ruhezeit {settings.notifications.quietHours.from}–{settings.notifications.quietHours.to} ·
                    Briefing um {settings.notifications.briefingTime} Uhr
                  </Muted>
                  <Button action="secondary" size="sm" className="mt-2.5" onPress={handleTestNotifications}>
                    <ButtonText>Zeitplan jetzt neu berechnen</ButtonText>
                  </Button>
                </View>
              </View>
            </View>
          </ColorBlockCard>
        </View>

        {/* ---------------------------------------------------------- Live-Island */}
        <View className="mb-4">
          <ColorBlockCard color={colors.accent.violet} tone="tint" padded={false} className="overflow-hidden">
            <View className="p-5">
              <Row className="gap-3">
                <IconBadge icon={Rocket} color={colors.accent.violet} tone="solid" size={44} iconSize={22} />
                <View className="flex-1">
                  <Text className="text-[17px] font-extrabold text-ink">Live-Island</Text>
                  <Muted className="text-[12px]">Laufende & nächste Stunde im Blick</Muted>
                </View>
                <Switch
                  value={settings.liveIsland}
                  onValueChange={(value) => void handleToggleIsland(value)}
                />
              </Row>
              <Muted className="mt-3 text-[12px] leading-5 text-ink/80">
                {Platform.OS === 'android'
                  ? nativeIsland
                    ? 'Volle Variante: dauerhafte System-Notification mit Fortschrittsbalken — auf HyperOS als Fokus-Notification um die Kamera.'
                    : 'Stille Notification mit Countdown. Mit einem Dev-Build als echte Live-Update-Notification.'
                  : Platform.OS === 'web'
                    ? 'Insel klebt oben mittig in der Web-App — Browser-Tab tickt im Takt des Countdowns mit.'
                    : 'Die Insel zeigt die laufende bzw. nächste Stunde prominent oben in der App.'}
              </Muted>
            </View>
          </ColorBlockCard>
        </View>

        {/* ---------------------------------------------------------- Datenschutz */}
        <View className="mb-4">
          <ColorBlockCard color={colors.category.green.solid} tone="tint" padded={false} className="overflow-hidden">
            <View className="p-5">
              <Row className="gap-3">
                <IconBadge icon={Shield} color={colors.category.green.solid} tone="solid" size={44} iconSize={22} />
                <View className="flex-1">
                  <Text className="text-[17px] font-extrabold text-ink">Datenschutz</Text>
                  <Muted className="text-[12px]">Sicherheit & lokale Datenkontrolle</Muted>
                </View>
              </Row>

              <View className="mt-3 gap-2">
                {gradesOn ? (
                  <Row className="justify-between rounded-2xl bg-surface p-3.5" style={shadow.card}>
                    <View className="flex-1 pr-2">
                      <Text className="text-[14px] font-extrabold text-ink">Noten verbergen</Text>
                      <Muted className="text-[11px]">Zeigt ••• bis zum Aufdecken</Muted>
                    </View>
                    <Switch
                      value={settings.hideGrades}
                      onValueChange={(value) => update({ hideGrades: value })}
                    />
                  </Row>
                ) : null}

                <Row className="justify-between rounded-2xl bg-surface p-3.5" style={shadow.card}>
                  <View className="flex-1 pr-2">
                    <Text className="text-[14px] font-extrabold text-ink">Biometrie beim Start</Text>
                    <Muted className="text-[11px]">Face ID / Fingerabdruck-Sperre</Muted>
                  </View>
                  <Switch
                    value={settings.requireBiometrics}
                    onValueChange={(value) => update({ requireBiometrics: value })}
                  />
                </Row>

                <PressableScale
                  onPress={() => {
                    const reset = async () => {
                      await clearCredentials();
                      update(DEFAULT_SETTINGS);
                      setNotice('Alle lokalen Daten wurden gelöscht.');
                    };
                    if (Platform.OS === 'web') void reset();
                    else
                      Alert.alert('Wirklich löschen?', 'Alle lokal gespeicherten Daten werden entfernt.', [
                        { text: 'Abbrechen', style: 'cancel' },
                        { text: 'Löschen', style: 'destructive', onPress: () => void reset() },
                      ]);
                  }}
                  className="rounded-2xl bg-danger/15 p-3.5"
                >
                  <Row className="gap-3">
                    <IconBadge icon={Trash2} color={colors.danger} tone="solid" size={36} iconSize={18} />
                    <View className="flex-1">
                      <Text className="text-[14px] font-extrabold text-danger">Lokale Daten löschen</Text>
                      <Muted className="text-[11px] text-danger/80">
                        Cache, Haken und Zugangsdaten zurücksetzen
                      </Muted>
                    </View>
                  </Row>
                </PressableScale>
              </View>
            </View>
          </ColorBlockCard>
        </View>

        {/* ---------------------------------------------------------- Über */}
        <View className="mb-4">
          <ColorBlockCard color={colors.charcoal} tone="tint" padded={false} className="overflow-hidden">
            <View className="p-5">
              <Row className="gap-3">
                <IconBadge icon={Info} color={colors.charcoal} tone="solid" size={44} iconSize={22} />
                <View className="flex-1">
                  <Text className="text-[17px] font-extrabold text-ink">Über Schulflow</Text>
                  <Muted className="text-[12px]">Version 1.0 · Inoffizieller Client</Muted>
                </View>
              </Row>

              <Muted className="mt-3 text-[12px] leading-5 text-ink/80">
                Inoffizieller Client für Schulmanager Online. Keine Verbindung zur Schulmanager Online GmbH.
                Datenabrufe erfolgen sparsam, gebündelt und unter Einhaltung des Server-Rate-Limits.
              </Muted>

              <Row className="mt-3.5 flex-wrap gap-2">
                <Pill label="React Native" color={colors.accent.violet} tone="solid" />
                <Pill label="Expo SDK 54" color={colors.charcoal} tone="solid" />
                <Pill label="gluestack-ui" color={colors.success} tone="solid" />
                <Pill label="NativeWind" color={colors.accent.amber} tone="solid" />
              </Row>
            </View>
          </ColorBlockCard>
        </View>
      </ScrollView>
    </Screen>
  );
}
