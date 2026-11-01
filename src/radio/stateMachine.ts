// Pure device state machine. No React, no DOM, no randomness, no mutation of inputs.
// Behaviour classification for every rule is in docs/device-functionality-v5.md. No primary document for the
// original AN/PRC-152 was readable, so nothing here is Verified-public-doc; rules that follow a game-mod description
// are Secondary-source and the rest are simulator choices.
import {
  BATTERY_DRAIN_STEP_PERCENT,
  BATTERY_PLACEHOLDER_PERCENT,
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  BANDS,
  DEFAULT_UHF_PRESET_STEP_HZ,
  DEFAULT_VHF_PRESET_COUNT,
  DEFAULT_VHF_PRESET_STEP_HZ,
  DIAL_DESCRIPTIONS,
  DIAL_POSITIONS,
  DIAL_PRESET_POSITIONS,
  ENTRY_INCOMPLETE_NOTICE,
  FREQ_ENTRY_DIGITS,
  FREQ_ENTRY_INTEGER_DIGITS,
  FREQ_MAX_HZ,
  FREQ_MIN_HZ,
  FREQ_TUNE_STEP_HZ,
  bandOf,
  INITIAL_BRIGHTNESS,
  INITIAL_DIAL_INDEX,
  INITIAL_OUTPUT_POWER_W,
  INITIAL_PRESET,
  INITIAL_SQUELCH,
  INITIAL_VOLUME,
  OUT_OF_RANGE_NOTICE,
  POWER_LEVELS_W,
  PRESET_COUNT,
  SAVED_NOTICE,
  SQUELCH_MAX,
  SQUELCH_MIN,
  UNAVAILABLE_NOTICE,
  VOLUME_MAX,
  VOLUME_MIN,
} from './config';
import { MENUS } from './menus';
import type {
  ControlEvent,
  ControlId,
  KnobId,
  MenuId,
  MenuState,
  Preset,
  RadioAction,
  RadioState,
  SoundCue,
} from './types';

export const CONFIRM_PROMPT = 'Apply? ENT=yes CLR=no';
export const RESET_PROMPT = 'Reset simulator? ENT=yes CLR=no';
export const LOCKED_NOTICE = 'KEYPAD LOCKED';
export const NOT_USED_NOTICE = 'NOT USED HERE';

function defaultPresetFrequencyHz(i: number): number {
  return i < DEFAULT_VHF_PRESET_COUNT
    ? BANDS[0].minHz + i * DEFAULT_VHF_PRESET_STEP_HZ
    : BANDS[1].minHz + (i - DEFAULT_VHF_PRESET_COUNT) * DEFAULT_UHF_PRESET_STEP_HZ;
}

/** Simulated default presets. Unknown: the factory presets are not documented (see config.ts). */
export function createDefaultPresets(): Preset[] {
  return Array.from({ length: PRESET_COUNT }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return { name: `CHAN ${n}`, frequencyHz: defaultPresetFrequencyHz(i) };
  });
}

export const initialState: RadioState = {
  power: 'off',
  screen: 'off',
  mode: 'standby',
  presets: createDefaultPresets(),
  preset: INITIAL_PRESET,
  dial: INITIAL_DIAL_INDEX,
  volume: INITIAL_VOLUME,
  squelch: INITIAL_SQUELCH,
  monitor: false,
  brightness: INITIAL_BRIGHTNESS,
  outputPowerW: INITIAL_OUTPUT_POWER_W,
  batteryPct: BATTERY_PLACEHOLDER_PERCENT,
  batteryDrain: false,
  locked: false,
  unlockStage: 0,
  menu: null,
  edit: null,
  pendingConfirm: null,
  overlay: null,
  notice: null,
  // Seq 0 is not audible. The frontend plays a cue only when seq changes from the last value it saw.
  sound: { seq: 0, cue: 'power-off' },
  heard: {},
};

/** The frequency of the active preset, in integer Hz. */
export function activeFrequencyHz(state: RadioState): number {
  return state.presets[state.preset - 1].frequencyHz;
}

/**
 * Parses the frequency edit buffer. The buffer is exactly FREQ_ENTRY_DIGITS digits, read as MMM.KKK MHz.
 * Returns integer Hz, or null when the buffer is not complete, not all digits, or outside both bands (VHF 30-87.975 MHz, UHF 225-511.975 MHz).
 * Simulator-specific: the 1 kHz entry increment is coarser than the 10 Hz device resolution.
 */
