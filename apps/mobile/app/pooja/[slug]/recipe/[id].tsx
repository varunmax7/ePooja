import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { Card, Txt, colors, radius, spacing } from '@epooja/ui';
import recipe from '@/mocks/recipe.json';

/**
 * Recipe (§8.5): hero, time, a servings stepper that scales the quantities,
 * ingredients, steps and the ritual notes.
 */
function formatAmount(amount: number, servings: number, base: number): string {
  const scaled = (amount * servings) / base;
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
}

export default function RecipeScreen() {
  const [servings, setServings] = useState(recipe.baseServings);

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
          {recipe.title}
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
                setServings((s) => Math.max(1, s - 1));
              }}
            />
            <Txt variant="fieldValue" tone="ink">
              {servings}
            </Txt>
            <Stepper
              icon="plus"
              label="More servings"
              onPress={() => {
                setServings((s) => Math.min(20, s + 1));
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
              paddingVertical: spacing[2],
              borderBottomWidth: index === recipe.ingredients.length - 1 ? 0 : 1,
              borderBottomColor: colors.cream['300'],
            }}
          >
            <Txt variant="body" tone="ink">
              {ingredient.name}
            </Txt>
            <Txt variant="label" tone="inkMuted">
              {formatAmount(ingredient.amount, servings, recipe.baseServings)} {ingredient.unit}
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
            key={step}
            style={{ flexDirection: 'row', gap: spacing[3], paddingVertical: spacing[2] }}
          >
            <Txt variant="cardTitle" tone="gold">
              {index + 1}
            </Txt>
            <Txt variant="body" tone="ink" style={{ flex: 1 }}>
              {step}
            </Txt>
          </View>
        ))}
      </Card>

      <Card tone="outlined" padding={5}>
        <Txt variant="sectionTitle" tone="maroon">
          Ritual notes
        </Txt>
        <View style={{ height: spacing[2] }} />
        {recipe.ritualNotes.map((note) => (
          <Txt key={note} variant="body" tone="ink" style={{ paddingVertical: spacing[1] }}>
            · {note}
          </Txt>
        ))}
      </Card>
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
