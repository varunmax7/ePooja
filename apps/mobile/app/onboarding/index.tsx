import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';

/**
 * Welcome (§8.1 step 1): brand, three value props, "Begin".
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation('onboarding');

  const valueProps: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }[] = [
    { icon: 'calendar-star', text: t('welcome.valueProp1') },
    { icon: 'account-voice', text: t('welcome.valueProp2') },
    { icon: 'candle', text: t('welcome.valueProp3') },
  ];

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }} className="bg-cream-50">
      <View style={{ alignItems: 'center', paddingTop: spacing[9] * 1.5, gap: spacing[2] }}>
        <MaterialCommunityIcons name="om" size={56} color={colors.maroon['800'] as string} />
        <Txt variant="screenTitle" tone="maroon">
          {t('welcome.title')}
        </Txt>
        <Txt
          variant="body"
          tone="inkMuted"
          align="center"
          style={{ paddingHorizontal: spacing[7] }}
        >
          {t('welcome.tagline')}
        </Txt>
      </View>

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
        {valueProps.map((item) => (
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
          label={t('common:begin')}
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
