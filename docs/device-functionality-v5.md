# RadioSim V5: device functionality

Model simulated: the original Harris Falcon III AN/PRC-152 (not the AN/PRC-152A). This is an interface simulation only. There is no RF, no microphone access, no networking, no crypto, no key loading, and no hopping. It does not replicate the radio's firmware.

## 1. Evidence status (read this first)

No primary document for the original model could be read during V5 research (2026-10-25):

- The operator manual on studylib (document 26288460) returned no text, only an image.
- The L3Harris datasheet host did not resolve (DNS failure, tried twice). A local copy of the 2006 data sheet was added afterwards; see `docs/datasheet-ds321d.md`. It verifies only specifications (band, presets, tuning step, power, size), not any menu or key behavior.
- Marine Corps and Army training PDFs returned HTTP 403 or 402.

Details and the full source table are in `docs/research-v5-basic-operation.md`.

What was readable: Wikipedia, Crypto Museum (its specification list is labelled for the A designator), and two video-game mod wikis (ACRE2 and RHS). The game-mod wikis describe in-game emulation, not hardware.

Consequences:

- **No menu or key behavior in this document is classified Verified-public-doc.** Only specifications are, via the 2006 data sheet (`docs/datasheet-ds321d.md`): 30-512 MHz, 10 Hz tuning, 250 mW-5 W, and 100 presets.
- Behavior that follows a game-mod description is **Secondary-source** at best, and only for what the page says. It is not evidence of what the hardware does.
- Everything else is **Simulator-specific** (a choice made so the simulator is consistent) or **Unknown** (not implemented, or implemented only as a labelled placeholder).
- Nothing here claims to be the original firmware's behavior. The menus on the LCD say "(simulator)" for that reason.

### Classification legend

| Label | Meaning |
|---|---|
| Verified-public-doc | Stated by a primary public document for the original model. **None in V5.** |
| Secondary-source | Described by a secondary or game-mod source. Not checked on hardware. |
| Approximated | The simulator reproduces the idea of a documented function with different details. |
| Simulator-specific | A simulator choice with no source. Shown as such in the UI where it matters. |
| Unknown / Unsupported | Not documented, or deliberately not implemented. Shown as unavailable on the LCD where it appears. |

Mapping to the code's `Accuracy` tags (`controls.ts`, `menus.ts`): Secondary-source is Secondary-source; Simulator-specific is Assumed (or Unknown where nothing at all supports the control); Unknown/Unsupported is Unknown.

## 2. Device states

The states are an architectural representation, not a claim about the firmware's states.

```text
off --power--> startup --tick--> main --7--> menu (OPT)
                                   |  \--8--> menu (PGM) --> presets list --> preset --> edit --> confirm
                                   |
                                   +--OPT > Keypad Lock--> locked --CLR, ENT--> main
```

`Screen` values: `off`, `startup`, `main`, `locked`, `menu`, `edit`, `confirm`. Every transition is a pure function of the state and one action, and is tested without a browser.

## 3. Implemented behavior

### Power and startup

| Behavior | Classification | Source / note |
|---|---|---|
| A power control toggles the radio on and off | Simulator-specific | The original's power control is Unknown. The SVG has a power button on the top view. Game mods put power on the top dial (leftmost = off). Not applied. |
| Power-on shows a short startup screen ("RADIOSIM STARTING"), then the main screen after about 1.2 s | Simulator-specific | The real startup text and timing are Unknown. The screen is labelled approximated. |
| Keys, knobs and PTT are ignored during startup and while off | Simulator-specific | |
| Power-off blanks the LCD, stops simulated transmission, leaves menus, discards unconfirmed edits, clears the lock and temporary indicators | Simulator-specific | |
| Saved presets, volume, squelch, brightness and options survive a power cycle | Simulator-specific | ACRE2 notes that changes are lost on channel change unless auto-save is on. That is a game feature. The simulator keeps saved presets, which is the behavior the project requires. |

### Keypad

