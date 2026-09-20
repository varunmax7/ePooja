import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, TextField, Txt, colors, spacing } from '@epooja/ui';
import { enumDisplay, enumValue, isTodoPandit, type Gender } from '@epooja/content';
import { rasiIdFromNakshatraPada } from '@epooja/panchangam';
import { EnumSearchPicker } from '@/components/onboarding/EnumSearchPicker';
import { TELUGU_NAME_PLACEHOLDER } from '@/i18n/onboarding';
import { useDevoteeStore } from '@/stores/devotee';
import { ENUM_FILES } from '@/services/panchangam';

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

const PADAS = [1, 2, 3, 4] as const;

function PickerField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <View>
        <Txt variant="fieldLabel" tone="inkMuted">
          {label.toUpperCase()}
        </Txt>
        <View style={{ height: spacing[1] }} />
        <Card tone="outlined" padding={3}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="fieldValue" tone={value ? 'ink' : 'inkMuted'}>
              {value || 'Tap to choose'}
            </Txt>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.ink['500'] as string} />
          </View>
        </Card>
      </View>
    </Pressable>
  );
}

/**
 * Edit Profile (§8.7 edit icon): the same ritual fields §8.1 collects at
 * onboarding, editable afterwards. Location has its own field here — moving
 * house is common enough that it shouldn't require re-running onboarding.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const devotee = useDevoteeStore((s) => s.devotee);
  const updateDevotee = useDevoteeStore((s) => s.updateDevotee);

  const [nameEn, setNameEn] = useState(devotee?.name.en ?? '');
  const [nameTe, setNameTe] = useState(devotee?.name.te ?? '');
  const [gender, setGender] = useState<Gender>(devotee?.gender ?? 'male');
  const [gotraId, setGotraId] = useState<string | null>(devotee?.gotraId ?? null);
  const [gotraCustom, setGotraCustom] = useState(devotee?.gotraCustom ?? '');
  const [nakshatraId, setNakshatraId] = useState<string | null>(devotee?.nakshatraId ?? null);
  const [pada, setPada] = useState<1 | 2 | 3 | 4 | null>(devotee?.nakshatraPada ?? null);
  const [rasiId, setRasiId] = useState<string | null>(devotee?.rasiId ?? null);
  const [rasiEdited, setRasiEdited] = useState(false);
  const [picker, setPicker] = useState<'gotra' | 'nakshatra' | 'rasi' | null>(null);

  const gotraLabel = useMemo(() => {
    if (gotraCustom.trim().length > 0) return gotraCustom;
    if (!gotraId) return '';
    const te = enumDisplay(enumValue(ENUM_FILES.gotra, gotraId), 'te');
    return isTodoPandit(te) ? gotraId : te;
  }, [gotraId, gotraCustom]);

  const nakshatraLabel = useMemo(() => {
    if (!nakshatraId) return '';
    const te = enumDisplay(enumValue(ENUM_FILES.nakshatra, nakshatraId), 'te');
    return pada ? `${te} · pada ${pada}` : te;
  }, [nakshatraId, pada]);

  const rasiLabel = useMemo(() => {
    if (!rasiId) return '';
    const te = enumDisplay(enumValue(ENUM_FILES.rasi, rasiId), 'te');
    return isTodoPandit(te) ? rasiId : te;
  }, [rasiId]);

  function selectNakshatra(id: string, selectedPada: 1 | 2 | 3 | 4 | null) {
    setNakshatraId(id);
    setPada(selectedPada);
    if (!rasiEdited && selectedPada) {
      const index = enumValue(ENUM_FILES.nakshatra, id).index;
      setRasiId(rasiIdFromNakshatraPada(index, selectedPada));
    }
  }

  if (!devotee) return null;

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing[5],
        }}
      >
        <Txt variant="screenTitle" tone="maroon">
          Edit Profile
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.maroon['800'] as string} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingTop: 0 }}>
        <TextField label="Name (English)" value={nameEn} onChangeText={setNameEn} placeholder="Your name" />
        <TextField
          label="Name (Telugu)"
          script="telugu"
          value={nameTe}
          onChangeText={setNameTe}
          placeholder={TELUGU_NAME_PLACEHOLDER}
        />

        <View style={{ gap: spacing[3] }}>
          <Txt variant="sectionTitle" tone="ink">
            Gender
          </Txt>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            {GENDERS.map((option) => (
              <Pressable
                key={option.id}
                style={{ flex: 1 }}
                accessibilityRole="radio"
                accessibilityState={{ checked: gender === option.id }}
                onPress={() => setGender(option.id)}
              >
                <Card tone={gender === option.id ? 'cream' : 'outlined'} padding={3}>
                  <Txt variant="body" tone="ink" align="center">
                    {option.label}
                  </Txt>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

        <PickerField label="Gothram" value={gotraLabel} onPress={() => setPicker('gotra')} />
        {ENUM_FILES.gotra.values.length === 0 ? (
          <TextField
            label="Or type your gothram"
            script="telugu"
            value={gotraCustom}
            onChangeText={(text) => {
              setGotraCustom(text);
              setGotraId(null);
            }}
            placeholder="e.g. Kashyapa"
          />
        ) : null}

        <PickerField
          label="Janma Nakshatram"
          value={nakshatraLabel}
          onPress={() => setPicker('nakshatra')}
        />
        {nakshatraId ? (
          <View style={{ gap: spacing[2] }}>
            <Txt variant="fieldLabel" tone="inkMuted">
              PADAM (OPTIONAL)
            </Txt>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {PADAS.map((p) => (
                <Pressable
                  key={p}
                  style={{ flex: 1 }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: pada === p }}
                  onPress={() => selectNakshatra(nakshatraId, p)}
                >
                  <Card tone={pada === p ? 'cream' : 'outlined'} padding={3}>
                    <Txt variant="body" tone="ink" align="center">
                      {p}
                    </Txt>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <PickerField label="Rasi (Moon Sign)" value={rasiLabel} onPress={() => setPicker('rasi')} />
      </ScrollView>

      <View style={{ padding: spacing[5] }}>
        <Button
          label="Save"
          tone="maroon"
          size="lg"
          fullWidth
          onPress={() => {
            updateDevotee({
              name: { te: nameTe, en: nameEn },
              gender,
              ...(gotraId ? { gotraId } : { gotraId: undefined }),
              ...(!gotraId && gotraCustom.trim() ? { gotraCustom } : { gotraCustom: undefined }),
              ...(nakshatraId ? { nakshatraId } : { nakshatraId: undefined }),
              ...(pada ? { nakshatraPada: pada } : { nakshatraPada: undefined }),
              ...(rasiId ? { rasiId } : { rasiId: undefined }),
            });
            router.back();
          }}
        />
      </View>

      <EnumSearchPicker
        visible={picker === 'gotra'}
        title="Gothram"
        file={ENUM_FILES.gotra}
        selectedId={gotraId}
        onSelect={(value) => {
          setGotraId(value.id);
          setGotraCustom('');
        }}
        onUnknown={() => {
          setGotraId(null);
        }}
        onClose={() => setPicker(null)}
      />
      <EnumSearchPicker
        visible={picker === 'nakshatra'}
        title="Janma Nakshatram"
        file={ENUM_FILES.nakshatra}
        selectedId={nakshatraId}
        onSelect={(value) => selectNakshatra(value.id, null)}
        onUnknown={() => {
          setNakshatraId(null);
          setPada(null);
        }}
        onClose={() => setPicker(null)}
      />
      <EnumSearchPicker
        visible={picker === 'rasi'}
        title="Rasi"
        file={ENUM_FILES.rasi}
        selectedId={rasiId}
        onSelect={(value) => {
          setRasiId(value.id);
          setRasiEdited(true);
        }}
        onUnknown={() => {
          setRasiId(null);
          setRasiEdited(true);
        }}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}
