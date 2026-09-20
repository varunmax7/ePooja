import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';

const VALUE_PROPS: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }[] = [
  { icon: 'calendar-star', text: 'Your Panchangam, computed for exactly where you live' },
  { icon: 'account-voice', text: 'A Sankalpam spoken correctly for you and your family' },
  { icon: 'candle', text: 'Guided through every puja, step by step, in your own voice' },
];

/**
 * Welcome (§8.1 step 1): brand, three value props, "Begin".
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }} className="bg-cream-50">
      <View style={{ alignItems: 'center', paddingTop: spacing[9] * 1.5, gap: spacing[2] }}>
        <MaterialCommunityIcons name="om" size={56} color={colors.maroon['800'] as string} />
        <Txt variant="screenTitle" tone="maroon">
          ePooja
        </Txt>
        <Txt variant="body" tone="inkMuted" align="center" style={{ paddingHorizontal: spacing[7] }}>
          A digital Telugu Smartha purohit for your home.
        </Txt>
      </View>

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
        {VALUE_PROPS.map((item) => (
          <Card key={item.text} tone="cream" padding={4}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={colors.maroon['700'] as string}
              />
              <Txt variant="body" tone="ink" style={{ flex: 1 }}>
                {item.text}
              </Txt>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ padding: spacing[5] }}>
        <Button
          label="Begin"
          tone="maroon"
          size="lg"
          fullWidth
          onPress={() => {
            router.push('/onboarding/language');
          }}
        />
      </View>
    </View>
  );
}
