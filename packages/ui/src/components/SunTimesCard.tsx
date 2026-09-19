import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors, spacing } from '../tokens.js';
import { Card } from './Card.js';
import { Txt } from './Txt.js';

export interface SunTimesCardProps {
  sunriseLabel: string;
  sunrise: string;
  sunsetLabel: string;
  sunset: string;
}

/**
 * §7.4 `SunTimesCard`: two columns — sunrise icon + time, a divider, then
 * sunset icon + time.
 */
export function SunTimesCard({ sunriseLabel, sunrise, sunsetLabel, sunset }: SunTimesCardProps) {
  return (
    <Card tone="cream" padding={5}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SunColumn icon="weather-sunset-up" label={sunriseLabel} time={sunrise} />
        <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: colors.cream['300'] }} />
        <SunColumn icon="weather-sunset-down" label={sunsetLabel} time={sunset} />
      </View>
    </Card>
  );
}

function SunColumn({
  icon,
  label,
  time,
}: {
  icon: 'weather-sunset-up' | 'weather-sunset-down';
  label: string;
  time: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}>
      <MaterialCommunityIcons name={icon} size={26} color={colors.saffron['600'] as string} />
      <Txt variant="fieldLabel" tone="inkMuted">
        {label.toUpperCase()}
      </Txt>
      <Txt variant="fieldValue" tone="ink">
        {time}
      </Txt>
    </View>
  );
}
