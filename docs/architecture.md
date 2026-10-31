# RadioSim Architecture Contract (v2, with the V5 update at the end)

> V5 changed the radio state, screens, menus and LCD frame. Where the sections below disagree with "V5 contract" at the end of this file, the V5 section wins.

Shared interface between agents. Change only through the orchestrator.
v1 is kept as `docs/architecture-v1.md` for history. v2 corrects the view set: the original requirement is **Front, Left, Right, Top** (v1 wrongly used back and side).

Accuracy source of truth: `docs/accuracy-matrix.md`. Every control and LCD element carries an accuracy status. Anything not verified is labelled approximated in code and UI.

## Layers

```
src/assets/radio/{front,left,right,top}.svg  (svg-designer)  four views, data-control ids
src/radio/*   (radio-logic)  pure state machine, screens, menus, LCD frames, sound cues; no React/DOM
src/components, src/hooks, src/styles, src/App.tsx  (frontend-developer)  rendering, input, audio hook
e2e/, *.test.*  (test-engineer)
```

Data flow: DOM event -> `keyToAction`/`controlToAction` -> `reduce(state, action)` -> `renderLcd(state)` -> LCD; `state.sound` -> `useSound` hook (only if the user enabled sound).

## Views

`front`, `left`, `right`, `top`. Files: `src/assets/radio/{front,left,right,top}.svg`. `back.svg` and `side.svg` are removed.

Views are presentation only; they do not change radio state.

## Control IDs

Same IDs as v1 (no new controls invented). Placement:

| ControlId | Type | View | Accuracy | Notes |
|---|---|---|---|---|
| `power` | button | front | Assumed | On/off. Power-on sequence Unknown. |
| `ptt` | switch | left | Assumed | Push-to-talk, simulated only. Side placement Unknown (left chosen as Assumed). |
| `knob-channel` | knob | front | Unknown | Preset select (100). Positions Unknown. |
| `knob-volume` | knob | front | Assumed | Volume. |
| `knob-squelch` | knob | front | Assumed | Squelch. |
| `keypad-0` ... `keypad-9` | key | front | Secondary-source | Numeric keypad (S3, S7). Grid position Assumed. |
| `keypad-star`, `keypad-hash` | key | front | Unknown | Generic labels. |
| `keypad-clear`, `keypad-enter` | key | front | Assumed | Generic labels CLR and ENT. |
| `fn-1` ... `fn-4` | key | front | Unknown | Generic function keys F1-F4. Meaning is a placeholder. |
| `antenna` | connector | top | Secondary-source | TNC, 50 ohm. |
| `conn-top` | connector | top | Secondary-source | U-229 receptacle. No pin behaviour. |
| `lcd-area` | display | front | Unknown | Region where React draws the LCD. |

## State (`RadioState` in `src/radio/types.ts`)

```ts
type Screen = 'off' | 'startup' | 'main' | 'menu' | 'edit' | 'confirm';

type RadioState = {
  power: 'off' | 'on';
  screen: Screen;
  mode: 'standby' | 'receive' | 'transmit';   // transmit is simulated only
  frequencyHz: number;          // clamped to FREQ_MIN_HZ..FREQ_MAX_HZ
  preset: number;               // 1..PRESET_COUNT
  volume: number;               // 0..10
  squelch: number;              // 0..10
  outputPowerW: number;         // one of POWER_LEVELS_W (only the verified-range endpoints unless flagged)
  waveform: string;             // one of WAVEFORMS
  batteryPct: number;           // placeholder, Unknown
  entryBuffer: string;          // digits typed on keypad
  menu: { path: string[]; cursor: number; editing: boolean; draft?: string } | null;
  pendingConfirm: null | { prompt: string; onYes: 'applyDraft' | 'resetDefaults' };
  notice: string | null;        // short status line for LCD
  sound: { seq: number; cue: SoundCue };  // seq increments on every audible cue
};

type SoundCue = 'key' | 'knob' | 'power-on' | 'power-off' | 'ptt-down' | 'ptt-up' | 'error' | 'confirm';
```

## Screens and LCD

`renderLcd(state): LcdFrame` is pure and returns:

```ts
type LcdFrame = {
  screen: Screen;
  rows: LcdRow[];                  // each row: { text, inverse?, size: 'small' | 'large' }
  indicators: { power: boolean; tx: boolean; rx: boolean; battery: number; volume: number; squelch: number };
  label: string;                   // caption for the placeholder area, e.g. "Simulated LCD (layout approximated)"
  approximated: boolean;           // true when any text came from approximated behaviour
};
```

Screen behaviour:
- `off`: blank frame. No text.
- `startup`: short placeholder animation frames. Startup sequence Unknown; mark approximated.
- `main`: channel (preset) and frequency in MHz to 3 decimals, mode, volume and squelch bars, battery %, entry buffer. Layout is a placeholder (Unknown).
- `menu`: placeholder menu list. Menu tree is fictional and must render the label "PLACEHOLDER MENU (not Harris firmware)".
- `edit`: a setting shows its draft value; keypad digits or knobs change it.
- `confirm`: yes/no prompt; ENT confirms, CLR cancels.

Menu entries must carry `accuracy: 'Unknown' | 'Assumed'`. None may be `Verified-public-doc` unless a source is cited in the research.

## Constants (`src/radio/config.ts`)

Each constant has its source and status in a comment.

