// Shared types for the RadioSim device state machine (contract: docs/architecture.md, v5).
// No React, no DOM, no runtime code in this file.

/** Accuracy status, matching docs/accuracy-matrix.md. Verified-photo covers existence and placement only. */
export type Accuracy = 'Verified-public-doc' | 'Verified-photo' | 'Secondary-source' | 'Assumed' | 'Unknown';

/** Control IDs. Each one appears as data-control="<id>" in the SVG view named in docs/architecture.md. */
export type ControlId =
  | 'power'
  | 'ptt'
  | 'knob-channel'
  | 'knob-volume'
  | 'knob-squelch'
  | 'keypad-0'
  | 'keypad-1'
  | 'keypad-2'
  | 'keypad-3'
  | 'keypad-4'
  | 'keypad-5'
  | 'keypad-6'
  | 'keypad-7'
  | 'keypad-8'
  | 'keypad-9'
  | 'keypad-star'
  | 'keypad-hash'
  | 'keypad-clear'
  | 'keypad-enter'
  | 'keypad-preset-up'
  | 'keypad-preset-down'
  | 'fn-1'
  | 'fn-2'
  | 'fn-3'
  | 'fn-4'
  | 'antenna'
  | 'conn-top'
  | 'lcd-area';

export type KnobId = 'knob-channel' | 'knob-volume' | 'knob-squelch';

export type ControlEvent = 'press' | 'release' | 'longpress';

/**
 * Screens shown on the simulated LCD. This is an architectural representation, not a claim about the
 * original firmware's states. 'locked' is the main screen with the keypad locked (simulator feature).
 */
export type Screen = 'off' | 'startup' | 'main' | 'locked' | 'menu' | 'edit' | 'confirm';

/** Audible cues. The logic only names them; the frontend synthesizes the tones. */
export type SoundCue = 'key' | 'knob' | 'power-on' | 'power-off' | 'ptt-down' | 'ptt-up' | 'error' | 'confirm';

/** Menus. 'opt' and 'pgm' are the roots; the others are reached from them. Data lives in menus.ts. */
export type MenuId = 'opt' | 'pgm' | 'pgm.system' | 'pgm.presets' | 'pgm.preset';

/** One stored system preset. Names are simulator defaults; name editing is not supported. */
export type Preset = {
  name: string;
  frequencyHz: number; // integer Hz, FREQ_MIN_HZ..FREQ_MAX_HZ
};

/** A temporary indicator shown on the main screen for a short time (volume or squelch changes). */
export type Overlay = { kind: 'volume' | 'squelch'; value: number } | null;

/** The open menu. path[0] is the root; cursors holds the parent cursors so CLR returns to where the user was. */
export type MenuState = {
  path: MenuId[];
  cursor: number;
  cursors: number[];
  target: number | null; // preset index (0-based) being viewed or edited, in pgm.preset
};

/** What ENT is about to apply on the confirm screen. */
export type PendingConfirm =
  | { kind: 'frequency'; presetIndex: number; frequencyHz: number; prompt: string }
  | { kind: 'reset'; prompt: string };

export type RadioState = {
  power: 'off' | 'on';
  screen: Screen;
  mode: 'standby' | 'receive' | 'transmit'; // transmit is simulated only; receive is never entered (Unknown)
  presets: Preset[]; // 100 stored presets. Persist across power cycles. Restored by reset.
  preset: number; // active preset, 1..PRESET_COUNT. Changed by PRE +/- and by dial positions 1 to 5.
  dial: number; // index into DIAL_POSITIONS. A separate control from the stored presets.
  volume: number; // 0..10
  squelch: number; // 0..10 (simulator control; a squelch control is Unknown on the original)
  monitor: boolean; // simulator monitor state (a monitor control is Unknown on the original)
  brightness: number; // 1..5
  outputPowerW: number; // one of POWER_LEVELS_W
  batteryPct: number; // simulated, 0..100
  batteryDrain: boolean; // off by default; battery-tick actions drain only while on
  locked: boolean; // keypad lock (simulator feature)
  unlockStage: 0 | 1; // 1 after CLR while locked; ENT then unlocks
  menu: MenuState | null;
  edit: { buffer: string } | null; // digit string for the frequency being edited. Strings keep leading zeros.
  pendingConfirm: PendingConfirm | null;
  overlay: Overlay;
  notice: string | null; // short status line for the LCD
  sound: { seq: number; cue: SoundCue }; // seq increments on every audible cue
};

export type RadioAction =
  | { type: 'control'; id: ControlId; event: ControlEvent }
  | { type: 'knob'; id: KnobId; delta: -1 | 1 }
  | { type: 'ptt'; down: boolean }
  | { type: 'tick' } // frontend timer; advances the startup screen to main
  | { type: 'overlay-clear' } // frontend timer; removes the temporary volume or squelch indicator
  | { type: 'battery-tick' } // frontend timer; drains the simulated battery while drain is on
  | { type: 'reset' };

export type LcdRow = {
  text: string;
  inverse?: boolean;
  size: 'small' | 'large';
  /** What an inverse row is, so the small in-radio display can choose which one to show. */
  kind?: 'notice' | 'overlay' | 'cursor';
};

/** Indicators shown only while they apply. */
export type LcdIndicators = {
  power: boolean;
  tx: boolean;
  rx: boolean;
  monitor: boolean;
  locked: boolean;
  lowBattery: boolean;
  battery: number;
};

export type LcdFrame = {
  screen: Screen;
  rows: LcdRow[]; // each row: { text, inverse?, size }
  indicators: LcdIndicators;
  brightness: number; // 0 when off, otherwise 1..5. Both displays apply it.
  label: string; // caption for the placeholder area
  approximated: boolean; // true when any text came from approximated behaviour
};
