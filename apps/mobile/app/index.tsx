import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { env } from '@/lib/env';

/**
 * Phase 0 shell screen. It exists to satisfy the Phase 0 Gate — "dev build runs
 * on both platforms showing a themed Hello" — and is replaced by the Today tab
 * (§8.2) in Phase 3.
 */
export default function ShellScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-cream-50" style={{ paddingBottom: insets.bottom }}>
      <View className="h-48 items-center justify-center rounded-b-[32px] bg-maroon-900">
        <Text className="text-3xl font-semibold text-cream-100">ePooja</Text>
        <Text className="mt-1 text-sm text-gold-300">Phase 0 — foundations</Text>
      </View>

      <View className="flex-1 gap-3 p-5">
        <View className="rounded-md border border-gold-300 bg-cream-200 p-4">
          <Text className="text-xs uppercase tracking-wide text-ink-500">Build</Text>
          <Text className="mt-1 text-base font-semibold text-ink-900">
            {env.APP_ENV} · v{env.appVersion}
          </Text>
        </View>

        <View className="rounded-md border border-gold-300 bg-cream-200 p-4">
          <Text className="text-xs uppercase tracking-wide text-ink-500">Integrations</Text>
          <Text className="mt-1 text-base text-ink-900">
            Supabase {env.hasSupabase ? 'on' : 'off'} · Sentry {env.hasSentry ? 'on' : 'off'} ·
            PostHog {env.hasAnalytics ? 'on' : 'off'}
          </Text>
        </View>

        <Link
          href="/_dev/audio-spike"
          className="mt-2 overflow-hidden rounded-pill bg-maroon-800 px-5 py-4 text-center text-base font-semibold text-cream-100"
        >
          Open audio spike
        </Link>
      </View>
    </View>
  );
}
