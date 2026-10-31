# RadioSim V3 - Visual accuracy review (original AN/PRC-152)

Scope: the four SVG views (front, left, right, top) compared against the original Harris AN/PRC-152 evidence. Not the AN/PRC-152A, not TRI replicas, not airsoft.

This review does not claim exact replication. Automated tests check the simulator's behaviour, not its resemblance to the device.

## Evidence used

| ID | Source | Access | Used for |
|---|---|---|---|
| S10 | Wikimedia Commons, "Harris PRC-152 multiband radio" (National Cryptologic Museum, caption "Voice encryptor", CC BY-SA 4.0) | Image inspected at full resolution (3024 x 4032) | Top dial, top connectors, antenna, front grille and keypad, side panel, latch |
| S11 | Wikimedia Commons, "AN/PRC-152 handheld radio" (USMC student handout, public domain) | Image inspected (253 x 485, low resolution) | Antenna, grille, LCD placement, keypad grid, battery block |
| S20 | szpzl-zegrze.waw.pl unit museum page | Text only (Polish) | Frequency bands and modes, not physical layout |
| S7 | Harris original datasheet (tcpremier.l3harris.com) | BLOCKED: DNS failure | Not used |
| S21, S22 | Army handbook and Falcon III student guide (studylib) | BLOCKED: 429 and 403 | Not used |

Model identity for S10 and S11 rests on the museum and Commons captions. The device's own model marking is not legible in either photo.

## Screenshots

All captures are in `docs/screenshots/v3/`, produced by `e2e/screenshots.spec.ts`.

| View | Desktop (1280 x 800) | Mobile (375 x 812) |
|---|---|---|
| Front (after startup) | `front-desktop.png` | `front-mobile.png` |
| Front (startup frame) | `front-desktop-startup.png` | `front-mobile-startup.png` |
| Left | `left-desktop.png` | `left-mobile.png` |
| Right | `right-desktop.png` | `right-mobile.png` |
| Top | `top-desktop.png` | `top-mobile.png` |

Corrected front view (desktop): `docs/screenshots/v3/front-desktop.png`

## 1. Confirmed visual matches

These features are visible in the photos and are now drawn in the same place.

| Feature | Original evidence | Simulator | Status |
|---|---|---|---|
| Rotary function dial on top, with SCAN and 1-5, S, F, Z, R labels | S10 | `knob-channel` on top view, labels drawn | Verified-photo (existence, placement, legible labels) |
| Whip antenna at top centre-rear | S10, S11 | `antenna` on top view | Verified-photo (position) |
| Two round connectors with caps flanking the dial | S10 | `conn-top` (one id) plus a decorative second connector | Verified-photo (two connectors); which one is U-229 is Unknown |
| Perforated speaker grille at upper front | S10, S11 | Front grille, no control id | Verified-photo |
| Wide, short LCD below the grille | S11 (low resolution) | `lcd-area` below grille | Verified-photo (position); size and resolution Unknown |
| Keypad of about 4 rows by 3 columns below the LCD | S11 | 3 x 4 digit grid, then CLR and ENT | Verified-photo (grid count); key labels other than digits Unknown |
| Battery block at the bottom | S11 | Non-control battery block | Verified-photo (position); capacity Unknown |
| Right-side recessed panel with holes | S10 | Non-control `side-panel` group on right view | Verified-photo (position); function Unknown |

## 2. Corrected discrepancies

Each row lists what changed from the V2 model and the evidence for it.

| Correction | V2 model | V3 model | Evidence |
|---|---|---|---|
| Function dial location | Channel knob on the front face | Dial on the top edge | S10 |
| Antenna location | Top, off-centre | Top, centre-rear | S10, S11 |
| Top connectors | One connector | Two capped connectors flanking the dial, `conn-top` on one | S10 (S4 describes a single U-229; conflict noted) |
| FN1 to FN4 keys | Four keys on the front | Removed from the visible front; ids kept, hidden with `display:none` | No accessible source supports them |
| Keypad grid | 4 x 4 grid with FN keys in column 4 | 3 x 4 digit grid, CLR and ENT in the bottom row | S11 (about 4 rows by 3 columns) |
| LCD position | Centre of front face | Below the speaker grille | S11 |
| Speaker grille | Not drawn as a grille | Perforated grille at upper front | S10, S11 |
| PTT placement | Left side, middle height | Upper front-left, near the black protrusion in S10 | S10 (placement Unknown; left-side placement withdrawn) |
| Body proportion | Wider body | Narrower body, about 2.2:1 height to width at the front | S11 |
| Battery | Not drawn | Block at the bottom, non-control | S11 |

Logic change that goes with the layout: ENT on the main screen with an empty entry buffer opens the placeholder menu, since FN keys no longer exist. This is a simulator path, labelled Assumed. It is not documented device behaviour.

## 3. Remaining approximations

| Item | Status | Why it is approximate |
|---|---|---|
| Body outline (rounded rectangle, grey gradient) | Approximation | No outline drawn from a measured source; the photos show a more angular shape |
| Overall dimensions and aspect ratio | Approximation | Datasheet blocked; only the photo proportion is used |
| Volume and squelch knobs on the left of the front | Assumed | No photo shows them clearly |
| PTT location | Unknown, placed as Assumed | Only a black protrusion in S10 suggests a location |
| Key labels `*` and `#` | Unknown | Standard keypad labels used; no legible evidence |
| CLR and ENT key labels | Unknown | Generic labels |
| Dial position meanings | Unknown | Only SCAN, 1-5, S, F, Z, R are legible; the 99-preset mapping is simulated |
| Cipher switch | Unknown | Not visible in the photos |
| Latch at lower right (S10) | Not drawn | Function Unknown |
| Right-side panel function | Unknown | Drawn as decoration only |
| Top connector pin behaviour | Unknown | No pin-level source |
| Upper frequency limit | Conflict | 511.9999 MHz (S20), 511.99 MHz (S3), 512.000 MHz (S4, S5, S9); the simulator keeps 512 MHz |
| Power button icon and location | Assumed | Not documented |
| LCD contents | Simulated | React panel shows placeholder frames; device LCD layout Unknown |
| Colours, shading, and screen-door key texture | Approximation | Not from a colour source |

## 4. Evidence per correction (summary)

- Dial, antenna, top connectors, grille, keypad, battery and side panel: S10 full-resolution photo, read by inspection. Confirmed by eye, not by measurement.
- LCD position and keypad grid count: S11 low-resolution photo. Confirmed by eye.
- FN key removal: absence of any source that shows or describes them. Recorded as Unknown in the accuracy matrix.
- Frequency-related text on the device: S20 text only.

## 5. Not claimed

- Exact replication of dimensions, colour, shape, or key labels.
- Any control placement marked Unknown or Assumed in `src/assets/radio/controls.md`.
- Device behaviour of the dial or keypad beyond the legible labels.
- That the simulator's startup, menu, or LCD matches device firmware. These remain simulated placeholders.
