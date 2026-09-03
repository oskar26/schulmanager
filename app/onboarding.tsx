import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  Eye,
  EyeOff,
  GraduationCap,
  ListChecks,
  Lock,
  LogIn,
  Mail,
  Play,
} from 'lucide-react-native';

import type { AccountChoice } from '@/api/types';
import type { ThemePalette } from '@/design/tokens';
import { foregroundOn } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { tint } from '@/design/subjects';
import { useSession } from '@/state/session';
import { useSettings } from '@/state/settings';

type SlideAccent = 'violet' | 'lime' | 'amber';

const SLIDES: { icon: typeof CalendarDays; accent: SlideAccent; title: string; body: string }[] = [
  {
    icon: CalendarDays,
    accent: 'violet',
    title: 'Alles auf einen Blick',
    body: 'Dein Stundenplan, Aufgaben und Klassenarbeiten sauber als Formkarten auf dem Startbildschirm.',
  },
  {
    icon: ListChecks,
    accent: 'lime',
    title: 'Immer den Überblick',
    body: 'Hausaufgaben abhaken, nächste Stunde sehen und dich automatisch über Vertretungen informieren lassen.',
  },
  {
    icon: BarChart3,
    accent: 'amber',
    title: 'Noten & Fortschritt',
    body: 'Dein Schnitt, neue Noten und smarte Hinweise — für hell und dunkel, auf Handy, Tablet und Desktop.',
  },
];

function accentColor(colors: ThemePalette, accent: SlideAccent): string {
  switch (accent) {
    case 'lime':
      return colors.accent.lime;
    case 'amber':
      return colors.accent.amber;
    case 'violet':
    default:
      return colors.accent.violet;
  }
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const router = useRouter();
  const status = useSession((state) => state.status);
  const error = useSession((state) => state.error);
  const twoFactor = useSession((state) => state.twoFactor);
  const accountChoices = useSession((state) => state.accountChoices);
  const connect = useSession((state) => state.connect);
  const setDemo = useSession((state) => state.setDemo);
  const update = useSettings((state) => state.update);
  const setCredentials = useSettings((state) => state.setCredentials);
  const markOnboarded = useSettings((state) => state.markOnboarded);

  const [step, setStep] = useState<0 | 1>(0); // 0 = Welcome, 1 = Wahl (Demo/Login)
  const [mode, setMode] = useState<'choice' | 'login'>('choice');

  // Login-Feld
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');

  const finishDemo = () => {
    update({ demoMode: true, email: '', hasPassword: false });
    setDemo();
    markOnboarded();
    router.replace('/');
  };

  const handleLogin = async (userId?: string | number) => {
    const ok = await connect(email.trim(), password, code ? { twoFactorCode: code, userId } : { userId });
    if (ok) {
      await setCredentials(email.trim(), password);
      update({ demoMode: false });
      markOnboarded();
      router.replace('/');
    }
  };

  const goBack = () => {
    if (mode === 'login') setMode('choice');
    else setStep(0);
  };

  return (
    <View style={{ flex: 1, width: '100%', backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Kopf: neutral auf Canvas — keine lila Header-Fläche. */}
        <View
          style={{
            paddingTop: Math.max(insets.top, 12) + 6,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {step === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 13,
                  backgroundColor: colors.accent.amber,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GraduationCap color={colors.on.amber} size={18} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}>Schulflow</Text>
            </View>
          ) : (
            <Pressable
              onPress={goBack}
              hitSlop={10}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              <ChevronLeft color={colors.muted} size={22} />
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {[0, 1].map((index) => (
              <View
                key={index}
                style={{
                  width: index === step ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: index === step ? colors.accent.amber : colors.line,
                }}
              />
            ))}
          </View>
        </View>

        {step === 0 ? (
          <WelcomeSlides colors={colors} onNext={() => setStep(1)} />
        ) : (
          <ChoiceView
            colors={colors}
            mode={mode}
            setMode={setMode}
            status={status}
            error={error}
            twoFactor={twoFactor}
            accountChoices={accountChoices}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            code={code}
            setCode={setCode}
            onDemo={finishDemo}
            onLogin={() => void handleLogin()}
            onLoginUser={(id) => void handleLogin(id)}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

/* ------------------------------------------------------------------ Welcome */

function WelcomeSlides({
  colors,
  onNext,
}: {
  colors: ThemePalette;
  onNext: () => void;
}) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ flex: 1 }}
    >
      {SLIDES.map((slide, index) => (
        <View key={slide.title} style={{ flex: 1, width }} pointerEvents="none">
          <View style={{ flex: 1, width: '100%' }}>
            <WelcomeCard {...slide} colors={colors} index={index} />
          </View>
        </View>
      ))}
      <View key="cta" style={{ width }}>
        <View style={{ flex: 1, width: '100%' }}>
          <WelcomeCTA colors={colors} onNext={onNext} />
        </View>
      </View>
    </ScrollView>
  );
}

function WelcomeCard({
  icon: Icon,
  accent,
  title,
  body,
  colors,
  index,
}: {
  icon: typeof CalendarDays;
  accent: SlideAccent;
  title: string;
  body: string;
  colors: ThemePalette;
  index: number;
}) {
  const color = accentColor(colors, accent);
  const foreground = foregroundOn(color, colors);
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 12, width: '100%' }}>
      <View
        style={{
          flex: 1,
          borderRadius: 28,
          backgroundColor: colors.surface,
          padding: 24,
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.faint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 18 }}>
          {`Feature ${index + 1}`}
        </Text>
        <View style={{ width: 74, height: 74, borderRadius: 26, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Icon color={foreground} size={34} strokeWidth={2} />
        </View>
        <Text style={{ marginTop: 26, fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.6, lineHeight: 34 }}>
          {title}
        </Text>
        <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 23, color: colors.muted }}>{body}</Text>
      </View>
    </View>
  );
}

