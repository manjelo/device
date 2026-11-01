# Harris Falcon III AN/PRC-152 (original) - Accuracy Matrix

Model: original AN/PRC-152 (not AN/PRC-152A). Research date: 2026-10-25. Second pass: 2026-10-25. Third pass: 2026-10-25.
Source IDs (S1-S24) are defined in docs/device-research.md, section "Source inventory", and docs/references.md.
Rows marked "152A only" come from 152A sources and must not be applied to the original without a new source.

Status values: Verified-public-doc, Verified-photo, Secondary-source, Assumed, Unknown.
Verified-photo is used only for features visible in a photo the research inspected. It does not confirm model identity; see the photo-identity row.

Totals (66 rows): Verified-public-doc 9 (6 for the original, 3 for the 152A only) | Verified-photo 9 | Secondary-source 30 | Assumed 0 | Unknown 18.

| Feature | Claimed behavior | Source(s) | Verification status | Notes for simulator implementation |
|---|---|---|---|---|
| Designation and launch | AN/PRC-152 designation for the NSA-certified Falcon III handheld; production from 2005 | S1 (EDN reprint of Harris release, 2005-08-24); S9 (2005-10-13) | Verified-public-doc | Use 2005 as the in-universe release year. |
| NSA TOP SECRET certification | Voice and data protected up to TOP SECRET | S1; S12 | Verified-public-doc | Show the certification in the About or info screen only if a source for that screen exists. |
| JTRS SCA operating environment | First radio on the JTRS SCA operating environment to receive NSA certification | S1 | Verified-public-doc | Descriptive only; no UI behaviour implied. |
| Sierra II encryption module | First system certified with Sierra II software-programmable encryption | S1; S12 | Verified-public-doc | Model Sierra II as a crypto module name. Key entry UI is Unknown. |
| Embedded GPS option | GPS available as an option | S1; S12 | Verified-public-doc | Make GPS an optional hardware flag. Position display behaviour is Unknown. |
| Vehicular adapter option | Fits the US-standard combat net radio mount | S1; S12 | Verified-public-doc | Optional accessory; no UI behaviour. |
| Display: NVG compatible | Display is NVG compatible | S3 (citing 152A datasheet); S7 snippet | Secondary-source | Implement a dim, high-contrast display theme as Assumed styling. Do not claim NVG-specific colour rules. |
| Display size, resolution, layout | Not stated in any accessible text source (S2 and S4 have no display description) | None (S11 shows placement only; see next row) | Unknown | Do not invent an LCD layout. Use a placeholder and label it as such. |
| LCD proportions and placement | Wide, short LCD below the speaker grille; green display | S11 (USMC photo, 253 x 485 px, low resolution) | Verified-photo | Proportions and position only. Size, resolution, and icons remain Unknown. Low-resolution basis. |
| Speaker grille placement | Perforated speaker grille on the upper front | S10 (Cryptologic Museum photo); S11 | Verified-photo | Upper front. The prior "upper left" placement came from the 152A photo and is not used. |
| Microphone placement | Location of the microphone on the original | None | Unknown | No source. Do not place a microphone in the simulator. |
| Keypad grid geometry | About 4 rows by 3 columns of grey keys below the LCD; raised-key keypad on lower front | S11 (low resolution); S10 (keypad existence and position) | Verified-photo | Use 4 x 3 as the layout placeholder. Replaces the prior 4 x 4 grid, which no accessible source supports. Key count per row at low resolution is approximate. |
| Keypad: full numeric | Full numeric keypad | S3; S7 snippet | Secondary-source | Include digits 0-9 on the keypad. Other key names are Unknown. |
| Keypad key labels and FN1-FN4 | Labels for individual keys; FN1-FN4 function keys | None. The FN1-FN4 keys came from the 152A photo (S2) and no accessible source supports them | Unknown | Remove FN1-FN4 from the simulator. Do not label any key except digits (see previous row). Labels are not legible in S10 or S11. |
| PTT location | Side or front position of the push-to-talk control on the original | None | Unknown | The prior left-side placement was an Assumed architecture choice and is withdrawn. Do not infer PTT location from S10 or S11. |
| Squelch and volume controls | Existence, location, and form of squelch and volume controls | None | Unknown | No source. Do not add knobs or buttons for these. |
| Function dial: existence and placement | Rotary function dial on the top of the radio | S10 (Verified-photo: top, between two connectors) | Verified-photo | Position only. Shape and detent count are not verified. |
| Function dial labels as printed | White labels: SCAN, numerals 1 to 5, letters S, F, Z, R; position dot | S10 (legible text in photo) | Verified-photo | Use these labels only as printed. Their meanings are in the next row. The 152A knob set in S2 is a different list and is not applied. |
| Function dial position meanings | What each dial position does on the original | None. S2 gives a 152A-only knob list (Off, 1-5 presets, scan, front panel, Z-All, PT, LD, CT) | Unknown | Do not map S/F/Z/R or numerals to behaviour. Ask the orchestrator before modelling any dial position. |
| Function knob positions (152A) | Off, 1-5 presets, scan, front panel, Z-All, PT, LD, CT | S2 (DS475L, 2019) | Verified-public-doc (152A only) | Do not apply to the original. |
| Cipher switch | Existence and location of a cipher switch on the original | None | Unknown | No source. Do not add a cipher switch control. |
| Antenna connector position | Black whip antenna at the top, centre-rear (S10) and top-left to centre (S11) | S10; S11 | Verified-photo | Position on the top only. Pin and thread details are not in the photos. |
| Antenna connector type | TNC, 50 ohm | S5; S2 (152A, 50 Ohm TNC female) | Secondary-source | Use as a connector label. The S2 entry is 152A-only; S5 does not name the model. |
| Top round connectors | Two round metal-ringed connectors with black dust caps on the top, either side of the function dial | S10 | Verified-photo | Existence and position only. Which connector is the U-229 (see next row) is Unknown. |
| Top connector U-229 | Single U-229 receptacle on the top carrying audio, data, and fill | S4 | Secondary-source | Conflicts with S10, which shows two round top connectors. Pin-level behaviour not verified. Do not simulate pin signals. |
| Right-side recessed panel | Black recessed rectangular panel with holes on the right side | S10 | Verified-photo | Existence and position only. |
| Right-side panel function | What the right-side panel contains or does | None | Unknown | Do not label it as a connector or port. |
| Battery compartment position | Larger battery block at the bottom of the radio | S11 | Verified-photo | Position only. Capacity and life are the next-but-one row. |
| Battery type | Li-ion | S5 | Secondary-source | The 152A datasheet gives only input voltage (9.6 to 14 VDC). Battery icon may show a generic Li-ion model. |
| Battery capacity and life | Not stated | None | Unknown | Use a placeholder battery percentage and label it. |
| Menu tree | Not stated in accessible sources | S8 is a game mod and excluded. S3 and S4 are silent | Unknown | Do not implement a real menu tree. Build any menu as a clearly labelled placeholder. |
| Button sequences | Not stated in accessible sources | S8 is a game mod and excluded | Unknown | Do not copy the [G]+[R] or [G]+scroll sequences from S8. |
| Frequency range (original) | **Simulator decision (user-supplied): multiband, VHF 30.000-87.975 MHz and UHF 225.000-511.975 MHz, gap not tunable (`BANDS` in config.ts).** Public sources: 30 to 512 MHz in S9, S4, S5. 30.0000 to 511.9999 MHz in S20. 30 to 511.99 MHz in S3 body | S9 (2005); S4; S3; S5; S7 snippet; S20 | Secondary-source | Upper limit conflict: 512.000 MHz (S9, S4, S5) vs 511.9999 MHz (S20) vs 511.99 MHz (S3). The sources are close, so use 30.0000 to 511.9999 MHz as the band limit and flag it. S20 is a unit museum page. |
| VULOS sub-bands | Long UHF 30-89.9999 MHz; short UHF 90-224.9999 MHz; VHF 225-511.9999 MHz | S20 | Secondary-source | Use as the VULOS band table. Not confirmed by a Harris source. |
| HAVEQUICK AM range | Optional HAVEQUICK AM, 225.000 to 399.975 MHz | S20 | Secondary-source | Optional feature. Do not treat as standard. |
| SATCOM channel spacing | SATCOM with 25 kHz and 5 kHz channels | S20 | Secondary-source | Use for SATCOM channel-step options only. |
| HPW option | Optional HPW with KG-84C | S20; S2 (152A, KG-84C listed) | Secondary-source | Optional. Treat as an option, not a standard mode. KG-84C behaviour is Unknown. |
| Beacon mode | Beacon mode: 300-3300 Hz audio tone; user-changeable frequency, power, and interval | S20 | Secondary-source | New row, third pass. Single unit museum source. Add only if the orchestrator approves. Beacon controls and their front-panel path are Unknown. |
| Highband (original) | Not stated for the original. S9 (2005) lists 30-512 MHz only | S9; S3 infobox (undated, 762-870 MHz and 30-520 MHz) | Unknown | Keep FEATURE_HIGHBAND = false. |
| Highband (152A) | Standard highband enhancement to 520 MHz; 762-870 MHz added | S2 (DS475L) | Verified-public-doc (152A only) | Do not apply to the original. |
| Frequency tuning step (original) | 10 Hz | S9 (2005, "10-Hz tuning resolution"); S4 (10 Hz); S3 (10 Hz entry citing older datasheet) | Secondary-source | Conflict with 100 Hz is resolved by model: 100 Hz is the 152A front panel value (row below). Original value not yet verified against the Harris original datasheet. Keep FREQ_STEP_HZ = 10 with a note. |
| Frequency tuning step (152A) | Front panel 100 Hz; ASCII remote 1 Hz; highband 5 kHz; ANW2C 5 kHz | S2 (DS475L) | Verified-public-doc (152A only) | Do not apply to the original. |
| Presets count | 100 presets | Harris data sheet DS-321D (2006), `docs/datasheet-ds321d.md` | Verified-public-doc | Model 100 preset slots (earlier sources said 99). Preset selection UI is Unknown. The 152A value is confirmed. |
| RF output power range (original) | 250 mW to 5 W | S9 (2005); S4; S3; S5 | Secondary-source | Use 0.25 W to 5 W as the output range. |
| SATCOM burst power | 10 W burst mode | S2 (152A, verified for 152A); S3 "VSAT 10 W" | Secondary-source | Original SATCOM power is not confirmed. Add as optional SATCOM mode only. |
| Power level names | Names and wattages for the original (LOW, MEDIUM, HIGH) | S8 only (game mod) | Unknown | Do not use the game-mod names or wattages as fact. |
| Waveforms (original) | SINCGARS; VHF/UHF AM/FM (VULOS); ANDVT MIL-STD-188-181B; HAVEQUICK I/II; HPW; SATCOM; OTAR; optional P25 with 3-DES | S3; S4; S20 (VULOS, HAVEQUICK AM, SATCOM, HPW, beacon) | Secondary-source | Show as a list of supported types. Selectable front-panel path is Unknown. S2 lists a similar set for the 152A. |
| Voice codecs (original) | CVSD wideband 16 kb/s; LPC-10e narrowband 2400 baud; MELP | S4 | Secondary-source | S2 lists the same codec family for the 152A. Codec list can be a read-only info field. |
| Modulation modes (original) | FM, AM, PSK, FSK, ASK, CPM, GMSK; FSK and PSK31/63 | S4; S5 | Secondary-source | Use only for the info list. S2 lists AM, ASK, FM, FSK, PSK, CPM, GMSK for the 152A. |
| Frequency stability | 2.5 ppm (S5). The 152A datasheet gives 1 x 10^-6 with drift of +/-0.5 ppm per year (S2). | S5; S2 (152A) | Secondary-source | Sources conflict and the 152A value is not the original. Use a fixed constant and flag it. |
| Receiver sensitivity (original) | -116 dBm (S4); SSB -113 dBm for 10 dB SINAD (S5) | S4; S5 | Secondary-source | Sources differ on the measurement basis. The 152A datasheet uses 12 dB SINAD for LOS FM. Do not simulate sensitivity from these figures. |
| HAVEQUICK hopping | Frequency hopping anti-jam mode | S3; S4; S2 (152A ECCM bands) | Secondary-source | Hopping timing and sequence are Unknown. Do not simulate hop timing. |
| Dimensions (original) | 234 x 64 x 43 mm with battery | S4; S3 | Secondary-source | Conflicts: S5 gives 74 x 244 x 64 mm; the 152A datasheet (S2) gives 244 x 76 x 48 mm non-GPS and 265 x 76 x 64 mm with GPS. Use S4 values in the model and note the conflict. |
| Weight (original) | About 1.2 kg with battery and GPS | S3 (1.22 kg); S4 (1220 g); S5 (1.18 kg). The 152A datasheet gives 1.1 kg non-GPS and 1.2 kg GPS (S2). | Secondary-source | Use 1.22 kg, flagged. |
| Operating temperature | -31 C to +60 C (original, S4); -30 C to +60 C (152A, S2) | S4; S2 | Secondary-source | Info field only. |
| Immersion rating | 2 m (original, S4); 2.0 m standard unit for 30 minutes (152A, S2) | S4; S2 | Secondary-source | Info field only. |
| Remote and data interfaces (original) | RS-232, USB, ADF, Ethernet | S4 | Secondary-source | S2 lists USB, Ethernet, RS-232, and a 6-pin ADF audio port for the 152A. Interfaces are listed; no protocol or UI behaviour known. |
| Export variant | RF-310M-HH without NSA Type 1; Citadel II | S3; S4 | Secondary-source | Out of scope for the original model simulator unless requested. |
| Encryption list (original) | NSA Type 1, SIERRA II, SAVILLE, AES, DES | S4 | Secondary-source | The 152A list (S2) differs (KY-57, KYV-5, KG-84C, FASCINATOR, and others). Show the original list in an info screen only. |
| Key management UI | Key entry, storage, and zeroise | None | Unknown | Do not implement key UI from the game mod or assumption. |
| Power-on behaviour | Start-up sequence, self-test, and display on power-up | None | Unknown | Do not simulate a boot sequence as fact. |
| Mode selection from front panel | Whether waveforms and modes are selectable on the panel | None | Unknown | Ask the orchestrator before building a mode switch. |
| Accessories list | Official original-model accessory list | None (GPS and vehicular adapter from S1 and S12 only) | Unknown | Limit accessories to S1 and S12 items. |
| Game-mod controls and menus | BEEP, POWER, LED, SCND TRANS, FREQ RES, and similar | S8 (video-game mod) | Unknown | Excluded as evidence. Do not copy into the simulator as real behaviour. |
| Photo identity as original model | The photographed radios are the original AN/PRC-152, not the 152A | S10 (museum caption and file name; device marking not legible); S11 (caption "AN/PRC-152 handheld radio" only) | Secondary-source | Feature rows above are Verified-photo for what is visible. Model identity rests on captions. Confirm against S7 or a manual before relying on any original-only feature. |
| TRI-built AN/PRC-152 variant | Non-Harris PRC-152 with replica bands, 100 channels, 100 mW to 5 W, 214 x 67 x 39 mm | S14 (greenradio.de) | Secondary-source | Excluded. Do not use any value from this variant for the Harris model. |