export function parseFrequencyEntry(buffer: string): number | null {
  if (!new RegExp(`^\\d{${FREQ_ENTRY_DIGITS}}$`).test(buffer)) return null;
  const mhz = Number(buffer.slice(0, FREQ_ENTRY_INTEGER_DIGITS));
  const khz = Number(buffer.slice(FREQ_ENTRY_INTEGER_DIGITS));
  const hz = mhz * 1_000_000 + khz * 1_000;
  return bandOf(hz) ? hz : null;
}

/**
 * True while another instance is transmitting on this radio's active frequency. Simulator-specific (Assumed): the
 * radio must be on and past startup, and not transmitting itself. Squelch, volume, monitor and keypad lock do not
 * gate it, because no signal or audio is simulated. Nothing is transmitted over RF; see docs/device-functionality-v5.md.
 */
export function isReceiving(state: RadioState): boolean {
  if (!isInteractive(state) || state.mode === 'transmit') return false;
  const frequencyHz = activeFrequencyHz(state);
  return Object.values(state.heard).some((hz) => hz === frequencyHz);
}

/** Number of entries in the open menu level. */
export function menuLength(state: RadioState): number {
  const menu = state.menu;
  if (!menu) return 0;
  const id = currentMenuId(menu);
  return id === 'pgm.presets' ? state.presets.length : MENUS[id].items.length;
}

export function currentMenuId(menu: MenuState): MenuId {
  return menu.path[menu.path.length - 1];
}

