import '../global.css';

import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
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
import { paletteFor } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { useSettings } from '@/state/settings';
import { useSession } from '@/state/session';
import { registerNotificationHandler } from '@/features/notifications/scheduler';
import { hydrateRelayOverride } from '@/api/transport';
import { LiveIsland } from '@/features/island/LiveIsland';
import { useIslandState } from '@/features/island/use-island';
import { useLiveIslandEffects } from '@/features/island/effects';
import { ErrorBoundary as ScreenErrorBoundary } from '@/ui/error-boundary';
import { LockGate } from '@/ui/lock-gate';
import { PressableScale } from '@/ui/motion';
import { StylePipelineGuard } from '@/ui/style-guard';

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
    // Phase 11: ein in den Einstellungen hinterlegter CORS-Umweg muss vor der
    // ersten Datenanfrage bekannt sein, sonst läuft der Start ins Leere.
    void hydrateRelayOverride();
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
    const nextScheme = resolved === 'dark' ? 'dark' : 'light';
    // NativeWind aktualisiert die RN-Styles. Die explizite HTML-Klasse hält
    // zusätzlich unsere CSS-Variablen in `global.css` beim Theme-Wechsel synchron.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextScheme === 'dark');
    }
    nativewindColorScheme.set(nextScheme);
  }, [resolved]);

  // APK-Stabilität: Kein freischwebender, halb initialisierter Start.
  // Boot-View mit fester Füllhöhe zeigen, bis die Einstellungen hydratisiert sind
  // (Thema, Demo-Modus bekannt) — nie ein leerer/transparenter Bildschirm.
  const dark = resolved === 'dark';
  const colors = paletteFor(dark);

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
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.canvas },
                        // Phase 12: Screen-Wechsel bewegen sich einheitlich statt
                        // hart zu springen. Kürzer als der Systemdefault (260 ms),
                        // damit sich die App direkt anfühlt; `slide_from_bottom`
                        // bleibt den modalen Formularen vorbehalten.
                        animation: 'slide_from_right',
                        animationDuration: 260,
                      }}
                    >
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="onboarding" />
                      <Stack.Screen name="settings" options={{ presentation: 'card', animation: 'slide_from_right' }} />
                      <Stack.Screen name="sick-note" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                      <Stack.Screen name="exemption" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                      <Stack.Screen name="calendar" />
                      <Stack.Screen name="attendance" />
                      <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                      <Stack.Screen name="thread" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                      <Stack.Screen name="payments" />
                      <Stack.Screen name="documents" />
                      <Stack.Screen name="parent-talks" />
                      <Stack.Screen name="electives" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                      <Stack.Screen name="allday" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                    </Stack>
                    {/*
                     * Phase 13: die Kapsel schwebt nicht mehr über allen Screens.
                     * Auf Web ist sie die Erweiterung über der Tab-Bar, nativ liefert
                     * sie null — dort übernehmen System-Mechanismen (Android-Live-Update,
                     * iOS Live Activity). `useLiveIslandEffects` läuft trotzdem weiter:
                     * es füttert genau diese Kanäle.
                     */}
                    <IslandHost />
                    {/* Phase 10: meldet ein fehlendes Stylesheet-Bundle, statt es stumm zu lassen. */}
                    <StylePipelineGuard />
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
  const colors = paletteFor(dark);
  useEffect(() => {
    // Safety-Net: Selbst wenn Hydration je hängen sollte, nie endlos Boot.
    const t = setTimeout(() => setNudge(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }]}>
      <View style={{ width: 72, height: 72, borderRadius: 26, backgroundColor: colors.accent.amber, alignItems: 'center', justifyContent: 'center' }}>
        <GraduationCap color={colors.on.amber} size={34} strokeWidth={2.2} />
      </View>
      <Text style={{ marginTop: 14, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: colors.ink }}>
        Schulflow
      </Text>
      <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '600', color: colors.muted }}>
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
  const { colors } = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, padding: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: `${colors.accent.coral}22`, alignItems: 'center', justifyContent: 'center' }}>
        <CircleAlert color={colors.danger} size={30} strokeWidth={2.2} />
      </View>
      <Text style={{ marginTop: 16, fontSize: 20, fontWeight: '800', color: colors.ink, textAlign: 'center' }}>
        Da ist Schulflow gestolpert
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 20, color: colors.muted, textAlign: 'center' }}>
        Deine Daten sind unberührt. Versuche den Bildschirm neu zu laden.
      </Text>
      <ScrollView style={{ maxHeight: 96, marginTop: 14, backgroundColor: colors.surface, borderRadius: 16, padding: 12 }}>
        <Text style={{ fontSize: 11, color: colors.muted }}>{props.error?.message}</Text>
      </ScrollView>
      <PressableScale
        onPress={props.retry}
        accessibilityRole="button"
        scale={0.97}
        hoverScale={1.01}
        style={{ marginTop: 20, backgroundColor: colors.accent.amber, borderRadius: 999, paddingHorizontal: 26, paddingVertical: 13 }}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.on.amber }}>Neu versuchen</Text>
      </PressableScale>
    </View>
  );
}
