# Content review queue

Every ritual string in this repo is **data authored or approved by a named
pandit**, never invented by an engineer or a model (§0.3, §0.4). This file is
the running list of everything still waiting on that review.

## How to use it

- When you add content you cannot source, write the placeholder
  `"⟨TODO_PANDIT: some_id⟩"` in the JSON and add a row below.
- When a pandit approves a file, set its
  `review: { status: "APPROVED", reviewer, date }` block and delete the rows.
- **Gate (Phase 10): this table must be empty and every content file
  `APPROVED` before a production release.**

## Open items

| ID                                                   | File | What is needed | Raised | Owner |
| ---------------------------------------------------- | ---- | -------------- | ------ | ----- |
| _(none yet — content authoring starts in Phase 2/4)_ |      |                |        |       |

## Non-code dependencies started in Phase 0

These are not TODOs in a file; they are the long-lead items §10 says to start
now because the release cannot happen without them.

| Item                                              | Status         | Notes                                                       |
| ------------------------------------------------- | -------------- | ----------------------------------------------------------- |
| Identify the pandit (voice + content reviewer)    | ⬜ not started | Blocks Phases 2, 4, 5, 7 content and all production audio   |
| 30-minute pilot recording + voice approval        | ⬜ not started | Confirms the voice before booking studio time               |
| Book the full studio session (≈2–4 days)          | ⬜ not started | ≈250 enum audio tokens + mantras + instructions (§9.6)      |
| Written consent for voice use                     | ⬜ not started | Required before any recording ships                         |
| Separate consent for the name voice clone         | ⬜ not started | Names only; default remains self-recite (§9.6.1)            |
| `docs/reference/ui-reference.png` from the client | ⬜ **missing** | The 4-screen mockup; Phase 1 acceptance compares against it |
