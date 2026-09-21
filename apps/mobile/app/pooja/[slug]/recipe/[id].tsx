import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card, Txt, colors, radius, spacing } from '@epooja/ui';
import { formatScaledAmount } from '@epooja/content';
import { RECIPE_BY_ID } from '@/services/content';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 20;

/**
 * Recipe (§8.5): hero, time, a servings stepper that scales the quantities,
 * ingredients, steps and the ritual notes — now from
 * `content/naivedyam/recipes.json`.
 *
 * Scaling is `formatScaledAmount` from `@epooja/content`, the same function
 * the §10 Phase 4 acceptance test checks, rather than arithmetic written
 * again here.
 */
export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = id === undefined ? undefined : RECIPE_BY_ID.get(id);
  const [servings, setServings] = useState(recipe?.baseServings ?? 4);

  if (!recipe) {
    return (
      <View style={{ flex: 1, padding: spacing[5] }} className="bg-cream-50">
        <Card tone="outlined" padding={5}>
          <Txt variant="body" tone="inkMuted">
            That recipe isn&apos;t in this app yet.
          </Txt>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: spacing[8] }}
    >
      <View
        style={{
          height: 160,
          borderRadius: radius.lg,
          backgroundColor: colors.saffron['200'],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name="bowl-mix" size={56} color={colors.maroon['700'] as string} />
        <Txt variant="fieldLabel" tone="inkMuted">
          PHOTO PENDING
        </Txt>
      </View>

      <View style={{ gap: spacing[1] }}>
        <Txt variant="screenTitle" tone="ink">
          {recipe.name.en ?? recipe.name.te}
        </Txt>
        <Txt variant="telugu" tone="maroon">
          {recipe.name.te}
        </Txt>
        <Txt variant="label" tone="inkMuted">
          {recipe.timeMinutes} min · naivedyam
        </Txt>
      </View>

      <Card tone="cream" padding={4}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Txt variant="cardTitle" tone="ink">
            Servings
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
            <Stepper
              icon="minus"
              label="Fewer servings"
              onPress={() => {
                setServings((s) => Math.max(MIN_SERVINGS, s - 1));
              }}
            />
            <Txt variant="fieldValue" tone="ink">
              {servings}
            </Txt>
            <Stepper
              icon="plus"
              label="More servings"
              onPress={() => {
                setServings((s) => Math.min(MAX_SERVINGS, s + 1));
              }}
            />
          </View>
        </View>
      </Card>

      <Card tone="cream" padding={5}>
        <Txt variant="sectionTitle" tone="ink">
          Ingredients
        </Txt>
        <View style={{ height: spacing[2] }} />
        {recipe.ingredients.map((ingredient, index) => (
          <View
            key={ingredient.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: spacing[3],
              paddingVertical: spacing[2],
              borderBottomWidth: index === recipe.ingredients.length - 1 ? 0 : 1,
              borderBottomColor: colors.cream['300'],
            }}
          >
            <Txt variant="body" tone="ink" style={{ flexShrink: 1 }}>
              {ingredient.name.en ?? ingredient.name.te}
            </Txt>
            <Txt variant="label" tone="inkMuted">
              {formatScaledAmount(ingredient, servings, recipe.baseServings)} {ingredient.unit}
            </Txt>
          </View>
        ))}
      </Card>

      <Card tone="cream" padding={5}>
        <Txt variant="sectionTitle" tone="ink">
          Steps
        </Txt>
        <View style={{ height: spacing[2] }} />
        {recipe.steps.map((step, index) => (
          <View
            key={`${recipe.id}-step-${index}`}
            style={{ flexDirection: 'row', gap: spacing[3], paddingVertical: spacing[2] }}
          >
            <Txt variant="cardTitle" tone="gold">
              {index + 1}
            </Txt>
            <Txt variant="body" tone="ink" style={{ flex: 1 }}>
              {step.en ?? step.te}
            </Txt>
          </View>
        ))}
      </Card>

      {recipe.ritualNotes && recipe.ritualNotes.length > 0 ? (
        <Card tone="outlined" padding={5}>
          <Txt variant="sectionTitle" tone="maroon">
            Ritual notes
          </Txt>
          <View style={{ height: spacing[2] }} />
          {recipe.ritualNotes.map((note, index) => (
            <Txt
              key={`${recipe.id}-note-${index}`}
              variant="body"
              tone="ink"
              style={{ paddingVertical: spacing[1] }}
            >
              · {note.en ?? note.te}
            </Txt>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

function Stepper({
  icon,
  label,
  onPress,
}: {
  icon: 'plus' | 'minus';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.cream['300'],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name={icon} size={18} color={colors.maroon['800'] as string} />
    </Pressable>
  );
}
