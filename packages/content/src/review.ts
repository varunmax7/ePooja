import { z } from 'zod';

/** §0.3: every content file carries a review block. */
export const reviewSchema = z.object({
  status: z.enum(['PENDING_PANDIT_REVIEW', 'APPROVED']),
  reviewer: z.string().nullable(),
  date: z.string().nullable(),
});

export type Review = z.infer<typeof reviewSchema>;

/** A file may only be APPROVED with a named reviewer and a date (§0.3). */
export function isApproved(review: Review): boolean {
  return review.status === 'APPROVED' && Boolean(review.reviewer) && Boolean(review.date);
}
