import { z } from 'zod';
import { reviewSchema } from './review';
import { contentTextSchema } from './localizedText';

/**
 * Schema for `content/pujas/*.json` (§9.4 `PujaCatalogItem`/`PujaStep`).
 *
 * A puja is its catalog metadata plus an ordered list of steps; the Puja
 * Runner (Phase 6) walks the steps, the Sankalpam engine (Phase 5) fills the
 * one step marked `dynamic: "sankalpam"`, and Phase 4 only needs enough of
 * this to render the catalog, the detail/preparation screens and the step
 * list — not to run a puja.
 */

export const STEP_SECTIONS = ['poorvangam', 'pradhana', 'uttarangam'] as const;
export type StepSection = (typeof STEP_SECTIONS)[number];

export const UPACHARAS = [
  'dhyana',
  'avahana',
  'asana',
  'padya',
  'arghya',
  'achamaniya',
  'snana',
  'vastra',
  'yajnopavita',
  'gandha',
  'pushpa',
  'dhupa',
  'deepa',
  'naivedya',
  'tambula',
  'nirajana',
] as const;
export type Upachara = (typeof UPACHARAS)[number];

export const PUJA_VARIANTS = ['short', 'full'] as const;
export type PujaVariant = (typeof PUJA_VARIANTS)[number];

export const PUJA_CATEGORIES = ['nitya', 'deity', 'festival'] as const;
export type PujaCategory = (typeof PUJA_CATEGORIES)[number];

export const mantraLineSchema = z.object({
  id: z.string().min(1),
  text: contentTextSchema,
  meaning: contentTextSchema.optional(),
  /** Milliseconds into the step's chant clip; stitched in Phase 7. */
  cue: z
    .object({ startMs: z.number().int().nonnegative(), endMs: z.number().int().positive() })
    .optional(),
  repeat: z.number().int().positive().optional(),
});

export type MantraLine = z.infer<typeof mantraLineSchema>;

const instructionActionSchema = z.object({
  kind: z.enum(['confirm', 'timer']),
  seconds: z.number().int().positive().optional(),
  icon: z.string().min(1),
});

const instructionSchema = z.object({
  text: contentTextSchema,
  /** Id of the pandit's recorded instruction clip (§9.6); not resolved in Phase 4. */
  audioId: z.string().min(1),
  action: instructionActionSchema.optional(),
});

const chantSchema = z.object({
  audioId: z.string().min(1),
  lines: z.array(mantraLineSchema),
});

const namavaliSchema = z.object({
  count: z.number().int().positive(),
  names: z.array(mantraLineSchema),
  offering: z.enum(['pushpa', 'akshata', 'kumkuma']),
});

export const pujaStepSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
  order: z.number().int().positive(),
  section: z.enum(STEP_SECTIONS),
  upachara: z.enum(UPACHARAS).optional(),
  title: contentTextSchema,
  instruction: instructionSchema.optional(),
  chant: chantSchema.optional(),
  /** The Sankalpam engine (Phase 5) builds this step's chant at runtime. */
  dynamic: z.literal('sankalpam').optional(),
  namavali: namavaliSchema.optional(),
  samagriUsed: z.array(z.string()).optional(),
  /** Which duration variants include this step; absent means every variant does. */
  variants: z.array(z.enum(PUJA_VARIANTS)).optional(),
});

export type PujaStep = z.infer<typeof pujaStepSchema>;

export const pujaPackMetaSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'semver, e.g. 0.1.0'),
  sizeBytes: z.number().int().nonnegative(),
  audioIds: z.array(z.string()),
});