function WelcomeCTA({ colors, onNext }: { colors: ThemePalette; onNext: () => void }) {
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 12, width: '100%' }}>
      <View style={{ flex: 1, borderRadius: 28, backgroundColor: colors.charcoal, padding: 26, justifyContent: 'space-between' }}>
        <View>
          <View style={{ width: 60, height: 60, borderRadius: 22, backgroundColor: colors.accent.amber, alignItems: 'center', justifyContent: 'center' }}>
            <Bell color={colors.on.amber} size={28} />
          </View>
          <Text style={{ marginTop: 24, fontSize: 26, fontWeight: '800', color: colors.on.charcoal, letterSpacing: -0.6, lineHeight: 33 }}>
            Bereit für <Text style={{ color: colors.accent.amber }}>deinen</Text> Schultag?
          </Text>
          <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 23, color: colors.on.charcoal, opacity: 0.7 }}>
            Verbinde dein Schulmanager-Konto oder erkunde Schulflow erst einmal mit Beispieldaten.
          </Text>
        </View>
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          style={{
            backgroundColor: colors.surface,
            borderRadius: 999,
            paddingVertical: 16,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.charcoal }}>Los geht’s</Text>
          <ArrowRight color={colors.charcoal} size={19} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ Wahl */

interface ChoiceProps {
  colors: ThemePalette;
  mode: 'choice' | 'login';
  setMode: (mode: 'choice' | 'login') => void;
  status: string;
  error: string | null;
  twoFactor: 'email' | 'totp' | null;
  accountChoices: AccountChoice[] | null;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  code: string;
  setCode: (value: string) => void;
  onDemo: () => void;
  onLogin: () => void;
  onLoginUser: (id: string | number) => void;
}

function ChoiceView(props: ChoiceProps) {
  const connecting = props.status === 'connecting';
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 12, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {props.mode === 'choice' ? <ChoiceCards {...props} /> : <LoginContent {...props} connecting={connecting} />}
    </ScrollView>
  );
}

function ChoiceCards({ colors, onDemo, setMode }: ChoiceProps) {
  return (
    <>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.6, lineHeight: 33 }}>
        Wie möchtest du starten?
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.muted }}>
        Du kannst später in den Einstellungen jederzeit wechseln.
      </Text>

      {/* Option A: klarer Amber-Hauptblock statt lila Pastell */}
      <Pressable
        onPress={() => setMode('login')}
        accessibilityRole="button"
        style={{ marginTop: 26, borderRadius: 28, backgroundColor: colors.accent.amber, padding: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.charcoal, alignItems: 'center', justifyContent: 'center' }}>
            <LogIn color={colors.on.charcoal} size={24} />
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight color={colors.charcoal} size={19} />
          </View>
        </View>
        <Text style={{ marginTop: 22, fontSize: 21, fontWeight: '800', color: colors.on.amber, letterSpacing: -0.4 }}>
          Mit Schulmanager Online verbinden
        </Text>
        <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.on.amber, opacity: 0.76 }}>
          Zeige deinen echten Stundenplan, deine Aufgaben und Noten. Zugangsdaten bleiben verschlüsselt auf dem Gerät.
        </Text>
      </Pressable>

      {/* Option B: ruhiger Charcoal-Block */}
      <Pressable
        onPress={onDemo}
        accessibilityRole="button"
        style={{ marginTop: 16, borderRadius: 28, backgroundColor: colors.charcoal, padding: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.accent.violet, alignItems: 'center', justifyContent: 'center' }}>
            <Play color={colors.on.violet} size={24} fill={colors.on.violet} />
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.charcoalElevated, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight color={colors.on.charcoal} size={19} />
          </View>
        </View>
        <Text style={{ marginTop: 22, fontSize: 21, fontWeight: '800', color: colors.on.charcoal, letterSpacing: -0.4 }}>
          Im Demo-Modus erkunden
        </Text>
        <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.on.charcoal, opacity: 0.7 }}>
          Kein Konto nötig — Schulflow wird sofort mit realistischen Beispieldaten gefüllt.
        </Text>
      </Pressable>
    </>
  );
}

