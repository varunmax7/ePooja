import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { bytesToHex } from './nonce';
import { parseOAuthRedirect } from './oauthRedirect';

/**
 * Sign-in (§10 Phase 8): guest by default (§5), Google + Apple as the two
 * ways to turn on sync. Phone OTP was scoped out of this phase (DLT
 * registration lead time).
 *
 * Every function here returns a result rather than throwing — a devotee
 * cancelling a sign-in sheet is a normal outcome, not an error to log to
 * Sentry, and the caller (the Account screen) needs to tell "you cancelled"
 * apart from "that didn't work" apart from "sign-in isn't set up yet."
 */

export type AuthFailureReason =
  'no_backend' | 'unsupported_platform' | 'cancelled' | 'provider_error';

export type AuthResult = { ok: true } | { ok: false; reason: AuthFailureReason };

const REDIRECT_URL = Linking.createURL('auth-callback');

/**
 * Google sign-in via Supabase's hosted OAuth (ADR 0004): open the provider's
 * consent screen in a system browser tab, read the tokens back off the
 * `epooja://auth-callback` redirect, and hand them to Supabase directly
 * rather than relying on `detectSessionInUrl` (which needs a real browser
 * location, not a React Native deep link).
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!supabase) return { ok: false, reason: 'no_backend' };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT_URL, skipBrowserRedirect: true },
  });

  if (error || !data.url) return { ok: false, reason: 'provider_error' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);
  if (result.type !== 'success') return { ok: false, reason: 'cancelled' };

  const tokens = parseOAuthRedirect(result.url);
  if (!tokens) return { ok: false, reason: 'provider_error' };

  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
  if (setSessionError) return { ok: false, reason: 'provider_error' };

  return { ok: true };
}

/**
 * Apple sign-in, native (ADR 0004: Apple expects the native button, not a web
 * view, when another third-party sign-in is offered). iOS only —
 * `AppleAuthentication.isAvailableAsync()` is also false on iOS devices
 * signed out of iCloud, which this treats the same as "not on iOS."
 */
export async function signInWithApple(): Promise<AuthResult> {
  if (!supabase) return { ok: false, reason: 'no_backend' };
  if (Platform.OS !== 'ios') return { ok: false, reason: 'unsupported_platform' };

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) return { ok: false, reason: 'unsupported_platform' };

  const rawNonce = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === 'ERR_REQUEST_CANCELED') return { ok: false, reason: 'cancelled' };
    return { ok: false, reason: 'provider_error' };
  }

  if (!credential.identityToken) return { ok: false, reason: 'provider_error' };

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) return { ok: false, reason: 'provider_error' };

  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Whether sign-in is even possible in this build — gates the Account screen's buttons. */
export function isAuthAvailable(): boolean {
  return supabase !== null;
}

export function isAppleSignInSupported(): boolean {
  return Platform.OS === 'ios';
}
