# RadioSim device logic (src/radio), V5

Pure TypeScript state machine for the simulated Harris Falcon III AN/PRC-152 (original model). No React, no DOM, no timers, no randomness, no hardware APIs. Transmit is simulated only: there is no RF, no WebRTC, no USB or Bluetooth access. The reducer does not play audio; it names the cue.

Contract: `docs/architecture.md` (V5 contract at the end). Behavior and its classification: `docs/device-functionality-v5.md`. Research: `docs/research-v5-basic-operation.md`.

**No behavior here is verified against a primary document for the original model.** Rules that follow a game-mod description are Secondary-source; the rest are simulator choices. Comments in the code name which.

## Files

| File | Purpose |
|---|---|
| `types.ts` | `RadioState`, `RadioAction`, `Screen`, `MenuId`, `Preset`, `LcdFrame`, `ControlId`, `KnobId`, `Accuracy` |
| `config.ts` | Frequency limits, presets, knob ranges, dial positions, brightness, battery and timing constants. Each constant says what its source is |
| `stateMachine.ts` | `initialState`, pure `reduce(state, action)`, `activeFrequencyHz`, `parseFrequencyEntry`, `createDefaultPresets` |
| `menus.ts` | Menu data: titles, entries, kinds and accuracy tags. The presets list is built from state |
| `lcd.ts` | Pure `renderLcd(state)` and `frequencyTemplate`. Placeholder layout |
| `controls.ts` | `CONTROL_ACCURACY`, `CONTROL_LABEL`: one record per ControlId |
| `keypad.ts` | Maps control events and keyboard keys to actions |
| `index.ts` | Public API |

## Public API

```ts
initialState: RadioState
reduce(state: RadioState, action: RadioAction): RadioState
renderLcd(state: RadioState): LcdFrame
activeFrequencyHz(state: RadioState): number          // frequency of the active preset
parseFrequencyEntry(buffer: string): number | null    // six digits MMM.KKK -> integer Hz, or null
createDefaultPresets(): Preset[]
keyToAction(key: string): RadioAction | null          // keyboard shortcuts (simulator convenience)
keyReleaseToAction(key: string): RadioAction | null   // ptt up on key up
controlToAction(id: ControlId, event: ControlEvent): RadioAction | null
knobTurnToAction(id: KnobId, delta: -1 | 1): RadioAction
CONTROL_ACCURACY: Record<ControlId, Accuracy>
CONTROL_LABEL: Record<ControlId, string>
```

Actions: `control`, `knob`, `ptt`, `tick`, `overlay-clear`, `battery-tick`, `reset`. The frontend owns every timer: `tick` leaves the startup screen, `overlay-clear` removes the temporary volume or squelch row, `battery-tick` drains the battery while drain is on. `reset` returns the powered-off defaults and keeps `sound.seq` so it never goes backwards.

## Screens

| Screen | Shown when |
|---|---|
| `off` | Power off. The LCD is blank: no rows, no indicators |
| `startup` | Power just pressed on. One placeholder frame, "RADIOSIM STARTING" |
| `main` | After the startup tick. Preset number and name, frequency, mode, dial position, temporary indicators |
| `locked` | The keypad is locked. The main rows plus "KEYPAD LOCKED" |
| `menu` | OPT or PGM, or a level under PGM, or the presets list |
| `edit` | Typing the six-digit frequency of one preset |
| `confirm` | ENT is about to apply a frequency or a reset |

Every frame carries `label: "Simulated LCD (layout approximated)"`, and `approximated` is true on every screen except `off`. `brightness` (1..5, 0 when off) is applied by both displays.

"Interactive" means power on and screen in main, locked, menu, edit or confirm. Startup and off are not interactive.

## Transitions

| Trigger | Where | Result |
|---|---|---|
| power press | off | `startup`, transient state cleared, cue `power-on` |
| power press | any on screen | `off`, transient state cleared, cue `power-off` |
| tick | startup | `main` |
| key 7 / key 8 | main | open the OPT / PGM menu (Secondary-source: ACRE2) |
| other digit | main | notice `NOT USED HERE`, cue `error` |
| ENT | main | none |
| PRE +/- | main | active preset +1 / -1, clamped 1..100 |
| PRE +/- | menu | cursor down / up, clamped |
| dial turn | main | dial position moves 0..9; positions 1-5 set preset 1-5; others set notice `DIAL x N/A` |
| dial turn | menu | cursor moves |
| volume knob | main, menu, edit, confirm, locked | volume 0..10 and a temporary `VOLUME n` row |
| squelch knob | not locked | squelch 0..10 and a temporary `SQUELCH n` row |
| ENT | menu | open the entry: submenu, toggle, cycle, action, edit, or notice `UNAVAILABLE IN SIM` |
| CLR | menu | back one level (restores the cursor); at the root, `main` |
| digit | edit | append, up to six digits |
| CLR | edit | clear the typed entry; with an empty entry, back to the menu |
| ENT | edit | fewer than six digits: `ENTER 6 DIGITS`. Out of band: `OUT OF RANGE`. Valid: `confirm` |
| ENT | confirm | apply (frequency saved, or defaults restored), cue `confirm` |
| CLR | confirm | cancel, back to the menu, nothing changed |
| OPT > Keypad Lock | menu | `locked` |
| CLR, then ENT | locked | `main` (any other key resets the sequence and shows `KEYPAD LOCKED`) |
| ptt down / up | any interactive screen | `mode` transmit / standby (simulated) |
| battery-tick | on, drain on | battery -5%; at 0% the radio powers off |

Keys act on press only. A key or knob that changes nothing makes no sound and returns the same state object.

Power-off clears `mode`, `locked`, `unlockStage`, `menu`, `edit`, `pendingConfirm`, `overlay` and `notice`. It keeps the presets, active preset, dial, volume, squelch, monitor, brightness, output power, battery and the drain option.

## Frequency

Stored as integer Hz. The entry is a digit string of exactly six digits read as MMM.KKK MHz, so the entry increment is 1 kHz (Simulator-specific). The device tuning resolution is `FREQ_STEP_HZ` (10 Hz, Secondary-source); every entered value is a multiple of it. The band is 30.000 to 512.000 MHz (sources conflict; see `config.ts`). Nothing is saved until ENT on the confirm screen.

## Simulator keyboard shortcuts

These keys exist only in the simulator and are not device behavior.

| Key | Action |
|---|---|
| 0-9 | keypad-0 .. keypad-9 |
| Enter | keypad-enter |
| Backspace, Escape | keypad-clear |
| + or = / - | keypad-preset-up / keypad-preset-down |
| p | power |
| t (hold) | ptt down on key down; ptt up on key up (`keyReleaseToAction`) |
| ArrowUp / ArrowDown | dial +1 / -1 |
| ArrowRight / ArrowLeft | volume +1 / -1 |
| PageUp / PageDown | squelch +1 / -1 |

The frontend ignores auto-repeat `keydown` events for the `t` key so it does not re-send ptt down.

## Removed and unavailable

- `fn-1`..`fn-4` were removed in V3 (no source). `controlToAction` returns `null` for them.
- `keypad-star` and `keypad-hash` have no behavior (no source). On the main screen they set the notice `UNAVAILABLE IN SIM`.
- COMSEC, Waveform and Other Programming appear in the menus as unavailable entries only.
