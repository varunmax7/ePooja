import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AvatarRing,
  Card,
  CurvedHeader,
  FamilyChip,
  FieldCard,
  Txt,
  colors,
  spacing,
} from '@epooja/ui';
import { displayName, enumDisplay, enumValue, initialsOf, isTodoPandit } from '@epooja/content';
import { useDevoteeStore } from '@/stores/devotee';
import { ENUM_FILES } from '@/services/panchangam';

/**
 * My Profile (§8.7, mockup screen 1): a saffron curved header with the
 * avatar ring, a stack of field cards, and the family members row — all live
 * from `useDevoteeStore` (§8.1 wrote it, this screen and `/profile/edit` keep
 * it current).
 */
export default function ProfileScreen() {
  const router = useRouter();
  const devotee = useDevoteeStore((s) => s.devotee);
  const { t } = useTranslation('profile');

  if (!devotee) return null;

  const gotra = devotee.gotraCustom
    ? devotee.gotraCustom
    : devotee.gotraId
      ? (() => {
          const te = enumDisplay(enumValue(ENUM_FILES.gotra, devotee.gotraId as string), 'te');
          return isTodoPandit(te) ? (devotee.gotraId as string) : te;
        })()
      : t('notSet');

  const nakshatraValue = devotee.nakshatraId
    ? enumValue(ENUM_FILES.nakshatra, devotee.nakshatraId)
    : null;
  const nakshatraDisplay = nakshatraValue ? enumDisplay(nakshatraValue, 'te') : null;

  const rasiValue = devotee.rasiId ? enumValue(ENUM_FILES.rasi, devotee.rasiId) : null;
  const rasiDisplay = rasiValue ? enumDisplay(rasiValue, 'te') : null;
  const rasiText = rasiDisplay
    ? isTodoPandit(rasiDisplay)
      ? devotee.rasiId!
      : rasiDisplay
    : t('notSet');

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <CurvedHeader
        title={t('title')}
        tone="saffron"
        height={210}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('editA11y')}
            hitSlop={11}
            onPress={() => {
              router.push('/profile/edit');
            }}
          >
            <MaterialCommunityIcons
              name="square-edit-outline"
              size={22}
              color={colors.maroon['800'] as string}
            />
          </Pressable>
        }
      >
        <View style={{ alignItems: 'center', gap: spacing[2], marginTop: spacing[2] }}>
          <AvatarRing
            initials={initialsOf(devotee.name)}
            onEdit={() => {
              router.push('/profile/edit');
            }}
          />
          <Txt variant="cardTitle" tone="maroon">
            {displayName(devotee.name)}
          </Txt>
        </View>
      </CurvedHeader>

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[4], marginTop: spacing[5] }}>
        <FieldCard label={t('fieldName')} value={displayName(devotee.name)} />
        <FieldCard
          label={t('fieldGotra')}
          value={gotra}
          {...(devotee.gotraId ? {} : { secondary: t('gotraPendingNote') })}
        />
        <FieldCard
          label={t('fieldBirthStar')}
          value={nakshatraDisplay ?? t('notSet')}
          valueScript={nakshatraDisplay && !isTodoPandit(nakshatraDisplay) ? 'telugu' : 'latin'}
          {...(devotee.nakshatraPada ? { secondary: t('pada', { n: devotee.nakshatraPada }) } : {})}
        />
        <FieldCard
          label={t('fieldMoonSign')}
          value={rasiText}
          valueScript={rasiDisplay && !isTodoPandit(rasiDisplay) ? 'telugu' : 'latin'}
        />

        <Card tone="cream" padding={5}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Txt variant="sectionTitle" tone="ink">
              {t('familyMembers')}
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('manageA11y')}
              onPress={() => {
                router.push('/profile/family');
              }}
            >
              <Txt variant="label" tone="maroon">
                {t('manage')}
              </Txt>
            </Pressable>
          </View>
          <View style={{ height: spacing[3] }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {devotee.family.map((member) => (
                <FamilyChip key={member.id} name={displayName(member.name)} />
              ))}
              <FamilyChip
                name={t('addChip')}
                add
                onPress={() => {
                  router.push('/profile/family');
                }}
              />
            </View>
          </ScrollView>
        </Card>

        <FieldCard
          label={t('fieldLocation')}
          value={devotee.location.label}
          secondary={devotee.location.tz}
        />

        <Card tone="cream" padding={5}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('previewSankalpamA11y')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => {
              router.push('/profile/sankalpam');
            }}
          >
            <Txt variant="sectionTitle" tone="ink">
              {t('previewSankalpam')}
            </Txt>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.maroon['800'] as string}
            />
          </Pressable>
        </Card>

        <Card tone="cream" padding={5}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('accountAndSyncA11y')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => {
              router.push('/profile/account');
            }}
          >
            <Txt variant="sectionTitle" tone="ink">
              {t('accountAndSync')}
            </Txt>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.maroon['800'] as string}
            />
          </Pressable>
        </Card>

        <Card tone="cream" padding={5}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('storageAndPacksA11y')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => {
              router.push('/profile/storage');
            }}
          >
            <Txt variant="sectionTitle" tone="ink">
              {t('storageAndPacks')}
            </Txt>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.maroon['800'] as string}
            />
          </Pressable>
        </Card>
      </View>
    </ScrollView>
  );
}
