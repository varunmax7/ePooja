import { Pressable, View } from 'react-native';
import { colors, radius, spacing } from '../tokens.js';
import { Txt } from './Txt.js';

export type PlayerMode = 'chant' | 'guided';

export interface ModeToggleProps {
  mode: PlayerMode;
  chantLabel: string;
  guidedLabel: string;
  onChange: (mode: PlayerMode) => void;
}

/**
 * §7.4 `ModeToggle`: "Chant Mode ◯ Guided Narration Mode" on a maroon track.
 *
 * The distinction matters to the devotee — Chant plays mantras only, Guided
 * speaks the purohit's instruction before each step (§1) — so both labels stay
 * visible rather than hiding behind a switch.
 */
export function ModeToggle({ mode, chantLabel, guidedLabel, onChange }: ModeToggleProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.maroon['800'],
        borderRadius: radius.pill,
        padding: spacing[1],
      }}
    >
      <Segment
        label={chantLabel}
        active={mode === 'chant'}
        onPress={() => {
          onChange('chant');
        }}
      />
      <Segment
        label={guidedLabel}
        active={mode === 'guided'}
        onPress={() => {
          onChange('guided');
        }}
      />
    </View>
  );
}

function Segment({
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
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[3],
        borderRadius: radius.pill,
        backgroundColor: active ? colors.gold['500'] : 'transparent',
        alignItems: 'center',
      }}
    >
      <Txt variant="label" tone={active ? 'maroon' : 'cream'} numberOfLines={1}>
        {label}
      </Txt>
    </Pressable>
  );
}