export const pujaCatalogItemSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
    slug: z.string().regex(/^[a-z][a-z0-9-]*$/, 'slugs are lower-kebab-case ASCII keys'),
    deity: z.string().min(1),
    category: z.enum(PUJA_CATEGORIES),
    title: contentTextSchema,
    description: contentTextSchema,
    /** Asset key, e.g. "pujas/nitya.webp" — not fetched in Phase 4. */
    image: z.string().min(1),
    durations: z.object({
      short: z.number().int().positive().optional(),
      full: z.number().int().positive(),
    }),
    samagri: z.array(z.string()),
    naivedyam: z.array(z.string()),
    steps: z.array(pujaStepSchema).min(1),
    pack: pujaPackMetaSchema,
    review: reviewSchema,
  })
  .superRefine((puja, ctx) => {
    const ids = new Set<string>();
    let previousOrder = 0;

    puja.steps.forEach((step, position) => {
      if (ids.has(step.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate step id ${step.id}`,
          path: ['steps', position, 'id'],
        });
      }
      ids.add(step.id);

      // `order` must strictly increase down the file, i.e. the JSON is
      // authored in the sequence a devotee experiences it — a puja step file
      // is meant to be read top-to-bottom, and a mismatch here usually means
      // a step was copy-pasted or reordered without updating its number.
      if (step.order <= previousOrder) {
        ctx.addIssue({
          code: 'custom',
          message: `step order must strictly increase: ${step.id} has order ${step.order}, expected > ${previousOrder}`,
          path: ['steps', position, 'order'],
        });
      }
      previousOrder = step.order;

      const hasContent = step.instruction || step.chant || step.dynamic || step.namavali;
      if (!hasContent) {
        ctx.addIssue({
          code: 'custom',
          message: `${step.id} has no instruction, chant, namavali or dynamic content`,
          path: ['steps', position],
        });
      }
    });

    if (puja.durations.short !== undefined && puja.durations.short >= puja.durations.full) {
      ctx.addIssue({
        code: 'custom',
        message: 'the short duration must be less than the full duration',
        path: ['durations', 'short'],
      });
    }
  });

export type PujaCatalogItem = z.infer<typeof pujaCatalogItemSchema>;

export function parsePujaFile(data: unknown): PujaCatalogItem {
  return pujaCatalogItemSchema.parse(data);
}

/**
 * Schema for `content/pujas/_shodashopachara.json` — the shared 16-upachara
 * sequence (§9.5) that deity pujas draw their Pradhana section from. It is a
 * step *template*, not a puja: no id, slug, durations or samagri of its own,
 * just an ordered, reusable list of `PujaStep`s.
 *
 * Phase 4 does not yet compose this into a deity puja at build time — the
 * three deity skeletons each carry their own minimal step list and note
 * where the shared sequence attaches. Composing them mechanically is Phase 6
 * puja-runner work, once there is a runner to prove the composition against.
 */
export const pujaStepTemplateFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.literal('puja-step-template'),
    note: z.string().optional(),
    review: reviewSchema,
    steps: z.array(pujaStepSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    let previousOrder = 0;

    file.steps.forEach((step, position) => {
      if (ids.has(step.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate step id ${step.id}`,
          path: ['steps', position, 'id'],
        });
      }
      ids.add(step.id);

      if (step.order <= previousOrder) {
        ctx.addIssue({
          code: 'custom',
          message: `step order must strictly increase: ${step.id} has order ${step.order}, expected > ${previousOrder}`,
          path: ['steps', position, 'order'],
        });
      }
      previousOrder = step.order;
    });
  });

export type PujaStepTemplateFile = z.infer<typeof pujaStepTemplateFileSchema>;

export function parsePujaStepTemplateFile(data: unknown): PujaStepTemplateFile {
  return pujaStepTemplateFileSchema.parse(data);
}

/** The steps a given duration variant includes, in order (§8.3/§8.4). */
export function stepsForVariant(puja: PujaCatalogItem, variant: PujaVariant): PujaStep[] {
  return puja.steps
    .filter((step) => step.variants === undefined || step.variants.includes(variant))
    .sort((a, b) => a.order - b.order);
}

/** Steps grouped by their §8.4 accordion section, in step order. */
export function stepsBySection(
  steps: readonly PujaStep[],
): { section: StepSection; steps: PujaStep[] }[] {
  return STEP_SECTIONS.map((section) => ({
    section,
    steps: steps.filter((step) => step.section === section),
  })).filter((group) => group.steps.length > 0);
}
