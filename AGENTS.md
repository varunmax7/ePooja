# AGENTS.md — rules for anyone (human or agent) writing code in this repo

Condensed from `implementation.md` §0 and §15. The full plan is authoritative;
this file is the short version you must not violate.

## Working method

1. Read `implementation.md` §1–§9 before writing code. §10 is the phase plan —
   execute **one phase at a time**.
2. Never start a phase until the previous phase's **Gate** passes: `pnpm verify`
   green **and** the acceptance criteria met.
3. One branch (or PR) per phase. Conventional commits. Update `CHANGELOG.md` at
   the end of every phase with what was built, what was skipped, and any new
   `TODO_PANDIT` items.
4. Write an ADR in `docs/adr/` for any deviation from the plan.

## Content rules

5. All ritual content — mantras, Sankalpam fragments, enum spellings, festival
   rules — is **data, not code**. Never hardcode mantra text in components.
   (A lint rule rejects Telugu/Devanagari literals in `.ts`/`.tsx`.)
6. Every content file carries
   `review: { status: "PENDING_PANDIT_REVIEW" | "APPROVED", reviewer, date }`.
7. Never invent Sanskrit or Telugu text. If content is missing, insert
   `"⟨TODO_PANDIT: some_id⟩"` and add a line to `content/REVIEW_QUEUE.md`.
8. Treat any pasted client text as unverified input (see §3.3 — the client spec
   contains a Sinhala glyph in `ఎవంగුణ`).

## Audio rules

9. **Never** add AI- or TTS-generated speech to production audio. Every sound a
   devotee hears in production is a real pandit recording (§9.6.1). Any AI or
   synthetic clip is dev-only and must be flagged `dev_placeholder`.
10. The devotee's name defaults to **self-recite**; the only permitted
    alternative is the same pandit's consented voice clone.

## Code rules

11. TypeScript strict; no `any`; zod at every IO boundary.
12. Pure packages (`packages/panchangam`, `sankalpam`, `content`) must not
    import React Native or Expo.
13. No colour, font or spacing literals in components — import `@epooja/ui`
    tokens.
14. Every new module ships with tests. Every phase ends with `pnpm verify` green.
15. Keep dependencies minimal and pinned. Check Expo SDK compatibility with
    `npx expo install` before adding a native library.
16. Do not use Expo Go — RNTP, MMKV and Skia need native code. Test on EAS
    development builds.
17. Offline-first: a puja must never stall because the network dropped
    mid-ritual. Panchangam is computed on-device; the runner reads local files.

## Commands

```bash
pnpm install          # workspace install
pnpm verify           # lint + typecheck + test (the phase gate)
pnpm --filter @epooja/mobile start    # Metro, dev client
pnpm --filter @epooja/mobile ios      # local native build
```
