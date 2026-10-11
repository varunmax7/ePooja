import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation('account');
  const { t: tProfile } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');

  const FAILURE_MESSAGES: Record<AuthFailureReason, string> = {
    no_backend: t('account.failureNoBackend'),
    unsupported_platform: t('account.failureUnsupportedPlatform'),
    cancelled: t('account.failureCancelled'),
    provider_error: t('account.failureProviderError'),
  };

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
      setDeleteError(t('account.deleteGenericError'));
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
      <Stack.Screen options={{ title: tProfile('accountAndSync') }} />

      <Card tone="cream" padding={5}>
        {authStatus === 'signed_in' ? (
          <View style={{ gap: spacing[2] }}>
            <Txt variant="sectionTitle" tone="ink">
              {t('account.signedIn')}
            </Txt>
            <Txt variant="body" tone="inkMuted">
              {email ?? t('account.accountFallback')}{' '}
              {provider
                ? `· ${provider === 'google' ? t('account.providerGoogle') : t('account.providerApple')}`
                : ''}
            </Txt>
            <Txt variant="label" tone="inkMuted">
              {lastSyncedAt
                ? t('account.lastSynced', { date: new Date(lastSyncedAt).toLocaleString() })
                : t('account.notSyncedYet')}
            </Txt>
          </View>
        ) : (
          <View style={{ gap: spacing[2] }}>
            <Txt variant="sectionTitle" tone="ink">
              {t('account.guestTitle')}
            </Txt>
            <Txt variant="body" tone="inkMuted">
              {t('account.guestBody')}
            </Txt>
          </View>
        )}
      </Card>

      {authStatus !== 'signed_in' && (
        <Card tone="cream" padding={5} style={{ gap: spacing[3] }}>
          <Button
            label={
              pending === 'google' ? t('account.openingGoogle') : t('account.signInWithGoogle')
            }
            icon="google"
            onPress={() => void startSignIn('google')}
            disabled={!available || pending !== null}
            fullWidth
          />
          {isAppleSignInSupported() && (
            <Button
              label={pending === 'apple' ? t('account.openingApple') : t('account.signInWithApple')}
              icon="apple"
              tone="ghost"
              onPress={() => void startSignIn('apple')}
              disabled={!available || pending !== null}
              fullWidth
            />
          )}
          {pending && (
            <ActivityIndicator
              color={colors.maroon['700'] as string}
              accessibilityLabel={tCommon('loading')}
            />
          )}
          {error && (
            <Txt variant="label" tone="danger">
              {error}
            </Txt>
          )}
          {!available && (
            <Txt variant="label" tone="inkMuted">
              {t('account.noBackend')}
            </Txt>
          )}
        </Card>
      )}

      {authStatus === 'signed_in' && (
        <Card tone="cream" padding={5} style={{ gap: spacing[3] }}>
          <Button
            label={t('account.signOut')}
            tone="ghost"
            onPress={() => void signOut()}
            fullWidth
          />

          {!confirmingDelete ? (
            <Button
              label={t('account.deleteMyAccount')}
              tone="ghost"
              onPress={() => {
                setConfirmingDelete(true);
              }}
              fullWidth
            />
          ) : (
            <View style={{ gap: spacing[2] }}>
              <Txt variant="label" tone="danger">
                {t('account.deleteConfirmWarning')}
              </Txt>
              <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                <Button
                  label={tCommon('cancel')}
                  tone="ghost"
                  onPress={() => {
                    setConfirmingDelete(false);
                  }}
                />
                <Button
                  label={deleting ? t('account.deleting') : t('account.confirmDelete')}
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
        label={t('account.privacyPolicyLink')}
        tone="ghost"
        onPress={() => {
          router.push('/profile/privacy');
        }}
      />
    </ScrollView>
  );
}
