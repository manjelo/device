# Research v5: Basic operation of the original Harris/L3Harris AN/PRC-152

Scope: original AN/PRC-152 only (not AN/PRC-152A). Interface-only simulator; no RF, COMSEC, key loading, hopping, or networking.
Research date: 2026-10-25.

**Important caveat.** No primary document for the original model (L3Harris datasheet, operator manual, or Army/Marine technical manual) could be read. Every row below is therefore `Secondary-source` or `Unknown`. No row is `Verified-public-doc`. Quotes marked "(fetch summary)" are the text as returned by the WebFetch summarizer, not raw source text; re-check them against the source before quoting them in the simulator UI.

---

## 0. Source access

### Retrieved (readable text)

| URL | Retrieved | Model covered | Notes |
|---|---|---|---|
| https://en.wikipedia.org/wiki/AN/PRC-152 | 2026-10-25 | Mixed; cites an A-model datasheet | General description, "Full Numeric Keypad", "NVG Compatible Display", presets 99, frequency range. Infobox and body disagree on range. |
| https://www.cryptomuseum.com/radio/prc152/ | 2026-10-25 | Specs labelled AN/PRC-152A | Description ("military tactical handheld VHF/UHF radio transceiver with built-in COMSEC"), "U-229 receptacle" at top, dimensions and weight. |
| https://acre2.idi-systems.com/wiki/radios/an-prc-152 | 2026-10-25 | AN/PRC-152 (original name) | ACRE2 game-mod documentation. Describes in-game emulation, not hardware. Used only as Secondary-source. |
| https://docs.rhsmods.org/rhs-status-quo-user-documentation/arma-reforger/rhs-status-quo/blufor/gadgets/an-prc-152 | 2026-10-25 | Game model | Arma Reforger mod documentation. Game behavior only. |

### Not retrieved (blocked, empty, or unreadable)

| URL | Result |
|---|---|
| https://studylib.net/doc/26288460/prc-152-manual (requested primary reference) | Page loaded but only the title and an embedded base64 image. No readable text. |
| https://tcpremier.l3harris.com/pdf/datasheets/AN-PRC-152.pdf (requested datasheet) | DNS failure (`getaddrinfo EAI_AGAIN`) on two attempts. |
| https://studylib.net/doc/27578467/b191716-communication-equipment ("AN/PRC-152 Radio Operations Training Manual") | Embedded base64 image only. No readable text. |
| https://studylib.net/download/27578467 | HTTP 403. |
| https://www.trngcmd.marines.mil/Portals/207/Docs/TBS/B180231XQ-B280385%20Communications%20Equipment%20I%20and%20II.pdf (USMC Basic School) | HTTP 403. |
| https://www.trngcmd.marines.mil/Portals/207/Docs/FMTBE/Student%20Materials/FMST/Block3/FMST%20306.pdf | HTTP 403. |
| https://www.trngcmd.marines.mil/Portals/207/Docs/FMTBE/Student%20Materials/MCECST/MCT-COMM-1003_4%20Radio%20Communications.doc | HTTP 403. |
| https://www.zsis.hr/UserDocsImages/Sigurnost/pdfs/AN_PRC-152.pdf (titled "AN/PRC-152 Type-1 Multiband Multimission Handheld Radio") | Fetched as binary PDF. No extractable text (compressed streams). The fetch tool saved the binary to a local tool-results path; it was not executed. |
| https://www.globalsecurity.org/military/library/report/call/call_10-33.pdf | HTTP 402. |
| https://internal-mongodb.champds.com/archive-ga-23-05/an-prc-152-manual.pdf | Not fetched. Suspicious host; a search summary called it unreliable. |

### Seen only as search snippets (not opened; not used for classification)

- L3Harris AN/PRC-152A sell sheet (2026-08 PDF) and product pages. These cover the A-model. The snippet lists A-model function knob settings (Off, presets 1-5, scan, front panel, Z-All, PT, LD & CT). Excluded from original-model rows.
- TRI/TCA/AR-152 replica guides and TRI quick reference. Excluded (replicas).
- Harris PRC-150 operator materials. Different radio. Excluded.

