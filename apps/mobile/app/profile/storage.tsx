import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';
import { PUJAS, checkForUpdates, downloadPack } from '@/services/content';
import { pujaTitle } from '@/lib/pujaDisplay';
import { useDownloadsStore, type DownloadStatus } from '@/stores/downloads';
import { env } from '@/lib/env';

/**
 * Storage & Offline Packs (§10 Phase 8: "'Download for offline' and storage
 * management in Settings"). Every puja today is bundled inside the binary
 * (§10 Phase 4's seed pack) — there is no second, download-only puja yet —
 * so "Check for updates" is the only action that means anything until a
 * puja ships that isn't bundled; it's still real against a configured
 * backend, just always reporting "nothing to update" today.
 */

export default function StorageScreen() {
  const statuses = useDownloadsStore((s) => s.statuses);
  const [checking, setChecking] = useState(false);
  const [updateCount, setUpdateCount] = useState<number | null>(null);
  const { t } = useTranslation('account');
  const { t: tProfile } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');

  const STATUS_LABEL: Record<DownloadStatus, string> = {
    bundled: t('storage.statusBundled'),
    'not-downloaded': t('storage.statusNotDownloaded'),
    downloading: t('storage.statusDownloading'),
    downloaded: t('storage.statusDownloaded'),
    failed: t('storage.statusFailed'),
  };

  async function handleCheckForUpdates() {
    setChecking(true);
    setUpdateCount(null);
    const updates = await checkForUpdates();
    setUpdateCount(updates.length);
    for (const update of updates) {
      await downloadPack(update);
    }
    setChecking(false);
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: spacing[8] }}
    >
      <Stack.Screen options={{ title: tProfile('storageAndPacks') }} />

      {PUJAS.map((puja) => (
        <Card key={puja.id} tone="cream" padding={4}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Txt variant="cardTitle" tone="ink">
              {pujaTitle(puja)}
            </Txt>
            <Txt variant="label" tone="inkMuted">
              {STATUS_LABEL[statuses[puja.id] ?? 'not-downloaded']}
            </Txt>
          </View>
        </Card>
      ))}

      <Button
        label={checking ? t('storage.checking') : t('storage.checkForUpdates')}
        onPress={() => void handleCheckForUpdates()}
        disabled={checking || !env.hasSupabase}
        fullWidth
      />
      {checking && (
        <ActivityIndicator
          color={colors.maroon['700'] as string}
          accessibilityLabel={tCommon('loading')}
        />
      )}
      {updateCount !== null && !checking && (
        <Txt variant="label" tone="inkMuted">
          {updateCount === 0
            ? t('storage.upToDate')
            : t('storage.updatedCount', { count: updateCount })}
        </Txt>
      )}
      {!env.hasSupabase && (
        <Txt variant="label" tone="inkMuted">
          {t('storage.noBackend')}
        </Txt>
      )}
    </ScrollView>
  );
}
