import '../global.css';

import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CircleAlert, GraduationCap } from 'lucide-react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { TamaguiProvider } from 'tamagui';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

import tamaguiConfig from '@/design/tamagui.config';
import { useSettings } from '@/state/settings';
import { useSession } from '@/state/session';
import { registerNotificationHandler } from '@/features/notifications/scheduler';
import { LiveIsland } from '@/features/island/LiveIsland';
import { useIslandState } from '@/features/island/use-island';
import { useLiveIslandEffects } from '@/features/island/effects';
import { ErrorBoundary as ScreenErrorBoundary } from '@/ui/error-boundary';
import { LockGate } from '@/ui/lock-gate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 7 * 24 * 60 * 60_000, retry: 1 },
  },
});

/**
 * Offline-Persistenz: Der ganze Query-Cache wandert in AsyncStorage. Beim Start
 * erscheint sofort der letzte Stand, im Hintergrund wird aktualisiert.
 */
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 3_000,
  key: 'schulflow.query-cache',
});

/** App-Fokus (AppState) als react-query-Fokusquelle — mobil korrekt. */
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
  return () => subscription.remove();
});

export default function RootLayout() {
  const system = useColorScheme();
  const hydrate = useSettings((state) => state.hydrate);
  const hydrated = useSettings((state) => state.hydrated);
  const theme = useSettings((state) => state.settings.theme);
  const onboarded = useSettings((state) => state.settings.onboarded);
  const status = useSession((state) => state.status);
  const restore = useSession((state) => state.restore);
  const restoring = useRef(false);
  const [restoreSettled, setRestoreSettled] = useState(false);

  useEffect(() => {
    void hydrate();
    registerNotificationHandler();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !restoring.current) {
      restoring.current = true;
      void restore().finally(() => {
        restoring.current = false;
        setRestoreSettled(true);
      });
    }
  }, [hydrated, restore]);

  const resolved = theme === 'system' ? (system ?? 'light') : theme;

  useEffect(() => {
    nativewindColorScheme.set(resolved === 'dark' ? 'dark' : 'light');
  }, [resolved]);

  // APK-Stabilität: Kein freischwebender, halb initialisierter Start.
  // Boot-View mit fester Füllhöhe zeigen, bis die Einstellungen hydratisiert sind
  // (Thema, Demo-Modus bekannt) — nie ein leerer/transparenter Bildschirm.
  const dark = resolved === 'dark';

  // Erstmalig? Nur wenn kein Konto verbunden ist, führt der Onboarding-Flow.
  const needsOnboarding = !onboarded && status !== 'connected';
  const contentReady = hydrated && restoreSettled;

  return (
    <ScreenErrorBoundary label="App">
      <GestureHandlerRootView style={styles.root}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={resolved}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister, maxAge: 7 * 24 * 60 * 60_000 }}
          >
            <SafeAreaProvider>
              <LockGate>
                {contentReady ? (
                  <View style={styles.root}>
                    <StatusBar style={dark ? 'light' : 'dark'} />
                    <Stack
                      initialRouteName={needsOnboarding ? 'onboarding' : '(tabs)'}
                      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
                    >
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="onboarding" />
                      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
                      <Stack.Screen name="sick-note" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="exemption" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="calendar" />
                      <Stack.Screen name="attendance" />
                      <Stack.Screen name="search" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="thread" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="payments" />
                      <Stack.Screen name="documents" />
                      <Stack.Screen name="parent-talks" />
                      <Stack.Screen name="electives" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="allday" options={{ presentation: 'modal' }} />
                    </Stack>
                    {/* Live-Island schwebt über allen Screens (In-App-Dynamic-Island). */}
                    <IslandHost />
                  </View>
                ) : (
                  <BootScreen dark={dark} />
                )}
              </LockGate>
            </SafeAreaProvider>
          </PersistQueryClientProvider>
        </TamaguiProvider>
      </GestureHandlerRootView>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', height: '100%' },
});

/** Marken-Startbildschirm — ersetzt einen leeren/weißen ersten Frame im APK. */
function BootScreen({ dark }: { dark: boolean }) {
  const [nudge, setNudge] = useState(false);
  useEffect(() => {
    // Safety-Net: Selbst wenn Hydration je hängen sollte, nie endlos Boot.
    const t = setTimeout(() => setNudge(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', backgroundColor: dark ? '#0F172A' : '#F6F5F2' }]}>
      <View style={{ width: 72, height: 72, borderRadius: 26, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center' }}>
        <GraduationCap color="#FFFFFF" size={34} strokeWidth={2.2} />
      </View>
      <Text style={{ marginTop: 14, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: dark ? '#F8FAFC' : '#18181B' }}>
        Schulflow
      </Text>
      <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '600', color: dark ? '#94A3B8' : '#6E6C66' }}>
        {nudge ? 'Einen Moment – deine Daten werden vorbereitet …' : 'Wird geladen …'}
      </Text>
    </View>
  );
}

/** Island + ihre System-Effekte (Tab-Titel, Android-Notification) an einem Ort. */
function IslandHost() {
  const state = useIslandState();
  useLiveIslandEffects(state);
  return <LiveIsland state={state} />;
}

/** Expo-Router-Fehlergrenze — fängt Routing-/Render-Fehler auf Root-Ebene. */
export function ErrorBoundary(props: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F5F2', padding: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
        <CircleAlert color="#E0564C" size={30} strokeWidth={2.2} />
      </View>
      <Text style={{ marginTop: 16, fontSize: 20, fontWeight: '800', color: '#18181B', textAlign: 'center' }}>
        Da ist Schulflow gestolpert
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 20, color: '#6E6C66', textAlign: 'center' }}>
        Deine Daten sind unberührt. Versuche den Bildschirm neu zu laden.
      </Text>
      <ScrollView style={{ maxHeight: 96, marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12 }}>
        <Text style={{ fontSize: 11, color: '#6E6C66' }}>{props.error?.message}</Text>
      </ScrollView>
      <Pressable
        onPress={props.retry}
        style={{ marginTop: 20, backgroundColor: '#6C5CE7', borderRadius: 999, paddingHorizontal: 26, paddingVertical: 13 }}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Neu versuchen</Text>
      </Pressable>
    </View>
  );
}
