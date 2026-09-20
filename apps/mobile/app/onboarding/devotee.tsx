import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, TextField, Txt, colors, spacing } from '@epooja/ui';
import { enumDisplay, enumValue, isTodoPandit, type Gender } from '@epooja/content';
import { rasiIdFromNakshatraPada } from '@epooja/panchangam';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { EnumSearchPicker } from '@/components/onboarding/EnumSearchPicker';
import { TELUGU_NAME_PLACEHOLDER } from '@/i18n/onboarding';
import { useOnboardingDraft } from '@/stores/onboardingDraft';
import { ENUM_FILES } from '@/services/panchangam';

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

const PADAS = [1, 2, 3, 4] as const;

function PickerField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
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
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.ink['500'] as string}
            />
          </View>
        </Card>
      </View>
    </Pressable>
  );
}

/**
 * Devotee (§8.1 step 3): name, gender, gothram, janma nakshatram + padam,
 * and the rasi that follows from them.
 */
export default function DevoteeScreen() {
  const router = useRouter();
  const draft = useOnboardingDraft();

  const [nameEn, setNameEn] = useState(draft.name.en ?? '');
  const [nameTe, setNameTe] = useState(draft.name.te);
  const [gender, setGender] = useState<Gender | null>(draft.gender);
  const [gotraId, setGotraId] = useState<string | null>(draft.gotraId);
  const [gotraCustom, setGotraCustom] = useState(draft.gotraCustom ?? '');
  const [nakshatraId, setNakshatraId] = useState<string | null>(draft.nakshatraId);
  const [pada, setPada] = useState<1 | 2 | 3 | 4 | null>(draft.nakshatraPada);
  const [rasiId, setRasiId] = useState<string | null>(draft.rasiId);
  const [rasiEdited, setRasiEdited] = useState(false);

  const [pickerOpen, setPickerOpen] = useState<'gotra' | 'nakshatra' | 'rasi' | null>(null);

  const gotraLabel = useMemo(() => {
    if (gotraCustom.trim().length > 0) return gotraCustom;
    if (!gotraId) return '';
    const value = enumValue(ENUM_FILES.gotra, gotraId);
    const te = enumDisplay(value, 'te');
    return isTodoPandit(te) ? value.id : te;
  }, [gotraId, gotraCustom]);

  const nakshatraLabel = useMemo(() => {
    if (!nakshatraId) return '';
    const value = enumValue(ENUM_FILES.nakshatra, nakshatraId);
    const te = enumDisplay(value, 'te');
    return pada ? `${te} · pada ${pada}` : te;
  }, [nakshatraId, pada]);

  const rasiLabel = useMemo(() => {
    if (!rasiId) return '';
    const value = enumValue(ENUM_FILES.rasi, rasiId);
    const te = enumDisplay(value, 'te');
    return isTodoPandit(te) ? value.id : te;
  }, [rasiId]);

  // §8.1: rasi is auto-suggested from nakshatra + padam, editable. Only
  // overwrite it while the devotee has not deliberately picked one of their
  // own — someone who knows their rasi but not their padam must not have it
  // silently replaced the moment they add a padam.
  function selectNakshatra(id: string, selectedPada: 1 | 2 | 3 | 4 | null) {
    setNakshatraId(id);
    setPada(selectedPada);
    if (!rasiEdited && selectedPada) {
      const nakshatraIndex = enumValue(ENUM_FILES.nakshatra, id).index;
      setRasiId(rasiIdFromNakshatraPada(nakshatraIndex, selectedPada));
    }
  }

  const canContinue = nameEn.trim().length > 0 || nameTe.trim().length > 0;

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <StepHeader step={2} title="Tell us about yourself" />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5] }}>
        <TextField label="Name (English)" value={nameEn} onChangeText={setNameEn} placeholder="Your name" />
        <TextField
          label="Name (Telugu)"
          script="telugu"
          value={nameTe}
          onChangeText={setNameTe}
          placeholder={TELUGU_NAME_PLACEHOLDER}
          hint="Shown on screen for self-recite; optional."
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
                onPress={() => {
                  setGender(option.id);
                }}
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

        <PickerField
          label="Gothram"
          value={gotraLabel}
          onPress={() => {
            setPickerOpen('gotra');
          }}
        />
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
            hint="The pandit-supplied list isn't ready yet — your gothram is self-recited until it is."
          />
        ) : null}

        <PickerField
          label="Janma Nakshatram"
          value={nakshatraLabel}
          onPress={() => {
            setPickerOpen('nakshatra');
          }}
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
                  onPress={() => {
                    selectNakshatra(nakshatraId, p);
                  }}
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

        <PickerField
          label="Rasi (Moon Sign)"
          value={rasiLabel}
          onPress={() => {
            setPickerOpen('rasi');
          }}
        />
        {nakshatraId && pada && !rasiEdited ? (
          <Txt variant="label" tone="inkMuted">
            Suggested from your nakshatram and padam — tap to change it.
          </Txt>
        ) : null}
      </ScrollView>

      <View style={{ padding: spacing[5] }}>
        <Button
          label="Continue"
          tone="maroon"
          size="lg"
          fullWidth
          disabled={!canContinue}
          onPress={() => {
            draft.setName({ te: nameTe, en: nameEn });
            if (gender) draft.setGender(gender);
            draft.setGotra(gotraId, gotraCustom.trim().length > 0 ? gotraCustom : null);
            draft.setNakshatra(nakshatraId, pada);
            draft.setRasi(rasiId);
            router.push('/onboarding/family');
          }}
        />
      </View>

      <EnumSearchPicker
        visible={pickerOpen === 'gotra'}
        title="Gothram"
        file={ENUM_FILES.gotra}
        selectedId={gotraId}
        onSelect={(value) => {
          setGotraId(value.id);
          setGotraCustom('');
        }}
        onUnknown={() => {
          setGotraId(null);
          setGotraCustom('');
        }}
        onClose={() => {
          setPickerOpen(null);
        }}
      />

      <EnumSearchPicker
        visible={pickerOpen === 'nakshatra'}
        title="Janma Nakshatram"
        file={ENUM_FILES.nakshatra}
        selectedId={nakshatraId}
        onSelect={(value) => {
          selectNakshatra(value.id, null);
        }}
        onUnknown={() => {
          setNakshatraId(null);
          setPada(null);
        }}
        onClose={() => {
          setPickerOpen(null);
        }}
      />

      <EnumSearchPicker
        visible={pickerOpen === 'rasi'}
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
        onClose={() => {
          setPickerOpen(null);
        }}
      />
    </View>
  );
}
