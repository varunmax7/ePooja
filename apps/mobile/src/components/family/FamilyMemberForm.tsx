import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, CheckRow, TextField, Txt, colors, spacing } from '@epooja/ui';
import {
  enumDisplay,
  enumValue,
  isTodoPandit,
  type FamilyMember,
  type Gender,
  type Relation,
} from '@epooja/content';
import { EnumSearchPicker } from '@/components/onboarding/EnumSearchPicker';
import { ENUM_FILES } from '@/services/panchangam';

/** `Relation` labels, localized — shared by onboarding and Profile's family CRUD. */
export function useRelationLabels(): Record<Relation, string> {
  const { t } = useTranslation('forms');
  return {
    spouse: t('relationSpouse'),
    son: t('relationSon'),
    daughter: t('relationDaughter'),
    father: t('relationFather'),
    mother: t('relationMother'),
    other: t('relationOther'),
  };
}

function useRelationOptions(): { id: Relation; label: string }[] {
  const labels = useRelationLabels();
  return (['spouse', 'son', 'daughter', 'father', 'mother', 'other'] as const).map((id) => ({
    id,
    label: labels[id],
  }));
}

export type FamilyMemberDraft = Omit<FamilyMember, 'id'>;

const EMPTY: FamilyMemberDraft = {
  name: { te: '', en: '' },
  relation: 'spouse',
  gender: 'female',
  includeInSankalpam: true,
};

export interface FamilyMemberFormProps {
  initial?: FamilyMemberDraft;
  submitLabel: string;
  onSubmit: (member: FamilyMemberDraft) => void;
  onCancel: () => void;
}

/**
 * The add/edit form for one family member (§8.1 step 4, §8.7 profile family
 * CRUD): name, relation, gender, the optional nakshatram/rasi §8.1 names,
 * and whether they're included in the Sankalpam.
 *
 * Shared between onboarding and Profile so both write the same shape and
 * neither drifts from the other.
 */
export function FamilyMemberForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: FamilyMemberFormProps) {
  const base = initial ?? EMPTY;
  const [name, setName] = useState(base.name.en ?? '');
  const [relation, setRelation] = useState<Relation>(base.relation);
  const [gender, setGender] = useState<Gender>(base.gender);
  const [nakshatraId, setNakshatraId] = useState<string | undefined>(base.nakshatraId);
  const [rasiId, setRasiId] = useState<string | undefined>(base.rasiId);
  const [includeInSankalpam, setIncludeInSankalpam] = useState(base.includeInSankalpam);
  const [picker, setPicker] = useState<'nakshatra' | 'rasi' | null>(null);
  const { t } = useTranslation('forms');
  const relationOptions = useRelationOptions();

  const nakshatraLabel = nakshatraId
    ? (() => {
        const te = enumDisplay(enumValue(ENUM_FILES.nakshatra, nakshatraId), 'te');
        return isTodoPandit(te) ? nakshatraId : te;
      })()
    : '';
  const rasiLabel = rasiId
    ? (() => {
        const te = enumDisplay(enumValue(ENUM_FILES.rasi, rasiId), 'te');
        return isTodoPandit(te) ? rasiId : te;
      })()
    : '';

  return (
    <Card tone="outlined" padding={4}>
      <View style={{ gap: spacing[4] }}>
        <TextField label={t('name')} value={name} onChangeText={setName} placeholder={t('name')} />

        <View style={{ gap: spacing[2] }}>
          <Txt variant="fieldLabel" tone="inkMuted">
            {t('relation').toUpperCase()}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {relationOptions.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: relation === option.id }}
                onPress={() => {
                  setRelation(option.id);
                }}
              >
                <View
                  style={{
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: 999,
                    backgroundColor:
                      relation === option.id
                        ? (colors.maroon['700'] as string)
                        : (colors.cream['200'] as string),
                  }}
                >
                  <Txt variant="label" tone={relation === option.id ? 'cream' : 'ink'}>
                    {option.label}
                  </Txt>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          {(['male', 'female'] as const).map((option) => (
            <Pressable
              key={option}
              style={{ flex: 1 }}
              accessibilityRole="radio"
              accessibilityState={{ checked: gender === option }}
              onPress={() => {
                setGender(option);
              }}
            >
              <Card tone={gender === option ? 'cream' : 'outlined'} padding={2}>
                <Txt variant="body" tone="ink" align="center">
                  {option === 'male' ? t('male') : t('female')}
                </Txt>
              </Card>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <Pressable
            style={{ flex: 1 }}
            accessibilityRole="button"
            onPress={() => {
              setPicker('nakshatra');
            }}
          >
            <View>
              <Txt variant="fieldLabel" tone="inkMuted">
                {t('nakshatram').toUpperCase()}
              </Txt>
              <View style={{ height: spacing[1] }} />
              <Card tone="outlined" padding={3}>
                <Txt variant="body" tone={nakshatraLabel ? 'ink' : 'inkMuted'}>
                  {nakshatraLabel || t('notSet')}
                </Txt>
              </Card>
            </View>
          </Pressable>
          <Pressable
            style={{ flex: 1 }}
            accessibilityRole="button"
            onPress={() => {
              setPicker('rasi');
            }}
          >
            <View>
              <Txt variant="fieldLabel" tone="inkMuted">
                {t('rasi').toUpperCase()}
              </Txt>
              <View style={{ height: spacing[1] }} />
              <Card tone="outlined" padding={3}>
                <Txt variant="body" tone={rasiLabel ? 'ink' : 'inkMuted'}>
                  {rasiLabel || t('notSet')}
                </Txt>
              </Card>
            </View>
          </Pressable>
        </View>

        <CheckRow
          label={t('includeInSankalpam')}
          checked={includeInSankalpam}
          onToggle={() => {
            setIncludeInSankalpam((v) => !v);
          }}
        />

        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <Button label={t('common:cancel')} tone="ghost" onPress={onCancel} />
          <View style={{ flex: 1 }}>
            <Button
              label={submitLabel}
              tone="maroon"
              fullWidth
              disabled={name.trim().length === 0}
              onPress={() => {
                onSubmit({
                  name: { te: base.name.te, en: name.trim() },
                  relation,
                  gender,
                  ...(nakshatraId ? { nakshatraId } : {}),
                  ...(rasiId ? { rasiId } : {}),
                  includeInSankalpam,
                });
              }}
            />
          </View>
        </View>
      </View>

      <EnumSearchPicker
        visible={picker === 'nakshatra'}
        title={t('nakshatramTitle')}
        file={ENUM_FILES.nakshatra}
        selectedId={nakshatraId ?? null}
        onSelect={(value) => {
          setNakshatraId(value.id);
        }}
        onUnknown={() => {
          setNakshatraId(undefined);
        }}
        onClose={() => {
          setPicker(null);
        }}
      />
      <EnumSearchPicker
        visible={picker === 'rasi'}
        title={t('rasiTitle')}
        file={ENUM_FILES.rasi}
        selectedId={rasiId ?? null}
        onSelect={(value) => {
          setRasiId(value.id);
        }}
        onUnknown={() => {
          setRasiId(undefined);
        }}
        onClose={() => {
          setPicker(null);
        }}
      />
    </Card>
  );
}
