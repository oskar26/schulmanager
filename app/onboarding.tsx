import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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

import { useSession } from '@/state/session';
import { useSettings } from '@/state/settings';
import type { AccountChoice } from '@/api/types';

const DARK = '#0F172A';
const LIGHT = '#F6F5F2';

const SLIDES = [
  {
    icon: CalendarDays,
    tone: '#EDE9FE',
    iconColor: '#6366F1',
    title: 'Alles auf einen Blick',
    body: 'Dein Stundenplan, Aufgaben und Klassenarbeiten sauber als Bento-Kacheln auf dem Startbildschirm.',
  },
  {
    icon: ListChecks,
    tone: '#D1FAE5',
    iconColor: '#059669',
    title: 'Immer den Überblick',
    body: 'Hausaufgaben abhaken, nächste Stunde sehen und dich automatisch über Vertretungen informieren lassen.',
  },
  {
    icon: BarChart3,
    tone: '#FEF3C7',
    iconColor: '#B45309',
    title: 'Noten & Fortschritt',
    body: 'Dein Schnitt, neue Noten und smarte Hinweise — für hell und dunkel, auf Handy, Tablet und Desktop.',
  },
] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const system = useColorScheme();
  const theme = useSettings((s) => s.settings.theme);
  const dark = (theme === 'system' ? system : theme) === 'dark';
  const canvas = dark ? DARK : LIGHT;
  const ink = dark ? '#F8FAFC' : '#18181B';
  const muted = dark ? '#94A3B8' : '#6E6C66';

  const router = useRouter();
  const status = useSession((s) => s.status);
  const error = useSession((s) => s.error);
  const twoFactor = useSession((s) => s.twoFactor);
  const accountChoices = useSession((s) => s.accountChoices);
  const connect = useSession((s) => s.connect);
  const setDemo = useSession((s) => s.setDemo);
  const update = useSettings((s) => s.update);
  const setCredentials = useSettings((s) => s.setCredentials);
  const markOnboarded = useSettings((s) => s.markOnboarded);

  const [step, setStep] = useState<0 | 1>(0); // 0 = Welcome, 1 = Wahl (Demo/Login)
  const [page, setPage] = useState(0);
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

  const onWelcomeScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / Math.max(e.nativeEvent.layoutMeasurement.width, 1));
    if (next !== page) setPage(next);
  };

  const goBack = () => {
    if (mode === 'login') {
      setMode('choice');
    } else {
      setStep(0);
    }
  };

  return (
    <View style={{ flex: 1, width: '100%', backgroundColor: canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Kopf */}
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
              <View style={{ width: 36, height: 36, borderRadius: 13, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap color="#FFFFFF" size={18} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: ink, letterSpacing: -0.3 }}>Schulflow</Text>
            </View>
          ) : (
            <Pressable onPress={goBack} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: dark ? '#1E293B' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft color={muted} size={22} />
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {[0, 1].map((i) => (
              <View key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === step ? '#6C5CE7' : dark ? '#334155' : '#E7E5E2' }} />
            ))}
          </View>
        </View>

        {step === 0 ? (
          <WelcomeSlides
            dark={dark}
            canvas={canvas}
            ink={ink}
            muted={muted}
            page={page}
            onScroll={onWelcomeScroll}
            onNext={() => setStep(1)}
          />
        ) : (
          <ChoiceView
            dark={dark}
            canvas={canvas}
            ink={ink}
            muted={muted}
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
  dark, canvas, ink, muted, page, onScroll, onNext,
}: {
  dark: boolean;
  canvas: string;
  ink: string;
  muted: string;
  page: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onNext: () => void;
}) {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ flex: 1 }}
    >
      {SLIDES.map((slide, i) => (
        <View key={i} style={{ flex: 1, width: undefined }} pointerEvents="none">
          <View style={{ flex: 1, width: '100%' }}>
            <WelcomeCard key={slide.title} {...slide} dark={dark} canvas={canvas} ink={ink} muted={muted} index={i} />
          </View>
        </View>
      ))}
      <View key="cta" style={{ width: '100%' }}>
        <View style={{ flex: 1, width: '100%' }}>
          <WelcomeCTA dark={dark} canvas={canvas} ink={ink} muted={muted} onNext={onNext} />
        </View>
      </View>
    </ScrollView>
  );
}

