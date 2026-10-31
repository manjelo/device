# Visual reference spec: AN/PRC-152 (original Harris) front view

Author: orchestrator, from direct inspection of the enlarged USMC photo (`AN_PRC-152.jpg`, 253 x 485 px, front and side) and the S10 Cryptologic Museum photo (`Harris_PRC-152_multiband_radio.agr.jpg`, 3024 x 4032 px). The radio-researcher subagent could not read the images in its run (no Bash for crops), so this spec was produced directly. Crops used: `scratchpad/refs/crops/usmc_x3.png`, `scratchpad/refs/crops/s10_front_face.png`.

No AN/PRC-152A, TRI, or airsoft evidence is used. The Harris datasheet and the studylib manuals are blocked (see `docs/references.md`).

## Coordinate system

All positions are fractions of the **front body width** (x, from 0 at the left edge to 1 at the right edge) and the **front body height** (y, from 0 at the top edge of the main housing to 1 at the bottom of the battery). The top connectors and dial sit above y = 0.

Measured body (USMC photo, front object): width ~330 px; main housing from y = 0 to y ~ 0.65 of the total front height; battery block from y ~ 0.65 to 1.0. Battery is about 35% of front height.

## Status key

- **CONFIRMED**: visible in the photo at the resolution used.
- **UNCERTAIN**: visible but the detail is unclear.
- **NOT VISIBLE**: not in the photos.

## Items

| # | Feature | Position and size (fractions) | Status | Notes |
|---|---|---|---|---|
| 1 | Body silhouette | Rectangle, width 1.0, height 1.0 of the main housing plus battery. Slight taper in the upper third | CONFIRMED (rectangular, squared corners with a small radius) | Corner radius small, about 0.03 of width. Not a generic rounded handheld |
| 2 | Finish | Olive green, mid-tone, matte | CONFIRMED | Flat olive, slight tonal variation only |
| 3 | Speaker grille | x 0.30 to 0.86, y 0.08 to 0.23 | CONFIRMED (position and perforated pattern) | Round holes, staggered rows: about 5 rows of 4 to 5 holes. Pattern roughly centred on the upper front |
| 4 | Side dots near grille | Left x ~0.20, right x ~0.86, y ~0.19 | UNCERTAIN | Small round holes or marks beside the grille |
| 5 | HARRIS word mark | x 0.14 to 0.36, y 0.06 | CONFIRMED | Small white logo, upper-left above the grille |
| 6 | MULTIBAND text | x 0.68 to 0.86, y 0.27 | CONFIRMED | Small white text below the grille |
| 7 | LCD | x 0.17 to 0.88, y 0.30 to 0.37 | CONFIRMED (wide, short, recessed green panel) | Size fraction: about 71% of width, 7% of height. Green-tinted screen with a bezel |
| 8 | Keypad housing | x 0.18 to 0.86, y 0.42 to 0.61 | CONFIRMED (recessed dark panel) | Keypad occupies the full housing |
| 9 | Keypad grid | 4 columns, 4 rows visible | CONFIRMED for 4 rows; the right column is partly UNCERTAIN | Top two rows show 4 keys each. Bottom two rows show 3 keys plus a larger key at the right. Count of the right-column keys is UNCERTAIN |
| 10 | Key shape | Rounded rectangles with a raised face | CONFIRMED | Keys are small compared with the body width. Each key about 0.14 of width and 0.11 of the keypad height |
| 11 | Key legends | Not legible at this resolution | UNCERTAIN (legend text not resolvable) | Do not draw legends that cannot be read. Use the standard numeric layout only as a documented secondary source |
| 12 | Battery block | x 0.0 to 1.0, y 0.65 to 1.0 | CONFIRMED | Same width as the body. Takes about 35% of front height |
| 13 | Battery seam | Horizontal seam at y ~0.645 | CONFIRMED | Thin step between housing and battery |
| 14 | Battery latch | Dark recess at x 0.31 to 0.90, y 0.65 to 0.68 | UNCERTAIN | Appears as a dark slot under the keypad housing |
| 15 | Top connectors | Above the body at y -0.15 to 0, x 0.25 (round, silver-ringed), x 0.45 (dial), x 0.80 (round, black cap) | CONFIRMED | Three items along the top edge in the USMC photo. Drawn on the top view, not the front |
| 16 | Antenna | Above the body, centre-rear | CONFIRMED | Black rubber whip. Drawn on the top view |
| 17 | Power button | None visible on the front | NOT VISIBLE | No authentic evidence. Remove the visible glyph. Keep only an invisible hit target for `power` (decision in controls.md) |
| 18 | Side knobs (volume, squelch) | Not visible on the front face | NOT VISIBLE | Remove the protruding circles from the front |
| 19 | SIM MODEL badge | Not on the radio | NOT VISIBLE | Remove |
| 20 | Side view (USMC left object) | Side has a rounded black rocker about x 0.45 to 0.65, y 0.25 to 0.34, and a smaller black button above it | CONFIRMED (side), UNCERTAIN (function) | Drawn on the left view in a later pass, not the front |

## Harness notes

- Knob hit-target placement was widened from the spec's 0.30 and 0.36 pitch so the hit areas do not overlap (SVG agent decision; see Deviations).
- Use these fractions as the design, scaled to the viewBox (width 340). The front body is about 260 units wide.
- Do not invent features outside this table.
- Items marked UNCERTAIN are drawn only as the simplest shape that the photo supports, and must be labelled `<!-- UNCERTAIN -->` in the SVG.

## Deviations

Made in `src/assets/radio/front.svg` (V4) to meet the 44-unit touch target rule. Each one departs from the table above.

1. **Keypad housing height (item 8).** Spec: y 0.42 to 0.61 (about 109 units at a 572-unit body). Drawn: 176 units tall, from y 280 to 456. Reason: four keys with 44-unit hit cells need 176 units. Key faces are 36 x 30 units. The spec figure of 0.11 of keypad height would give about 12 units, which is too small.
2. **Battery block (item 12).** Spec: y 0.65 to 1.0 (about 35 percent of height). Drawn: y 462 to 612 (about 26 percent). Reason: the enlarged keypad moves the battery down. The body stays inside the 630-unit viewBox.
3. **Knob hit targets (item 18).** Spec: knobs are not visible on the front. Drawn: two invisible 44 x 44 hit targets on the left edge, at y 174 to 218 (volume) and y 222 to 266 (squelch). Reason: the React side needs focusable, named slider controls. The spec fractions (0.30 and 0.36) would overlap at 44 units, so the pitch is widened.
4. **Power hit target (item 17).** Spec: no visible power control. Drawn: an invisible 44-unit hit target at the top-right corner. The position is a placeholder, not a spec position.
