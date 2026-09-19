import * as Sentry from '@sentry/react-native';
import { env } from './env';

/**
 * Crash reporting (§12). No-ops unless a DSN is configured, so guest builds and
 * CI never phone home.
 */
export function initSentry(): void {
  if (!env.hasSentry) return;

  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    environment: env.APP_ENV,
    // §13: ritual content and devotee details never leave the device.
    sendDefaultPii: false,
    tracesSampleRate: env.APP_ENV === 'production' ? 0.2 : 1.0,
    enabled: !env.isDev,
  });
}

export { Sentry };
