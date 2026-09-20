import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  AngaBadge,
  Button,
  Card,
  CURVE_OVERHANG,
  CurvedHeader,
  DateDial,
  SunTimesCard,
  TimingRow,
  Txt,
  colors,
  spacing,
} from '@epooja/ui';
import { useDevoteeStore } from '@/stores/devotee';
import { useTodayView } from '@/services/panchangam';
import { formatCalendarDate } from '@/lib/dateFormat';
import { shiftDate } from '@/stores/settings';
import today from '@/mocks/today.json';

/**
 * Today — "Vedic Calendar – Today" (§8.2, mockup screen 2).
 *
 * The panchangam, sun times and prayer schedule are live, from
 * `useTodayView` (@epooja/panchangam over the devotee's stored location).
 * "Today's Puja" still comes from the Phase 1 mock: puja content doesn't
 * exist until Phase 4, and defaulting it to Nitya Puja here would be a
 * decision this screen has no business making silently.
 */
export default function TodayScreen() {
  const router = useRouter();
  const location = useDevoteeStore((s) => s.devotee?.location);
  const prefs = useDevoteeStore((s) => s.devotee?.prefs);
  const script = prefs?.mantraScript ?? 'te';
  const uiLang = prefs?.uiLang ?? 'en';

  const { view, date, goToDate, isLoading, isError } = useTodayView(script, uiLang);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const { weekday, day, month, year } = formatCalendarDate(date);

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <CurvedHeader
        title="Vedic Calendar – Today"
        subtitle={location?.label ?? 'Location not set'}
        tone="maroon"
        height={150}
      />

      {/* The header's curve bulges CURVE_OVERHANG past its box; the anga labels
          sit right under it, so start below the deepest point. */}
      <View style={{ paddingHorizontal: spacing[5], marginTop: CURVE_OVERHANG, gap: spacing[5] }}>
        {!location ? (
          <Card tone="outlined" padding={5}>
            <Txt variant="body" tone="inkMuted">
              Set your location in Profile to see today&apos;s Panchangam.
            </Txt>
          </Card>
        ) : null}

        {isError ? (
          <Card tone="outlined" padding={5}>
            <Txt variant="body" tone="danger">
              Could not compute today&apos;s Panchangam for this location.
            </Txt>
          </Card>
        ) : null}

        {location && view ? (
          <>
            {/* Dial with an anga badge at each corner (§8.2). */}
            <View style={{ alignItems: 'center', gap: spacing[4] }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignSelf: 'stretch',
                }}
              >
                <AngaBadge kind="tithi" label={view.tithi.label} value={view.tithi.value} />
                <AngaBadge
                  kind="nakshatra"
                  label={view.nakshatra.label}
                  value={view.nakshatra.value}
                  align="right"
                />
              </View>

              {/* Date swipe (§8.2): chevrons are the accessible affordance; the
                  gesture is layered on in a later pass once puja-runner audio
                  focus rules (Phase 6) settle how a swipe should behave mid-puja. */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <DaySwipeButton
                  direction="previous"
                  onPress={() => {
                    goToDate(shiftDate(date, -1));
                  }}
                />
                <DateDial
                  weekday={weekday}
                  day={day}
                  month={month}
                  year={year}
                  onPress={() => {
                    router.push(`/panchangam/${date}`);
                  }}
                  accessibilityLabel={`${weekday} ${month} ${day} ${year}. Tap for the full panchangam.`}
                />
                <DaySwipeButton
                  direction="next"
                  onPress={() => {
                    goToDate(shiftDate(date, 1));
                  }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignSelf: 'stretch',
                }}
              >
                <AngaBadge kind="ritu" label={view.ritu.label} value={view.ritu.value} />
                <AngaBadge
                  kind="masa"
                  label={view.masa.label}
                  value={view.masa.value}
                  align="right"
                />
              </View>
            </View>

            <SunTimesCard
              sunriseLabel="Sunrise"
              sunrise={view.sunrise}
              sunsetLabel="Sunset"
              sunset={view.sunset}
            />

            <Card tone="cream" padding={5}>
              <Txt variant="sectionTitle" tone="ink">
                Daily Prayer Timings
              </Txt>
              <View style={{ height: spacing[2] }} />
              {view.prayerTimings.map((timing, index) => (
                <TimingRow
                  key={timing.id}
                  label={timing.label}
                  range={timing.range}
                  reminderOn={reminders[timing.id] ?? false}
                  onToggleReminder={() => {
                    setReminders((prev) => ({ ...prev, [timing.id]: !prev[timing.id] }));
                  }}
                  last={index === view.prayerTimings.length - 1}
                />
              ))}
            </Card>

            <Card tone="cream" padding={5}>
              <Txt variant="sectionTitle" tone="ink">
                Inauspicious Timings
              </Txt>
              <View style={{ height: spacing[2] }} />
              {view.inauspicious.map((timing, index) => (
                <TimingRow
                  key={timing.id}
                  label={timing.label}
                  range={timing.range}
                  caution
                  last={index === view.inauspicious.length - 1}
                />
              ))}
            </Card>
          </>
        ) : null}

        {location && isLoading && !view ? (
          <Txt variant="body" tone="inkMuted">
            Computing today&apos;s Panchangam…
          </Txt>
        ) : null}

        <Card tone="outlined" padding={5}>
          <Txt variant="fieldLabel" tone="inkMuted">
            TODAY&apos;S PUJA
          </Txt>
          <View style={{ height: spacing[1] }} />
          <Txt variant="cardTitle" tone="ink">
            {today.todaysPuja.title} · {today.todaysPuja.duration}
          </Txt>
          <View style={{ height: spacing[3] }} />
          <Button
            label={today.todaysPuja.cta}
            tone="maroon"
            size="lg"
            icon="candle"
            fullWidth
            onPress={() => {
              router.push(`/pooja/${today.todaysPuja.slug}/prepare`);
            }}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

function DaySwipeButton({
  direction,
  onPress,
}: {
  direction: 'previous' | 'next';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === 'previous' ? 'Previous day' : 'Next day'}
      hitSlop={12}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={direction === 'previous' ? 'chevron-left' : 'chevron-right'}
        size={32}
        color={colors.maroon['700'] as string}
      />
    </Pressable>
  );
}
