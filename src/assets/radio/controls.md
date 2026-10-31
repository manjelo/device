# RadioSim control map (svg-designer, V4 final cleanup, original AN/PRC-152 layout)

Sources for the layout: USMC photo and Cryptologic Museum photo only. No AN/PRC-152A material is used.
Accuracy values: Verified-photo, Secondary-source, Assumed, Unknown (docs/accuracy-matrix.md).
No control is marked Verified.
SVG root: viewBox width 340 units for every view. At a 340 px render, 1 unit = 1 px. At 375 px, the scale is 1.10.

Rule (V4): every control is a visible shape. No transparent hit target exists on a view without a visible control beside it.
`src/components/radioSvg.test.ts` enforces this for all four views.

| ControlId | Type | View | Accuracy | Notes |
|---|---|---|---|---|
| `power` | button | top | Assumed | V4: visible push button at the left end of the top, with a power glyph. Placement is ASSUMED (Unknown on the real radio). Moved from the front view. Behaviour is Assumed in the app (radio README). |
| `knob-volume` | knob | top | Assumed | V4: visible knob at the right end, upper. Placement ASSUMED. Moved from the front view. No legend is drawn: the real markings are not known. |
| `knob-squelch` | knob | top | Assumed | V4: visible knob at the right end, lower. Placement ASSUMED. Moved from the front view. No legend is drawn: the real markings are not known. |
| `keypad-1` | key | front | Secondary-source | V4: grid row 1, column 1 (4 rows x 4 columns from spec items 8-10). Legend from standard telephone layout. |
| `keypad-2` | key | front | Secondary-source | V4: grid row 1, column 2. Same as above. |
| `keypad-3` | key | front | Secondary-source | V4: grid row 1, column 3. Same as above. |
| `keypad-4` | key | front | Secondary-source | V4: grid row 2, column 1. Same as above. |
| `keypad-5` | key | front | Secondary-source | V4: grid row 2, column 2. Same as above. |
| `keypad-6` | key | front | Secondary-source | V4: grid row 2, column 3. Same as above. |
| `keypad-7` | key | front | Secondary-source | V4: grid row 3, column 1. V5: on the main screen it opens the OPT menu (secondary function from the ACRE2 game-mod page; the legend is not drawn). |
| `keypad-8` | key | front | Secondary-source | V4: grid row 3, column 2. V5: on the main screen it opens the PGM menu (same source and caveat). |
| `keypad-9` | key | front | Secondary-source | V4: grid row 3, column 3. Same as above. |
| `keypad-star` | key | front | Unknown | V4: grid row 4, column 1. Legend `*` from standard telephone layout; the placement is not confirmed. |
| `keypad-0` | key | front | Secondary-source | V4: grid row 4, column 2. Same as above. |
| `keypad-hash` | key | front | Unknown | V4: grid row 4, column 3. Legend `#` from standard telephone layout; the placement is not confirmed. |
| `keypad-clear` | key | front | Assumed | V5: column 4, row 1 (moved up from row 3). Placement and legend `CLR` UNCERTAIN (spec item 11; photo does not resolve legends). |
| `keypad-enter` | key | front | Assumed | V5: column 4, row 2 (moved up from row 4). Placement and legend `ENT` UNCERTAIN (spec item 11). Column 4 rows 3 and 4 are the preset keys (below). |
| `keypad-preset-up` | key | front | Assumed | V5: column 4, row 3. Legend `+` with a small `PRE` (from a photo crop). Steps the preset by +1, clamped 1..100 (same as the channel knob). Placement ASSUMED. |
| `keypad-preset-down` | key | front | Assumed | V5: column 4, row 4. Legend `−` only. Steps the preset by -1. The `−` legend is from the request, not verified. Placement ASSUMED. |
| `lcd-area` | display | front | Unknown | V4: window at spec item 7 (x 0.17-0.88, y 0.30-0.37). Not a control (role img). Contents drawn by React (inset on the face and LCD panel). |
| `knob-channel` | knob (rotary dial) | top | Verified-photo | Rotary function selector on the top, labelled SCAN, 1-5, S, F, Z, R (Cryptologic Museum photo). Dial-to-channel mapping is Unknown. |
| `antenna` | connector | top | Secondary-source | Centre-rear (both photos). TNC, 50 ohm from S5. Connector type is not shown in the photos. Not a control (role img). |
| `conn-top` | connector | top | Secondary-source | Left of the dial, black dust cap (Cryptologic Museum photo). U-229 type from S4. Which connector it is, is ASSUMED. Not a control (role img). |
| `ptt` | switch | left | Assumed | Upper front-left, black protrusion. Placement is ASSUMED and consistent with the Cryptologic Museum photo. Not confirmed as PTT. |

## Removed in V4

- `fn-1`..`fn-4` (formerly hidden with display:none, still carrying data-control, role and tabindex). No source supports FN keys. Removed from front.svg so no invisible control remains in the DOM. The ids stay in `CONTROL_LABEL` and `CONTROL_ACCURACY` so the types stay valid.
- Front-view transparent hit targets for `power`, `knob-volume` and `knob-squelch`. Replaced by visible controls on the top view.

## Counts per view

- front.svg: 17 control ids (16 keys, including `keypad-clear`, `keypad-enter`, `keypad-preset-up` and `keypad-preset-down`; plus `lcd-area`, which is not a control).
- left.svg: 1 control id (`ptt`).
- right.svg: 0 control ids (`side-panel` is decorative, no id).
- top.svg: 6 control ids (`power`, `knob-channel`, `knob-volume`, `knob-squelch`, `antenna`, `conn-top`). Four are interactive (buttons and knobs).

Total: 24 live control ids. Interactive (button or slider): 16 front + 1 left + 4 top = 21. `ControlId` also lists `fn-1`..`fn-4`, which are not drawn.

Non-control decoration (no control id): front speaker grille, antenna stub, battery block, label plate; top second connector with cap; right side panel with holes; grip grooves on left and right.

## Assumed or Unknown

Counts follow `CONTROL_ACCURACY` in `src/radio/controls.ts` (the single source for accuracy), for the 24 live control ids:

- Assumed (8): `power`, `ptt`, `knob-volume`, `knob-squelch`, `keypad-clear`, `keypad-enter`, `keypad-preset-up`, `keypad-preset-down`.
- Unknown (3): `keypad-star`, `keypad-hash`, `lcd-area`.
- Verified-photo (1): `knob-channel`. Existence and placement only.
- Secondary-source (12): `keypad-0` to `keypad-9`, `antenna`, `conn-top`.

Where this table and `controls.ts` disagree, the code wins and this table needs a fix. The V4 pass aligned the rows for `ptt`, `conn-top`, `keypad-star` and `keypad-hash` to the code; their accuracy values were not changed in the code.

## Hit areas

Every interactive control has a visible shape and a `.hit` shape of at least 44 units in both dimensions. The test in `radioSvg.test.ts` checks this.
Smallest: 44 units (`power`, `knob-volume`, `knob-squelch` hit circles r=22, `keypad-*` keys 44 x 44).

## Layout notes

- Front (V4): body is 260 x 572 units (about 2.2:1), per the USMC photo. Grille, then LCD, then 4x3 keypad, then clear/enter row, then label plate, then battery block.
- Top (V4): dial at centre-front, labels on a 270 degree arc, antenna at centre-rear, one connector left of the dial and one right of it. Power at the left end. Volume and squelch knobs at the right end.
- Left (V3): PTT is a protrusion at the upper front-left.
- Right (V3): recessed panel with holes is decorative only.
- The black latch at lower right (Cryptologic Museum photo) is not drawn: no control and not requested.
