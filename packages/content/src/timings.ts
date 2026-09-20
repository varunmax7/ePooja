import { z } from 'zod';
import { reviewSchema } from './review';
import { isTodoPandit, teluguOrTodo } from './enums';

/**
 * Schema for `content/timings.json` — the daily prayer windows §8.2 puts in
 * content rather than in code.
 *
 * Daylight is divided into `parts` equal spans and each window names the one
 * it occupies, so a pandit can move a window without a release. The engine
 * takes these parts as an argument; it never reads this file (§15).
 */

export const PRAYER_TIMING_IDS = ['morning', 'midday', 'evening'] as const;
export type PrayerTimingId = (typeof PRAYER_TIMING_IDS)[number];

export const timingSchema = z.object({
  id: z.enum(PRAYER_TIMING_IDS),
  /** 0-based index of the daylight part this window occupies. */
  part: z.number().int().min(0),
  en: z.string().min(1),
  te: teluguOrTodo,
  /** The Sanskrit sandhya this window corresponds to; pandit-supplied. */
  sandhya: z.string().min(1),
  audioTokenId: z.string().regex(/^enum\.timing\.[a-z]+$/),
});

export type Timing = z.infer<typeof timingSchema>;

export const timingFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.literal('timings'),
    note: z.string().optional(),
    review: reviewSchema,
    reviewNote: z.string().optional(),
    /** Documents the rule the parts are indices into. */
    basis: z.literal('daylight-fifths'),
    parts: z.number().int().positive(),
    timings: z.array(timingSchema),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<PrayerTimingId>();

    file.timings.forEach((timing, position) => {
      if (seen.has(timing.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate timing ${timing.id}`,
          path: ['timings', position, 'id'],
        });
      }
      seen.add(timing.id);

      if (timing.part >= file.parts) {
        ctx.addIssue({
          code: 'custom',
          message: `part must be 0–${file.parts - 1}, got ${timing.part}`,
          path: ['timings', position, 'part'],
        });
      }

      if (timing.audioTokenId !== `enum.timing.${timing.id}`) {
        ctx.addIssue({
          code: 'custom',
          message: `audioTokenId must be enum.timing.${timing.id}`,
          path: ['timings', position, 'audioTokenId'],
        });
      }
    });

    for (const id of PRAYER_TIMING_IDS) {
      if (!seen.has(id)) {
        ctx.addIssue({ code: 'custom', message: `Missing timing ${id}`, path: ['timings'] });
      }
    }

    // Morning before midday before evening: the reminder schedule and the
    // Today list both read them in file order.
    const parts = file.timings.map((timing) => timing.part);
    const ascending = parts.every((part, i) => i === 0 || part > (parts[i - 1] ?? -1));
    if (!ascending) {
      ctx.addIssue({
        code: 'custom',
        message: 'timings must be listed in ascending part order',
        path: ['timings'],
      });
    }
  });

export type TimingFile = z.infer<typeof timingFileSchema>;

export function parseTimingFile(data: unknown): TimingFile {
  return timingFileSchema.parse(data);
}

/** The `parts` map the engine's `prayerTimings` takes. */
export function prayerParts(file: TimingFile): Record<PrayerTimingId, number> {
  const parts = {} as Record<PrayerTimingId, number>;
  for (const timing of file.timings) parts[timing.id] = timing.part;
  return parts;
}

/** Which sandhya names a pandit still has to supply (§0.4). */
export function pendingTimingFields(file: TimingFile): string[] {
  return file.timings.filter((t) => isTodoPandit(t.sandhya)).map((t) => `${t.id}.sandhya`);
}
