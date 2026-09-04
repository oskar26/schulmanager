import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeBack } from '@/ui/navigation';
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
  type LucideIcon,
} from 'lucide-react-native';

import { useModuleActive, useSnapshot } from '@/data/queries';
import { WEB_USES_CORS_PROXY } from '@/api/client';
import { requestPermission, syncNotifications } from '@/features/notifications/scheduler';
import { getNativeIsland } from '@/features/island/bridge';
import {
  BlockCaption,
  BlockText,
  Card,
  ColorBlockCard,
  Divider,
  IconBadge,
  IconButton,
  Muted,
  Pill,
  Row,
  Screen,
  SegmentedControl,
  Title,
} from '@/ui/primitives';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner, Switch } from '@/ui/gluestack/feedback';
import { useSession } from '@/state/session';
import { DEFAULT_SETTINGS, WIDGET_META, useSettings, type WidgetId } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { foregroundOn, resolveThemeColor } from '@/design/tokens';
import { tint } from '@/design/subjects';
import { PressableOpacity } from '@/ui/motion';

/* ------------------------------------------------------------------ Bausteine (Phase 8) */

/**
 * Sektions-Kopf im Farbflächen-Stil: vollflächige Farbkarte mit großem
 * Icon-Badge (≥ lg) und fettem Titel — ersetzt die frühere
 * Android-Settings-Listenoptik aus kleinem Icon + dünner Trennlinie.
 */