function WelcomeCard({
  icon: Icon, tone, iconColor, title, body, dark, canvas, ink, muted, index,
}: {
  icon: typeof CalendarDays;
  tone: string;
  iconColor: string;
  title: string;
  body: string;
  dark: boolean;
  canvas: string;
  ink: string;
  muted: string;
  index: number;
}) {
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 12, width: '100%' }}>
      <View style={{ flex: 1, borderRadius: 30, backgroundColor: dark ? '#1E293B' : '#FFFFFF', padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 18 }}>
          {`Feature ${index + 1}`}
        </Text>
        <View style={{ width: 74, height: 74, borderRadius: 26, backgroundColor: tone, alignItems: 'center', justifyContent: 'center' }}>
          <Icon color={iconColor} size={34} strokeWidth={2} />
        </View>
        <Text style={{ marginTop: 26, fontSize: 28, fontWeight: '800', color: ink, letterSpacing: -0.6, lineHeight: 34 }}>{title}</Text>
        <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 23, color: muted }}>{body}</Text>
      </View>
    </View>
  );
}

function WelcomeCTA({ dark, canvas, ink, muted, onNext }: { dark: boolean; canvas: string; ink: string; muted: string; onNext: () => void }) {
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 12, width: '100%' }}>
      <View style={{ flex: 1, borderRadius: 30, backgroundColor: '#111827', padding: 26, justifyContent: 'space-between' }}>
        <View>
          <View style={{ width: 60, height: 60, borderRadius: 22, backgroundColor: '#8C8EFF', alignItems: 'center', justifyContent: 'center' }}>
            <Bell color="#FFFFFF" size={28} />
          </View>
          <Text style={{ marginTop: 24, fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6, lineHeight: 33 }}>
            Bereit für{' '}
            <Text style={{ color: '#8C8EFF' }}>deinen</Text>{' '}
            Schultag?
          </Text>
          <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 23, color: 'rgba(255,255,255,0.7)' }}>
            Verbinde dein Schulmanager-Konto oder erkunde Schulflow erst einmal mit Beispieldaten.
          </Text>
        </View>
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          style={{ backgroundColor: '#FFFFFF', borderRadius: 999, paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Los geht’s</Text>
          <ArrowRight color="#111827" size={19} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ Wahl */

interface ChoiceProps {
  dark: boolean;
  canvas: string;
  ink: string;
  muted: string;
  mode: 'choice' | 'login';
  setMode: (m: 'choice' | 'login') => void;
  status: string;
  error: string | null;
  twoFactor: 'email' | 'totp' | null;
  accountChoices: AccountChoice[] | null;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  code: string;
  setCode: (v: string) => void;
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

function ChoiceCards({ onDemo, setMode, ink, muted }: ChoiceProps) {
  return (
    <>
      <Text style={{ fontSize: 26, fontWeight: '800', color: ink, letterSpacing: -0.6, lineHeight: 33 }}>
        Wie möchtest du starten?
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: muted }}>
        Du kannst später in den Einstellungen jederzeit wechseln.
      </Text>

      {/* Option A: Schulmanager-Login */}
      <Pressable
        onPress={() => setMode('login')}
        accessibilityRole="button"
        style={{ marginTop: 26, borderRadius: 30, backgroundColor: '#EDE9FE', padding: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: '#8C8EFF', alignItems: 'center', justifyContent: 'center' }}>
            <LogIn color="#FFFFFF" size={24} />
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight color="#4338CA" size={19} />
          </View>
        </View>
        <Text style={{ marginTop: 22, fontSize: 21, fontWeight: '800', color: '#312E81', letterSpacing: -0.4 }}>
          Mit Schulmanager Online verbinden
        </Text>
        <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: '#5B57A1' }}>
          Zeige deinen echten Stundenplan, deine Aufgaben und Noten. Zugangsdaten bleiben verschlüsselt auf dem Gerät.
        </Text>
      </Pressable>

      {/* Option B: Demo */}
      <Pressable
        onPress={onDemo}
        accessibilityRole="button"
        style={{ marginTop: 16, borderRadius: 30, backgroundColor: '#111827', padding: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: '#8C8EFF', alignItems: 'center', justifyContent: 'center' }}>
            <Play color="#FFFFFF" size={24} fill="#FFFFFF" />
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight color="#FFFFFF" size={19} />
          </View>
        </View>
        <Text style={{ marginTop: 22, fontSize: 21, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 }}>
          Im Demo-Modus erkunden
        </Text>
        <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.7)' }}>
          Kein Konto nötig — Schulflow wird sofort mit realistischen Beispieldaten gefüllt.
        </Text>
      </Pressable>
    </>
  );
}

