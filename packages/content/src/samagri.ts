import { z } from 'zod';
import { reviewSchema } from './review';
import { contentTextSchema } from './localizedText';

/**
 * Schema for `content/samagri/items.json` (§9.4 `SamagriItem`) — the
 * ritual items a Preparation checklist offers.
 */
export const samagriItemSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
  name: contentTextSchema,
  /** A MaterialCommunityIcons glyph name, e.g. "candle" — an asset key, not a file. */
  icon: z.string().min(1),
  quantity: contentTextSchema.optional(),
  optional: z.boolean().optional(),
  notes: contentTextSchema.optional(),
});

export type SamagriItem = z.infer<typeof samagriItemSchema>;

export const samagriFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.literal('samagri'),
    note: z.string().optional(),
    review: reviewSchema,
    items: z.array(samagriItemSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.items.forEach((item, position) => {
      if (ids.has(item.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate samagri id ${item.id}`,
          path: ['items', position, 'id'],
        });
      }
      ids.add(item.id);
    });
  });

export type SamagriFile = z.infer<typeof samagriFileSchema>;

export function parseSamagriFile(data: unknown): SamagriFile {
  return samagriFileSchema.parse(data);
}
