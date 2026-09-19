import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
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
import profile from '@/mocks/profile.json';

/**
 * My Profile (§8.7, mockup screen 1): a saffron curved header with the avatar
 * ring, a stack of field cards, and the family members row.
 */
export default function ProfileScreen() {
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
          <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" hitSlop={10}>
            <MaterialCommunityIcons
              name="square-edit-outline"
              size={22}
              color={colors.maroon['800'] as string}
            />
          </Pressable>
        }
      >
        <View style={{ alignItems: 'center', gap: spacing[2], marginTop: spacing[2] }}>
          <AvatarRing initials={profile.devotee.initials} onEdit={() => undefined} />
          <Txt variant="cardTitle" tone="maroon">
            {profile.devotee.nameEn}
          </Txt>
        </View>
      </CurvedHeader>

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[4], marginTop: spacing[5] }}>
        {profile.devotee.fields.map((field) => (
          <FieldCard
            key={field.label}
            label={field.label}
            value={field.value}
            valueScript={field.script === 'telugu' ? 'telugu' : 'latin'}
            {...(field.secondary ? { secondary: field.secondary } : {})}
          />
        ))}

        <Card tone="cream" padding={5}>
          <Txt variant="sectionTitle" tone="ink">
            Family Members
          </Txt>
          <View style={{ height: spacing[3] }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {profile.family.map((member) => (
                <FamilyChip key={member.id} name={member.name} />
              ))}
              <FamilyChip name="Add" add />
            </View>
          </ScrollView>
        </Card>

        <FieldCard
          label={profile.location.label}
          value={profile.location.value}
          secondary={profile.location.secondary}
        />
      </View>
    </ScrollView>
  );
}