/* ---------------------------------------------- Login */

function LoginContent(props: ChoiceProps & { connecting: boolean }) {
  const { dark, ink, muted } = props;
  const inputStyle = {
    height: 54,
    borderRadius: 18,
    paddingHorizontal: 14,
    fontSize: 15,
    color: ink,
    backgroundColor: dark ? '#1E293B' : '#FFFFFF',
    borderWidth: 1,
    borderColor: dark ? '#334155' : '#E7E5E2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as const;

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: ink, letterSpacing: -0.6, lineHeight: 33 }}>
        Mit Schulmanager verbinden
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: muted }}>
        Benutzername oder E-Mail plus Passwort. Sicher verwahrt in der Keychain deines Geräts.
      </Text>

      <Text style={{ marginTop: 22, marginBottom: 8, fontSize: 13, fontWeight: '700', color: muted }}>Benutzername oder E-Mail</Text>
      <View style={inputStyle}>
        <Mail size={18} color={muted} />
        <TextInput
          value={props.email}
          onChangeText={props.setEmail}
          placeholder="name@beispiel.de"
          placeholderTextColor={muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={{ flex: 1, fontSize: 15, color: ink, height: '100%' }}
        />
      </View>

      <Text style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: '700', color: muted }}>Passwort</Text>
      <View style={inputStyle}>
        <Lock size={18} color={muted} />
        <TextInput
          value={props.password}
          onChangeText={props.setPassword}
          placeholder="••••••••"
          placeholderTextColor={muted}
          secureTextEntry={!props.showPassword}
          autoCapitalize="none"
          style={{ flex: 1, fontSize: 15, color: ink, height: '100%' }}
        />
        <Pressable onPress={() => props.setShowPassword(!props.showPassword)} hitSlop={8}>
          {props.showPassword ? <EyeOff size={18} color={muted} /> : <Eye size={18} color={muted} />}
        </Pressable>
      </View>

      {props.twoFactor ? (
        <>
          <Text style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: '700', color: muted }}>
            {props.twoFactor === 'email' ? 'Code aus der E-Mail' : 'Code aus der Authenticator-App'}
          </Text>
          <TextInput
            value={props.code}
            onChangeText={props.setCode}
            placeholder="123456"
            placeholderTextColor={muted}
            keyboardType="number-pad"
            style={[inputStyle, { flexDirection: 'row' }]}
          />
        </>
      ) : null}

      {props.accountChoices && props.accountChoices.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: muted, marginBottom: 8 }}>Mehrere Konten gefunden — wähle eins:</Text>
          {props.accountChoices.map((a) => (
            <Pressable
              key={String(a.userId)}
              onPress={() => props.onLoginUser(a.userId)}
              style={{ ...inputStyle, justifyContent: 'space-between', marginBottom: 8 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: ink }}>{`${a.firstname ?? ''} ${a.lastname ?? ''}`.trim()}</Text>
              <Text style={{ fontSize: 12, color: muted }}>{a.institutionName ?? ''}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {props.error ? (
        <View style={{ marginTop: 14, borderRadius: 16, backgroundColor: dark ? '#7F1D1D' : '#FEE2E2', padding: 14 }}>
          <Text style={{ color: dark ? '#FECACA' : '#B91C1C', fontSize: 13, fontWeight: '600', lineHeight: 19 }}>{props.error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={props.onLogin}
        disabled={props.connecting || props.email.trim().length === 0 || props.password.length === 0}
        accessibilityRole="button"
        style={{
          marginTop: 24,
          borderRadius: 999,
          paddingVertical: 16,
          backgroundColor:
            props.connecting || props.email.trim().length === 0 || props.password.length === 0 ? '#A5B4FC' : '#6C5CE7',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
          {props.connecting ? 'Verbinde …' : 'Verbinden'}
        </Text>
        {!props.connecting ? <ArrowRight color="#FFFFFF" size={19} /> : null}
      </Pressable>

      <Text style={{ marginTop: 20, fontSize: 12, lineHeight: 18, color: muted, textAlign: 'center' }}>
        Daten werden ausschließlich an login.schulmanager-online.de gesendet und nur auf diesem Gerät gespeichert.
      </Text>
    </View>
  );
}
