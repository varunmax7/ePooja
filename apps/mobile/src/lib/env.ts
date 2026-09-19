import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Environment contract (§13). Everything is optional so the app runs as a guest
 * with no backend configured; each integration is switched on only when its key
 * is present.
 */
const envSchema = z.object({
  APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),
});

const parsed = envSchema.safeParse({
  APP_ENV: process.env.APP_ENV,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
  EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST,
});

if (!parsed.success) {
  // Misconfigured env must fail loudly in dev and degrade to guest mode in prod.
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
}

const values = parsed.success ? parsed.data : envSchema.parse({});

export const env = {
  ...values,
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  isDev: __DEV__,
  hasSupabase: Boolean(values.EXPO_PUBLIC_SUPABASE_URL && values.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  hasSentry: Boolean(values.EXPO_PUBLIC_SENTRY_DSN),
  hasAnalytics: Boolean(values.EXPO_PUBLIC_POSTHOG_KEY),
} as const;

export type Env = typeof env;
