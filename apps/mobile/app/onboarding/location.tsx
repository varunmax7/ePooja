import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, TextField, Txt, colors, spacing } from '@epooja/ui';
import { searchCities, type City, type DevoteeLocation } from '@epooja/content';
import { CITIES, requestDeviceLocation, resolveFromCity } from '@/services/location';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { toNewDevotee, useOnboardingDraft } from '@/stores/onboardingDraft';
import { useDevoteeStore } from '@/stores/devotee';

type GpsStatus = 'idle' | 'requesting' | 'denied' | 'unavailable';

/**
 * Location (§8.1 step 5): GPS permission, or city search; shows the computed
 * timezone. Finishing this step creates the devotee and lands on Today.
 */
export default function LocationScreen() {
  const router = useRouter();
  const draft = useOnboardingDraft();
  const createDevotee = useDevoteeStore((s) => s.createDevotee);
  const completeOnboarding = useDevoteeStore((s) => s.completeOnboarding);

  const [location, setLocation] = useState<DevoteeLocation | null>(draft.location);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [query, setQuery] = useState('');

  const results = useMemo(() => (query.trim() ? searchCities(CITIES, query, 8) : []), [query]);

  async function handleUseDeviceLocation() {
    setGpsStatus('requesting');
    const result = await requestDeviceLocation();

    if (result.status === 'granted') {
      setLocation(result.location);
      setGpsStatus('idle');
    } else {
      setGpsStatus(result.status);
    }
  }

  function chooseCity(city: City) {
    setLocation(resolveFromCity(city));
    setQuery('');
  }

  function finish() {
    if (!location) return;

    createDevotee(toNewDevotee(draft, location));
    for (const member of draft.family) {
      // `useDevoteeStore.addFamilyMember` reads the devotee `createDevotee` just
      // set, so this only works called after it, in this order.
      useDevoteeStore.getState().addFamilyMember(member);
    }
    completeOnboarding();
    draft.reset();
    router.replace('/');
  }

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <StepHeader step={4} title="Where are you?" />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
        <Txt variant="body" tone="inkMuted">
          Your location is used to compute your local Panchangam and to say your Sankalpam with
          the correct place.
        </Txt>

        <Button
          label={gpsStatus === 'requesting' ? 'Finding you…' : 'Use my current location'}
          tone="maroon"
          icon="crosshairs-gps"
          fullWidth
          disabled={gpsStatus === 'requesting'}
          onPress={() => {
            void handleUseDeviceLocation();
          }}
        />

        {gpsStatus === 'denied' ? (
          <Txt variant="label" tone="danger">
            Location permission was declined. Search for your city below instead.
          </Txt>
        ) : null}
        {gpsStatus === 'unavailable' ? (
          <Txt variant="label" tone="danger">
            Couldn&apos;t determine your location. Search for your city below instead.
          </Txt>
        ) : null}

        <TextField
          label="Or search for your city"
          value={query}
          onChangeText={setQuery}
          placeholder="Hyderabad, Dallas, London…"
        />

        {results.length > 0 ? (
          <View style={{ gap: spacing[2] }}>
            {results.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  chooseCity(item);
                }}
              >
                <Card tone="outlined" padding={3}>
                  <Txt variant="body" tone="ink">
                    {item.name}, {item.region}
                  </Txt>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}

        {location ? (
          <Card tone="cream" padding={4}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={colors.maroon['700'] as string}
              />
              <View>
                <Txt variant="cardTitle" tone="ink">
                  {location.label}
                </Txt>
                <Txt variant="label" tone="inkMuted">
                  {location.tz}
                </Txt>
              </View>
            </View>
          </Card>
        ) : null}
      </ScrollView>

      <View style={{ padding: spacing[5] }}>
        <Button
          label="Finish"
          tone="maroon"
          size="lg"
          fullWidth
          disabled={!location}
          onPress={finish}
        />
      </View>
    </View>
  );
}
