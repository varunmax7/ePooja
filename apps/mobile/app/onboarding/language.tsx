import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';
import type { DevoteePrefs, Script } from '@epooja/content';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { SCRIPT_SAMPLES, TELUGU_LANGUAGE_NAME } from '@/i18n/onboarding';
import { useOnboardingDraft } from '@/stores/onboardingDraft';

const UI_LANGUAGES: { id: DevoteePrefs['uiLang']; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'te', label: TELUGU_LANGUAGE_NAME },
];

const MANTRA_SCRIPTS: { id: Script; label: string; sample: string }[] = [
  { id: 'te', label: 'Telugu', sample: SCRIPT_SAMPLES.te },
  { id: 'dev', label: 'Devanagari', sample: SCRIPT_SAMPLES.dev },
  { id: 'iast', label: 'Roman (IAST)', sample: 'oṃ namaḥ śivāya' },
];

function OptionRow({
  label,
  sample,
  selected,
  onPress,
}: {
  label: string;
  sample?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
    >
      <Card tone={selected ? 'cream' : 'outlined'} padding={4}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <Txt variant="cardTitle" tone="ink">
              {label}
            </Txt>
            {sample ? (
              <Txt variant="telugu" tone="inkMuted">
                {sample}
              </Txt>
            ) : null}
          </View>
          {selected ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={22}
              color={colors.maroon['700'] as string}
            />
          ) : (
            <MaterialCommunityIcons
              name="circle-outline"
              size={22}
              color={colors.cream['400'] as string}
            />
          )}
        </View>
      </Card>
    </Pressable>
  );
}

/**
 * Language (§8.1 step 2): UI language and mantra script.
 */
export default function LanguageScreen() {
  const router = useRouter();
  const draft = useOnboardingDraft();
  const [uiLang, setUiLang] = useState(draft.uiLang);
  const [mantraScript, setMantraScript] = useState(draft.mantraScript);

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <StepHeader step={1} title="Choose your language" />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[6] }}>
        <View style={{ gap: spacing[3] }}>
          <Txt variant="sectionTitle" tone="ink">
            App language
          </Txt>
          {UI_LANGUAGES.map((option) => (
            <OptionRow
              key={option.id}
              label={option.label}
              selected={uiLang === option.id}
              onPress={() => {
                setUiLang(option.id);
              }}
            />
          ))}
        </View>

        <View style={{ gap: spacing[3] }}>
          <Txt variant="sectionTitle" tone="ink">
            Mantra script
          </Txt>
          <Txt variant="body" tone="inkMuted">
            Which script should chants and the Sankalpam be shown in?
          </Txt>
          {MANTRA_SCRIPTS.map((option) => (
            <OptionRow
              key={option.id}
              label={option.label}
              sample={option.sample}
              selected={mantraScript === option.id}
              onPress={() => {
                setMantraScript(option.id);
              }}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: spacing[5] }}>
        <Button
          label="Continue"
          tone="maroon"
          size="lg"
          fullWidth
          onPress={() => {
            draft.setLanguage(uiLang, mantraScript);
            router.push('/onboarding/devotee');
          }}
        />
      </View>
    </View>
  );
}
