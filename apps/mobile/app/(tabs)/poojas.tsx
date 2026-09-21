import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, CurvedHeader, Txt, colors, radius, spacing } from '@epooja/ui';
import { catalogSections } from '@/services/content';
import { durationLabel, pujaIcon, pujaTitle, shortStepCount } from '@/lib/pujaDisplay';

/**
 * Poojas catalog (§8.3): sections for Nitya, deity pujas and festivals, each
 * card showing the name, duration variants and step count — now from the
 * bundled seed pack rather than the Phase 1 mock.
 *
 * Every puja here ships inside the binary (§10 Phase 4), so all of them read
 * as available offline. The per-pack Download control §8.3 describes belongs
 * to Phase 8, where downloadable packs actually exist; showing a download
 * affordance now would promise something the app cannot do.
 */
export default function PoojasScreen() {
  const router = useRouter();
  const sections = catalogSections();

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <CurvedHeader title="Poojas" tone="maroon" height={130} />

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[6], marginTop: spacing[4] }}>
        {sections.map((section) => (
          <View key={section.category} style={{ gap: spacing[3] }}>
            <Txt variant="sectionTitle" tone="ink">
              {section.title}
            </Txt>

            {section.pujas.map((puja) => (
              <Pressable
                key={puja.slug}
                accessibilityRole="button"
                accessibilityLabel={pujaTitle(puja)}
                onPress={() => {
                  router.push(`/pooja/${puja.slug}`);
                }}
              >
                <Card tone="cream" padding={4}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: radius.md,
                        backgroundColor: colors.saffron['200'],
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons
                        name={pujaIcon(puja)}
                        size={28}
                        color={colors.maroon['700'] as string}
                      />
                    </View>

                    <View style={{ flex: 1, gap: spacing[1] }}>
                      <Txt variant="cardTitle" tone="ink">
                        {pujaTitle(puja)}
                      </Txt>
                      <Txt variant="telugu" tone="inkMuted">
                        {puja.title.te}
                      </Txt>
                      <Txt variant="label" tone="inkMuted">
                        {durationLabel(puja)} · {shortStepCount(puja)} steps
                      </Txt>
                    </View>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={colors.ink['400'] as string}
                    />
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
