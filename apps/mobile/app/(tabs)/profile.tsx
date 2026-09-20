import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
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

  if (!devotee) return null;

  const gotra = devotee.gotraCustom
    ? devotee.gotraCustom
    : devotee.gotraId
      ? (() => {
          const te = enumDisplay(enumValue(ENUM_FILES.gotra, devotee.gotraId as string), 'te');
          return isTodoPandit(te) ? (devotee.gotraId as string) : te;
        })()
      : 'Not set';

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
    : 'Not set';

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <CurvedHeader
        title="My Profile"
        tone="saffron"
        height={210}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            hitSlop={10}
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
        <FieldCard label="Name" value={displayName(devotee.name)} />
        <FieldCard
          label="Gotra"
          value={gotra}
          {...(devotee.gotraId ? {} : { secondary: 'pandit-supplied list (§9.2)' })}
        />
        <FieldCard
          label="Birth Star"
          value={nakshatraDisplay ?? 'Not set'}
          valueScript={nakshatraDisplay && !isTodoPandit(nakshatraDisplay) ? 'telugu' : 'latin'}
          {...(devotee.nakshatraPada ? { secondary: `pada ${devotee.nakshatraPada}` } : {})}
        />
        <FieldCard
          label="Moon Sign"
          value={rasiText}
          valueScript={rasiDisplay && !isTodoPandit(rasiDisplay) ? 'telugu' : 'latin'}
        />

        <Card tone="cream" padding={5}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Txt variant="sectionTitle" tone="ink">
              Family Members
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage family members"
              onPress={() => {
                router.push('/profile/family');
              }}
            >
              <Txt variant="label" tone="maroon">
                Manage
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
                name="Add"
                add
                onPress={() => {
                  router.push('/profile/family');
                }}
              />
            </View>
          </ScrollView>
        </Card>

        <FieldCard label="Location" value={devotee.location.label} secondary={devotee.location.tz} />
      </View>
    </ScrollView>
  );
}
