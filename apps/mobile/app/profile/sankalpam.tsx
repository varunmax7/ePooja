import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Txt, colors, mantraVariantFor, spacing, type MantraScript } from '@epooja/ui';
import { useDevoteeStore } from '@/stores/devotee';
import { useTodayDate, usePanchangam } from '@/services/panchangam';
import { buildDevoteeSankalpam } from '@/services/sankalpam';
import { pujaBySlug } from '@/services/content';

/**
 * "Preview Sankalpam" (§10 Phase 5): today's Sankalpam, text only, in the
 * devotee's chosen script with a toggle to check the other two. The audio
 * version is Phase 7 — this screen only proves the text builder end to end
 * against a live devotee and a live Panchangam, the same way the full-
 * Panchangam sheet already does for the engine.
 */
export default function SankalpamPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const devotee = useDevoteeStore((s) => s.devotee);
  const { date } = useTodayDate();
  const { data: panchangam, isLoading, isError } = usePanchangam(date, devotee?.location);
  const [script, setScript] = useState<MantraScript>(devotee?.prefs.mantraScript ?? 'te');

  // The daily Nitya Puja's own deity (§9.5) — the Sankalpam this screen
  // previews is the one a devotee would actually recite today, not a
  // deity-puja-specific one they have not opened yet.
  const deity = pujaBySlug('nitya-puja')?.deity ?? 'generic';

  const text = devotee && panchangam ? buildDevoteeSankalpam(devotee, panchangam, deity) : null;

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + spacing[3],
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[3],
        }}
      >
        <Txt variant="screenTitle" tone="maroon">
          Preview Sankalpam
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          onPress={() => {
            router.back();
          }}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.maroon['800'] as string} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[5] }}>
        {(['te', 'dev', 'iast'] as const).map((option) => (
          <ScriptChip
            key={option}
            label={option === 'te' ? 'Telugu' : option === 'dev' ? 'Devanagari' : 'IAST'}
            active={script === option}
            onPress={() => {
              setScript(option);
            }}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: spacing[8] }}
      >
        {!devotee ? <Txt tone="inkMuted">Finish onboarding to preview the Sankalpam.</Txt> : null}
        {isLoading ? <Txt tone="inkMuted">Computing today&rsquo;s Panchangam…</Txt> : null}
        {isError ? <Txt tone="danger">Could not compute today&rsquo;s Panchangam.</Txt> : null}

        {text ? (
          <Card tone="cream" padding={5}>
            <Txt variant={mantraVariantFor(script)} tone="ink">
              {script === 'te' ? text.te : script === 'dev' ? text.dev : text.iast}
            </Txt>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ScriptChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: 999,
        backgroundColor: active ? (colors.gold['400'] as string) : (colors.cream['200'] as string),
      }}
    >
      <Txt variant="label" tone={active ? 'maroon' : 'inkMuted'}>
        {label}
      </Txt>
    </Pressable>
  );
}
