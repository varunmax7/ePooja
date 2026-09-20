# Phase 1 screenshots

The gate for §10 Phase 1: the design system and the static screens, captured at
the three widths the plan names, at 100% and 130% Dynamic Type.

## Regenerating

```sh
pnpm --filter @epooja/mobile exec expo start --web   # in one shell
pnpm screens:capture                                 # in another
```

`tools/screens` drives headless Chrome over the DevTools protocol and writes
every file here. The manifest — which screens, which widths, which type scales
— is `tools/screens/src/screens.ts`, and it is unit-tested.

Web is not a shipping target (§2). It exists so the design system can be
rendered without a device farm: layout is Yoga on both, so a row that overflows
here overflows on a device, but the rasterisation is CanvasKit and a browser
text engine rather than Skia-on-Metal and CoreText. **Treat these as proof of
layout and hierarchy, not of pixels.**

## What is here

| File                           |                                      |
| ------------------------------ | ------------------------------------ |
| `<screen>-360x640.png`         | Small Android                        |
| `<screen>-390x844.png`         | iPhone 14 / 15                       |
| `<screen>-430x932.png`         | iPhone 15 Pro Max                    |
| `<screen>-390x844-type130.png` | the same screen at 130% Dynamic Type |

The four screens from the mockup — `today`, `profile`, `prepare`, `player` —
are the ones the acceptance check compares against the reference, and the ones
captured at 130%. `calendar`, `poojas`, `pooja-detail`, `recipe` and the
`components` gallery are captured at the three widths as well.

Dynamic Type is driven by the dev-only `?fontScale=` override in
`apps/mobile/src/lib/fontScale.ts`; on a device `useFontScale()` reads the real
OS text size. See `packages/ui/src/fontScale.ts` for why the app scales text
itself instead of leaving it to React Native.

## What the 130% pass caught

All four were fixed before these files were written:

- **`AngaBadge` pushed off the screen.** Two badges share a row, RN defaults
  `flexShrink` to 0, and the badge did not shrink — the nakshatram and masam
  icons were already clipped at 360 px before Dynamic Type entered it.
- **The anga labels sat under the curved header.** `CurvedHeader` paints its
  bottom bulge from an absolutely-positioned canvas, so it takes no part in
  layout; Today pulled its first row up into it. The overhang is now exported
  as `CURVE_OVERHANG` so no screen has to guess it.
- **The Chant Player's action prompt covered the transport controls.** The
  prompt floats over the scroller, and the scroller reserved no room for it, so
  Pause could not be reached at the bottom of the scroll — worse at 130%, where
  the prompt is taller. The prompt is now measured and its height added to the
  scroll padding.
- **The play coin cast a square shadow.** The Skia disc sits in a square
  `Pressable` that carried the elevation without a matching `borderRadius`.

One more, found at 360 px rather than at 130%: the calendar's last week had
four cells in a seven-column grid, so 27–30 spread evenly across the card
instead of sitting under S–W.

## Still open

- **No side-by-side comparison.** `docs/reference/ui-reference.png` has still
  not been supplied (see `docs/reference/README.md`), so the "same structure,
  palette, hierarchy" half of the acceptance is unjudged. These screenshots are
  the other half of that comparison, ready for whenever the mockup arrives.
- **60 fps on a mid-range Android is unverified.** The dial and disc animations
  are Skia + Reanimated on the UI thread, but this machine has no Android SDK
  or device, and a browser frame rate says nothing about one. Carry this into
  Phase 3, when the app first runs on hardware.
- Every ritual value on these screens is a `⟨TODO_PANDIT: …⟩` placeholder or a
  `PENDING_PANDIT_REVIEW` enum (§0.4). The long placeholders are why the anga
  values truncate here; real Telugu values are far shorter.
