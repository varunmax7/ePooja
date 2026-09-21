import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors, FontScaleProvider } from '@epooja/ui';
import { appFonts } from '@/lib/fonts';
import { readFontScaleOverride } from '@/lib/fontScale';
import { initAnalytics } from '@/lib/analytics';
import { initSentry } from '@/lib/sentry';
import '../global.css';

initSentry();
void SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const fontScaleOverride = readFontScaleOverride();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    // Hide the splash once the §7.3 faces are ready — the app should never
    // flash a fallback face under Telugu or Devanagari text.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <FontScaleProvider scale={fontScaleOverride}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.maroon['900'] },
                headerTintColor: colors.cream['100'],
                headerTitleStyle: { fontWeight: '600' },
                contentStyle: { backgroundColor: colors.cream['50'] },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="pooja/[slug]/index" options={{ title: 'Pooja' }} />
              <Stack.Screen name="pooja/[slug]/prepare" options={{ headerShown: false }} />
              <Stack.Screen name="pooja/[slug]/recipe/[id]" options={{ title: 'Recipe' }} />
              <Stack.Screen
                name="player/[slug]"
                options={{ headerShown: false, presentation: 'fullScreenModal' }}
              />
              <Stack.Screen
                name="panchangam/[date]"
                options={{ headerShown: false, presentation: 'modal' }}
              />
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="profile/edit"
                options={{ headerShown: false, presentation: 'modal' }}
              />
              <Stack.Screen name="profile/family/index" options={{ title: 'Family Members' }} />
              <Stack.Screen name="_dev/components" options={{ title: 'Components' }} />
              <Stack.Screen name="_dev/svara" options={{ title: 'Svara spike' }} />
              <Stack.Screen name="_dev/audio-spike" options={{ title: 'Audio spike' }} />
            </Stack>
          </FontScaleProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
