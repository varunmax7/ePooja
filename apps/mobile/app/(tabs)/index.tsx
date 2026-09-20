import { useState } from 'react';
import { ScrollView, View } from 'react-native';
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
  spacing,
} from '@epooja/ui';
import today from '@/mocks/today.json';

/**
 * Today — "Vedic Calendar – Today" (§8.2, mockup screen 2).
 *
 * Phase 1 renders it from `src/mocks/today.json`; Phase 3 swaps that for a live
 * `getDayPanchangam()` call against the devotee's location. The shape of the
 * mock deliberately matches what the engine already returns.
 */
export default function TodayScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState(() =>
    Object.fromEntries(today.prayerTimings.map((t) => [t.id, t.reminderOn])),
  );

  const { tithi, nakshatra, ritu, masa } = today.angas;

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <CurvedHeader
        title="Vedic Calendar – Today"
        subtitle={today.place}
        tone="maroon"
        height={150}
      />

      {/* The header's curve bulges CURVE_OVERHANG past its box; the anga labels
          sit right under it, so start below the deepest point. */}
      <View style={{ paddingHorizontal: spacing[5], marginTop: CURVE_OVERHANG, gap: spacing[5] }}>
        {/* Dial with an anga badge at each corner (§8.2). */}
        <View style={{ alignItems: 'center', gap: spacing[4] }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' }}
          >
            <AngaBadge kind="tithi" label={tithi.label} value={tithi.value} />
            <AngaBadge
              kind="nakshatra"
              label={nakshatra.label}
              value={nakshatra.value}
              align="right"
            />
          </View>

          <DateDial
            weekday={today.date.weekday}
            day={today.date.day}
            month={today.date.month}
            year={today.date.year}
            onPress={() => {
              router.push('/_dev/components');
            }}
            accessibilityLabel={`${today.date.weekday} ${today.date.day} ${today.date.month} ${today.date.year}. Tap for the full panchangam.`}
          />

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' }}
          >
            <AngaBadge kind="ritu" label={ritu.label} value={ritu.value} />
            <AngaBadge kind="masa" label={masa.label} value={masa.value} align="right" />
          </View>
        </View>

        <SunTimesCard {...today.sun} />

        <Card tone="cream" padding={5}>
          <Txt variant="sectionTitle" tone="ink">
            Daily Prayer Timings
          </Txt>
          <View style={{ height: spacing[2] }} />
          {today.prayerTimings.map((timing, index) => (
            <TimingRow
              key={timing.id}
              label={timing.label}
              range={timing.range}
              reminderOn={reminders[timing.id] ?? false}
              onToggleReminder={() => {
                setReminders((prev) => ({ ...prev, [timing.id]: !prev[timing.id] }));
              }}
              last={index === today.prayerTimings.length - 1}
            />
          ))}
        </Card>

        <Card tone="cream" padding={5}>
          <Txt variant="sectionTitle" tone="ink">
            Inauspicious Timings
          </Txt>
          <View style={{ height: spacing[2] }} />
          {today.inauspicious.map((timing, index) => (
            <TimingRow
              key={timing.id}
              label={timing.label}
              range={timing.range}
              caution
              last={index === today.inauspicious.length - 1}
            />
          ))}
        </Card>

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