| Key | Behavior | Classification | Source / note |
|---|---|---|---|
| 0-9 | Digit entry in the frequency edit | Secondary-source | ACRE2: "Numerical values are entered with the number pad." Wikipedia lists a full numeric keypad. |
| 7 (main screen) | Opens the OPT menu | Secondary-source | ACRE2: "All operational programming modes are accessible through pressing 7-OPT button." The key legend "OPT" is not drawn on the SVG. Whether the real key is labelled so is Unknown. |
| 8 (main screen) | Opens the PGM menu | Secondary-source | ACRE2 gives "8-PGM". Same caveat. |
| Other digits on the main screen | Notice "NOT USED HERE" | Simulator-specific | The main screen has no direct frequency entry, so ENT is not a shortcut to anything. |
| CLR | Cancels the typed entry; then goes back one level; from a menu root returns to main; cancels a confirm | Secondary-source | ACRE2: "CLR will take you back at any time." Details (clear first, then back) are Simulator-specific. |
| ENT | Selects the highlighted menu entry; checks a typed entry; applies a confirmed change. **Does nothing on the main screen.** | Secondary-source | ACRE2: "ENT is generally used for saving values." |
| PRE + / PRE - | Step the active preset 1..100 on the main screen | Secondary-source | ACRE2: "Click PRE +/- to change between channels." The small "PRE" legend on the + key was taken from a photo crop supplied by the project owner and is not independently verified. |
| PRE + / PRE - in a menu | Move the cursor down / up | Simulator-specific | The SVG has no arrow keys. See section 5. |
| * and # | Notice "UNAVAILABLE IN SIM" on the main screen | Unknown | No source mentions these keys. |

### Menus

The menu data is in `src/radio/menus.ts`. Labels ending "(simulator)" are simulator titles.

| Menu | Entries | Classification |
|---|---|---|
| OPT: "OPTIONS (simulator)" | Keypad Lock, Monitor, Display Bright, RF Power, Battery Drain, Reset Simulator, COMSEC (N/A), Waveform (N/A) | The OPT key opening operational options is Secondary-source. The entries are Simulator-specific. COMSEC and Waveform are shown only as unavailable. |
| PGM: "PROGRAM (simulator)" | System Preset Settings, Other Programming (N/A) | The PGM key opening programming and the label "System Preset Settings" are Secondary-source (ACRE2). "Other Programming" is a placeholder. |
| System Preset Settings | System Presets | Secondary-source (ACRE2: "System Preset Settings", then "System Presets"). |
| System Presets | The 100 presets as a scrolling list (five rows visible) | Secondary-source for reaching the preset list this way; the list layout is Simulator-specific. |
| One preset | Frequency (editable), Name (N/A: no text entry) | Simulator-specific. |

Navigation keeps the cursor inside the list (no wrap). CLR goes back one level and restores the previous cursor.

### Frequency

| Behavior | Classification | Note |
|---|---|---|
| Stored internally as integer Hz | Simulator-specific | No floating-point MHz is stored. |
| Band 30.000 to 512.000 MHz | Secondary-source | The sources conflict: Wikipedia's text says 30-511.99 MHz, Wikipedia's infobox says 30-520 MHz (and 762-870 MHz), and Crypto Museum says 30-512 MHz under the A designator. The simulator uses 30.000-512.000 MHz. Out-of-band values are refused. |
| Device tuning resolution 10 Hz | Secondary-source | Wikipedia and Crypto Museum (A designator). Kept as `FREQ_STEP_HZ`; every stored value is a multiple of it. |
| Front-panel entry increment 1 kHz | Simulator-specific | Entry is six digits read as MMM.KKK MHz. No source gives the real entry format. The finer 10 Hz resolution is not reachable from this entry. |
| Entry is a digit string, so leading zeros and trailing zeros are kept | Simulator-specific | `029999` is refused as below the band; `030000` is 30.000 MHz. |
| Entry needs all six digits; fewer shows "ENTER 6 DIGITS"; out of band shows "OUT OF RANGE" | Simulator-specific | The previous value is untouched. |
| A valid entry goes to a confirm screen ("NEW 150.000 MHz", "Apply? ENT=yes CLR=no"). Only ENT there saves. CLR there cancels. | Simulator-specific | Nothing changes before the confirm. |
| Shown as "ddd.ddd MHz" with underscores for digits not yet typed | Simulator-specific | The underscores are the input cursor. |

### Presets

| Behavior | Classification | Note |
|---|---|---|
| 100 stored presets | Verified-public-doc | Harris data sheet DS-321D (2006). Earlier secondary sources said 99. |
| Each preset has a number, a name and a frequency | Approximated | The main screen shows "PRESET nn  CHAN nn" and the frequency. Names are defaults; name editing is not supported (no text entry). |
| Default presets: preset n is "CHAN nn" at 30 MHz + 4.5 MHz x (n - 1), so preset 1 is 30.000 MHz and preset 100 is 475.500 MHz | Simulator-specific | The factory presets are Unknown. Each default is distinct so a preset change is visible. |
| Editing one preset leaves the other 98 untouched | Simulator-specific | Covered by tests. |
| PRE + / PRE - step the active preset | Secondary-source | See keypad. |
| Presets persist across power cycles; Reset Simulator restores the defaults | Simulator-specific | Browser-refresh persistence is not implemented. |

