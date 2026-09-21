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
import { pujaBySlug, recipesForPuja, samagriForPuja } from '@/services/content';
import { useChecklistStore } from '@/stores/checklist';
import { useTodayDate } from '@/services/panchangam';
import { durationLabel, pujaTitle } from '@/lib/pujaDisplay';

/**
 * Pooja Preparation (§8.4, mockup screen 3).
 *
 * The checklist is the puja's own samagri, and the ticks persist per puja per
 * day (§10 Phase 4) through `useChecklistStore` — keyed on the same date the
 * Today screen is showing, so a devotee preparing for a specific day ticks
 * that day's list.
 *
 * "Start Pooja" is never blocked — an unchecked item gets a gentle warning, not
 * a locked button. A devotee mid-ritual must never be stopped by the app.
 */
export default function PrepareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { date } = useTodayDate();

  const puja = pujaBySlug(slug);
  const entries = useChecklistStore((s) => s.entries);
  const toggleItem = useChecklistStore((s) => s.toggle);

  if (!puja) {
    return (
      <View style={{ flex: 1, padding: spacing[5] }} className="bg-cream-50">
        <Card tone="outlined" padding={5}>
          <Txt variant="body" tone="inkMuted">
            That pooja isn&apos;t in this app yet.
          </Txt>
        </Card>
      </View>
    );
  }

  const items = samagriForPuja(puja);
  const recipe = recipesForPuja(puja)[0];
  // Read from `entries` rather than the store's selector so the component
  // re-renders when a tick changes — a selector call inside render would not
  // subscribe to the slice it reads.
  const checkedIds = entries[`${puja.id}:${date}`] ?? [];

  const doneCount = items.filter((item) => checkedIds.includes(item.id)).length;
  const total = items.length;
  const pending = total - doneCount;

  const toggle = (id: string) => {
    void Haptics.selectionAsync();
    toggleItem(puja.id, date, id);
  };

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[9] * 2 }}>
        <CurvedHeader
          title="Pooja Preparation"
          subtitle={`${pujaTitle(puja)} · ${durationLabel(puja)}`}
          tone="maroon"
          height={150}
        />

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
                Essentials for Today&apos;s Ritual
              </Txt>
              <ProgressPill label={`${doneCount}/${total} ready`} done={doneCount} total={total} />
            </View>

            <View style={{ height: spacing[2] }} />

            {items.map((item, index) => (
              <View
                key={item.id}
                style={{
                  borderBottomWidth: index === items.length - 1 ? 0 : 1,
                  borderBottomColor: colors.cream['300'],
                }}
              >
                <CheckRow
                  label={item.name.en ?? item.name.te}
                  checked={checkedIds.includes(item.id)}
                  onToggle={() => {
                    toggle(item.id);
                  }}
                  icon={item.icon as never}
                />
              </View>
            ))}
          </Card>

          {recipe ? (
            <RecipePreviewCard
              eyebrow="Offerings Recipe Preview:"
              title={recipe.name.en ?? recipe.name.te}
              buttonLabel="View Recipe"
              onPress={() => {
                router.push(`/pooja/${puja.slug}/recipe/${recipe.id}`);
              }}
            />
          ) : null}
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
          label="Start Pooja"
          tone="maroon"
          size="lg"
          icon="play"
          fullWidth
          onPress={() => {
            router.push(`/player/${puja.slug}`);
          }}
        />
      </View>
    </View>
  );
}
