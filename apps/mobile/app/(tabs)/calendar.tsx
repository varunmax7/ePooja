import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CurvedHeader, Txt, colors, radius, spacing } from '@epooja/ui';
import { useDevoteeStore } from '@/stores/devotee';
import { useMonthView, useTodayDate, type MonthDayView } from '@/services/panchangam';
import { formatMonthYear, weekdayNarrowLabels, shiftMonth } from '@/lib/dateFormat';

/**
 * Calendar (§8.8): a month grid where each cell carries the tithi number and
 * a marker for ekadashi / purnami / amavasya, and a gold dot for any
 * pandit-reviewed festival (`content/festivals/{samvatsara}.json`, none yet —
 * `content/REVIEW_QUEUE.md` tracks that as a non-code dependency).
 *
 * Phase 1 laid this out statically with a placeholder tithi numbering; Phase 9
 * fills it from `useMonthView`, which wraps the engine's `getMonth`.
 */
export default function CalendarScreen() {
  const router = useRouter();
  const location = useDevoteeStore((s) => s.devotee?.location);
  const prefs = useDevoteeStore((s) => s.devotee?.prefs);
  const uiLang = prefs?.uiLang ?? 'en';
  const { t } = useTranslation('calendar');

  const { date: todayDate } = useTodayDate();
  const [{ year, month }, setMonth] = useState(() => {
    const [y, m] = todayDate.split('-').map(Number);
    return { year: y ?? 2026, month: m ?? 1 };
  });

  const { view, isLoading, isError } = useMonthView(year, month, uiLang);
  const weekdayLabels = useMemo(() => weekdayNarrowLabels(uiLang), [uiLang]);
  const monthLabel = formatMonthYear(year, month, uiLang);

  const markerLabel = (cell: MonthDayView): string => {
    if (cell.marker === 'pournami') return 'P';
    if (cell.marker === 'amavasya') return 'A';
    if (cell.marker === 'ekadashi') return 'E';
    return String(cell.tithiNumber);
  };

  const dayAccessibilityLabel = (cell: MonthDayView): string => {
    const tithi = cell.marker ? t(cell.marker) : t('tithiLabel', { number: cell.tithiNumber });
    const festivals = cell.festivalNames.length
      ? t('festivalsSuffix', { names: cell.festivalNames.join(', ') })
      : '';
    return t('dayA11y', {
      weekday: weekdayLabels[new Date(`${cell.date}T00:00:00Z`).getUTCDay()],
      month: monthLabel,
      day: cell.day,
      tithi,
      festivals,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <CurvedHeader title={t('title')} subtitle={monthLabel} tone="maroon" height={130} />

      <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[4], gap: spacing[4] }}>
        {!location ? (
          <Card tone="outlined" padding={5}>
            <Txt variant="body" tone="inkMuted">
              {t('setLocationPrompt')}
            </Txt>
          </Card>
        ) : null}

        {isError ? (
          <Card tone="outlined" padding={5}>
            <Txt variant="body" tone="danger">
              {t('computeError')}
            </Txt>
          </Card>
        ) : null}

        {location ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <MonthNavButton
              direction="previous"
              onPress={() => {
                setMonth(({ year: y, month: m }) => shiftMonth(y, m, -1));
              }}
            />
            <Txt variant="sectionTitle" tone="ink">
              {monthLabel}
            </Txt>
            <MonthNavButton
              direction="next"
              onPress={() => {
                setMonth(({ year: y, month: m }) => shiftMonth(y, m, 1));
              }}
            />
          </View>
        ) : null}

        {location && isLoading && !view ? (
          <Card tone="outlined" padding={5}>
            <Txt variant="body" tone="inkMuted">
              {t('loading')}
            </Txt>
          </Card>
        ) : null}

        {location && view ? (
          <Card tone="cream" padding={4}>
            <View style={{ flexDirection: 'row' }}>
              {weekdayLabels.map((label, index) => (
                <Txt
                  key={index}
                  variant="fieldLabel"
                  tone="inkMuted"
                  align="center"
                  style={{ flex: 1 }}
                >
                  {label}
                </Txt>
              ))}
            </View>

            <View style={{ height: spacing[2] }} />

            {view.weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={{ flexDirection: 'row' }}>
                {week.map((cell, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: spacing[2] }}
                  >
                    {cell === null ? (
                      <View style={{ height: 44 }} />
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={dayAccessibilityLabel(cell)}
                        hitSlop={4}
                        onPress={() => {
                          router.push(`/panchangam/${cell.date}`);
                        }}
                        style={{
                          width: 40,
                          minHeight: 44,
                          borderRadius: radius.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: cell.isToday ? colors.gold['300'] : 'transparent',
                        }}
                      >
                        <Txt variant="label" tone={cell.isToday ? 'maroon' : 'ink'}>
                          {cell.day}
                        </Txt>
                        <Txt variant="fieldLabel" tone={cell.marker ? 'gold' : 'inkMuted'}>
                          {markerLabel(cell)}
                        </Txt>
                        {cell.festivalNames.length > 0 ? (
                          <View
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 3,
                              backgroundColor: colors.saffron['600'],
                              marginTop: 2,
                            }}
                          />
                        ) : null}
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </Card>
        ) : null}

        <Card tone="outlined" padding={4}>
          <Txt variant="label" tone="inkMuted">
            {t('legend')}
          </Txt>
        </Card>
      </View>
    </ScrollView>
  );
}

function MonthNavButton({
  direction,
  onPress,
}: {
  direction: 'previous' | 'next';
  onPress: () => void;
}) {
  const { t } = useTranslation('calendar');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === 'previous' ? t('previousMonthA11y') : t('nextMonthA11y')}
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
