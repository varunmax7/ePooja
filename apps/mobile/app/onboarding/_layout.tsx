import { Stack } from 'expo-router';

/**
 * §8.1 onboarding: five steps, no back-swipe out of the flow into a half-set
 * devotee, and no header chrome — each step draws its own.
 */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="language" />
      <Stack.Screen name="devotee" />
      <Stack.Screen name="family" />
      <Stack.Screen name="location" />
    </Stack>
  );
}