/* ---------------------------------------------- Login */

function LoginContent(props: ChoiceProps & { connecting: boolean }) {
  const { colors } = props;
  const inputStyle = {
    height: 54,
    borderRadius: 18,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as const;
  const disabled = props.connecting || props.email.trim().length === 0 || props.password.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.6, lineHeight: 33 }}>
        Mit Schulmanager verbinden
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.muted }}>
        Benutzername oder E-Mail plus Passwort. Sicher verwahrt in der Keychain deines Geräts.
      </Text>

      <Text style={{ marginTop: 22, marginBottom: 8, fontSize: 13, fontWeight: '700', color: colors.muted }}>Benutzername oder E-Mail</Text>
      <View style={inputStyle}>
        <Mail size={18} color={colors.muted} />
        <TextInput
          value={props.email}
          onChangeText={props.setEmail}
          placeholder="name@beispiel.de"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={{ flex: 1, fontSize: 15, color: colors.ink, height: '100%' }}
        />
      </View>

      <Text style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: '700', color: colors.muted }}>Passwort</Text>
      <View style={inputStyle}>
        <Lock size={18} color={colors.muted} />
        <TextInput
          value={props.password}
          onChangeText={props.setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.faint}
          secureTextEntry={!props.showPassword}
          autoCapitalize="none"
          style={{ flex: 1, fontSize: 15, color: colors.ink, height: '100%' }}
        />
        <Pressable onPress={() => props.setShowPassword(!props.showPassword)} hitSlop={8}>
          {props.showPassword ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
        </Pressable>
      </View>

      {props.twoFactor ? (
        <>
          <Text style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: '700', color: colors.muted }}>
            {props.twoFactor === 'email' ? 'Code aus der E-Mail' : 'Code aus der Authenticator-App'}
          </Text>
          <TextInput
            value={props.code}
            onChangeText={props.setCode}
            placeholder="123456"
            placeholderTextColor={colors.faint}
            keyboardType="number-pad"
            style={[inputStyle, { flexDirection: 'row' }]}
          />
        </>
      ) : null}

      {props.accountChoices && props.accountChoices.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 8 }}>Mehrere Konten gefunden — wähle eins:</Text>
          {props.accountChoices.map((account) => (
            <Pressable
              key={String(account.userId)}
              onPress={() => props.onLoginUser(account.userId)}
              style={{ ...inputStyle, justifyContent: 'space-between', marginBottom: 8 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{`${account.firstname ?? ''} ${account.lastname ?? ''}`.trim()}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{account.institutionName ?? ''}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {props.error ? (
        <View style={{ marginTop: 14, borderRadius: 16, backgroundColor: tint(colors.danger, 0.14), padding: 14 }}>
          <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600', lineHeight: 19 }}>{props.error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={props.onLogin}
        disabled={disabled}
        accessibilityRole="button"
        style={{
          marginTop: 24,
          borderRadius: 999,
          paddingVertical: 16,
          backgroundColor: disabled ? colors.line : colors.accent.amber,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '800', color: disabled ? colors.faint : colors.on.amber }}>
          {props.connecting ? 'Verbinde …' : 'Verbinden'}
        </Text>
        {!props.connecting ? <ArrowRight color={disabled ? colors.faint : colors.on.amber} size={19} /> : null}
      </Pressable>

      <Text style={{ marginTop: 20, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center' }}>
        Daten werden ausschließlich an login.schulmanager-online.de gesendet und nur auf diesem Gerät gespeichert.
      </Text>
    </View>
  );
}
