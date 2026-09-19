import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { colors, elevation, shadow } from '../tokens.js';
import { Txt } from './Txt.js';

export interface AvatarRingProps {
  /** Initials shown when there is no photo. */
  initials: string;
  size?: number;
  /** Shows the maroon pencil badge and makes the avatar pressable. */
  onEdit?: () => void;
  editAccessibilityLabel?: string;
}

/**
 * §7.4 `AvatarRing`: a 96 px circle with a 3 px gold ring and an edit badge at
 * the bottom-right (a maroon dot with a pencil).
 */
export function AvatarRing({
  initials,
  size = 96,
  onEdit,
  editAccessibilityLabel = 'Edit profile photo',
}: AvatarRingProps) {
  const badge = Math.round(size * 0.3);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor: colors.gold['500'],
            backgroundColor: colors.cream['200'],
            alignItems: 'center',
            justifyContent: 'center',
          },
          elevation(shadow.card),
        ]}
      >
        <Txt variant="screenTitle" tone="maroon">
          {initials}
        </Txt>
      </View>

      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editAccessibilityLabel}
          onPress={onEdit}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: badge,
            height: badge,
            borderRadius: badge / 2,
            backgroundColor: colors.maroon['800'],
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.cream['50'],
          }}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={badge * 0.5}
            color={colors.cream['100'] as string}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
