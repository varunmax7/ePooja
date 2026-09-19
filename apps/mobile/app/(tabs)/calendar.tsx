import { ScrollView, View } from 'react-native';
import { Card, CurvedHeader, Txt, colors, radius, spacing } from '@epooja/ui';
import today from '@/mocks/today.json';

/**
 * Calendar (§8.8): a month grid where each cell carries the tithi short name
 * and a marker for ekadashi / purnima / amavasya.
 *
 * Phase 1 lays out September 2026 statically; Phase 9 fills it from
 * `getMonth(year, month, loc)`, which the engine already provides.
 */
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_IN_MONTH = 30;
const FIRST_WEEKDAY = 2; // 1 September 2026 is a Tuesday.

/** Placeholder tithi numbering until Phase 9 wires the engine in. */
function tithiShort(day: number): string {
  const index = ((day + 7) % 30) + 1;
  if (index === 15) return 'P';
  if (index === 30) return 'A';
  if (index === 11 || index === 26) return 'E';
  return String(index <= 15 ? index : index - 15);
}

function marker(day: number): string | null {
  const short = tithiShort(day);
  return short === 'P' || short === 'A' || short === 'E' ? short : null;
}

export default function CalendarScreen() {
  const cells: (number | null)[] = [
    ...Array.from({ length: FIRST_WEEKDAY }, () => null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <CurvedHeader title="Calendar" subtitle={`${today.date.month} ${today.date.year}`} height={130} />

      <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[4], gap: spacing[4] }}>
        <Card tone="cream" padding={4}>
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((label, index) => (
              <Txt key={index} variant="fieldLabel" tone="inkMuted" align="center" style={{ flex: 1 }}>
                {label}
              </Txt>
            ))}
          </View>

          <View style={{ height: spacing[2] }} />

          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={{ flexDirection: 'row' }}>
              {week.map((day, dayIndex) => {
                const isToday = day === Number(today.date.day);
                return (
                  <View key={dayIndex} style={{ flex: 1, alignItems: 'center', paddingVertical: spacing[2] }}>
                    {day === null ? (
                      <View style={{ height: 40 }} />
                    ) : (
                      <View
                        style={{
                          width: 38,
                          height: 40,
                          borderRadius: radius.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isToday ? colors.gold['300'] : 'transparent',
                        }}
                      >
                        <Txt variant="label" tone={isToday ? 'maroon' : 'ink'}>
                          {day}
                        </Txt>
                        <Txt variant="fieldLabel" tone={marker(day) ? 'gold' : 'inkMuted'}>
                          {tithiShort(day)}
                        </Txt>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </Card>

        <Card tone="outlined" padding={4}>
          <Txt variant="label" tone="inkMuted">
            P = Pournami · A = Amavasya · E = Ekadashi. Numbers are the tithi of the day.
          </Txt>
        </Card>
      </View>
    </ScrollView>
  );
}