---

## 1. Power-on and shutdown

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Hardware power control (button, switch, or knob) on the original | No retrieved source names a hardware power control for the original model. | (none) | Unknown |
| Power off via the top function switch in leftmost position | ACRE2: "It also turns the radio off: 'placing the switch in the left most position.'" (fetch summary). Game emulation. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod; not hardware) |
| Power on by rotating the top knob | RHS: "By rotating this knob you will be able to turn on the radio and set it to custom channel." (fetch summary). Game emulation. | https://docs.rhsmods.org/rhs-status-quo-user-documentation/arma-reforger/rhs-status-quo/blufor/gadgets/an-prc-152 | Secondary-source (game mod; not hardware) |
| Startup screen, text, and timing | No source. | (none) | Unknown |
| What survives power cycling (saved settings) | ACRE2: "Operational changes to a radio are erased when the current channel is changed, unless auto-saving is on." (fetch summary). Game emulation; the auto-save feature is not confirmed on hardware. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod; not hardware) |

---

## 2. Physical keypad

| Key or function | What the source says | Source URL | Classification |
|---|---|---|---|
| Numeric keys 0-9 | Wikipedia Key Features list: "Full Numeric Keypad" (cited to a PRC-152A datasheet). ACRE2: "Numerical values are entered with the number pad." | https://en.wikipedia.org/wiki/AN/PRC-152 ; https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (model caveat: Wikipedia cites the A datasheet) |
| Layout of the numeric keys (3x3 plus 0) | No source gives a layout for the original. | (none) | Unknown |
| `*` and `#` keys | No source mentions these keys or their functions. | (none) | Unknown |
| CLR | ACRE2: "CLR will take you back at any time." (fetch summary). | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| ENT | ACRE2: "ENT is generally used for saving values." (fetch summary). | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| PRE + and PRE - | ACRE2: "Click PRE +/- to change between channels." (fetch summary). | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Navigation arrows (UP/DOWN, LEFT/RIGHT) | ACRE2: "Menus and items are navigated with either the UP-DOWN or LEFT-RIGHT arrows." (fetch summary). Whether these are physical keys is not stated. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source for function; physical presence Unknown |
| OPT | ACRE2: "All operational programming modes are accessible through pressing 7-OPT button." (fetch summary). The "7" numeric label is a game-mod detail. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| PGM | ACRE2: "Press PGM, select System Preset Settings, select System Presets, use UP/DOWN..." (fetch summary). The same page also gives "8-PGM" for the PGM key. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod); hardware label Unknown |
| Light / backlight key | No source. | (none) | Unknown |
| Lock key or lock sequence | No source for the original. | (none) | Unknown |
| Key positions on the face (rows, columns) | No source gives layout. | (none) | Unknown |

Note: the ACRE2 key numbers (7 = OPT, 8 = PGM) and the arrow/CLR/ENT behavior are in-game emulation. Do not present them as hardware facts. A search snippet attributed PGM to key 8 and OPT to key 7 in Army training material. That document was not opened, so it stays Unknown.

---

## 3. Main operating screen and LCD

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| LCD exists | Wikipedia Key Features: "NVG Compatible Display" (cited to a PRC-152A datasheet). | https://en.wikipedia.org/wiki/AN/PRC-152 | Secondary-source (model caveat) |
| Display size, resolution, colour, type | No source. | (none) | Unknown |
| Main-screen contents (preset number, channel name, frequency, battery, indicators) | RHS: "Showing you the current radio settings and choose frequencies." (fetch summary). Game mod; no field-level detail. | https://docs.rhsmods.org/rhs-status-quo-user-documentation/arma-reforger/rhs-status-quo/blufor/gadgets/an-prc-152 | Secondary-source (game mod); field layout Unknown |
| Volume shown on LCD when changed | ACRE2: "The volume setting will be displayed on the LCD screen when you use this button." (fetch summary). | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |

