import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';
import { useDevoteeStore } from '@/stores/devotee';
import { FamilyMemberForm, RELATIONS } from '@/components/family/FamilyMemberForm';

/**
 * Family Members (§8.7): add, edit and remove the family §8.1 already lets a
 * devotee name in the Sankalpam.
 */
export default function FamilyListScreen() {
  const family = useDevoteeStore((s) => s.devotee?.family ?? []);
  const addFamilyMember = useDevoteeStore((s) => s.addFamilyMember);
  const updateFamilyMember = useDevoteeStore((s) => s.updateFamilyMember);
  const removeFamilyMember = useDevoteeStore((s) => s.removeFamilyMember);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: spacing[8] }}
    >
      {family.map((member) =>
        editingId === member.id ? (
          <FamilyMemberForm
            key={member.id}
            initial={member}
            submitLabel="Save"
            onCancel={() => {
              setEditingId(null);
            }}
            onSubmit={(patch) => {
              updateFamilyMember(member.id, patch);
              setEditingId(null);
            }}
          />
        ) : (
          <Card key={member.id} tone="cream" padding={4}>
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
              <View style={{ flexDirection: 'row', gap: spacing[4] }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${member.name.en || member.name.te}`}
                  hitSlop={10}
                  onPress={() => {
                    setEditingId(member.id);
                  }}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={20}
                    color={colors.maroon['700'] as string}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${member.name.en || member.name.te}`}
                  hitSlop={10}
                  onPress={() => {
                    removeFamilyMember(member.id);
                  }}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={colors.ink['500'] as string}
                  />
                </Pressable>
              </View>
            </View>
          </Card>
        ),
      )}

      {adding ? (
        <FamilyMemberForm
          submitLabel="Add"
          onCancel={() => {
            setAdding(false);
          }}
          onSubmit={(member) => {
            addFamilyMember(member);
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
  );
}