## V5 additions (2026-10-25)

V5 research could not read any primary document for the original model (`docs/research-v5-basic-operation.md`). These rows follow that research. The full behavior-by-behavior table is `docs/device-functionality-v5.md`. No row below is Verified-public-doc.

| Feature | Claimed behavior | Source(s) | Verification status | Notes for simulator implementation |
|---|---|---|---|---|
| OPT key and PGM key | Operational programming opens with OPT, programming with PGM; the ACRE2 page names them as keys 7 and 8 | ACRE2 wiki (game mod) | Secondary-source | Implemented as the main-screen secondary functions of keys 7 and 8. Hardware labels and positions are Unknown. The SVG draws no OPT or PGM legend. |
| PGM path to presets | PGM, then "System Preset Settings", then "System Presets", then pick a preset | ACRE2 wiki (game mod) | Secondary-source | Implemented as the PGM menu path. Other PGM entries are not documented. |
| Navigation arrows | UP/DOWN or LEFT/RIGHT move through menus | ACRE2 wiki (game mod) | Secondary-source (function); Unknown (physical keys) | The SVG has no arrow keys. PRE +/-, the channel dial and keyboard arrows act as cursor movement. Left/right digit navigation is unsupported. |
| CLR and ENT meaning | CLR goes back; ENT saves values | ACRE2 wiki (game mod) | Secondary-source | Implemented. The clear-first-then-back detail is Simulator-specific. |
| PRE +/- | Change between channels (presets) | ACRE2 wiki (game mod) | Secondary-source | Implemented as one-step preset changes on the main screen. |
| Temporary volume display | Volume shows on the LCD when changed | ACRE2 wiki (game mod) | Secondary-source | Implemented as a 1.5 s overlay row. The range 0..10 and the timing are Simulator-specific. |
| Presets edited on the radio | Presets can be modified | ACRE2 wiki (game mod) | Secondary-source | Frequency editing only. Name editing is unsupported. |
| Top dial meaning | Labels SCAN, 1-5, S, F, Z, R | museum photo (existence and labels as drawn) | Verified-photo (existence); Unknown (meanings) | Positions 1-5 select presets 1-5 (Simulator-specific; game mods say 5 or 6 and disagree). Others show N/A. |
| Power control | A power button on the top view | None | Unknown | Game mods put power on the top dial. The simulator keeps the drawn button. |
| Squelch and monitor | A squelch knob and a monitor function | None | Unknown | The squelch knob is drawn and stays. Monitor is an OPT entry. Both are Simulator-specific. |
| Keypad lock | A lock with an unlock sequence | None | Unknown | Implemented as a simulator feature: OPT > Keypad Lock, unlock with CLR then ENT. |
| Display brightness and backlight | Brightness levels or a light key | None | Unknown | Implemented as a simulator brightness option (1..5), applied to both LCDs. |
| Startup sequence | Text and timing at power-on | None | Unknown | A short labelled placeholder frame (about 1.2 s). |
| Battery indication and low-battery behavior | Display and warning | None | Unknown | Percentage and a LOW BAT indicator at 20% or less. Optional deterministic drain, off by default. |
| `*` and `#` keys | Functions | None | Unknown | Shown as unavailable. |
