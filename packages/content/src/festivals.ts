import { z } from 'zod';
import { reviewSchema } from './review';
import { contentTextSchema } from './localizedText';

/**
 * Schema for `content/festivals/{samvatsara}.json` (§10 Phase 9: "Month
 * Calendar screen; festival markers from `content/festivals/{samvatsara}.json`
 * (pandit-authored table, not algorithmic, for v1)").
 *
 * Unlike the five angas, a festival's *observed* Gregorian date is a pandit's
 * call (udaya vyapti rules, regional variation), not something
 * `@epooja/panchangam` can derive — so each samvatsara's table is content,
 * checked in and reviewed exactly like a puja or recipe file, never computed.
 */
export const festivalSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
  name: contentTextSchema,
  /** The Gregorian date the festival is observed on, for this samvatsara. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dates are yyyy-MM-dd'),
  /** Asset key into the icon set, e.g. "festival/ugadi.webp" — optional. */
  icon: z.string().optional(),
});

export const festivalFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.literal('festivals'),
    /** Which `enums/samvatsara.json` id this table's dates belong to. */
    samvatsara: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
    note: z.string().optional(),
    review: reviewSchema,
    festivals: z.array(festivalSchema),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.festivals.forEach((festival, position) => {
      if (ids.has(festival.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate festival id ${festival.id}`,
          path: ['festivals', position, 'id'],
        });
      }
      ids.add(festival.id);
    });
  });

export type Festival = z.infer<typeof festivalSchema>;
export type FestivalFile = z.infer<typeof festivalFileSchema>;

export function parseFestivalFile(data: unknown): FestivalFile {
  return festivalFileSchema.parse(data);
}

/**
 * Festivals in `file` falling within `year`/`month` (1–12) — what the
 * Calendar screen's month grid marks. `file` is optional because no samvatsara
 * has a pandit-reviewed table yet (`content/REVIEW_QUEUE.md`); the Calendar
 * screen calls this exactly the same way once one lands.
 */
export function festivalsInMonth(
  file: FestivalFile | undefined,
  year: number,
  month: number,
): Festival[] {
  if (!file) return [];
  const prefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-`;
  return file.festivals.filter((festival) => festival.date.startsWith(prefix));
}
