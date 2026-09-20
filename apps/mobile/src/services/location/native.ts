import * as Location from 'expo-location';
import type { DevoteeLocation } from '@epooja/content';
import { CITIES } from './cities';
import { resolveFromCoords } from './resolve';

/**
 * The three ways §8.1's location step can end: a fix was obtained, the
 * devotee (or the OS) said no, or the platform can't ask. The screen switches
 * on `status` rather than on a thrown error — a denial is an expected answer,
 * not a failure.
 */
export type LocationResult =
  | { status: 'granted'; location: DevoteeLocation }
  | { status: 'denied' }
  | { status: 'unavailable'; reason: string };

/**
 * Requests foreground permission if needed, then a GPS fix, and resolves it
 * against the offline city list.
 *
 * Never throws: every failure this can hit — permission denied, services off,
 * a timeout — is something §8.1 explicitly has to "handle", i.e. fall through
 * to manual city search, not crash the onboarding flow.
 */
export async function requestDeviceLocation(): Promise<LocationResult> {
  try {
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) return { status: 'unavailable', reason: 'Location services are turned off' };

    const existing = await Location.getForegroundPermissionsAsync();
    const permission = existing.granted
      ? existing
      : await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) return { status: 'denied' };

    const fix = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      status: 'granted',
      location: resolveFromCoords(CITIES, {
        lat: fix.coords.latitude,
        lng: fix.coords.longitude,
      }),
    };
  } catch (error) {
    return {
      status: 'unavailable',
      reason: error instanceof Error ? error.message : 'Could not determine location',
    };
  }
}
