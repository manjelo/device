# RadioSim Architecture Contract (v1)

This is the shared interface between agents. Change it only through the orchestrator.

Accuracy source of truth: `docs/accuracy-matrix.md`. Every control below carries an accuracy status. Anything not verified is labeled as an approximation in code and UI.

## Layers

```
src/assets/radio/*.svg   (svg-designer)   four views, data-control ids
src/radio/*              (radio-logic)    pure state machine, no React/DOM
src/components, src/hooks, src/styles, src/App.tsx  (frontend-developer)
src/test, e2e/, *.test.* (test-engineer)
```

Data flow: DOM event -> `keypad.ts` maps `ControlId` + event to `RadioAction` -> `reduce(state, action)` -> `renderLcd(state)` -> LCD.

## Views

`front`, `back`, `top`, `side`. Files: `src/assets/radio/{front,back,top,side}.svg`.

## Control IDs (`ControlId` union in `src/radio/types.ts`)

Each ID appears as `data-control="<id>"` in the SVG for the view named in the Placement column.

| ControlId | Type | View | Accuracy | Notes |
|---|---|---|---|---|
| `power` | button | front | Assumed | Power on/off. Power-on behavior is Unknown. |
| `ptt` | switch | side | Assumed | Push-to-talk. Simulated only. |
| `knob-channel` | knob | front | Unknown | Preset select (99 presets). Positions Unknown. |
| `knob-volume` | knob | front | Assumed | Volume. |
| `knob-squelch` | knob | front | Assumed | Squelch. |
| `keypad-0` ... `keypad-9` | key | front | Secondary-source | Full numeric keypad per S3/S7. |
| `keypad-star` | key | front | Unknown | Label is generic. |
| `keypad-hash` | key | front | Unknown | Label is generic. |
| `keypad-clear` | key | front | Assumed | Clears entry buffer. |
| `keypad-enter` | key | front | Assumed | Commits entry buffer. |
| `fn-1` ... `fn-4` | key | front | Unknown | Generic function keys with labels "F1"-"F4". Meaning is a placeholder. |
| `antenna` | connector | top | Secondary-source | TNC, 50 ohm. Label only. |
| `conn-top` | connector | top | Secondary-source | U-229 receptacle. No pin behavior. |
| `lcd-area` | display | front | Unknown | Layout placeholder. Drawn by React, not in SVG. |

No other controls may be added without marking them Unknown in the matrix first.

## State (`RadioState` in `src/radio/types.ts`)

```ts
type RadioState = {
  power: 'off' | 'on';
  mode: 'standby' | 'receive' | 'transmit';   // transmit is simulated only
  frequencyHz: number;          // clamped to FREQ_MIN_HZ..FREQ_MAX_HZ
  preset: number;               // 1..PRESET_COUNT (99)
  volume: number;               // 0..10
  squelch: number;              // 0..10
  outputPowerW: number;         // one of POWER_LEVELS_W
  waveform: string;             // one of WAVEFORMS (info list; selection path Unknown)
  entryBuffer: string;          // digits typed on keypad
  menuPath: string[];           // placeholder menu, empty when closed
  lastNotice?: string;          // short status line for LCD
};
```

Constants live in `src/radio/config.ts`, each with its source and accuracy status:

- `FREQ_MIN_HZ = 30_000_000` (Secondary-source)
- `FREQ_MAX_HZ = 512_000_000` (Secondary-source; optional highband Secondary-source)
- `FREQ_STEP_HZ = 10` (Unknown: sources conflict, 10 Hz vs 100 Hz)
- `PRESET_COUNT = 99` (Secondary-source)
- `POWER_LEVELS_W = [0.25, 5]` (Secondary-source; intermediate levels Unknown)
- `WAVEFORMS` from the matrix (Secondary-source)

## Actions (`RadioAction`)

```ts
type RadioAction =
  | { type: 'control'; id: ControlId; event: 'press' | 'release' | 'longpress' }
  | { type: 'knob'; id: 'knob-channel' | 'knob-volume' | 'knob-squelch'; delta: -1 | 1 }
  | { type: 'ptt'; down: boolean }
  | { type: 'reset' };
```

## Public API (`src/radio/index.ts`)

```ts
export const initialState: RadioState;
export function reduce(state: RadioState, action: RadioAction): RadioState;
export function renderLcd(state: RadioState): LcdFrame;
export function keyToAction(key: string): RadioAction | null;   // keyboard shortcuts
export type { RadioState, RadioAction, LcdFrame, ControlId, Accuracy };
```

`LcdFrame` = `{ rows: string[]; flags: { power: boolean; tx: boolean; rx: boolean; battery: number } }`. The battery value is a placeholder percentage (Unknown).

## Rules for all agents

- No real RF communication, no WebRTC, no hardware APIs, no audio capture.
- Do not present approximated behavior as verified.
- Do not commit, push, or deploy.
