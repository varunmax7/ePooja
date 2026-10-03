# Cue Tapper (§9.6)

A local, offline, dependency-free web page for authoring a chant clip's line
cues (`MantraLine.cue: { startMs, endMs }`) — §9.6's "`tools/cue-tapper`, a
local web page that plays the clip and records tap timestamps per line, then
exports JSON merged into the puja file."

## Use

1. Open `index.html` directly in a browser (no server, no build step).
2. Pick the chant clip (any audio file the browser can play).
3. Paste the step's line ids, one per line, in the order they're chanted
   (`content/pujas/*.json`'s `chant.lines[].id`, top to bottom).
4. Play the clip. Press **Space** (or the Tap button) the instant each line
   starts.
5. Once every line has a tap, **Export cues JSON** fills the output box.
6. Paste each line's `cue` object into the matching `MantraLine` in
   `content/pujas/*.json` by hand — this tool never writes to the repo
   itself, the same way `tools/content-build` never invents ritual text.

## Status (§10 Phase 6)

Built but **not exercised against a real recording** — §9.6 recording has
not started (no chant clip exists yet to tap against). The tap/undo/export
logic is plain, dependency-free JS and was checked by hand against a
synthetic audio file; it has not been used in anger, and the human-usability
question (can a reviewer actually tap accurately along with real Vedic
chanting?) is Phase 7's to answer once there is something real to try it on.
