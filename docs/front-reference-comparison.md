# Front view: authentic reference vs RadioSim SVG

Images:
- Desktop comparison: `docs/screenshots/v3/front-comparison-desktop.png` (captured after the rebuild) (left: USMC reference, right: SVG at common height)
- Mobile comparison: `docs/screenshots/v3/front-comparison-mobile.png`
- SVG alone: `docs/screenshots/v3/front-svg-desktop.png`, `docs/screenshots/v3/front-svg-mobile.png`
- Full-page captures: `docs/screenshots/v3/front-desktop.png`, `docs/screenshots/v3/front-mobile.png`

Reference: `AN_PRC-152.jpg` (USMC, 253 x 485 px, low resolution), front object only. Spec: `docs/visual-reference-front.md`.

These are visual comparisons, not measurements. The reference is low resolution. Claims of exact proportion are estimates.

## Confirmed matches

| Feature | Reference | RadioSim |
|---|---|---|
| Speaker grille at upper front | Perforated grille, upper third | Perforated grille, upper third |
| HARRIS mark | Upper left, above grille | Upper left, above grille |
| LCD below grille | Wide, short, recessed | Wide, short, recessed (contents drawn by React) |
| Keypad below LCD | 4 rows, recessed housing | 4 rows x 4 columns, recessed housing |
| Battery at bottom with seam | Separate block with seam | Separate block with seam |
| Olive green finish | Olive, matte | Flat olive (#556347, an estimate sampled by eye, not measured) |

## Remaining differences

| Area | Reference | RadioSim | Effect |
|---|---|---|---|
| Body width-to-height | Narrow: roughly 0.3 of total height (estimate) | Wider: roughly 0.45 (estimate) | RadioSim looks squatter |
| Silhouette | Stepped: narrower top cap, slight waist above battery | Straight with slight taper at the top | Missing the step |
| Speaker grille | Staggered, about 5 rows, holes smaller relative to grille | Staggered rows of 5, 4, 5, 4, 5 dots | Hole size and spacing approximate |
| LCD | Green-tinted, light, with text rows | Dark green-grey window | Colour and tone differ |
| Keypad keys | Small raised keys, dark housing, legends not resolvable | Larger light keys with digits 1-9, *, 0, # | Key size and legends differ |
| Keypad column 4 | Right column has a tall key, count uncertain | Two inert keys above CLR and ENT | Uncertain in reference |
| Key legends | Not legible | Digits and *, #, CLR, ENT | Legends are not verified |
| Battery share of height | About 35 percent (estimate) | About 26 percent (after the keypad enlargement) | Battery looks smaller |
| Battery latch | Dark recess near the top of the battery (UNCERTAIN in the spec) | Dark bar at the top of the battery | Existence and shape not confirmed |
| Top connectors and antenna | Above the body at the top of the front view | Not on the front view (on the top view) | Documented; view split |
| Side dots near grille | Small holes or marks, left and right (UNCERTAIN in the spec) | One left dot, one right dot | Existence and position not confirmed |
| Power and side knobs | No visible power button or protruding knobs | Invisible hit targets only | No visible difference from the reference |

## Deviations from the spec (documented)

- Keypad housing enlarged vertically so every key row has a 44-unit hit cell, as the accessibility rule requires. This makes the keypad taller than the reference proportion.
- Battery compressed to about 26 percent of height (spec: 35 percent), to fit the taller keypad.
- Keypad keys are drawn with digit legends and CLR and ENT text. The spec marks legends UNCERTAIN; these are kept for usability and are not verified legends.
- Knob hit targets are invisible rectangles, placed wider apart than the spec's fractions so that they do not overlap.

## Not claimed

- Exact proportions, colours, or key sizes.
- Legibility of key legends. The reference does not resolve them.
- Any control placement marked UNCERTAIN in `src/assets/radio/controls.md`.
