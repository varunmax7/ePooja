import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';
import { useAuthStore } from '@/stores/auth';
import { useConsentStore, hasAcceptedDpdpConsent } from '@/stores/consent';
import {
  isAppleSignInSupported,
  isAuthAvailable,
  signInWithApple,
  signInWithGoogle,
  signOut,
  type AuthFailureReason,
} from '@/services/auth';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';

/**
 * Account & Sync (§10 Phase 8, §13): where a devotee turns on multi-device
 * sync, or turns their account off again. Reached from a new row on the
 * Profile tab — the app stays guest-first (§5), so nothing here is in the
 * onboarding flow (§10 Phase 3) a devotee has already walked through.
 */

type Provider = 'google' | 'apple';

const FAILURE_MESSAGES: Record<AuthFailureReason, string> = {
  no_backend: 'Sign-in is not set up in this build yet.',
  unsupported_platform: 'This sign-in method is not available on this device.',
  cancelled: 'Sign-in was cancelled.',
  provider_error: 'Something went wrong — please try again.',
};

export default function AccountScreen() {
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);
  const email = useAuthStore((s) => s.email);
  const provider = useAuthStore((s) => s.provider);
  const lastSyncedAt = useAuthStore((s) => s.lastSyncedAt);
  const consentAccepted = useConsentStore(hasAcceptedDpdpConsent);
  const acceptConsent = useConsentStore((s) => s.accept);

  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const available = isAuthAvailable();

  async function startSignIn(which: Provider) {
    setError(null);
    if (!consentAccepted) {
      acceptConsent();
    }
    setPending(which);
    const result = which === 'google' ? await signInWithGoogle() : await signInWithApple();
    setPending(null);
    if (!result.ok) setError(FAILURE_MESSAGES[result.reason]);
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const session = await supabase?.auth.getSession();
      const accessToken = session?.data.session?.access_token;
      if (!supabase || !accessToken) throw new Error('not_signed_in');

      const response = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('delete_failed');

      await signOut();
      setConfirmingDelete(false);
    } catch {
      setDeleteError('Could not delete your account. Please try again, or contact support.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: spacing[8] }}
    >
      <Card tone="cream" padding={5}>
        {authStatus === 'signed_in' ? (
          <View style={{ gap: spacing[2] }}>
            <Txt variant="sectionTitle" tone="ink">
              Signed in
            </Txt>
            <Txt variant="body" tone="inkMuted">
              {email ?? 'Account'}{' '}
              {provider ? `· ${provider === 'google' ? 'Google' : 'Apple'}` : ''}
            </Txt>
            <Txt variant="label" tone="inkMuted">
              {lastSyncedAt
                ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
                : 'Not synced yet'}
            </Txt>
          </View>
        ) : (
          <View style={{ gap: spacing[2] }}>
            <Txt variant="sectionTitle" tone="ink">
              You&apos;re using ePooja as a guest
            </Txt>
            <Txt variant="body" tone="inkMuted">
              Your profile stays on this device. Sign in to back it up and use it on another phone.
            </Txt>
          </View>
        )}
      </Card>

      {authStatus !== 'signed_in' && (
        <Card tone="cream" padding={5} style={{ gap: spacing[3] }}>
          <Button
            label={pending === 'google' ? 'Opening Google…' : 'Sign in with Google'}
            icon="google"
            onPress={() => void startSignIn('google')}
            disabled={!available || pending !== null}
            fullWidth
          />
          {isAppleSignInSupported() && (
            <Button
              label={pending === 'apple' ? 'Opening Apple…' : 'Sign in with Apple'}
              icon="apple"
              tone="ghost"
              onPress={() => void startSignIn('apple')}
              disabled={!available || pending !== null}
              fullWidth
            />
          )}
          {pending && <ActivityIndicator color={colors.maroon['700'] as string} />}
          {error && (
            <Txt variant="label" tone="danger">
              {error}
            </Txt>
          )}
          {!available && (
            <Txt variant="label" tone="inkMuted">
              This build has no backend configured — sign-in will work once one is.
            </Txt>
          )}
        </Card>
      )}

      {authStatus === 'signed_in' && (
        <Card tone="cream" padding={5} style={{ gap: spacing[3] }}>
          <Button label="Sign out" tone="ghost" onPress={() => void signOut()} fullWidth />

          {!confirmingDelete ? (
            <Button
              label="Delete my account"
              tone="ghost"
              onPress={() => {
                setConfirmingDelete(true);
              }}
              fullWidth
            />
          ) : (
            <View style={{ gap: spacing[2] }}>
              <Txt variant="label" tone="danger">
                This permanently deletes your account, synced profile and puja history from our
                servers. Your profile stays on this device.
              </Txt>
              <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                <Button
                  label="Cancel"
                  tone="ghost"
                  onPress={() => {
                    setConfirmingDelete(false);
                  }}
                />
                <Button
                  label={deleting ? 'Deleting…' : 'Confirm delete'}
                  tone="maroon"
                  disabled={deleting}
                  onPress={() => void handleDeleteAccount()}
                />
              </View>
              {deleteError && (
                <Txt variant="label" tone="danger">
                  {deleteError}
                </Txt>
              )}
            </View>
          )}
        </Card>
      )}

      <Button
        label="Privacy Policy"
        tone="ghost"
        onPress={() => {
          router.push('/profile/privacy');
        }}
      />
    </ScrollView>
  );
}
