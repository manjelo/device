# Primary source: Harris AN/PRC-152 data sheet DS-321D (06/2006)

File: `harris_datasheet.pdf` (project root), 2 pages, title "AN/PRC-152 Type 1 Multiband Multimission Handheld Radio Data Sheet", Harris RF Communications Division, copyright 2006. Text was extracted with `pdftotext`. This is the original AN/PRC-152, not the 152A. It is the first primary document for the original model that RadioSim could read. Everything below is **Verified-public-doc** (original model, as of June 2006).

## What it states

| Item | Datasheet value | RadioSim today | Status |
|---|---|---|---|
| Frequency range | 30 to 512 MHz | 30.000 to 512.000 MHz | Matches. Resolves the 512 vs 520 MHz conflict: 512 is the original's range. 520 and 762-870 MHz belong to the 152A. |
| Presets | 100 | 100 | Matches since the change from 99 (the 99 had come from secondary sources). |
| Tuning resolution | 10 Hz | `FREQ_STEP_HZ = 10` | Matches. Now Verified-public-doc, not Secondary-source. |
| Output power | 250 mW to 5 W (adjustable) | RF Power setting (simulated label only) | Range is verified. The LOW/MEDIUM/HIGH names remain Unknown. |
| Transmission modes | FM, AM, PSK, CPM | Not simulated | Unsupported by scope. |
| Waveforms | SINCGARS, VHF/UHF AM/FM, MIL-STD-188-181B, Havequick II, HPW | Shown as N/A | Unsupported by scope. |
| Crypto | Sierra II programmable module; fill via AN/CYZ-10 DTD | Shown as N/A | Unsupported by scope. |
| Key features | Full numeric keypad; NVG-compatible display; built-in speaker/mic; optional embedded GPS | Keypad and LCD drawn; speaker grille drawn | Keypad and display existence verified. |
| Antenna | 50 ohm TNC | Antenna connector drawn | Verified. |
| Audio connector | Six-pin standard | Top connector labelled U-229 (Crypto Museum) | Not contradicted. The datasheet does not say which connector is on top. |
| Dimensions | 2.5 W x 9.2 H x 1.7 D in with battery (about 63.5 x 233.7 x 43.2 mm) | Front body about 2.55:1 (height:width) | Datasheet ratio is about 3.7:1. The approved SVG geometry was not changed. |
| Weight | 2.4 lb with battery | Not shown | Verified, not displayed. |
| Battery | Rechargeable lithium-ion, included | Battery housing drawn | Verified. |
| Finish | CARC Green | Olive body | Consistent. |
| Interfaces | RS-232, RS-422, MIL-STD-188-114A; remote control USB, RS-232 | Not simulated | Unsupported by scope. |

## What it does not state

The datasheet says nothing about key legends, the OPT or PGM menus, menu paths, LCD layout, startup behavior, keypad lock, monitor, squelch, brightness, the dial labels, the power switch, or how PRE +/- work. So **every V5 menu and key behavior stays Secondary-source, Approximated, or Simulator-specific**. The operator manual (listed as "included" in the accessories) is still the missing document.

## Consequences for RadioSim

1. **Preset count.** Done: `PRESET_COUNT` is 100. Default preset n is at 30 MHz + 4.5 MHz x (n - 1), so preset 100 is 475.500 MHz.
2. **Band.** Keep 30.000 to 512.000 MHz. Review item m8 (512.000 vs 511.9999) is still open; the datasheet gives "30 to 512 MHz" without saying whether 512.000 itself is included.
3. **Tuning step.** Keep 10 Hz. The 1 kHz front-panel entry increment stays Simulator-specific.
4. **Proportions.** The datasheet's 2.5 x 9.2 in body is much narrower than the current front view. The user-approved SVG geometry was not changed. If the proportions are ever revisited, this is the primary source to use. A 63.5 mm wide body with battery would give the 224-unit front body a height of roughly 825 units.
5. **Docs that say the datasheet is blocked** (`docs/references.md` S7, `docs/visual-reference-front.md`, `docs/visual-accuracy-review.md` S7, `docs/device-research.md`, `docs/device-functionality-v5.md`) predate this file. The "blocked" wording there is out of date for the facts in this table.
