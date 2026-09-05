import React, { useEffect, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, FlaskConical, Lock } from 'lucide-react-native';

import { WebConnectionCard } from '@/ui/connection-card';
import { useSession } from '@/state/session';
import { useSettings } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { tint } from '@/design/subjects';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner } from '@/ui/gluestack/feedback';
import { PressableOpacity } from '@/ui/motion';
import {
  InfoRow,
  SettingsGroup,
  SettingsNote,
  SettingsPage,
  ToggleRow,
} from './_components';

export default function AccountSettings() {
  const { colors } = useThemeColors();
  const { settings, update, setCredentials, getCredentials, clearCredentials } = useSettings();
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
  const inputClass = 'min-h-[52px] rounded-[20px] bg-canvas px-4 text-[15px] font-medium text-ink';

  const handleConnect = async () => {
    setNotice(null);
    const cleanEmail = email.trim();
    await setCredentials(cleanEmail, password);
    const ok = await connect(cleanEmail, password, code ? { twoFactorCode: code } : undefined);
    setNotice(ok ? 'Verbunden. Deine echten Schuldaten werden geladen.' : null);
  };

  const handleDisconnect = async () => {
    await disconnect();
    await clearCredentials();
    setPassword('');
    setNotice('Abgemeldet. Schulflow zeigt wieder den Demo-Datensatz.');
  };

  return (
    <SettingsPage title="Konto & Verbindung" subtitle={connected ? 'Verbunden' : 'Demo oder Schulmanager-Login'}>
      <SettingsNote>
        E-Mail und Passwort werden verschlüsselt auf dem Gerät gespeichert ({Platform.OS === 'web' ? 'Browser-Speicher' : 'Keychain / Keystore'}) und ausschließlich an login.schulmanager-online.de gesendet.
      </SettingsNote>
      <View className="mb-2.5 rounded-[28px] bg-surface p-[18px]">
        <View className="flex-row items-center gap-3">
          <Lock color={colors.blocks.mint} size={20} strokeWidth={2.4} />
          <Text className="flex-1 text-[16px] font-extrabold text-ink">Schulmanager-Login</Text>
        </View>
        <Text className="mb-1.5 mt-4 text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">E-Mail-Adresse</Text>
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
        <Text className="mb-1.5 mt-3.5 text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">Passwort</Text>
        <View className="relative">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Passwort"
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
            {showPassword ? <EyeOff size={20} color={colors.faint} /> : <Eye size={20} color={colors.faint} />}
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
            <Text className="text-[12px] font-semibold text-muted">Mehrere Konten gefunden — bitte auswählen:</Text>
            {accountChoices.map((account) => (
              <PressableOpacity
                key={String(account.userId)}
                onPress={() => void connect(email, password, { userId: account.userId })}
                accessibilityRole="button"
                className="min-h-[56px] justify-center rounded-[20px] bg-canvas px-4 py-3"
              >
                <Text className="text-[14.5px] font-bold text-ink">{account.firstname} {account.lastname}</Text>
                <Text className="text-[12px] text-muted">{account.institutionName}</Text>
              </PressableOpacity>
            ))}
          </View>
        ) : null}
        {error ? (
          <View className="mt-3.5 flex-row gap-2.5 rounded-[20px] p-3.5" style={{ backgroundColor: tint(colors.danger, 0.12) }}>
            <AlertTriangle size={17} color={colors.danger} />
            <Text className="flex-1 text-[12.5px] font-semibold text-danger">{error}</Text>
          </View>
        ) : null}
        {notice ? (
          <View className="mt-3.5 flex-row gap-2.5 rounded-[20px] p-3.5" style={{ backgroundColor: tint(colors.success, 0.12) }}>
            <CheckCircle2 size={17} color={colors.success} />
            <Text className="flex-1 text-[12.5px] font-semibold text-success">{notice}</Text>
          </View>
        ) : null}
        <View className="mt-4 flex-row gap-2">
          <Button action={connected ? 'surface' : 'primary'} size="md" block={!connected} onPress={handleConnect} className="flex-1">
            {status === 'connecting' ? <Spinner color={colors.on.amber} /> : null}
            <ButtonText>{connected ? 'Erneut verbinden' : 'Verbinden'}</ButtonText>
          </Button>
          {connected ? <Button action="danger" size="md" onPress={handleDisconnect}><ButtonText>Abmelden</ButtonText></Button> : null}
        </View>
      </View>
      <SettingsGroup>
        <ToggleRow
          icon={FlaskConical}
          iconColor={colors.blocks.amber}
          title="Demo-Modus"
          subtitle="Erfundene Beispieldaten statt echter Schuldaten"
          value={settings.demoMode}
          onValueChange={(value) => update({ demoMode: value })}
        />
        <InfoRow title="Verbindungsstatus" subtitle={connected ? 'Schulmanager Online ist erreichbar.' : 'Noch keine echte Verbindung aktiv.'} icon={Lock} iconColor={colors.blocks.mint} />
      </SettingsGroup>
      <WebConnectionCard />
    </SettingsPage>
  );
}
