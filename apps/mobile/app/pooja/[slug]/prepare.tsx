import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  CheckRow,
  CurvedHeader,
  ProgressPill,
  RecipePreviewCard,
  Txt,
  colors,
  spacing,
} from '@epooja/ui';
import prepare from '@/mocks/prepare.json';

/**
 * Pooja Preparation (§8.4, mockup screen 3).
 *
 * "Start Pooja" is never blocked — an unchecked item gets a gentle warning, not
 * a locked button. A devotee mid-ritual must never be stopped by the app.
 */
export default function PrepareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(prepare.items.map((item) => [item.id, item.checked])),
  );

  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = prepare.items.length;
  const pending = total - doneCount;

  const toggle = (id: string) => {
    void Haptics.selectionAsync();
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[9] * 2 }}>
        <CurvedHeader title={prepare.title} subtitle={prepare.subtitle} tone="maroon" height={150} />

        <View style={{ paddingHorizontal: spacing[5], gap: spacing[5], marginTop: spacing[4] }}>
          <Card tone="cream" padding={5}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing[3],
              }}
            >
              <Txt variant="sectionTitle" tone="ink" style={{ flex: 1 }}>
                {prepare.checklistTitle}
              </Txt>
              <ProgressPill label={`${doneCount}/${total} ready`} done={doneCount} total={total} />
            </View>

            <View style={{ height: spacing[2] }} />

            {prepare.items.map((item, index) => (
              <View
                key={item.id}
                style={{
                  borderBottomWidth: index === prepare.items.length - 1 ? 0 : 1,
                  borderBottomColor: colors.cream['300'],
                }}
              >
                <CheckRow
                  label={item.label}
                  checked={checked[item.id] ?? false}
                  onToggle={() => {
                    toggle(item.id);
                  }}
                  icon={item.icon as never}
                />
              </View>
            ))}
          </Card>

          <RecipePreviewCard
            eyebrow={prepare.recipe.eyebrow}
            title={prepare.recipe.title}
            buttonLabel={prepare.recipe.buttonLabel}
            onPress={() => {
              router.push(`/pooja/${slug}/recipe/${prepare.recipe.id}`);
            }}
          />
        </View>
      </ScrollView>

      {/* Sticky footer: always enabled, warning only (§8.4). */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing[5],
          paddingBottom: Math.max(insets.bottom, spacing[5]),
          backgroundColor: colors.cream['50'],
          borderTopWidth: 1,
          borderTopColor: colors.cream['300'],
          gap: spacing[2],
        }}
      >
        {pending > 0 ? (
          <Txt variant="label" tone="inkMuted" align="center">
            {pending} {pending === 1 ? 'item' : 'items'} still unchecked — you can start anyway.
          </Txt>
        ) : null}
        <Button
          label={prepare.startLabel}
          tone="maroon"
          size="lg"
          icon="play"
          fullWidth
          onPress={() => {
            router.push(`/player/${slug}`);
          }}
        />
      </View>
    </View>
  );
}
