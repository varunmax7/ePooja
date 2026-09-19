/**
 * @epooja/content — zod schemas, types and loaders for ritual content packs
 * (implementation.md §9.4). Phase 0 ships only the review-status contract that
 * §0.3 requires every content file to carry; the full schema lands in Phase 4.
 */
import { z } from 'zod';

/** §0.3: every content file carries a review block. */
export const reviewSchema = z.object({
  status: z.enum(['PENDING_PANDIT_REVIEW', 'APPROVED']),
  reviewer: z.string().nullable(),
  date: z.string().nullable(),
});

export type Review = z.infer<typeof reviewSchema>;

/** §0.4: placeholder marker for content a pandit still has to supply. */
export const TODO_PANDIT_PATTERN = /^⟨TODO_PANDIT:[a-z0-9_]+⟩$/u;

export const isTodoPandit = (value: string): boolean => TODO_PANDIT_PATTERN.test(value);

export const CONTENT_PACKAGE = {
  name: '@epooja/content',
  schemaImplementedInPhase: 4,
} as const;
