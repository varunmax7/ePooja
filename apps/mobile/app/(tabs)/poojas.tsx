import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, CurvedHeader, Txt, colors, radius, spacing } from '@epooja/ui';
import poojas from '@/mocks/poojas.json';

/**
 * Poojas catalog (§8.3): sections for Nitya, deity pujas and festivals, each
 * card showing the name, duration variants and whether the pack is downloaded.
 */
export default function PoojasScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <CurvedHeader title="Poojas" tone="maroon" height={130} />

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[6], marginTop: spacing[4] }}>
        {poojas.sections.map((section) => (
          <View key={section.id} style={{ gap: spacing[3] }}>
            <Txt variant="sectionTitle" tone="ink">
              {section.title}
            </Txt>

            {section.items.length === 0 ? (
              <Card tone="outlined" padding={4}>
                <Txt variant="label" tone="inkMuted">
                  {section.note ?? ''}
                </Txt>
              </Card>
            ) : null}

            {section.items.map((item) => (
              <Pressable
                key={item.slug}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => {
                  router.push(`/pooja/${item.slug}`);
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
                        name={item.icon as never}
                        size={28}
                        color={colors.maroon['700'] as string}
                      />
                    </View>

                    <View style={{ flex: 1, gap: spacing[1] }}>
                      <Txt variant="cardTitle" tone="ink">
                        {item.title}
                      </Txt>
                      <Txt variant="label" tone="inkMuted">
                        {item.duration} · {item.steps} steps
                      </Txt>
                    </View>

                    {item.downloaded ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing[1],
                          backgroundColor: colors.cream['300'],
                          borderRadius: radius.pill,
                          paddingHorizontal: spacing[3],
                          paddingVertical: spacing[1],
                        }}
                      >
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={14}
                          color={colors.success}
                        />
                        <Txt variant="fieldLabel" tone="success">
                          Downloaded
                        </Txt>
                      </View>
                    ) : (
                      <MaterialCommunityIcons
                        name="tray-arrow-down"
                        size={22}
                        color={colors.ink['400'] as string}
                      />
                    )}
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
