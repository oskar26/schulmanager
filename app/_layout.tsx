import '../global.css';

import { useEffect, useRef } from 'react';
import { AppState, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
  const restore = useSession((state) => state.restore);
  const restoring = useRef(false);

  useEffect(() => {
    void hydrate();
    registerNotificationHandler();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !restoring.current) {
      restoring.current = true;
      void restore().finally(() => {
        restoring.current = false;
      });
    }
  }, [hydrated, restore]);

  const resolved = theme === 'system' ? (system ?? 'light') : theme;

  useEffect(() => {
    nativewindColorScheme.set(resolved === 'dark' ? 'dark' : 'light');
  }, [resolved]);

  return (
    <ScreenErrorBoundary label="App">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={resolved}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister, maxAge: 7 * 24 * 60 * 60_000 }}
          >
            <SafeAreaProvider>
              <LockGate>
                <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                  <Stack.Screen name="(tabs)" />
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
              </LockGate>
            </SafeAreaProvider>
          </PersistQueryClientProvider>
        </TamaguiProvider>
      </GestureHandlerRootView>
    </ScreenErrorBoundary>
  );
}

/** Expo-Router-Fehlergrenze — fängt Routing-/Render-Fehler auf Root-Ebene. */
export function ErrorBoundary(props: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FD', padding: 32 }}>
      <Text style={{ fontSize: 52 }}>😵‍💫</Text>
      <Text style={{ marginTop: 8, fontSize: 20, fontWeight: '700', color: '#121422', textAlign: 'center' }}>
        Da ist Schulflow gestolpert
      </Text>
      <Text style={{ marginTop: 4, fontSize: 13, color: '#6A7086', textAlign: 'center' }}>
        Deine Daten sind unberührt. Versuche den Bildschirm neu zu laden.
      </Text>
      <ScrollView style={{ maxHeight: 96, marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12 }}>
        <Text style={{ fontSize: 11, color: '#6A7086' }}>{props.error?.message}</Text>
      </ScrollView>
      <Pressable
        onPress={props.retry}
        style={{ marginTop: 20, backgroundColor: '#6C5CE7', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14 }}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Neu versuchen</Text>
      </Pressable>
    </View>
  );
}