- `FREQ_MIN_HZ = 30_000_000` (Secondary-source)
- `FREQ_MAX_HZ = 512_000_000` (Secondary-source)
- `FEATURE_HIGHBAND = false` (Unknown, disabled)
- `FREQ_STEP_HZ = 10` (Unknown: sources conflict, 10 Hz vs 100 Hz; the conflict stays documented)
- `PRESET_COUNT = 100` (Verified-public-doc, DS-321D)
- `POWER_LEVELS_W` (Unknown beyond endpoints 0.25 W and 5 W; intermediate levels disabled)
- `WAVEFORMS` (Secondary-source, info list only)

## Public API (`src/radio/index.ts`)

```ts
export const initialState: RadioState;
export function reduce(state: RadioState, action: RadioAction): RadioState;
export function renderLcd(state: RadioState): LcdFrame;
export function keyToAction(key: string): RadioAction | null;
export function keyReleaseToAction(key: string): RadioAction | null;
export function controlToAction(id: ControlId, event: ControlEvent): RadioAction | null;
export function knobTurnToAction(id: KnobId, delta: -1 | 1): RadioAction;
export const CONTROL_ACCURACY: Record<ControlId, Accuracy>;   // single source for UI accuracy text
export const CONTROL_LABEL: Record<ControlId, string>;        // single source for accessible names
export type { RadioState, RadioAction, LcdFrame, ControlId, KnobId, Accuracy, Screen, SoundCue };
```

`CONTROL_ACCURACY` and `CONTROL_LABEL` replace the duplicate table in `src/components/controlInfo.ts`. `docs/` and `src/assets/radio/controls.md` remain human-readable copies and must match.

## Sound

Sound is optional and off by default. The UI toggles it. `state.sound` describes the last audible cue. The logic never plays audio itself. The frontend's `useSound` hook uses Web Audio to synthesize short tones. No recorded audio. No audio is claimed to match the real radio.

## Rules for all agents

- No real RF communication, no WebRTC, no hardware APIs, no radio-to-radio communication.
- No military cryptographic implementation. Encryption items stay as text info only.
- Do not present approximated behaviour as verified.
- Do not commit, push, or deploy.

## V5 contract (supersedes the State, Screens and LCD sections above)

Behavior classification for every rule is in `docs/device-functionality-v5.md`. No behavior is Verified-public-doc: no primary document for the original model was readable.

### Layers (unchanged)

`src/radio/` is pure TypeScript (no React, no DOM, no timers). `src/hooks/useRadio.ts` owns the store, input wiring and every timer. `src/components/` renders. Device state lives in the reducer only; the DOM is never used to hold device state (the only DOM writes are ARIA value attributes on the knobs).

### State (`RadioState`)

| Field | Meaning |
|---|---|
| `power`, `screen` | `screen` is `off`, `startup`, `main`, `locked`, `menu`, `edit` or `confirm` |
| `mode` | `standby` or `transmit` (simulated). `receive` exists in the type and is never entered |
| `presets`, `preset` | 100 stored presets (`{ name, frequencyHz }`, integer Hz) and the active preset 1..100 |
| `dial` | Index into `DIAL_POSITIONS`. Separate from the stored presets. Positions 1 to 5 select presets 1 to 5 |
| `volume`, `squelch`, `monitor`, `brightness`, `outputPowerW` | Settings that survive a power cycle |
| `batteryPct`, `batteryDrain` | Simulated battery. Drain is off by default |
| `locked`, `unlockStage` | Keypad lock and the CLR-then-ENT unlock sequence |
| `menu` | `{ path, cursor, cursors, target }` or `null`. `path` is a stack of menu ids; `cursors` restores positions on CLR |
| `edit` | `{ buffer }` or `null`. The buffer is a digit string, so leading zeros survive |
| `pendingConfirm` | `frequency` or `reset` change waiting for ENT |
| `overlay`, `notice` | Temporary volume/squelch indicator and a short status line |
| `sound` | `{ seq, cue }` |

### Actions

`control` (id, event), `knob` (id, delta), `ptt` (down), `tick` (startup to main), `overlay-clear`, `battery-tick`, `reset`. All timers are in the hook: the startup timeout, the overlay timeout (1.5 s) and the battery interval (60 s, only while the radio is on and drain is on). Every timer is cancelled when its condition ends or the component unmounts. Tests drive the reducer directly, so they do not depend on real time.

### Rules that every change must keep

1. Nothing in the configuration changes before ENT on the confirm screen. CLR and power-off discard edits.
2. Frequencies are integer Hz. The device resolution (10 Hz) and the front-panel entry increment (1 kHz) are separate constants.
3. Power-off clears transient state (menu, edit, confirm, overlay, notice, lock, transmit) and keeps saved settings and presets.
4. Invalid input never throws: out-of-range or incomplete entries set a notice and an `error` cue.
5. ENT is never a shortcut to a menu. Menus open from keys 7 (OPT) and 8 (PGM) on the main screen.
6. Menus are data (`src/radio/menus.ts`). Rendering and behavior read that data; menu labels are not hard-coded in components.
7. One `renderLcd(state)` frame feeds the in-radio LCD and the enlarged preview. There is no second rendering path.
8. Unsupported features appear only as entries marked unavailable. Do not add undocumented menus as original behavior.
9. Do not change the approved SVG geometry.

### Control to action map

See `src/radio/keypad.ts` (`controlToAction`, `keyToAction`) and the table in `docs/device-functionality-v5.md`. PRE + and PRE - step the preset on the main screen and move the menu cursor in a menu. The channel dial moves the dial position on the main screen and the menu cursor in a menu.