---

## 4. LCD navigation and menu hierarchy

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| OPT menu entry | ACRE2: "All operational programming modes are accessible through pressing 7-OPT button." (fetch summary). | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| OPT submenu names | Not given. | (none) | Unknown |
| PGM menu entry and path | ACRE2: "Press PGM, select System Preset Settings, select System Presets, use UP/DOWN to navigate the preset to modify." (fetch summary). | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| PGM submenu names beyond "System Preset Settings" and "System Presets" | Not given. | (none) | Unknown |
| Number of menu positions | RHS: "AN / PRC 152 has as of right now 9 menu positions which will be described below" (fetch summary). The positions are not in the extracted text. | https://docs.rhsmods.org/rhs-status-quo-user-documentation/arma-reforger/rhs-status-quo/blufor/gadgets/an-prc-152 | Secondary-source (game mod); names Unknown |
| Selection (move between items) | ACRE2: UP/DOWN or LEFT/RIGHT arrows navigate menus and items. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Editing a value | ACRE2: "Numerical values are entered with the number pad, clicking left and right to navigate the digit." (fetch summary). | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Exit or back | ACRE2: "CLR will take you back at any time." | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Save | ACRE2: "ENT is generally used for saving values." | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Full menu tree | No source. | (none) | Unknown |

---

## 5. Frequency entry and tuning

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Frequency range (general) | Wikipedia General: "Frequency Range: 30 to 511.99 MHz". The Wikipedia infobox gives "30-520 MHz" and "762-870 MHz". The two disagree; the article does not state which applies to the original. | https://en.wikipedia.org/wiki/AN/PRC-152 | Secondary-source (conflicting within source) |
| Frequency range (spec table) | Crypto Museum spec list: "30-512 MHz", under "Designator AN/PRC-152A". | https://www.cryptomuseum.com/radio/prc152/ | Secondary-source (A-designator) |
| Tuning resolution | Wikipedia: "Tuning Resolution: 10 Hz". Crypto Museum spec list: "Step size: 10 Hz", under the A designator. | https://en.wikipedia.org/wiki/AN/PRC-152 ; https://www.cryptomuseum.com/radio/prc152/ | Secondary-source (A-model caveat) |
| Entering a frequency from the keypad | ACRE2 game mod: number pad entry; left/right to move between digits. No note on digit count or validation. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod); digit rules Unknown |
| Confirming an entry | ACRE2: ENT "generally used for saving values." | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Cancelling an entry | ACRE2: CLR "will take you back at any time." | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Out-of-range handling | No source. | (none) | Unknown |

---

## 6. Preset selection

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Number of presets | Wikipedia: "Presets: 99". Crypto Museum spec list: "Presets: 99" (A designator). | https://en.wikipedia.org/wiki/AN/PRC-152 ; https://www.cryptomuseum.com/radio/prc152/ | Secondary-source (A-model caveat) |
| Selecting a preset with PRE +/- | ACRE2: "Click PRE +/- to change between channels." | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Selecting presets with the top dial | RHS: "By default 152 will have 5 presets that each will be assigned to corresponding knob position" (fetch summary). ACRE2 gives 6: "cycle between the 1st 6 preset channels" via the function switch. The two game mods disagree (5 vs 6). | https://docs.rhsmods.org/rhs-status-quo-user-documentation/arma-reforger/rhs-status-quo/blufor/gadgets/an-prc-152 ; https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Unknown for hardware (sources conflict; both game mods) |
| Preset numbering format (for example 01-99) | A search snippet of Marine Corps material said "numbered 01-99". That document was not opened. | (search snippet only) | Unknown |
| How preset names are shown | No source. | (none) | Unknown |
| Whether an operational change is kept when switching presets | ACRE2: "Operational changes to a radio are erased when the current channel is changed, unless auto-saving is on." | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |

---

