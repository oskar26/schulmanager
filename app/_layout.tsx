import '../global.css';

import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from 'tamagui';
import { colorScheme as nativewindColorScheme } from 'nativewind';

import tamaguiConfig from '@/design/tamagui.config';
import { useSettings } from '@/state/settings';
import { useSession } from '@/state/session';
import { registerNotificationHandler } from '@/features/notifications/scheduler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 24 * 60 * 60_000, retry: 1 },
  },
});

export default function RootLayout() {
  const system = useColorScheme();
  const hydrate = useSettings((state) => state.hydrate);
  const hydrated = useSettings((state) => state.hydrated);
  const theme = useSettings((state) => state.settings.theme);
  const restore = useSession((state) => state.restore);

  useEffect(() => {
    void hydrate();
    registerNotificationHandler();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) void restore();
  }, [hydrated, restore]);

  const resolved = theme === 'system' ? (system ?? 'light') : theme;

  useEffect(() => {
    nativewindColorScheme.set(resolved === 'dark' ? 'dark' : 'light');
  }, [resolved]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={resolved}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="settings" options={{ presentation: 'card' }} />
              <Stack.Screen name="sick-note" options={{ presentation: 'modal' }} />
              <Stack.Screen name="exemption" options={{ presentation: 'modal' }} />
              <Stack.Screen name="calendar" />
              <Stack.Screen name="attendance" />
              <Stack.Screen name="search" options={{ presentation: 'modal' }} />
            </Stack>
          </SafeAreaProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