export function reduce(state: RadioState, action: RadioAction): RadioState {
  switch (action.type) {
    case 'reset':
      // Keeps sound.seq so a reset never makes the seq go backwards. Returns the powered-off defaults.
      // The link's heard senders are kept: they describe other instances, not this radio's settings.
      return { ...initialState, presets: createDefaultPresets(), sound: state.sound, heard: state.heard };
    case 'tick':
      return state.screen === 'startup' ? { ...state, screen: 'main' } : state;
    case 'overlay-clear':
      return state.overlay === null ? state : { ...state, overlay: null };
    case 'battery-tick':
      return batteryTick(state);
    case 'ptt':
      return reducePtt(state, action.down);
    case 'rx-signal':
      return reduceRxSignal(state, action.from, action.frequencyHz, action.active);
    case 'knob':
      return reduceKnob(state, action.id, action.delta);
    case 'control':
      return reduceControl(state, action.id, action.event);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Returns a copy of state with a new audible cue (seq + 1). */
function withCue(state: RadioState, cue: SoundCue): RadioState {
  return { ...state, sound: { seq: state.sound.seq + 1, cue } };
}

/** True while keys, knobs and ptt act: power on, and not during startup or off. */
function isInteractive(state: RadioState): boolean {
  return (
    state.power === 'on' &&
    (state.screen === 'main' ||
      state.screen === 'locked' ||
      state.screen === 'menu' ||
      state.screen === 'edit' ||
      state.screen === 'confirm')
  );
}

/** The transient fields every power change and every screen reset clears. */
const TRANSIENT_CLEARED = {
  mode: 'standby',
  locked: false,
  unlockStage: 0,
  menu: null,
  edit: null,
  pendingConfirm: null,
  overlay: null,
  notice: null,
} as const;

function powerOn(state: RadioState): RadioState {
  // Simulator-specific: power-on goes to a startup screen; the frontend sends tick to reach main. Saved presets are kept.
  // Simulator-specific: powering on a fully drained battery simulates a fresh battery rather than locking the sim.
  const batteryPct = state.batteryPct <= 0 ? BATTERY_PLACEHOLDER_PERCENT : state.batteryPct;
  return withCue({ ...state, ...TRANSIENT_CLEARED, batteryPct, power: 'on', screen: 'startup' }, 'power-on');
}

function powerOff(state: RadioState): RadioState {
  // Stops simulated transmission, exits menus, discards uncommitted edits, and clears the lock and indicators.
  // Saved presets, volume, squelch, brightness and the other settings are kept.
  return withCue({ ...state, ...TRANSIENT_CLEARED, power: 'off', screen: 'off' }, 'power-off');
}

function batteryTick(state: RadioState): RadioState {
  if (state.power !== 'on' || !state.batteryDrain) return state;
  const batteryPct = Math.max(0, state.batteryPct - BATTERY_DRAIN_STEP_PERCENT);
  const drained = { ...state, batteryPct };
  // At 0% the radio powers off and drain switches off, so it can be powered on again (and reset from the OPT menu)
  // instead of switching itself off again at the next tick.
  return batteryPct === 0 ? powerOff({ ...drained, batteryDrain: false }) : drained;
}

function reducePtt(state: RadioState, down: boolean): RadioState {
  // Transmit is simulated only. PTT stays available while the keypad is locked. Ignored unless the radio is interactive.
  if (down) {
    if (!isInteractive(state) || state.mode === 'transmit') return state;
    return withCue({ ...state, mode: 'transmit' }, 'ptt-down');
  }
  if (state.mode !== 'transmit') return state;
  return withCue({ ...state, mode: 'standby' }, 'ptt-up');
}

function reduceRxSignal(state: RadioState, from: string, frequencyHz: number, active: boolean): RadioState {
  // Never changes any setting, only what was heard. A repeat of the same signal returns the same state object.
  if (!active) {
    if (!(from in state.heard)) return state;
    const rest = { ...state.heard };
    delete rest[from];
    return { ...state, heard: rest };
  }
  if (!Number.isFinite(frequencyHz) || state.heard[from] === frequencyHz) return state;
  return { ...state, heard: { ...state.heard, [from]: frequencyHz } };
}

function reduceKnob(state: RadioState, id: KnobId, delta: -1 | 1): RadioState {
  // Knobs do nothing while off or during startup. Values clamp; no wrap. A cue plays only when a value changes.
  if (!isInteractive(state)) return state;
  switch (id) {
    case 'knob-volume':
      return volumeKnob(state, delta); // stays available while the keypad is locked
    case 'knob-squelch':
      return state.screen === 'locked' ? state : squelchKnob(state, delta);
    case 'knob-channel':
      return state.screen === 'main' ? dialKnob(state, delta) : state.screen === 'menu' ? moveCursor(state, delta) : state;
  }
}

function volumeKnob(state: RadioState, delta: -1 | 1): RadioState {
  const volume = clamp(state.volume + delta, VOLUME_MIN, VOLUME_MAX);
  if (volume === state.volume) return state;
  return withCue({ ...state, volume, overlay: { kind: 'volume', value: volume } }, 'knob');
}

function squelchKnob(state: RadioState, delta: -1 | 1): RadioState {
  const squelch = clamp(state.squelch + delta, SQUELCH_MIN, SQUELCH_MAX);
  if (squelch === state.squelch) return state;
  return withCue({ ...state, squelch, overlay: { kind: 'squelch', value: squelch } }, 'knob');
}

/** The notice for a dial position that is not a preset: its meaning when known (S, F, Z, R), otherwise N/A. */
function dialNotice(label: string): string {
  const description = DIAL_DESCRIPTIONS[label];
  return description ? `${label}: ${description.toUpperCase()}` : `DIAL ${label} N/A`;
}

/**
 * The top dial. Simulator-specific: positions 1 to 5 select presets 1 to 5; the other labelled positions are not
 * supported. The dial is a separate control from the 100 stored presets, which PRE + and PRE - step through.
 */
function dialKnob(state: RadioState, delta: -1 | 1): RadioState {
  const dial = clamp(state.dial + delta, 0, DIAL_POSITIONS.length - 1);
  if (dial === state.dial) return state;
  const onPreset = dial >= 1 && dial <= DIAL_PRESET_POSITIONS;
  return withCue(
    {
      ...state,
      dial,
      preset: onPreset ? dial : state.preset,
      overlay: null,
      notice: onPreset ? null : dialNotice(DIAL_POSITIONS[dial]),
    },
    'knob',
  );
}

/** Moves the menu cursor by one entry. Clamped, no wrap. */
function moveCursor(state: RadioState, delta: -1 | 1): RadioState {
  const menu = state.menu;
  if (!menu) return state;
  const cursor = clamp(menu.cursor + delta, 0, menuLength(state) - 1);
  if (cursor === menu.cursor) return state;
  return withCue({ ...state, menu: { ...menu, cursor }, notice: null }, 'knob');
}

function reduceControl(state: RadioState, id: ControlId, event: ControlEvent): RadioState {
  if (id === 'power') {
    // Power toggles on press only. Simulator-specific control: the original's power control is Unknown.
    if (event !== 'press') return state;
    return state.power === 'on' ? powerOff(state) : powerOn(state);
  }

  // Keys act on press only. Ptt and knob IDs are handled by their own actions.
  if (!isInteractive(state) || event !== 'press') return state;
  if (state.screen === 'locked') return lockedKey(state, id);

  const digit = /^keypad-([0-9])$/.exec(id);
  if (digit) return digitKey(state, digit[1]);

  switch (id) {
    case 'keypad-clear':
      return clearKey(state);
    case 'keypad-enter':
      return enterKey(state);
    case 'keypad-preset-up':
      return presetKey(state, 1);
    case 'keypad-preset-down':
      return presetKey(state, -1);
    case 'keypad-star':
    case 'keypad-hash':
      // No source documents these keys. Unavailable, with feedback on the main screen.
      return state.screen === 'main' ? withCue({ ...state, notice: UNAVAILABLE_NOTICE }, 'error') : state;
    default:
      // fn-1..fn-4 (removed V3), antenna, conn-top, lcd-area, ptt and knobs: no key behaviour.
      return state;
  }
}

/** While locked, only the documented-in-the-simulator unlock sequence works: CLR, then ENT. */
function lockedKey(state: RadioState, id: ControlId): RadioState {
  if (id === 'keypad-clear') return withCue({ ...state, unlockStage: 1, notice: null }, 'key');
  if (id === 'keypad-enter' && state.unlockStage === 1) {
    return withCue({ ...state, locked: false, unlockStage: 0, screen: 'main', notice: null }, 'confirm');
  }
  return withCue({ ...state, unlockStage: 0, notice: LOCKED_NOTICE }, 'error');
}

function lockKeypad(state: RadioState): RadioState {
  return withCue(
    { ...state, locked: true, unlockStage: 0, screen: 'locked', menu: null, edit: null, pendingConfirm: null, overlay: null, notice: null },
    'confirm',
  );
}

function digitKey(state: RadioState, digit: string): RadioState {
  switch (state.screen) {
    case 'main':
      // Secondary-source (ACRE2): key 7 is OPT and key 8 is PGM. Other digits have no function on the main screen.
      if (digit === '7') return openMenu(state, 'opt');
      if (digit === '8') return openMenu(state, 'pgm');
      return withCue({ ...state, notice: NOT_USED_NOTICE }, 'error');
    case 'edit': {
      const buffer = state.edit?.buffer ?? '';
      if (buffer.length >= FREQ_ENTRY_DIGITS) return state;
      return withCue({ ...state, edit: { buffer: buffer + digit }, notice: null }, 'key');
    }
    default:
      return state; // menu and confirm: digits have no effect
  }
}

function clearKey(state: RadioState): RadioState {
  switch (state.screen) {
    case 'main':
      // CLR only clears a showing notice or temporary indicator. With nothing to clear it changes nothing and makes no sound.
      if (state.notice === null && state.overlay === null) return state;
      return withCue({ ...state, notice: null, overlay: null }, 'key');
    case 'menu':
      return withCue(menuBack(state), 'key');
    case 'edit':
      // Cancels the typed entry first; a second CLR leaves the edit without changing the preset.
      if ((state.edit?.buffer ?? '') !== '') return withCue({ ...state, edit: { buffer: '' }, notice: null }, 'key');
      return withCue({ ...state, screen: 'menu', edit: null, notice: null }, 'key');
    case 'confirm':
      return withCue({ ...state, screen: 'menu', edit: null, pendingConfirm: null, notice: null }, 'key');
    default:
      return state;
  }
}

function enterKey(state: RadioState): RadioState {
  switch (state.screen) {
    case 'menu':
      return activate(state);
    case 'edit':
      return commitEdit(state);
    case 'confirm':
      return confirmYes(state);
    default:
      return state; // main: ENT has no function (it is not a shortcut to a menu)
  }
}

/**
 * The next tunable frequency one tuning step up or down. Hops the gap between the bands (87.975 MHz up goes to
 * 225.000 MHz and back) and stops at the lowest and highest tunable frequency. Simulator-specific (user-supplied).
 */
export function stepFrequency(hz: number, delta: -1 | 1): number {
  const next = hz + delta * FREQ_TUNE_STEP_HZ;
  if (bandOf(next)) return next;
  if (delta > 0) return next > FREQ_MAX_HZ ? FREQ_MAX_HZ : BANDS[1].minHz;
  return next < FREQ_MIN_HZ ? FREQ_MIN_HZ : BANDS[0].maxHz;
}

/**
 * + and - . On the main screen they retune the active preset by one tuning step (25 kHz). In a menu they move the
 * cursor (no arrow keys on the SVG). Presets are selected with the top dial.
 */
function presetKey(state: RadioState, delta: -1 | 1): RadioState {
  if (state.screen === 'menu') return moveCursor(state, delta);
  if (state.screen !== 'main') return state;
  const index = state.preset - 1;
  const frequencyHz = stepFrequency(state.presets[index].frequencyHz, delta);
  if (frequencyHz === state.presets[index].frequencyHz) return withCue({ ...state, overlay: null, notice: null }, 'error');
  const presets = state.presets.map((p, i) => (i === index ? { ...p, frequencyHz } : p));
  return withCue({ ...state, presets, overlay: null, notice: null }, 'key');
}

function openMenu(state: RadioState, root: 'opt' | 'pgm'): RadioState {
  return withCue(
    { ...state, screen: 'menu', menu: { path: [root], cursor: 0, cursors: [], target: null }, overlay: null, notice: null },
    'key',
  );
}

/** CLR in a menu: back one level, restoring the cursor; at the root, exit to the main screen. */
function menuBack(state: RadioState): RadioState {
  const menu = state.menu;
  if (!menu || menu.path.length <= 1) return { ...state, screen: 'main', menu: null, notice: null };
  const path = menu.path.slice(0, -1);
  return {
    ...state,
    menu: {
      path,
      cursor: menu.cursors[menu.cursors.length - 1] ?? 0,
      cursors: menu.cursors.slice(0, -1),
      target: path[path.length - 1] === 'pgm.preset' ? menu.target : null,
    },
    notice: null,
  };
}

function pushMenu(state: RadioState, menu: MenuState, to: MenuId, target: number | null): RadioState {
  return withCue(
    { ...state, menu: { path: [...menu.path, to], cursor: 0, cursors: [...menu.cursors, menu.cursor], target }, notice: null },
    'key',
  );
}

/** ENT on the highlighted menu entry. */
function activate(state: RadioState): RadioState {
  const menu = state.menu;
  if (!menu) return state;
  const id = currentMenuId(menu);

  if (id === 'pgm.presets') return pushMenu(state, menu, 'pgm.preset', menu.cursor);

  const item = MENUS[id].items[menu.cursor];
  switch (item.kind) {
    case 'submenu':
      return item.to ? pushMenu(state, menu, item.to, menu.target) : state;
    case 'toggle':
      return withCue(
        item.id === 'monitor' ? { ...state, monitor: !state.monitor, notice: null } : { ...state, batteryDrain: !state.batteryDrain, notice: null },
        'confirm',
      );
    case 'cycle':
      return withCue(item.id === 'brightness' ? { ...state, brightness: nextBrightness(state.brightness), notice: null } : { ...state, outputPowerW: nextPower(state.outputPowerW), notice: null }, 'confirm');
    case 'action':
      return item.id === 'lock'
        ? lockKeypad(state)
        : withCue({ ...state, screen: 'confirm', pendingConfirm: { kind: 'reset', prompt: RESET_PROMPT }, notice: null }, 'key');
    case 'edit':
      return menu.target === null ? state : withCue({ ...state, screen: 'edit', edit: { buffer: '' }, notice: null }, 'key');
    case 'unavailable':
      return withCue({ ...state, notice: UNAVAILABLE_NOTICE }, 'error');
  }
}

function nextBrightness(value: number): number {
  return value >= BRIGHTNESS_MAX ? BRIGHTNESS_MIN : value + 1;
}

function nextPower(watts: number): number {
  const index = POWER_LEVELS_W.indexOf(watts);
  return POWER_LEVELS_W[(index + 1) % POWER_LEVELS_W.length];
}

/** ENT in the frequency edit: validates the buffer, then asks for confirmation. Nothing is saved yet. */
function commitEdit(state: RadioState): RadioState {
  const menu = state.menu;
  if (!menu || menu.target === null) return state;
  const buffer = state.edit?.buffer ?? '';
  if (buffer.length !== FREQ_ENTRY_DIGITS) return withCue({ ...state, notice: ENTRY_INCOMPLETE_NOTICE }, 'error');
  const frequencyHz = parseFrequencyEntry(buffer);
  if (frequencyHz === null) return withCue({ ...state, notice: OUT_OF_RANGE_NOTICE }, 'error');
  return withCue(
    {
      ...state,
      screen: 'confirm',
      edit: null,
      pendingConfirm: { kind: 'frequency', presetIndex: menu.target, frequencyHz, prompt: CONFIRM_PROMPT },
      notice: null,
    },
    'key',
  );
}

/** ENT on the confirm screen applies the pending change. */
function confirmYes(state: RadioState): RadioState {
  const pending = state.pendingConfirm;
  if (!pending) return state;
  if (pending.kind === 'reset') {
    // Restores the simulated defaults and returns to the main screen. The radio stays on.
    return withCue({ ...initialState, presets: createDefaultPresets(), power: 'on', screen: 'main', sound: state.sound }, 'confirm');
  }
  const presets = state.presets.map((p, i) => (i === pending.presetIndex ? { ...p, frequencyHz: pending.frequencyHz } : p));
  return withCue({ ...state, presets, screen: 'menu', edit: null, pendingConfirm: null, notice: SAVED_NOTICE }, 'confirm');
}