## 7. Volume

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Volume control type (knob, switch, or button) | ACRE2 describes click-to-adjust in the game UI: "Left clicking on this will increase the volume, while right clicking will decrease the radio volume." (fetch summary). Hardware control type not stated. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source for game UI; hardware Unknown |
| Volume range or steps | No source. | (none) | Unknown |
| Temporary volume display on LCD | ACRE2: "The volume setting will be displayed on the LCD screen when you use this button." | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Volume knob on the top face | No source confirms a volume knob on the original. | (none) | Unknown |

---

## 8. Monitor and squelch

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Monitor key or function | No retrieved source mentions a monitor function on the original. | (none) | Unknown |
| Squelch dial or control | No retrieved source mentions a squelch control on the original. | (none) | Unknown |
| Monitor and squelch as a single feature | Not documented. | (none) | Unknown |

Explicit statement: no retrieved source documents a monitor button, monitor switch, or squelch dial on the original model. The simulator SVG contains a squelch knob; see the discrepancies section.

---

## 9. Keypad lock

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Lock or unlock method | No source for the original. A search snippet attributed a CLR-hold lock to a third-party replica guide; that guide was not opened and concerns a replica. Excluded. | (none) | Unknown |
| Lock indicator on screen | No source. | (none) | Unknown |
| Keys still available when locked | No source. | (none) | Unknown |

---

## 10. Display brightness, contrast, and backlight

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Backlight or light key | No source. | (none) | Unknown |
| Brightness or contrast control | No source. | (none) | Unknown |
| Documented brightness levels | No source. | (none) | Unknown |
| NVG compatibility | Wikipedia: "NVG Compatible Display" (cited to a PRC-152A datasheet). This does not give a backlight mode. | https://en.wikipedia.org/wiki/AN/PRC-152 | Secondary-source (model caveat) |

---

## 11. Top selector dial (function switch)

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Dial label set for the original | The simulator SVG labels the dial SCAN, 1, 2, 3, 4, 5, S, F, Z, R. No retrieved source confirms this label set for the original model. | (SVG; see discrepancies) | Unknown |
| Off position | ACRE2 (game mod): leftmost position turns the radio off. | https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Secondary-source (game mod) |
| Preset positions | RHS (game mod): presets assigned to knob positions; 5 presets by default. ACRE2 (game mod): "cycle between the 1st 6 preset channels". Conflict. | https://docs.rhsmods.org/rhs-status-quo-user-documentation/arma-reforger/rhs-status-quo/blufor/gadgets/an-prc-152 ; https://acre2.idi-systems.com/wiki/radios/an-prc-152 | Unknown for hardware (conflict) |
| SCAN position | No source for the original. | (none) | Unknown |
| S, F, Z, R positions | No source. The A-model sell-sheet snippet lists different positions (Off, presets 1-5, scan, front panel, Z-All, PT, LD & CT). Excluded because it is A-model. | (none) | Unknown |
| "Front panel" or "Z-All" meaning | Not documented for the original. | (none) | Unknown |

---

## 12. Battery indication and low-battery behavior

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| Battery pack presence and dimensions | Crypto Museum: "234 × 64 × 43 mm (with battery)" and weight "1220 g (with battery and GPS". Labelled A designator on that page. | https://www.cryptomuseum.com/radio/prc152/ | Secondary-source (A-designator) |
| Battery type, chemistry, or voltage | No source. | (none) | Unknown |
| Battery level indication on screen | No source. | (none) | Unknown |
| Low-battery warning or behavior | No source. | (none) | Unknown |

---

## Additional connector facts (for context)

| Behavior | What the source says | Source URL | Classification |
|---|---|---|---|
| U-229 receptacle at top | Crypto Museum: "At the top of the device is a U-229 receptacle." | https://www.cryptomuseum.com/radio/prc152/ | Secondary-source |
| Antenna connector type (TNC 50 ohm in the SVG) | Not in any retrieved source. | (none) | Unknown |

---

## Discrepancies with the simulator's SVG

