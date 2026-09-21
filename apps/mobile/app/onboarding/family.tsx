import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { FamilyMemberForm, RELATIONS } from '@/components/family/FamilyMemberForm';
import { useOnboardingDraft } from '@/stores/onboardingDraft';

/**
 * Family (§8.1 step 4): add spouse/children/parents, each with a name,
 * relation, gender, optional nakshatram/rasi, and whether they're included
 * in the Sankalpam.
 */
export default function FamilyScreen() {
  const router = useRouter();
  const draft = useOnboardingDraft();
  const [adding, setAdding] = useState(false);

  return (
    <View style={{ flex: 1 }} className="bg-cream-50">
      <StepHeader step={3} title="Your family" />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
        <Txt variant="body" tone="inkMuted">
          Add the family members you&apos;d like named in your Sankalpam. You can skip this and add
          them later from Profile.
        </Txt>

        {draft.family.map((member) => (
          <Card key={member.draftId} tone="cream" padding={4}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Txt variant="cardTitle" tone="ink">
                  {member.name.en || member.name.te}
                </Txt>
                <Txt variant="label" tone="inkMuted">
                  {RELATIONS.find((r) => r.id === member.relation)?.label}
                  {member.includeInSankalpam ? ' · in Sankalpam' : ''}
                </Txt>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${member.name.en || member.name.te}`}
                hitSlop={10}
                onPress={() => {
                  draft.removeFamilyDraft(member.draftId);
                }}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color={colors.ink['500'] as string}
                />
              </Pressable>
            </View>
          </Card>
        ))}

        {adding ? (
          <FamilyMemberForm
            submitLabel="Add"
            onCancel={() => {
              setAdding(false);
            }}
            onSubmit={(member) => {
              draft.addFamilyDraft(member);
              setAdding(false);
            }}
          />
        ) : (
          <Button
            label="Add family member"
            tone="ghost"
            icon="account-plus"
            onPress={() => {
              setAdding(true);
            }}
          />
        )}
      </ScrollView>

      <View style={{ padding: spacing[5] }}>
        <Button
          label="Continue"
          tone="maroon"
          size="lg"
          fullWidth
          onPress={() => {
            router.push('/onboarding/location');
          }}
        />
      </View>
    </View>
  );
}
