import { z } from 'zod';
import { reviewSchema } from './review';
import { contentTextSchema } from './localizedText';

/**
 * Schema for `content/naivedyam/recipes.json` (§9.4 `NaivedyamRecipe`).
 *
 * Ingredient amounts are plain numbers rather than fractions or ranges so the
 * Recipe screen's servings scaling (§8.5) is a pure multiply, not a parser.
 */
export const naivedyamIngredientSchema = z.object({
  id: z.string().min(1),
  name: contentTextSchema,
  amount: z.number().positive(),
  unit: z.string().min(1),
});

export const naivedyamRecipeSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
  name: contentTextSchema,
  /** Asset key, e.g. "naivedyam/pulihora.webp" — not fetched in Phase 4. */
  image: z.string().min(1),
  timeMinutes: z.number().int().positive(),
  baseServings: z.number().int().positive(),
  ingredients: z.array(naivedyamIngredientSchema).min(1),
  steps: z.array(contentTextSchema).min(1),
  ritualNotes: z.array(contentTextSchema).optional(),
});

export type NaivedyamIngredient = z.infer<typeof naivedyamIngredientSchema>;
export type NaivedyamRecipe = z.infer<typeof naivedyamRecipeSchema>;

export const naivedyamFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.literal('naivedyam'),
    note: z.string().optional(),
    review: reviewSchema,
    recipes: z.array(naivedyamRecipeSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.recipes.forEach((recipe, position) => {
      if (ids.has(recipe.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate recipe id ${recipe.id}`,
          path: ['recipes', position, 'id'],
        });
      }
      ids.add(recipe.id);

      const ingredientIds = new Set<string>();
      recipe.ingredients.forEach((ingredient, ingredientPosition) => {
        if (ingredientIds.has(ingredient.id)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate ingredient id ${ingredient.id} in ${recipe.id}`,
            path: ['recipes', position, 'ingredients', ingredientPosition, 'id'],
          });
        }
        ingredientIds.add(ingredient.id);
      });
    });
  });

export type NaivedyamFile = z.infer<typeof naivedyamFileSchema>;

export function parseNaivedyamFile(data: unknown): NaivedyamFile {
  return naivedyamFileSchema.parse(data);
}

/**
 * Scales one ingredient's amount for a different number of servings (§8.5).
 *
 * A pure function so the Recipe screen's stepper and Phase 4's acceptance
 * test ("recipe scaling correct") share the same logic rather than the
 * screen re-deriving it. Rounded to two decimals — a devotee measuring by
 * cups and spoons has no use for `2.6666666666666665`.
 */
export function scaledAmount(
  ingredient: Pick<NaivedyamIngredient, 'amount'>,
  servings: number,
  baseServings: number,
): number {
  if (baseServings <= 0) throw new RangeError(`baseServings must be positive, got ${baseServings}`);
  if (servings < 0) throw new RangeError(`servings must not be negative, got ${servings}`);

  const scaled = (ingredient.amount * servings) / baseServings;
  return Math.round(scaled * 100) / 100;
}

/** `scaledAmount`, formatted the way the Recipe screen displays a quantity. */
export function formatScaledAmount(
  ingredient: Pick<NaivedyamIngredient, 'amount'>,
  servings: number,
  baseServings: number,
): string {
  const scaled = scaledAmount(ingredient, servings, baseServings);
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(2).replace(/0$/, '');
}
