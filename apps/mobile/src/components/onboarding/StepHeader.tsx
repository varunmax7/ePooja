import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Txt, colors, spacing } from '@epooja/ui';

const TOTAL_STEPS = 5;

export interface StepHeaderProps {
  step: number;
  title: string;
  /** The welcome step has nothing to go back to. */
  canGoBack?: boolean;
}

/**
 * The onboarding wizard's own lightweight header: a back chevron, the step
 * title, and "step N of 5" dots. `CurvedHeader` is not used here — its
 * gradient band is for the four mockup screens, and a five-step form reads
 * better as a plain, quiet shell.
 */
export function StepHeader({ step, title, canGoBack = true }: StepHeaderProps) {
  const router = useRouter();

  return (
    <View style={{ paddingTop: spacing[6], paddingHorizontal: spacing[5], gap: spacing[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 28 }}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            onPress={() => {
              router.back();
            }}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={26}
              color={colors.maroon['800'] as string}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing[1] }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor:
                i < step ? (colors.maroon['700'] as string) : (colors.cream['300'] as string),
            }}
          />
        ))}
      </View>

      <Txt variant="screenTitle" tone="maroon">
        {title}
      </Txt>
    </View>
  );
}
