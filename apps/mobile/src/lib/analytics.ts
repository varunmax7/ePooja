import PostHog from 'posthog-react-native';
import { env } from './env';

/**
 * Privacy-safe analytics (§12): screen/funnel events only, never devotee names,
 * gothram, family details or location coordinates.
 */
let client: PostHog | null = null;

export function initAnalytics(): PostHog | null {
  if (!env.hasAnalytics || client) return client;

  client = new PostHog(env.EXPO_PUBLIC_POSTHOG_KEY as string, {
    host: env.EXPO_PUBLIC_POSTHOG_HOST,
    enableSessionReplay: false,
  });
  return client;
}

export function capture(event: string, properties?: Record<string, string | number | boolean>) {
  client?.capture(event, properties);
}
