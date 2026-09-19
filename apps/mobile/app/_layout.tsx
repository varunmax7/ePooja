import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from '@/theme';
import { initAnalytics } from '@/lib/analytics';
import { initSentry } from '@/lib/sentry';
import '../global.css';

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Offline-first (§5): content and profile queries survive a dropped
      // network; nothing in a running puja may depend on a refetch.
      retry: 2,
      staleTime: 5 * 60 * 1000,
      networkMode: 'offlineFirst',
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.maroon[900] },
              headerTintColor: colors.cream[100],
              headerTitleStyle: { fontWeight: '600' },
              contentStyle: { backgroundColor: colors.cream[50] },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'ePooja' }} />
            <Stack.Screen name="_dev/audio-spike" options={{ title: 'Audio spike' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
