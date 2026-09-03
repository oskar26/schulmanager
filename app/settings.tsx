import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useModuleActive, useSnapshot } from '@/data/queries';
import { WEB_USES_CORS_PROXY } from '@/api/client';
import { requestPermission, syncNotifications } from '@/features/notifications/scheduler';
import { getNativeIsland } from '@/features/island/bridge';
import { Card, Chip, Divider, IconButton, Ionicons, ListRow, Muted, Row, Screen, SectionHeader, Title } from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner, Switch } from '@/ui/gluestack/feedback';
import { useSession } from '@/state/session';
import { DEFAULT_SETTINGS, WIDGET_META, useSettings } from '@/state/settings';

export default function SettingsScreen() {
  const router = useRouter();
  const { data } = useSnapshot();
  const { settings, update, updateNotifications, toggleWidget, moveWidget, setCredentials, getCredentials, clearCredentials } =
    useSettings();
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

  // Modul-abhängige Zeilen: Was die Schule nicht gebucht hat, verschwindet
  // auch aus den Einstellungen (Noten-Tab macht es identisch).
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
        <Row className="gap-2">
          <IconButton icon="chevron-back" onPress={() => router.back()} color="#6A7086" size={36} />
          <Title>Einstellungen</Title>
        </Row>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ---------------------------------------------------------- Konto */}
        <SectionHeader title="Konto" emoji="🔐" />
        <Card padded={false}>
          <View className="p-4">
            <Muted className="text-[12px]">
              Schulflow meldet sich direkt bei Schulmanager Online an. E-Mail und Passwort werden
              verschlüsselt auf dem Gerät gespeichert ({Platform.OS === 'web' ? 'Browser-Speicher' : 'Keychain / Keystore'})
              und ausschließlich an login.schulmanager-online.de gesendet.
              {WEB_USES_CORS_PROXY
                ? ' Im Web laufen die Aufrufe über den eingebauten CORS-Proxy dieser Installation — er reicht sie unverändert an login.schulmanager-online.de weiter.'
                : ''}
            </Muted>

            <Text className="mb-1.5 mt-4 text-[12px] font-bold text-muted">E-Mail-Adresse</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@beispiel.de"
              placeholderTextColor="#9CA2B6"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              className="h-12 rounded-2xl border border-line bg-bg px-4 text-[15px] text-ink"
            />

            <Text className="mb-1.5 mt-3 text-[12px] font-bold text-muted">Passwort</Text>
            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9CA2B6"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="h-12 rounded-2xl border border-line bg-bg px-4 pr-12 text-[15px] text-ink"
              />
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-3"
                hitSlop={8}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA2B6" />
              </Pressable>
            </View>

            {twoFactor ? (
              <>
                <Text className="mb-1.5 mt-3 text-[12px] font-bold text-muted">
                  {twoFactor === 'email' ? 'Code aus der E-Mail' : 'Code aus der Authenticator-App'}
                </Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  placeholderTextColor="#9CA2B6"
                  keyboardType="number-pad"
                  className="h-12 rounded-2xl border border-line bg-bg px-4 text-[15px] text-ink"
                />
              </>
            ) : null}

            {accountChoices?.length ? (
              <View className="mt-3 gap-2">
                <Muted className="text-[12px]">Mehrere Konten gefunden — bitte auswählen:</Muted>
                {accountChoices.map((account) => (
                  <Pressable
                    key={String(account.userId)}
                    onPress={() => void connect(email, password, { userId: account.userId })}
                    className="rounded-2xl border border-line px-3 py-2.5 active:bg-line/40"
                  >
                    <Text className="text-[14px] font-semibold text-ink">
                      {account.firstname} {account.lastname}
                    </Text>
                    <Muted className="text-[12px]">{account.institutionName}</Muted>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {error ? (
              <Row className="mt-3 gap-2 rounded-2xl bg-danger/10 p-3">
                <Ionicons name="warning-outline" size={16} color="#E24848" />
                <Text className="flex-1 text-[12px] text-danger">{error}</Text>
              </Row>
            ) : null}
            {notice ? (
              <Row className="mt-3 gap-2 rounded-2xl bg-success/10 p-3">
                <Ionicons name="checkmark-circle-outline" size={16} color="#22B07A" />
                <Text className="flex-1 text-[12px] text-success">{notice}</Text>
              </Row>
            ) : null}

            <Row className="mt-4 gap-2">
              <Button
                action={connected ? 'surface' : 'primary'}
                size="md"
                block={!connected}
                onPress={handleConnect}
                className="flex-1"
              >
                {status === 'connecting' ? <Spinner color="#FFFFFF" /> : null}
                <ButtonText>{connected ? 'Erneut verbinden' : 'Verbinden'}</ButtonText>
              </Button>
              {connected ? (
                <Button action="danger" size="md" onPress={handleDisconnect}>
                  <ButtonText>Abmelden</ButtonText>
                </Button>
              ) : null}
            </Row>
          </View>

          <Divider />
          <ListRow
            icon="flask-outline"
            iconColor="#FAC748"
            title="Demo-Modus"
            subtitle="Erfundene Beispieldaten statt echter Schuldaten"
            right={
              <Switch
                value={settings.demoMode}
                onValueChange={(value) => update({ demoMode: value })}
              />
            }
          />
        </Card>

        {/* ---------------------------------------------------------- Schule */}
        {data?.institution ? (
          <>
            <SectionHeader title="Schule" emoji="🏫" />
            <Card padded={false}>
              <ListRow icon="business-outline" title={data.institution.name ?? '—'} subtitle={[data.institution.street, data.institution.city].filter(Boolean).join(', ')} />
              <Divider className="ml-16" />
              <ListRow icon="call-outline" title="Sekretariat" subtitle={data.institution.phone ?? '—'} />
              <Divider className="ml-16" />
              <ListRow icon="person-outline" title={`${data.student?.firstname ?? ''} ${data.student?.lastname ?? ''}`.trim() || 'Kind'} subtitle={data.student?.className ? `Klasse ${data.student.className}` : undefined} />
              <Divider className="ml-16" />
              <View className="p-4">
                <Muted className="text-[11px]">Freigeschaltete Module</Muted>
                <Row className="mt-2 flex-wrap gap-1.5">
                  {(data.modules ?? []).map((module) => (
                    <Chip key={module} label={module} color="#6C5CE7" />
                  ))}
                </Row>
              </View>
            </Card>
          </>
        ) : null}

        {/* ---------------------------------------------------------- Dashboard */}
        <SectionHeader title="Dashboard-Widgets" emoji="🧩" />
        <Card padded={false}>
          {settings.widgets
            .filter((widget) => widget.id !== 'grades' || gradesOn)
            .map((widget, index, visibleWidgets) => {
            const meta = WIDGET_META[widget.id];
            return (
              <View key={widget.id}>
                <Row className="gap-3 px-4 py-3">
                  <Text className="text-[18px]">{meta.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-ink">{meta.title}</Text>
                    <Muted className="text-[11px]">{meta.description}</Muted>
                  </View>
                  <Row className="gap-1">
                    <IconButton
                      icon="chevron-up"
                      size={28}
                      background="bg-line/50"
                      color="#6A7086"
                      onPress={() => moveWidget(widget.id, -1)}
                    />
                    <IconButton
                      icon="chevron-down"
                      size={28}
                      background="bg-line/50"
                      color="#6A7086"
                      onPress={() => moveWidget(widget.id, 1)}
                    />
                    <Switch value={widget.enabled} onValueChange={() => toggleWidget(widget.id)} />
                  </Row>
                </Row>
                {index < visibleWidgets.length - 1 ? <Divider className="ml-4" /> : null}
              </View>
            );
          })}
        </Card>

        {/* ---------------------------------------------------------- Benachrichtigungen */}
        <SectionHeader title="Benachrichtigungen" emoji="🔔" />
        <Card padded={false}>
          {(
            [
              ['substitutions', 'Vertretung & Entfall', 'Sofort, sobald sich der Plan ändert', 'core'],
              ['firstHourCancelled', 'Ausschlafen-Alarm', 'Wenn die erste Stunde entfällt', 'core'],
              ['homeworkDue', 'Hausaufgaben fällig', 'Abends vorher um 18:00', 'core'],
              ['examCountdown', 'Klassenarbeiten', '7, 3 und 1 Tag vorher', 'core'],
              ['newLetter', 'Neue Elternbriefe', 'Sofort', 'letters'],
              ['letterReminder', 'Erinnerung Bestätigung', 'Nach 48 Stunden ohne Bestätigung', 'letters'],
              ['newMessage', 'Neue Nachrichten', 'Sofort', 'messenger'],
              ['newGrade', 'Neue Noten', 'Sobald eine Note eingetragen wird', 'grades'],
              ['morningBriefing', 'Morgen-Briefing', 'Stunden, Aufgaben und Packliste', 'core'],
              ['eveningCheck', 'Abend-Check', '20:00 „Alles für morgen bereit?"', 'core'],
              ['weeklyReview', 'Wochenrückblick', 'Sonntags um 18:00', 'core'],
              ['unexcusedAbsence', 'Unentschuldigte Fehlzeit', 'Sobald eine auftaucht', 'core'],
            ] as const
          )
            .filter(
              ([, , , module]) =>
                module === 'core' ||
                (module === 'grades' && gradesOn) ||
                (module === 'messenger' && messengerOn) ||
                (module === 'letters' && lettersOn),
            )
            .map(([key, title, subtitle], index, array) => (
            <View key={key}>
              <ListRow
                title={title}
                subtitle={subtitle}
                right={
                  <Switch
                    value={settings.notifications[key] as boolean}
                    onValueChange={(value) => updateNotifications({ [key]: value } as never)}
                  />
                }
              />
              {index < array.length - 1 ? <Divider className="ml-4" /> : null}
            </View>
          ))}
          <Divider />
          <View className="p-4">
            <Muted className="text-[11px]">
              Ruhezeit {settings.notifications.quietHours.from}–{settings.notifications.quietHours.to} ·
              Briefing um {settings.notifications.briefingTime}
            </Muted>
            <Button action="secondary" size="sm" className="mt-3" onPress={handleTestNotifications}>
              <ButtonText>Zeitplan jetzt neu berechnen</ButtonText>
            </Button>
          </View>
        </Card>

        {/* ---------------------------------------------------------- Live-Island */}
        <SectionHeader title="Live-Island" emoji="🏝️" />
        <Card padded={false}>
          <ListRow
            title="Insel oben mittig"
            subtitle="Laufende & nächste Stunde — mit Countdown und Fortschritt"
            right={<Switch value={settings.liveIsland} onValueChange={(value) => void handleToggleIsland(value)} />}
          />
          <Divider className="ml-4" />
          <View className="px-4 py-3">
            <Muted className="text-[11px] leading-4">
              {Platform.OS === 'android'
                ? nativeIsland
                  ? 'Auf diesem Gerät die volle Variante: dauerhafte System-Notification mit Fortschritt — auf Xiaomi HyperOS erscheint sie automatisch als Fokus-Notification um die Kamera („HyperIsland"), auf neuen Android-Versionen als Live-Update-Chip in der Statusleiste.'
                  : 'Im Standard (Expo Go) zeigt eine stille Notification den Countdown. Mit einem Dev-Build wird sie zur echten Live-Update-Notification — auf Xiaomi HyperOS zur Fokus-Notification um die Kamera.'
                : Platform.OS === 'ios'
                  ? 'In der App schwebt die Insel oben mittig wie eine Dynamic Island. Echte Live Activities auf Lockscreen und in der Dynamic Island (iPhone 14 Pro+) kommen mit dem WidgetKit-Modul — der Fahrplan steht in docs/PLATTFORMEN.md.'
                  : Platform.OS === 'web'
                    ? 'Die Insel klebt oben mittig in der App — und der Browser-Tab-Titel tickt im Takt des Countdowns mit. Tipp: „App installieren" macht aus der Web-Version eine richtige PWA.'
                    : 'Die Insel zeigt die laufende bzw. nächste Stunde prominent oben in der App.'}
            </Muted>
          </View>
        </Card>

        {/* ---------------------------------------------------------- Erscheinungsbild */}
        <SectionHeader title="Erscheinungsbild" emoji="🎨" />
        <Card padded={false}>
          <View className="p-4">
            <Muted className="mb-2 text-[12px]">Farbschema</Muted>
            <Row className="gap-2">
              {(['system', 'light', 'dark'] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => update({ theme: option })}
                  className={`flex-1 items-center rounded-2xl py-2.5 ${
                    settings.theme === option ? 'bg-brand' : 'bg-line/50'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      settings.theme === option ? 'text-white' : 'text-muted'
                    }`}
                  >
                    {option === 'system' ? 'System' : option === 'light' ? 'Hell' : 'Dunkel'}
                  </Text>
                </Pressable>
              ))}
            </Row>
          </View>
          <Divider />
          <ListRow
            title="Kompakter Stundenplan"
            subtitle="Mehr Stunden auf einen Blick"
            right={
              <Switch value={settings.compactTimetable} onValueChange={(value) => update({ compactTimetable: value })} />
            }
          />
          <Divider className="ml-4" />
          <ListRow
            title="Wochenende anzeigen"
            right={<Switch value={settings.showWeekend} onValueChange={(value) => update({ showWeekend: value })} />}
          />
          <Divider className="ml-4" />
          <ListRow
            title="Haptisches Feedback"
            right={
              <Switch value={settings.hapticFeedback} onValueChange={(value) => update({ hapticFeedback: value })} />
            }
          />
        </Card>

        {/* ---------------------------------------------------------- Datenschutz */}
        <SectionHeader title="Datenschutz" emoji="🛡️" />
        <Card padded={false}>
          {gradesOn ? (
            <>
              <ListRow
                icon="eye-off-outline"
                iconColor="#48A3FF"
                title="Noten verbergen"
                subtitle="Zeigt •••, bis du sie einblendest"
                right={<Switch value={settings.hideGrades} onValueChange={(value) => update({ hideGrades: value })} />}
              />
              <Divider className="ml-16" />
            </>
          ) : null}
          <ListRow
            icon="finger-print-outline"
            iconColor="#22B07A"
            title="Biometrie beim Start"
            subtitle="Face ID / Fingerabdruck vor dem Öffnen"
            right={
              <Switch
                value={settings.requireBiometrics}
                onValueChange={(value) => update({ requireBiometrics: value })}
              />
            }
          />
          <Divider className="ml-16" />
          <ListRow
            icon="trash-outline"
            iconColor="#E24848"
            danger
            title="Lokale Daten löschen"
            subtitle="Cache, Haken und gespeicherte Zugangsdaten"
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
          />
        </Card>

        {/* ---------------------------------------------------------- Über */}
        <SectionHeader title="Über Schulflow" emoji="ℹ️" />
        <Card>
          <Text className="text-[14px] font-bold text-ink">Schulflow 1.0</Text>
          <Muted className="mt-1 text-[12px]">
            Inoffizieller Client für Schulmanager Online. Keine Verbindung zur Schulmanager Online GmbH.
            Nutzung auf eigene Verantwortung — Schulflow ruft Daten sparsam ab, bündelt alle Anfragen
            und respektiert das Rate-Limit des Servers.
          </Muted>
          <Row className="mt-3 flex-wrap gap-2">
            <Chip label="React Native · Expo" color="#6C5CE7" />
            <Chip label="gluestack-ui" color="#22B07A" />
            <Chip label="Tamagui" color="#48A3FF" />
            <Chip label="NativeWind" color="#BD7AF6" />
          </Row>
        </Card>

        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}