### Top function dial

| Behavior | Classification | Note |
|---|---|---|
| The dial has ten positions labelled SCAN, 1, 2, 3, 4, 5, S, F, Z, R | Verified-photo for existence and labels as drawn | The labels come from the project's top-view artwork and a museum photo. Their meanings are Unknown, and no document for the original was readable. |
| Positions 1-5 select presets 1-5 | Simulator-specific | Game mods give 5 or 6 dial presets and disagree. |
| SCAN, S, F, Z, R show "DIAL x N/A" and change nothing | Unknown | Shown as unsupported. |
| The dial is a separate control from the 100 stored presets | Simulator-specific | It is not a direct 1-100 rotary control. |
| In a menu, the dial moves the cursor | Simulator-specific | See section 5. |

### Volume and squelch

| Behavior | Classification | Note |
|---|---|---|
| Volume 0..10, clamped. A turn shows a temporary "VOLUME n" row for 1.5 s on the main and locked screens, on both LCDs (not inside menus or edits) | Secondary-source for a temporary volume display | ACRE2: "The volume setting will be displayed on the LCD screen when you use this button." The 0..10 range and the timing are Simulator-specific. A volume knob on the original is Unknown. |
| Volume affects optional simulated sound | Simulator-specific | |
| The squelch knob steps 0..10 and shows "SQUELCH n" | Simulator-specific | No source mentions a squelch control on the original. |
| Monitor (OPT > Monitor) is an on/off value shown as "MON" | Simulator-specific | No source mentions a monitor function on the original. The SVG has a squelch knob and no monitor control, so monitor is a menu option. |
| No signal processing or reception is simulated | | |

### Keypad lock

| Behavior | Classification | Note |
|---|---|---|
| OPT > Keypad Lock locks the keypad. The LCD shows "KEYPAD LOCKED" and the LOCK indicator. | Simulator-specific | No source documents a lock for the original. It is not an original feature as far as the research found. |
| While locked, keys do nothing. The unlock sequence is CLR, then ENT. Any other key resets the sequence and shows "KEYPAD LOCKED". | Simulator-specific | The unlock method is the simulator's own, not a documented one. |
| Power, PTT and the volume knob stay available while locked. The squelch knob, dial and PRE keys do not. | Simulator-specific | |
| A power cycle clears the lock | Simulator-specific | |

### Display

| Behavior | Classification | Note |
|---|---|---|
| Display brightness 1..5 (OPT > Display Bright), applied to the in-radio LCD and the enlarged preview alike | Simulator-specific | No source documents brightness levels. A key for it is Unknown; the SVG has none. |
| The LCD is a recessed live display with placeholder layout; the preview below the radio renders the same frame | Simulator-specific | One `renderLcd(state)` frame feeds both. |
| Indicators appear only while they apply: PWR ON, TX, MON, LOCK, LOW BAT, and the battery percentage. An RX indicator exists in the type but is never shown, because receive is not simulated | Simulator-specific | The real indicator set is Unknown. |

### PTT

| Behavior | Classification | Note |
|---|---|---|
| Pressing PTT sets simulated TX ("TRANSMIT", TX indicator); releasing clears it | Simulator-specific | PTT placement is Assumed. Nothing is transmitted. |
| PTT is released on pointer-up, pointer-cancel, touch cancel, keyboard key-up, window blur, a hidden tab, a view change and power-off | Simulator-specific | Covered by component and end-to-end tests. |
| PTT works while the keypad is locked; it does nothing while off or in startup | Simulator-specific | |

### Link (radio-to-radio between tabs)

| Behavior | Classification | Note |
|---|---|---|
| Radios in tabs of the same browser hear each other. A radio keyed with PTT makes other radios on the same active frequency show the RX indicator and "RECEIVING" | Simulator-specific | Not a documented feature of the original. No RF, audio or key material is involved; only "who is keyed, on which frequency" is shared (BroadcastChannel, same origin). |
| Matching is on the tuned frequency in Hz, not the preset number | Simulator-specific | Different presets on the same frequency hear each other; the same preset number on different frequencies does not. |
| A radio receives only while on, past startup and not transmitting itself. Squelch, volume, monitor and keypad lock do not gate it | Simulator-specific (Assumed) | No signal or audio is simulated, so nothing for them to act on. |
| A keyed radio repeats its signal every second; a sender not heard for 3 seconds is dropped | Simulator-specific | Prevents a stuck RX when a tab closes or freezes. PTT release rules (blur, hidden tab, power off) also release the link. |
| Link button below the radio cycles Off / this browser / network. Network mode connects to the relay; everyone shares one open room | Simulator-specific | Not a radio control. "This browser" is the tab link (no voice); "network" reaches other devices through the relay service (`docs/relay-design.md`). |
| In network mode, PTT sends microphone audio (raw 16 kHz PCM, no codec) to every other radio on the relay. A receiving radio plays it only on the same frequency, scaled by the volume setting (0 mutes) | Simulator-specific | No RF, waveform, COMSEC or noise model. Squelch does not gate it. The browser asks for microphone permission; without it the radio can still listen. Needs https or localhost. |