Source files reviewed: `src/assets/radio/front.svg` (keypad ids `keypad-1` to `keypad-9`, `keypad-star`, `keypad-0`, `keypad-hash`, `keypad-clear`, `keypad-enter`, `keypad-preset-up`, `keypad-preset-down`) and `src/assets/radio/top.svg` (`knob-channel`, `conn-top`, `power`, `knob-volume`, `knob-squelch`, `antenna`).

### Front keypad

| SVG control | Sourced support for the original | Status |
|---|---|---|
| Keys 1-9, 0 | Numeric keypad: Wikipedia (A-datasheet citation). | Supported (Secondary-source) |
| `*` (keypad-star) | No source. | Unknown; keep only if confirmed |
| `#` (keypad-hash) | No source. | Unknown; keep only if confirmed |
| CLR | ACRE2 (game mod). | Supported (Secondary-source); hardware Unknown |
| ENT | ACRE2 (game mod). | Supported (Secondary-source); hardware Unknown |
| PRE + and PRE - | ACRE2 (game mod). | Supported (Secondary-source); the small "PRE" legend text is unverified |
| CLR, ENT, PRE+/- layout (column 4 rows 1-4) | No source gives layout. | Unknown |

### Real controls missing from the SVG (candidates only; no physical components proposed)

| Possible control | Source | Status |
|---|---|---|
| OPT key | ACRE2 (game mod; "7-OPT") | Missing from SVG. Secondary-source for existence; hardware Unknown |
| PGM key | ACRE2 (game mod; "PGM") | Missing from SVG. Secondary-source for existence; hardware Unknown |
| Navigation arrows (UP/DOWN, LEFT/RIGHT) | ACRE2 (game mod) | Missing from SVG. Secondary-source for function; physical presence Unknown |
| Light or backlight key | No source | Unknown |
| Monitor control | No source | Unknown |
| Lock control | No source | Unknown |

### Top view

| SVG control | Sourced support for the original | Status |
|---|---|---|
| `power` button | No source names a separate power button. Game mods put power on the top function switch / knob (leftmost = off; rotating turns on). | Not supported as a separate control. Secondary-source (game mod) suggests power is part of the dial. Treat as Unknown. |
| `knob-channel` dial label SCAN | No source for original. | Unknown |
| `knob-channel` dial labels 1-5 | Game mods conflict (5 vs 6 presets). No hardware source. | Unknown |
| `knob-channel` dial labels S, F, Z, R | No source. The A-model sell-sheet snippet names different positions. | Unknown |
| `knob-volume` | No hardware source. ACRE2 volume is a game-UI click control. | Unknown |
| `knob-squelch` | No retrieved source. The SVG group for `knob-squelch` is empty (no drawn content) in `top.svg`. | Unknown. No source supports a squelch knob. |
| `conn-top` (U-229 connector) | Crypto Museum: "U-229 receptacle" at top. | Supported (Secondary-source) |
| `antenna` (TNC 50 ohm) | No retrieved source. | Unknown |

---

## Open questions and blocking unknowns

1. Physical keypad: whether OPT, PGM, arrows, light, and lock keys exist, their labels, and their positions. No primary document was readable.
2. Top dial: real label set for the original (SCAN, 1-5, S, F, Z, R?), the meaning of each position, and whether presets come from the dial. Game mods conflict (5 vs 6).
3. Power: how the radio is powered on and off, the startup sequence, and whether settings persist.
4. LCD: layout, main-screen fields, battery indicator, and whether the original has a volume knob or a squelch control.
5. Menu tree: names and contents of the OPT and PGM menus. Only "System Preset Settings" and "System Presets" are known, from a game mod.
6. Frequency range: Wikipedia gives 30-511.99 MHz in one place and 30-520 MHz with 762-870 MHz in another. The original's range is not confirmed.

Next steps that would unblock these: obtain the L3Harris operator's manual or an Army/USMC TM for AN/PRC-152 (not AN/PRC-152A) through an authorized channel, or a readable copy of the USMC Basic School or FMST PDFs (currently 403).