function SectionBlock({
  icon,
  color,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  const { colors, isDark } = useThemeColors();
  const tone = resolveThemeColor(color, isDark);
  const ink = foregroundOn(tone, colors);
  return (
    <ColorBlockCard color={tone} className="mb-2.5 mt-6" style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
      <Row className="gap-3.5">
        <IconBadge icon={icon} color={ink} tone="tint" size="lg" />
        <View className="min-w-0 flex-1">
          <BlockText className="text-[19px] font-extrabold leading-6" numberOfLines={2}>
            {title}
          </BlockText>
          {hint ? (
            <BlockCaption className="mt-0.5 text-[12.5px] leading-[17px]" numberOfLines={3}>
              {hint}
            </BlockCaption>
          ) : null}
        </View>
        {action ? <View style={{ flexShrink: 0 }}>{action}</View> : null}
      </Row>
    </ColorBlockCard>
  );
}

/**
 * Toggle-Zeile mit ≥ 56 px Höhe und großzügigem Weißraum. Trennlinien gibt es
 * nur noch *innerhalb* einer Gruppe (`SettingsGroup`), nie zwischen Gruppen.
 */
function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  icon,
  iconColor,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  icon?: LucideIcon;
  iconColor?: string;
}) {
  return (
    <Row className="min-h-[56px] gap-3 px-4 py-3.5">
      {icon ? <IconBadge icon={icon} color={iconColor} tone="tint" size="md" /> : null}
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-bold text-ink">{title}</Text>
        {subtitle ? <Muted className="mt-0.5 text-[12px] leading-[16px]">{subtitle}</Muted> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={title} />
    </Row>
  );
}

/** Info-/Aktionszeile ohne Toggle — gleicher Rhythmus wie `ToggleRow`. */
function InfoRow({
  title,
  subtitle,
  icon,
  iconColor,
  onPress,
  danger,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useThemeColors();
  const content = (
    <Row className="min-h-[56px] gap-3 px-4 py-3.5">
      {icon ? <IconBadge icon={icon} color={danger ? colors.danger : iconColor} tone="tint" size="md" /> : null}
      <View className="min-w-0 flex-1">
        <Text className={`text-[15px] font-bold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</Text>
        {subtitle ? <Muted className="mt-0.5 text-[12px] leading-[16px]">{subtitle}</Muted> : null}
      </View>
    </Row>
  );
  if (!onPress) return content;
  return (
    <PressableOpacity onPress={onPress} accessibilityRole="button" className="hover:bg-line/40 active:bg-line/60">
      {content}
    </PressableOpacity>
  );
}

/** Gruppen-Karte: weiße Surface-Karte, Trennlinien nur zwischen ihren Zeilen. */
function SettingsGroup({ children }: { children: React.ReactNode }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <Card padded={false} className="mb-2.5 overflow-hidden">
      {rows.map((row, index) => (
        <View key={index}>
          {index > 0 ? <Divider className="ml-4" /> : null}
          {row}
        </View>
      ))}
    </Card>
  );
}

/* ------------------------------------------------------------------ Screen */

export default function SettingsScreen() {
  const { colors, isDark } = useThemeColors();
  const dismiss = useSafeBack();
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

  const visibleWidgets = useMemo(
    () => settings.widgets.filter((widget) => widget.id !== 'grades' || gradesOn),
    [settings.widgets, gradesOn],
  );
  const visibleWidgetIds = useMemo<WidgetId[]>(
    () => visibleWidgets.map((widget) => widget.id),
    [visibleWidgets],
  );

  const notificationRows = (
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
  ).filter(
    ([, , , module]) =>
      module === 'core' ||
      (module === 'grades' && gradesOn) ||
      (module === 'messenger' && messengerOn) ||
      (module === 'letters' && lettersOn),
  );

  const inputClass =
    'min-h-[52px] rounded-[20px] bg-canvas px-4 text-[15px] font-medium text-ink';

  return (
    <Screen adaptive="content">
      <Row className="gap-3 px-4 pb-1 pt-2">
        <IconButton icon="chevron-back" onPress={() => dismiss()} color={colors.muted} background="bg-line/50" size={40} />
        <Title className="flex-1" numberOfLines={1}>Einstellungen</Title>
      </Row>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ---------------------------------------------------------- Konto */}
        <SectionBlock
          icon={Lock}
          color={colors.blocks.mint}
          title="Konto"
          hint="Direkte Anmeldung bei Schulmanager Online — verschlüsselt auf diesem Gerät."
        />
        <Card className="mb-2.5">
          <Muted className="text-[12px] leading-[17px]">
            E-Mail und Passwort werden verschlüsselt auf dem Gerät gespeichert
            ({Platform.OS === 'web' ? 'Browser-Speicher' : 'Keychain / Keystore'}) und ausschließlich an
            login.schulmanager-online.de gesendet.
            {WEB_USES_CORS_PROXY
              ? ' Im Web laufen die Aufrufe über den eingebauten CORS-Proxy dieser Installation — er reicht sie unverändert weiter.'
              : ''}
          </Muted>

          <Text className="mb-1.5 mt-4 text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">
            E-Mail-Adresse
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@beispiel.de"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="E-Mail-Adresse"
            className={inputClass}
          />

          <Text className="mb-1.5 mt-3.5 text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">
            Passwort
          </Text>
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.faint}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              accessibilityLabel="Passwort"
              className={`${inputClass} pr-14`}
            />
            <PressableOpacity
              onPress={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-2.5"
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {showPassword ? (
                <EyeOff size={20} strokeWidth={2.2} color={colors.faint} />
              ) : (
                <Eye size={20} strokeWidth={2.2} color={colors.faint} />
              )}
            </PressableOpacity>
          </View>

          {twoFactor ? (
            <>
              <Text className="mb-1.5 mt-3.5 text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">
                {twoFactor === 'email' ? 'Code aus der E-Mail' : 'Code aus der Authenticator-App'}
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={colors.faint}
                keyboardType="number-pad"
                accessibilityLabel="Zwei-Faktor-Code"
                className={inputClass}
              />
            </>
          ) : null}

          {accountChoices?.length ? (
            <View className="mt-3 gap-2">
              <Muted className="text-[12px]">Mehrere Konten gefunden — bitte auswählen:</Muted>
              {accountChoices.map((account) => (
                <PressableOpacity
                  key={String(account.userId)}
                  onPress={() => void connect(email, password, { userId: account.userId })}
                  accessibilityRole="button"
                  className="min-h-[56px] justify-center rounded-[20px] bg-canvas px-4 py-3"
                >
                  <Text className="text-[14.5px] font-bold text-ink">
                    {account.firstname} {account.lastname}
                  </Text>
                  <Muted className="text-[12px]">{account.institutionName}</Muted>
                </PressableOpacity>
              ))}
            </View>
          ) : null}

          {error ? (
            <Row
              className="mt-3.5 gap-2.5 rounded-[20px] p-3.5"
              style={{ backgroundColor: tint(colors.danger, 0.12) }}
            >
              <AlertTriangle size={17} strokeWidth={2.3} color={colors.danger} />
              <Text className="flex-1 text-[12.5px] font-semibold text-danger">{error}</Text>
            </Row>
          ) : null}
          {notice ? (
            <Row
              className="mt-3.5 gap-2.5 rounded-[20px] p-3.5"
              style={{ backgroundColor: tint(colors.success, 0.12) }}
            >
              <CheckCircle2 size={17} strokeWidth={2.3} color={colors.success} />
              <Text className="flex-1 text-[12.5px] font-semibold text-success">{notice}</Text>
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
              {status === 'connecting' ? <Spinner color={colors.on.amber} /> : null}
              <ButtonText>{connected ? 'Erneut verbinden' : 'Verbinden'}</ButtonText>
            </Button>
            {connected ? (
              <Button action="danger" size="md" onPress={handleDisconnect}>
                <ButtonText>Abmelden</ButtonText>
              </Button>
            ) : null}
          </Row>
        </Card>

        <SettingsGroup>
          <ToggleRow
            icon={FlaskConical}
            iconColor={colors.blocks.amber}
            title="Demo-Modus"
            subtitle="Erfundene Beispieldaten statt echter Schuldaten"
            value={settings.demoMode}
            onValueChange={(value) => update({ demoMode: value })}
          />
        </SettingsGroup>

        {/* ---------------------------------------------------------- Schule */}
        {data?.institution ? (
          <>
            <SectionBlock
              icon={School}
              color={colors.blocks.sky}
              title="Schule"
              hint={data.institution.name ?? undefined}
            />
            <SettingsGroup>
              <InfoRow
                icon={Building2}
                iconColor={colors.blocks.sky}
                title={data.institution.name ?? '—'}
                subtitle={[data.institution.street, data.institution.city].filter(Boolean).join(', ') || undefined}
              />
              <InfoRow
                icon={Phone}
                iconColor={colors.blocks.sky}
                title="Sekretariat"
                subtitle={data.institution.phone ?? '—'}
              />
              <InfoRow
                icon={UserRound}
                iconColor={colors.blocks.violet}
                title={`${data.student?.firstname ?? ''} ${data.student?.lastname ?? ''}`.trim() || 'Kind'}
                subtitle={data.student?.className ? `Klasse ${data.student.className}` : undefined}
              />
            </SettingsGroup>
            {(data.modules ?? []).length > 0 ? (
              <Card className="mb-2.5">
                <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">
                  Freigeschaltete Module
                </Text>
                <Row className="mt-2.5 flex-wrap gap-2">
                  {(data.modules ?? []).map((module) => (
                    <Pill
                      key={module}
                      label={module}
                      color={resolveThemeColor(colors.blocks.violet, isDark)}
                      tone="tint"
                    />
                  ))}
                </Row>
              </Card>
            ) : null}
          </>
        ) : null}

        {/* ---------------------------------------------------------- Dashboard */}
        <SectionBlock
          icon={LayoutGrid}
          color={colors.blocks.violet}
          title="Dashboard-Widgets"
          hint="Reihenfolge und Sichtbarkeit der Startseiten-Karten."
        />
        <SettingsGroup>
          {visibleWidgets.map((widget, index) => {
            const meta = WIDGET_META[widget.id];
            return (
              <Row key={widget.id} className="min-h-[56px] gap-3 px-4 py-3.5">
                <IconBadge icon={LayoutGrid} color={colors.blocks.violet} tone="tint" size="md" />
                <View className="min-w-0 flex-1">
                  <Text className="text-[15px] font-bold text-ink">{meta.title}</Text>
                  <Muted className="mt-0.5 text-[12px] leading-[16px]">{meta.description}</Muted>
                </View>
                <Row className="gap-1">
                  <IconButton
                    icon={ChevronUp}
                    size={32}
                    background="bg-line/50"
                    color={index === 0 ? colors.faint : colors.muted}
                    onPress={() => moveWidget(widget.id, -1, visibleWidgetIds)}
                  />
                  <IconButton
                    icon={ChevronDown}
                    size={32}
                    background="bg-line/50"
                    color={index === visibleWidgets.length - 1 ? colors.faint : colors.muted}
                    onPress={() => moveWidget(widget.id, 1, visibleWidgetIds)}
                  />
                  <Switch
                    value={widget.enabled}
                    onValueChange={() => toggleWidget(widget.id)}
                    accessibilityLabel={`Widget ${meta.title} anzeigen`}
                  />
                </Row>
              </Row>
            );
          })}
        </SettingsGroup>

        {/* ---------------------------------------------------------- Benachrichtigungen */}
        <SectionBlock
          icon={Bell}
          color={colors.blocks.apricot}
          title="Benachrichtigungen"
          hint={`Ruhezeit ${settings.notifications.quietHours.from}–${settings.notifications.quietHours.to} · Briefing um ${settings.notifications.briefingTime}`}
        />
        <SettingsGroup>
          {notificationRows.map(([key, title, subtitle]) => (
            <ToggleRow
              key={key}
              title={title}
              subtitle={subtitle}
              value={settings.notifications[key] as boolean}
              onValueChange={(value) => updateNotifications({ [key]: value } as never)}
            />
          ))}
        </SettingsGroup>
        <Card className="mb-2.5">
          <Button action="secondary" size="sm" onPress={handleTestNotifications}>
            <ButtonText>Zeitplan jetzt neu berechnen</ButtonText>
          </Button>
        </Card>

        {/* ---------------------------------------------------------- Live-Island */}
        <SectionBlock
          icon={Rocket}
          color={colors.blocks.lavender}
          title="Live-Island"
          hint="Laufende & nächste Stunde — mit Countdown und Fortschritt."
        />
        <SettingsGroup>
          <ToggleRow
            title="Insel oben mittig"
            subtitle="Laufende & nächste Stunde immer im Blick"
            value={settings.liveIsland}
            onValueChange={(value) => void handleToggleIsland(value)}
          />
        </SettingsGroup>
        <Card className="mb-2.5">
          <Muted className="text-[12px] leading-[17px]">
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
        </Card>

        {/* ---------------------------------------------------------- Erscheinungsbild */}
        <SectionBlock
          icon={Palette}
          color={colors.blocks.amber}
          title="Erscheinungsbild"
          hint="Farbschema, Stundenplan-Dichte und Haptik."
        />
        <Card className="mb-2.5">
          <Text className="mb-2.5 text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">
            Farbschema
          </Text>
          {/*
            Phase 8: Das Farbschema nutzt jetzt dasselbe `SegmentedControl` wie
            alle anderen Screens (min-h 48, runde Pille) statt drei eigener
            Pressables. Der Wechsel greift sofort — `update()` schreibt in den
            Zustand, aus dem `useThemeColors()` und das Root-Layout lesen.
          */}
          <SegmentedControl<'system' | 'light' | 'dark'>
            value={settings.theme}
            onChange={(next) => update({ theme: next })}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Hell' },
              { value: 'dark', label: 'Dunkel' },
            ]}
          />
        </Card>
        <SettingsGroup>
          <ToggleRow
            title="Kompakter Stundenplan"
            subtitle="Mehr Stunden auf einen Blick"
            value={settings.compactTimetable}
            onValueChange={(value) => update({ compactTimetable: value })}
          />
          <ToggleRow
            title="Wochenende anzeigen"
            subtitle="Samstag und Sonntag im Plan einblenden"
            value={settings.showWeekend}
            onValueChange={(value) => update({ showWeekend: value })}
          />
          <ToggleRow
            title="Haptisches Feedback"
            subtitle="Kurzes Vibrieren bei Aktionen"
            value={settings.hapticFeedback}
            onValueChange={(value) => update({ hapticFeedback: value })}
          />
        </SettingsGroup>

        {/* ---------------------------------------------------------- Datenschutz */}
        <SectionBlock
          icon={Shield}
          color={colors.blocks.charcoal}
          title="Datenschutz"
          hint="Was auf diesem Gerät sichtbar bleibt — und was gelöscht wird."
        />
        <SettingsGroup>
          {gradesOn ? (
            <ToggleRow
              icon={EyeOff}
              iconColor={colors.blocks.violet}
              title="Noten verbergen"
              subtitle="Zeigt •••, bis du sie einblendest"
              value={settings.hideGrades}
              onValueChange={(value) => update({ hideGrades: value })}
            />
          ) : null}
          <ToggleRow
            icon={Fingerprint}
            iconColor={colors.blocks.teal}
            title="Biometrie beim Start"
            subtitle="Face ID / Fingerabdruck vor dem Öffnen"
            value={settings.requireBiometrics}
            onValueChange={(value) => update({ requireBiometrics: value })}
          />
          <InfoRow
            icon={Trash2}
            danger
            title="Lokale Daten löschen"
            subtitle="Cache, Haken und gespeicherte Zugangsdaten"
            onPress={() => {
              const reset = async () => {
                await clearCredentials();
                /*
                 * Bug (Phase 8 · Persistenz): `update(DEFAULT_SETTINGS)` hat
                 * auch `onboarded` zurückgesetzt — beim nächsten Start landete
                 * man unerwartet wieder im Onboarding, obwohl nur die *Daten*
                 * gelöscht werden sollten. Onboarding-Status bleibt jetzt.
                 */
                update({ ...DEFAULT_SETTINGS, onboarded: settings.onboarded });
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
        </SettingsGroup>

        {/* ---------------------------------------------------------- Über */}
        <SectionBlock
          icon={Info}
          color={colors.blocks.slate}
          title="Über Schulflow"
          hint="Schulflow 1.0 — inoffizieller Client für Schulmanager Online."
        />
        <Card className="mb-2.5">
          <Muted className="text-[12.5px] leading-[18px]">
            Keine Verbindung zur Schulmanager Online GmbH. Nutzung auf eigene Verantwortung — Schulflow
            ruft Daten sparsam ab, bündelt alle Anfragen und respektiert das Rate-Limit des Servers.
          </Muted>
          <Row className="mt-3 flex-wrap gap-2">
            <Pill label="React Native · Expo" color={resolveThemeColor(colors.blocks.violet, isDark)} tone="tint" />
            <Pill label="gluestack-ui" color={resolveThemeColor(colors.blocks.mint, isDark)} tone="tint" />
            <Pill label="Tamagui" color={resolveThemeColor(colors.blocks.sky, isDark)} tone="tint" />
            <Pill label="NativeWind" color={resolveThemeColor(colors.blocks.apricot, isDark)} tone="tint" />
          </Row>
        </Card>

        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}