### Battery

| Behavior | Classification | Note |
|---|---|---|
| A battery percentage is shown on the LCD. A low-battery indicator appears at 20% or less | Simulator-specific | No source documents the battery indication or warning. |
| Optional drain (OPT > Battery Drain, off by default) removes 5% each minute; at 0% the radio powers off and drain switches itself off, so the radio can be powered on again (and reset from the OPT menu) | Simulator-specific | The step and interval are configuration constants. The simulator does not model the real discharge curve. |
| Drain is driven by a timer in the hook that exists only while the radio is on and drain is on | Simulator-specific | Tests send `battery-tick` actions, so they are deterministic. |

### Sound

Optional and off by default. Cues are named by the logic and synthesized by the frontend: key press, menu movement, confirm, error, power on and off, PTT down and up. The simulator works with sound disabled. These are simulator tones, not radio audio.

### Reset

`Reset Simulator` (OPT menu, with a confirm screen) restores the simulated defaults and leaves the radio on at the main screen. The `reset` action restores the powered-off defaults. View switching never resets anything.

## 4. Simulated defaults

| Setting | Default |
|---|---|
| Active preset | 1 (30.000 MHz, "CHAN 01") |
| Dial position | 1 |
| Volume / squelch | 5 / 5 |
| Monitor | off |
| Brightness | 5 |
| RF power | 0.25 W (the lower of the two secondary-source endpoints, 0.25 W and 5 W) |
| Battery | 100%, drain off |
| Keypad | unlocked |

## 5. Differences between the SVG and what the sources describe

The SVG is approved and was not changed. Differences are documented, not corrected.

- **OPT, PGM and arrow keys are not drawn.** ACRE2 gives OPT and PGM as the secondary functions of keys 7 and 8, so the simulator uses those keys on the main screen. There are no arrow keys, so PRE + / PRE - and the channel dial act as cursor down / up in menus, and typing is append-only with CLR clearing it. Left/right digit navigation is unsupported.
- **A separate power button and squelch knob are drawn.** No readable source supports either for the original. Game mods put power on the top dial. They stay because the design is approved; both are Simulator-specific.
- **`*` and `#` keys are drawn.** No source mentions them. They are shown as unavailable.
- **No backlight, lock or monitor key is drawn.** Their functions exist only as OPT menu entries.

## 6. Unsupported (not implemented)

Real RF, microphone transmission, radio-to-radio communication over a real or networked channel (the tab link in section 3 is a simulator feature only), waveforms, COMSEC and TRANSEC, key loading and zeroization, frequency hopping, GPS, SATCOM, tactical network configuration, hardware control, and name editing for presets. COMSEC, Waveform and Other Programming appear in the menus only as marked unavailable entries.

## 7. Simulator keyboard shortcuts

| Key | Action |
|---|---|
| 0-9 | Keypad digits (7 opens OPT and 8 opens PGM on the main screen) |
| Enter | ENT |
| Backspace, Escape | CLR |
| + or = / - | PRE + / PRE - |
| p | Power |
| t (hold) | PTT |
| ArrowUp / ArrowDown | Dial +1 / -1 (moves the menu cursor in a menu) |
| ArrowRight / ArrowLeft | Volume +1 / -1 |
| PageUp / PageDown | Squelch +1 / -1 |

## 8. Tests

- `src/radio/*.test.ts`: state machine, LCD frames, keypad mapping and end-to-end logic scenarios, with no browser.
- `src/components/App.test.tsx` and `radioSvg.test.ts`: the connected UI (overlay timing, inset and preview in sync, notices on the in-radio display, lock, PTT release by pointer id, pointer-cancel, hidden tab, window blur, view change and power-off, Enter on the details summary) and the SVG visibility and hit-area guard.
- `e2e/radio.spec.ts`: physical SVG controls, keyboard, wheel, touch taps, view switching and power cycling.
- Screenshots: `docs/screenshots/v5-functionality/` (captured by `e2e/functionality-screenshots.spec.ts`).
