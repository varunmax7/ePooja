import { MaterialCommunityIcons } from '@expo/vector-icons';
// Expo Router vendors its own copy of the bottom-tabs types (SDK 57).
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt, colors, elevation, radius, shadow, spacing } from '@epooja/ui';

const ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  index: 'white-balance-sunny',
  poojas: 'candle',
  calendar: 'calendar-month-outline',
  profile: 'account-circle-outline',
};

/**
 * §7.4 `TabBar`: a cream bar with a gold active pill — Today (sun), Poojas
 * (diya), Calendar, Profile.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.cream['100'],
          paddingTop: spacing[2],
          paddingBottom: Math.max(insets.bottom, spacing[3]),
          paddingHorizontal: spacing[3],
          borderTopWidth: 1,
          borderTopColor: colors.cream['300'],
        },
        elevation(shadow.card),
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const label = options?.title ?? route.name;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}
          >
            <View
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[1],
                borderRadius: radius.pill,
                backgroundColor: focused ? colors.gold['300'] : 'transparent',
              }}
            >
              <MaterialCommunityIcons
                name={ICONS[route.name] ?? 'circle-outline'}
                size={22}
                color={(focused ? colors.maroon['800'] : colors.ink['400']) as string}
              />
            </View>
            <Txt variant="fieldLabel" tone={focused ? 'maroon' : 'inkMuted'}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
