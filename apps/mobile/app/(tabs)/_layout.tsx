import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/components/TabBar';
import { hasOnboarded, useDevoteeStore } from '@/stores/devotee';

/**
 * §8.1: a fresh install lands on Welcome, not Today. `hydrated` gates the
 * check on MMKV actually having been read — without it, the very first frame
 * would see `devotee: null` before rehydration finishes and bounce a
 * returning devotee into onboarding for an instant.
 */
export default function TabsLayout() {
  const hydrated = useDevoteeStore((s) => s.hydrated);
  const onboarded = useDevoteeStore(hasOnboarded);

  if (!hydrated) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="poojas" options={{ title: 'Poojas' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
