import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { colors, spacing } from '../tokens.js';
import { Txt } from './Txt.js';

export interface TimingRowProps {
  label: string;
  secondary?: string;
  /** Already formatted for the devotee's locale, e.g. "06:04 – 07:30". */
  range: string;
  /** Bell toggle for a reminder (§8.2). Omit for read-only rows. */
  reminderOn?: boolean;
  onToggleReminder?: () => void;
  /** Inauspicious windows (Rahu kalam and friends) are marked, not hidden. */
  caution?: boolean;
  last?: boolean;
}

/**
 * §7.4 `TimingRow`: a gold bell icon, the label, and a right-aligned time
 * range, separated by hairlines.
 */
export function TimingRow({
  label,
  secondary,
  range,
  reminderOn,
  onToggleReminder,
  caution = false,
  last = false,
}: TimingRowProps) {
  const showBell = typeof reminderOn === 'boolean';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingVertical: spacing[3],
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.cream['300'],
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: caution ? colors.cream['300'] : colors.gold['200'],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name={caution ? 'alert-outline' : 'bell-outline'}
          size={18}
          color={(caution ? colors.danger : colors.gold['700']) as string}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Txt variant="cardTitle" tone="ink">
          {label}
        </Txt>
        {secondary ? (
          <Txt variant="teluguLabel" tone="inkMuted">
            {secondary}
          </Txt>
        ) : null}
      </View>

      <Txt variant="label" tone={caution ? 'danger' : 'inkMuted'}>
        {range}
      </Txt>

      {showBell ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: reminderOn }}
          accessibilityLabel={`Reminder for ${label}`}
          onPress={onToggleReminder}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name={reminderOn ? 'bell' : 'bell-off-outline'}
            size={20}
            color={(reminderOn ? colors.saffron['600'] : colors.ink['400']) as string}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
