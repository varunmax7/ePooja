import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Txt, colors, spacing } from '@epooja/ui';
import { useDevoteeStore } from '@/stores/devotee';
import { useFullPanchangamView } from '@/services/panchangam';
import { formatCalendarDate } from '@/lib/dateFormat';

/**
 * The full-Panchangam sheet (§8.2): every anga with its value, plus
 * samvatsaram, ayanam, paksham and the inauspicious windows already on Today.
 *
 * A modal route rather than `@gorhom/bottom-sheet`: expo-router already has
 * this exact presentation wired for the Chant Player, and pulling in a bottom
 * sheet library for one screen is not worth the native surface it adds.
 */
export default function FullPanchangamSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();
  const script = useDevoteeStore((s) => s.devotee?.prefs.mantraScript ?? 'te');
  const { view, isLoading, isError } = useFullPanchangamView(date, script);
  const { weekday, day, month, year } = formatCalendarDate(date);

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + spacing[3],
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[3],
        }}
      >
        <Txt variant="screenTitle" tone="maroon">
          {weekday}, {month} {day}, {year}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          onPress={() => {
            router.back();
          }}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.maroon['800'] as string} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: spacing[8] }}
      >
        {isLoading ? <Txt tone="inkMuted">Computing…</Txt> : null}
        {isError ? <Txt tone="danger">Could not compute the Panchangam for this date.</Txt> : null}

        {view ? (
          <>
            <Card tone="cream" padding={5}>
              <Row label="Samvatsaram" value={view.samvatsara} />
              <Row label="Ayanam" value={view.ayana} />
              <Row label="Paksham" value={view.paksha} />
              <Row label="Ruthuvu" value={view.ritu.value} last />
            </Card>

            <Card tone="cream" padding={5}>
              <Row label="Tithi" value={view.tithi.value} />
              <Row label="Nakshatram" value={view.nakshatra.value} />
              <Row label="Yogam" value={view.yoga.value} />
              <Row label="Karanam" value={view.karana.value} />
              <Row
                label="Masam"
                value={view.masa.value}
                secondary={view.adhika ? 'Adhika' : undefined}
              />
              <Row label="Vasaram" value={view.vasara} last />
            </Card>

            <Card tone="cream" padding={5}>
              <Txt variant="sectionTitle" tone="ink">
                Sun
              </Txt>
              <View style={{ height: spacing[2] }} />
              <Row label="Sunrise" value={view.sunrise} />
              <Row label="Sunset" value={view.sunset} last />
            </Card>

            <Card tone="outlined" padding={5}>
              <Txt variant="sectionTitle" tone="ink">
                Inauspicious Timings
              </Txt>
              <View style={{ height: spacing[2] }} />
              {view.inauspicious.map((timing, index) => (
                <Row
                  key={timing.id}
                  label={timing.label}
                  value={timing.range}
                  last={index === view.inauspicious.length - 1}
                />
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  secondary,
  last = false,
}: {
  label: string;
  value: string;
  secondary?: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing[3],
        paddingVertical: spacing[2],
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.cream['300'] as string,
      }}
    >
      <Txt variant="body" tone="inkMuted" style={{ flexShrink: 0 }}>
        {label}
      </Txt>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[2],
          flexShrink: 1,
          minWidth: 0,
          justifyContent: 'flex-end',
        }}
      >
        {secondary ? (
          <Txt variant="label" tone="gold">
            {secondary}
          </Txt>
        ) : null}
        {/* §0.4 placeholders (⟨TODO_PANDIT: …⟩) run far longer than the real
            values they stand in for, so this wraps rather than overflowing —
            the real content will never be this wide. */}
        <Txt variant="fieldValue" tone="ink" align="right" style={{ flexShrink: 1 }}>
          {value}
        </Txt>
      </View>
    </View>
  );
}
