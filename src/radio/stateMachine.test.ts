// Tests for the pure reducer. Each test name states the behaviour and, where it matters, its accuracy status.
// Accuracy tags follow src/radio/config.ts and menus.ts: Assumed = simulator choice, Secondary-source = game-mod
// description, Unknown = not documented. Nothing here is a claim about the original AN/PRC-152.
import { describe, expect, it } from 'vitest';
import { BATTERY_DRAIN_STEP_PERCENT, FREQ_MAX_HZ, FREQ_MIN_HZ, LOW_BATTERY_PERCENT, PRESET_COUNT, bandOf } from './config';
import {
  CONFIRM_PROMPT,
  LOCKED_NOTICE,
  NOT_USED_NOTICE,
  RESET_PROMPT,
  activeFrequencyHz,
  createDefaultPresets,
  initialState,
  isReceiving,
  parseFrequencyEntry,
  reduce,
  stepFrequency,
} from './stateMachine';
import { renderLcd } from './lcd';
import type { ControlId, KnobId, RadioAction, RadioState } from './types';

const UNAVAILABLE_NOTICE = 'UNAVAILABLE IN SIM';
const ENTRY_INCOMPLETE_NOTICE = 'ENTER 6 DIGITS';
const OUT_OF_RANGE_NOTICE = 'OUT OF RANGE';
const SAVED_NOTICE = 'SAVED';

const press = (id: ControlId): RadioAction => ({ type: 'control', id, event: 'press' });
const release = (id: ControlId): RadioAction => ({ type: 'control', id, event: 'release' });
const knob = (id: KnobId, delta: -1 | 1): RadioAction => ({ type: 'knob', id, delta });
const digit = (d: string): RadioAction => press(`keypad-${d}` as ControlId);
const ptt = (down: boolean): RadioAction => ({ type: 'ptt', down });
const POWER = press('power');
const ENT = press('keypad-enter');
const CLR = press('keypad-clear');
const PRE_UP = press('keypad-preset-up');
const PRE_DOWN = press('keypad-preset-down');
const TICK: RadioAction = { type: 'tick' };
const BATTERY_TICK: RadioAction = { type: 'battery-tick' };
const OVERLAY_CLEAR: RadioAction = { type: 'overlay-clear' };

/** Applies actions in order. */
function run(state: RadioState, ...actions: RadioAction[]): RadioState {
  return actions.reduce((s, a) => reduce(s, a), state);
}

/** Types a digit string on the current screen. */
function digits(state: RadioState, text: string): RadioState {
  return run(state, ...[...text].map(digit));
}

/** Presses one action n times. */
function repeat(state: RadioState, action: RadioAction, n: number): RadioState {
  return run(state, ...Array.from({ length: n }, () => action));
}

/** Power on and startup tick: the radio is on the main screen. */
function main(): RadioState {
  return run(initialState, POWER, TICK);
}

/** Main screen with the OPT menu open and the cursor on the given entry (0 = Keypad Lock ... 7 = Waveform). */
function optAt(cursor: number): RadioState {
  return repeat(run(main(), digit('7')), PRE_UP, cursor);
}

/** Opens the Frequency edit for a preset (0-based index) via PGM > System Preset Settings > System Presets. */
function editFrequencyOf(presetIndex: number): RadioState {
  const atPresetList = run(main(), digit('8'), ENT, ENT);
  const atPreset = run(repeat(atPresetList, PRE_UP, presetIndex), ENT);
  return run(atPreset, ENT);
}

/** Builds a deep-frozen copy of a state, so a mutating reducer would throw in strict mode. */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    const children: unknown[] = Object.values(value);
    children.forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function deepCopy(state: RadioState): RadioState {
  return structuredClone(state);
}

describe('initial state and power', () => {
  it('Assumed: initial state is powered off, on the off screen, with default settings', () => {
    expect(initialState.power).toBe('off');
    expect(initialState.screen).toBe('off');
    expect(initialState.mode).toBe('standby');
    expect(initialState.preset).toBe(1);
    expect(initialState.dial).toBe(1);
    expect(initialState.volume).toBe(5);
    expect(initialState.squelch).toBe(5);
    expect(initialState.brightness).toBe(5);
    expect(initialState.batteryPct).toBe(100);
    expect(initialState.batteryDrain).toBe(false);
    expect(initialState.menu).toBeNull();
    expect(initialState.edit).toBeNull();
    expect(initialState.overlay).toBeNull();
    expect(initialState.notice).toBeNull();
  });

  it('Assumed: power on from off goes to the startup screen, not main', () => {
    const s = reduce(initialState, POWER);
    expect(s.power).toBe('on');
    expect(s.screen).toBe('startup');
    expect(s.sound).toEqual({ seq: 1, cue: 'power-on' });
  });

  it('Assumed: a tick during startup moves the radio to the main screen', () => {
    expect(reduce(reduce(initialState, POWER), TICK).screen).toBe('main');
  });

  it('a tick outside startup returns the same state object', () => {
    const on = main();
    expect(reduce(on, TICK)).toBe(on);
    expect(reduce(initialState, TICK)).toBe(initialState);
  });

  it('a power release event (not a press) is ignored and returns the same state', () => {
    expect(reduce(initialState, release('power'))).toBe(initialState);
  });

  it('Assumed: power off from the main screen keeps presets, volume, squelch, brightness, preset, dial and battery', () => {
    let s = main();
    s = run(s, PRE_UP, PRE_UP, knob('knob-volume', 1), knob('knob-squelch', -1));
    const before = s;
    const off = reduce(s, POWER);
    expect(off.power).toBe('off');
    expect(off.screen).toBe('off');
    expect(off.presets).toEqual(before.presets);
    expect(off.preset).toBe(before.preset);
    expect(off.dial).toBe(before.dial);
    expect(off.volume).toBe(before.volume);
    expect(off.squelch).toBe(before.squelch);
    expect(off.brightness).toBe(before.brightness);
    expect(off.batteryPct).toBe(before.batteryPct);
    expect(off.sound.cue).toBe('power-off');
  });

  it('Assumed: power off clears menu, edit, pending confirm, overlay, notice, lock, unlock stage and transmit', () => {
    // Build a state with many transient fields set at once.
    const busy: RadioState = {
      ...main(),
      mode: 'transmit',
      locked: true,
      unlockStage: 1,
      menu: { path: ['pgm', 'pgm.system'], cursor: 0, cursors: [0], target: null },
      edit: { buffer: '15' },
      pendingConfirm: { kind: 'reset', prompt: RESET_PROMPT },
      overlay: { kind: 'volume', value: 6 },
      notice: 'SOMETHING',
      screen: 'confirm',
    };
    const off = reduce(busy, POWER);
    expect(off.screen).toBe('off');
    expect(off.mode).toBe('standby');
    expect(off.locked).toBe(false);
    expect(off.unlockStage).toBe(0);
    expect(off.menu).toBeNull();
    expect(off.edit).toBeNull();
    expect(off.pendingConfirm).toBeNull();
    expect(off.overlay).toBeNull();
    expect(off.notice).toBeNull();
  });

  it('Assumed: while off, key presses, knobs and PTT return the same state object', () => {
    const off = initialState;
    expect(reduce(off, digit('7'))).toBe(off);
    expect(reduce(off, ENT)).toBe(off);
    expect(reduce(off, PRE_UP)).toBe(off);
    expect(reduce(off, knob('knob-volume', 1))).toBe(off);
    expect(reduce(off, knob('knob-channel', 1))).toBe(off);
    expect(reduce(off, ptt(true))).toBe(off);
    expect(reduce(off, BATTERY_TICK)).toBe(off);
  });

  it('Assumed: during startup, keys, knobs and PTT are ignored and return the same state object', () => {
    const startup = reduce(initialState, POWER);
    expect(reduce(startup, digit('8'))).toBe(startup);
    expect(reduce(startup, ENT)).toBe(startup);
    expect(reduce(startup, knob('knob-channel', 1))).toBe(startup);
    expect(reduce(startup, knob('knob-volume', -1))).toBe(startup);
    expect(reduce(startup, knob('knob-squelch', 1))).toBe(startup);
    expect(reduce(startup, ptt(true))).toBe(startup);
  });

  it('Assumed: powering off during PTT clears transmit (mode standby)', () => {
    const transmitting = reduce(main(), ptt(true));
    expect(transmitting.mode).toBe('transmit');
    expect(reduce(transmitting, POWER).mode).toBe('standby');
  });

  it('Assumed: power on after an off clears the keypad lock', () => {
    const locked = run(optAt(0), ENT);
    expect(locked.locked).toBe(true);
    const cycled = run(locked, POWER, POWER, TICK);
    expect(cycled.screen).toBe('main');
    expect(cycled.locked).toBe(false);
  });
});

describe('main screen digits and star/hash', () => {
  it('Secondary-source: key 7 on the main screen opens the OPT menu', () => {
    const s = run(main(), digit('7'));
    expect(s.screen).toBe('menu');
    expect(s.menu).toEqual({ path: ['opt'], cursor: 0, cursors: [], target: null });
  });

  it('Secondary-source: key 8 on the main screen opens the PGM menu', () => {
    const s = run(main(), digit('8'));
    expect(s.screen).toBe('menu');
    expect(s.menu).toEqual({ path: ['pgm'], cursor: 0, cursors: [], target: null });
  });

  it.each(['0', '1', '2', '3', '4', '5', '6', '9'])('digit %s on the main screen sets the not-used notice with an error cue', (d) => {
    const s = run(main(), digit(d));
    expect(s.screen).toBe('main');
    expect(s.notice).toBe(NOT_USED_NOTICE);
    expect(s.sound.cue).toBe('error');
  });

  it.each(['keypad-star', 'keypad-hash'] as const)('Unknown: %s on the main screen sets the unavailable notice with an error cue', (id) => {
    const s = run(main(), press(id));
    expect(s.notice).toBe(UNAVAILABLE_NOTICE);
    expect(s.sound.cue).toBe('error');
  });

  it('Assumed: ENT on the main screen does nothing and returns the same state (not a menu shortcut)', () => {
    const on = main();
    expect(reduce(on, ENT)).toBe(on);
  });

  it('Secondary-source: opening OPT with key 7 bumps the sound sequence by exactly one', () => {
    const on = main();
    const s = reduce(on, digit('7'));
    expect(s.sound.seq).toBe(on.sound.seq + 1);
  });
});

describe('tuning with + and - on the main screen', () => {
  const tuned = (hz: number): RadioState => {
    const on = main();
    return { ...on, presets: on.presets.map((p, i) => (i === on.preset - 1 ? { ...p, frequencyHz: hz } : p)) };
  };
  const freq = (s: RadioState): number => s.presets[s.preset - 1].frequencyHz;

  it('Assumed: + raises the active preset frequency by 25 kHz and plays the key cue', () => {
    const s = run(main(), PRE_UP);
    expect(freq(s)).toBe(30_025_000);
    expect(s.preset).toBe(1);
    expect(s.sound.seq).toBe(main().sound.seq + 1);
  });

  it('Assumed: - lowers it by 25 kHz', () => {
    expect(freq(run(tuned(450_000_000), PRE_DOWN))).toBe(449_975_000);
  });

  it('Assumed: only the active preset changes, and never the dial', () => {
    const s = repeat(main(), PRE_UP, 7);
    expect(freq(s)).toBe(30_175_000);
    expect(s.dial).toBe(1);
    expect(s.presets.slice(1)).toEqual(main().presets.slice(1));
  });

  it('Assumed: + at 87.975 MHz hops the gap to 225.000 MHz, and - at 225.000 MHz hops back', () => {
    expect(freq(run(tuned(87_975_000), PRE_UP))).toBe(225_000_000);
    expect(freq(run(tuned(225_000_000), PRE_DOWN))).toBe(87_975_000);
  });

  it('Assumed: the lowest and highest frequencies stop with the error cue and no change', () => {
    const low = tuned(FREQ_MIN_HZ);
    const afterLow = run(low, PRE_DOWN);
    expect(freq(afterLow)).toBe(FREQ_MIN_HZ);
    expect(afterLow.sound.cue).toBe('error');
    const high = tuned(FREQ_MAX_HZ);
    expect(freq(run(high, PRE_UP))).toBe(FREQ_MAX_HZ);
  });

  it('stepFrequency never lands in the gap', () => {
    let hz = FREQ_MIN_HZ;
    for (let next = stepFrequency(hz, 1); next !== hz; hz = next, next = stepFrequency(hz, 1)) {
      expect(bandOf(next)).not.toBeNull();
    }
    expect(hz).toBe(FREQ_MAX_HZ);
  });

  it('Assumed: + and - do nothing in the edit and confirm screens', () => {
    const edit = editFrequencyOf(0);
    expect(reduce(edit, PRE_UP)).toBe(edit);
    const onConfirm = run(digits(edit, '450000'), ENT);
    expect(onConfirm.screen).toBe('confirm');
    expect(reduce(onConfirm, PRE_UP)).toBe(onConfirm);
  });
});

describe('menu navigation', () => {
  it('Assumed: PRE + and PRE - move the menu cursor, clamped to the menu length without wrap', () => {
    const top = optAt(0);
    expect(reduce(top, PRE_DOWN)).toBe(top);
    const last = repeat(top, PRE_UP, 7);
    expect(last.menu?.cursor).toBe(7);
    expect(reduce(last, PRE_UP)).toBe(last);
  });

  it('Assumed: the dial (knob-channel) moves the menu cursor', () => {
    const s = run(main(), digit('7'), knob('knob-channel', 1));
    expect(s.menu?.cursor).toBe(1);
    expect(run(s, knob('knob-channel', -1)).menu?.cursor).toBe(0);
  });

  it('a clamped cursor move at the top of the OPT menu returns the same state object', () => {
    const top = optAt(0);
    expect(reduce(top, knob('knob-channel', -1))).toBe(top);
  });

  it('Assumed: CLR at the root menu returns to the main screen with menu null', () => {
    const s = run(main(), digit('7'), CLR);
    expect(s.screen).toBe('main');
    expect(s.menu).toBeNull();
  });

  it('Assumed: CLR in a submenu goes back one level and restores the parent cursor', () => {
    // PGM (cursor 0) -> System Preset Settings -> System Presets (cursor moved to 4) -> preset 5 -> back.
    let s = run(main(), digit('8'), ENT, ENT);
    expect(s.menu?.path).toEqual(['pgm', 'pgm.system', 'pgm.presets']);
    s = repeat(s, PRE_UP, 4);
    s = run(s, ENT);
    expect(s.menu?.path).toEqual(['pgm', 'pgm.system', 'pgm.presets', 'pgm.preset']);
    expect(s.menu?.target).toBe(4);
    expect(s.menu?.cursor).toBe(0);

    s = run(s, CLR);
    expect(s.menu?.path).toEqual(['pgm', 'pgm.system', 'pgm.presets']);
    expect(s.menu?.cursor).toBe(4);
    expect(s.menu?.target).toBeNull();

    s = run(s, CLR);
    expect(s.menu?.path).toEqual(['pgm', 'pgm.system']);
    expect(s.menu?.cursor).toBe(0);

    s = run(s, CLR);
    expect(s.menu?.path).toEqual(['pgm']);
    expect(s.menu?.cursor).toBe(0);

    s = run(s, CLR);
    expect(s.screen).toBe('main');
    expect(s.menu).toBeNull();
  });

  it('Assumed: ENT on an unavailable item (COMSEC) sets the unavailable notice with an error cue', () => {
    const s = run(optAt(6), ENT);
    expect(s.screen).toBe('menu');
    expect(s.notice).toBe(UNAVAILABLE_NOTICE);
    expect(s.sound.cue).toBe('error');
  });

  it('Assumed: ENT on the PGM item "Other Programming" is unavailable', () => {
    const s = run(main(), digit('8'), PRE_UP, ENT);
    expect(s.notice).toBe(UNAVAILABLE_NOTICE);
    expect(s.menu?.path).toEqual(['pgm']);
  });

  it('Assumed: moving the cursor in a menu clears a previous notice', () => {
    const withNotice = run(optAt(6), ENT);
    expect(withNotice.notice).toBe(UNAVAILABLE_NOTICE);
    expect(run(withNotice, PRE_DOWN).notice).toBeNull();
  });
});

describe('toggles and cycles in the OPT menu', () => {
  it('Assumed: Monitor toggles state.monitor on each ENT, with a confirm cue', () => {
    const on = run(optAt(1), ENT);
    expect(on.monitor).toBe(true);
    expect(on.sound.cue).toBe('confirm');
    expect(run(on, ENT).monitor).toBe(false);
  });

  it('Assumed: Display Bright steps brightness 5, 1, 2, 3, 4, 5 (wraps from 5 to 1)', () => {
    let s = optAt(2);
    expect(s.brightness).toBe(5);
    const seen: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      s = run(s, ENT);
      seen.push(s.brightness);
    }
    expect(seen).toEqual([1, 2, 3, 4, 5]);
    expect(s.sound.cue).toBe('confirm');
  });

  it('Assumed: RF Power cycles through POWER_LEVELS_W (0.25 W, 5 W) and wraps', () => {
    const first = run(optAt(3), ENT);
    expect(first.outputPowerW).toBe(5);
    expect(run(first, ENT).outputPowerW).toBe(0.25);
    expect(first.sound.cue).toBe('confirm');
  });

  it('Assumed: Battery Drain toggles batteryDrain on each ENT, with a confirm cue', () => {
    const on = run(optAt(4), ENT);
    expect(on.batteryDrain).toBe(true);
    expect(on.sound.cue).toBe('confirm');
    expect(run(on, ENT).batteryDrain).toBe(false);
  });
});

describe('frequency entry in PGM > System Presets > Preset > Frequency', () => {
  it('Assumed: ENT on the Frequency item opens the edit screen with an empty buffer for that preset', () => {
    const s = editFrequencyOf(2);
    expect(s.screen).toBe('edit');
    expect(s.edit).toEqual({ buffer: '' });
    expect(s.menu?.target).toBe(2);
  });

  it('Assumed: digits append to the buffer and leading zeros are kept as a string', () => {
    const s = digits(editFrequencyOf(0), '030000');
    expect(s.edit).toEqual({ buffer: '030000' });
  });

  it('Assumed: a seventh digit is ignored (buffer stays at six digits, same state object)', () => {
    const full = digits(editFrequencyOf(0), '450000');
    expect(reduce(full, digit('7'))).toBe(full);
  });

  it('Assumed: ENT with fewer than six digits sets the incomplete notice, keeps the buffer, stays in edit', () => {
    const s = run(digits(editFrequencyOf(0), '1500'), ENT);
    expect(s.screen).toBe('edit');
    expect(s.edit).toEqual({ buffer: '1500' });
    expect(s.notice).toBe(ENTRY_INCOMPLETE_NOTICE);
    expect(s.sound.cue).toBe('error');
  });

  it('Assumed: ENT with an empty buffer is an incomplete entry, not a valid frequency', () => {
    const s = run(editFrequencyOf(0), ENT);
    expect(s.screen).toBe('edit');
    expect(s.notice).toBe(ENTRY_INCOMPLETE_NOTICE);
  });

  it.each(['029999', '087976', '150000', '224999', '511976', '512000', '999999', '000000'])('ENT with %s (outside VHF 30-87.975 and UHF 225-511.975 MHz) sets the out-of-range notice', (buf) => {
    const s = run(digits(editFrequencyOf(0), buf), ENT);
    expect(s.screen).toBe('edit');
    expect(s.notice).toBe(OUT_OF_RANGE_NOTICE);
    expect(s.sound.cue).toBe('error');
  });

  it.each([
    ['030000', 30_000_000],
    ['087975', 87_975_000],
    ['225000', 225_000_000],
    ['511975', 511_975_000],
    ['450000', 450_000_000],
  ])('Assumed: ENT with %s is valid and goes to the confirm screen with %i Hz', (buf, hz) => {
    const s = run(digits(editFrequencyOf(0), buf), ENT);
    expect(s.screen).toBe('confirm');
    expect(s.pendingConfirm).toEqual({ kind: 'frequency', presetIndex: 0, frequencyHz: hz, prompt: CONFIRM_PROMPT });
  });

  it('Assumed: a valid entry does not change any preset until ENT is pressed on the confirm screen', () => {
    const s = run(digits(editFrequencyOf(2), '450000'), ENT);
    expect(s.screen).toBe('confirm');
    expect(s.presets).toEqual(createDefaultPresets());
  });

  it('Assumed: ENT on confirm saves only the chosen preset, leaves every other preset unchanged, and shows SAVED', () => {
    const saved = run(digits(editFrequencyOf(2), '450000'), ENT, ENT);
    expect(saved.screen).toBe('menu');
    expect(saved.notice).toBe(SAVED_NOTICE);
    expect(saved.pendingConfirm).toBeNull();
    expect(saved.edit).toBeNull();
    const defaults = createDefaultPresets();
    expect(saved.presets).toHaveLength(PRESET_COUNT);
    expect(saved.presets[2].frequencyHz).toBe(450_000_000);
    saved.presets.forEach((p, i) => {
      if (i !== 2) expect(p).toEqual(defaults[i]);
    });
  });

  it('Assumed: editing the active preset changes activeFrequencyHz', () => {
    const saved = run(digits(editFrequencyOf(0), '450000'), ENT, ENT);
    expect(activeFrequencyHz(saved)).toBe(450_000_000);
  });

  it('Assumed: CLR on the confirm screen cancels without changing presets and returns to the menu', () => {
    const cancelled = run(digits(editFrequencyOf(2), '450000'), ENT, CLR);
    expect(cancelled.screen).toBe('menu');
    expect(cancelled.pendingConfirm).toBeNull();
    expect(cancelled.presets).toEqual(createDefaultPresets());
  });

  it('Assumed: CLR in edit with a non-empty buffer clears the buffer and stays in edit', () => {
    const s = run(digits(editFrequencyOf(0), '15'), CLR);
    expect(s.screen).toBe('edit');
    expect(s.edit).toEqual({ buffer: '' });
    expect(s.presets).toEqual(createDefaultPresets());
  });

  it('Assumed: CLR in edit with an empty buffer returns to the menu without changing presets', () => {
    const s = run(editFrequencyOf(0), CLR);
    expect(s.screen).toBe('menu');
    expect(s.edit).toBeNull();
    expect(s.presets).toEqual(createDefaultPresets());
  });

  it('Assumed: digits are ignored on the menu and confirm screens (same state object)', () => {
    const onMenu = run(main(), digit('8'));
    expect(reduce(onMenu, digit('1'))).toBe(onMenu);
    const onConfirm = run(digits(editFrequencyOf(0), '450000'), ENT);
    expect(reduce(onConfirm, digit('1'))).toBe(onConfirm);
  });

  it('Assumed: name (Name item) is unavailable and does not open edit', () => {
    const s = run(editFrequencyOf(0), CLR, PRE_UP, ENT);
    expect(s.screen).toBe('menu');
    expect(s.notice).toBe(UNAVAILABLE_NOTICE);
  });
});

describe('frequency parsing (parseFrequencyEntry)', () => {
  it('Assumed: six digits read as MMM.KKK MHz, so 450000 is 450.000 MHz', () => {
    expect(parseFrequencyEntry('450000')).toBe(450_000_000);
  });

  it('multiband: VHF is 30.000-87.975 MHz and UHF is 225.000-511.975 MHz, both inclusive', () => {
    expect(parseFrequencyEntry('030000')).toBe(FREQ_MIN_HZ);
    expect(parseFrequencyEntry('087975')).toBe(87_975_000);
    expect(parseFrequencyEntry('225000')).toBe(225_000_000);
    expect(parseFrequencyEntry('511975')).toBe(FREQ_MAX_HZ);
  });

  it('multiband: the gap between the bands is not tunable', () => {
    expect(parseFrequencyEntry('087976')).toBeNull();
    expect(parseFrequencyEntry('150000')).toBeNull();
    expect(parseFrequencyEntry('224999')).toBeNull();
  });

  it('multiband: every default preset is inside a band', () => {
    for (const p of createDefaultPresets()) expect(bandOf(p.frequencyHz)).not.toBeNull();
  });

  it('Assumed: the kHz digits are kept at 1 kHz resolution (450123 is 450.123 MHz)', () => {
    expect(parseFrequencyEntry('450123')).toBe(450_123_000);
  });

  it('returns null for non-six-digit, non-digit, or out-of-band buffers', () => {
    expect(parseFrequencyEntry('')).toBeNull();
    expect(parseFrequencyEntry('1500')).toBeNull();
    expect(parseFrequencyEntry('4500000')).toBeNull();
    expect(parseFrequencyEntry('15A000')).toBeNull();
    expect(parseFrequencyEntry('029999')).toBeNull();
    expect(parseFrequencyEntry('511976')).toBeNull();
  });
});

describe('volume and squelch knobs', () => {
  it('Assumed: volume knob +1 raises volume, creates a volume overlay and plays the knob cue', () => {
    const s = reduce(main(), knob('knob-volume', 1));
    expect(s.volume).toBe(6);
    expect(s.overlay).toEqual({ kind: 'volume', value: 6 });
    expect(s.sound.cue).toBe('knob');
  });

  it('Assumed: volume clamps at 10 and 0; at the limit the state object is unchanged', () => {
    const top = repeat(main(), knob('knob-volume', 1), 5);
    expect(top.volume).toBe(10);
    expect(reduce(top, knob('knob-volume', 1))).toBe(top);
    const bottom = repeat(main(), knob('knob-volume', -1), 5);
    expect(bottom.volume).toBe(0);
    expect(reduce(bottom, knob('knob-volume', -1))).toBe(bottom);
  });

  it('Assumed: squelch knob changes squelch and creates a squelch overlay', () => {
    const s = reduce(main(), knob('knob-squelch', -1));
    expect(s.squelch).toBe(4);
    expect(s.overlay).toEqual({ kind: 'squelch', value: 4 });
  });

  it('Assumed: squelch clamps at 0 and 10', () => {
    const bottom = repeat(main(), knob('knob-squelch', -1), 5);
    expect(bottom.squelch).toBe(0);
    expect(reduce(bottom, knob('knob-squelch', -1))).toBe(bottom);
  });

  it('Assumed: volume works in the menu screen', () => {
    const s = reduce(optAt(0), knob('knob-volume', -1));
    expect(s.volume).toBe(4);
  });

  it('Assumed: volume works while the keypad is locked; squelch does not', () => {
    const locked = run(optAt(0), ENT);
    expect(reduce(locked, knob('knob-volume', 1)).volume).toBe(6);
    expect(reduce(locked, knob('knob-squelch', 1))).toBe(locked);
  });

  it('Assumed: overlay-clear removes the overlay; when there is none it returns the same state', () => {
    const shown = reduce(main(), knob('knob-volume', 1));
    expect(shown.overlay).not.toBeNull();
    const cleared = reduce(shown, OVERLAY_CLEAR);
    expect(cleared.overlay).toBeNull();
    expect(reduce(cleared, OVERLAY_CLEAR)).toBe(cleared);
  });
});

describe('dial (knob-channel) on the main screen', () => {
  it('Assumed: the dial starts at index 1 on preset 1', () => {
    expect(main().dial).toBe(1);
    expect(main().preset).toBe(1);
  });

  it('Assumed: dial position 2 sets preset 2 and clears any notice', () => {
    const s = reduce(main(), knob('knob-channel', 1));
    expect(s.dial).toBe(2);
    expect(s.preset).toBe(2);
    expect(s.notice).toBeNull();
    expect(s.sound.cue).toBe('knob');
  });

  it('Assumed: dial positions 1 to 5 select presets 1 to 5', () => {
    let s = main();
    for (const expected of [2, 3, 4, 5]) {
      s = reduce(s, knob('knob-channel', 1));
      expect(s.preset).toBe(expected);
      expect(s.dial).toBe(expected);
    }
    expect(reduce(s, knob('knob-channel', -1)).preset).toBe(4);
  });

  it('dial position S (index 6) is described but not simulated: preset unchanged, notice S: SCAN CHANNELS', () => {
    const s = repeat(main(), knob('knob-channel', 1), 4);
    expect(s.dial).toBe(5);
    expect(s.preset).toBe(5);
    const onS = reduce(s, knob('knob-channel', 1));
    expect(onS.dial).toBe(6);
    expect(onS.preset).toBe(5);
    expect(onS.notice).toBe('S: SCAN CHANNELS');
    expect(onS.sound.cue).toBe('knob');
  });

  it('dial positions F, Z and R show their descriptions', () => {
    let s = repeat(main(), knob('knob-channel', 1), 4);
    const notices: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      s = reduce(s, knob('knob-channel', 1));
      notices.push(s.notice ?? '');
    }
    expect(notices).toEqual(['S: SCAN CHANNELS', 'F: SELECT PRESETS USING THE FRONT PANEL', 'Z: ZEROIZE SECURITY KEYS', 'R: RETRANSMISSION FUNCTION']);
    expect(s.preset).toBe(5);
  });

  it('Assumed: dial position SCAN (index 0) is not supported: preset unchanged, notice DIAL SCAN N/A', () => {
    const s = reduce(main(), knob('knob-channel', -1));
    expect(s.dial).toBe(0);
    expect(s.preset).toBe(1);
    expect(s.notice).toBe('DIAL SCAN N/A');
  });

  it('Assumed: the dial clamps at index 0 and index 9; at the limit the state object is unchanged', () => {
    const bottom = reduce(main(), knob('knob-channel', -1));
    expect(reduce(bottom, knob('knob-channel', -1))).toBe(bottom);
    const top = repeat(main(), knob('knob-channel', 1), 8);
    expect(top.dial).toBe(9);
    expect(reduce(top, knob('knob-channel', 1))).toBe(top);
  });

  it('Assumed: + and - retune the active preset without moving the dial or changing the preset number', () => {
    const s = repeat(main(), PRE_UP, 3);
    expect(s.preset).toBe(1);
    expect(s.dial).toBe(1);
  });

  it('Assumed: the dial does nothing on the edit, confirm and locked screens', () => {
    const edit = editFrequencyOf(0);
    expect(reduce(edit, knob('knob-channel', 1))).toBe(edit);
    const confirm = run(digits(edit, '450000'), ENT);
    expect(reduce(confirm, knob('knob-channel', 1))).toBe(confirm);
    const locked = run(optAt(0), ENT);
    expect(reduce(locked, knob('knob-channel', 1))).toBe(locked);
  });
});

describe('keypad lock (simulator feature)', () => {
  it('Assumed: OPT > Keypad Lock sets the locked screen, locked true, and closes the menu', () => {
    const s = run(optAt(0), ENT);
    expect(s.screen).toBe('locked');
    expect(s.locked).toBe(true);
    expect(s.menu).toBeNull();
    expect(s.sound.cue).toBe('confirm');
  });

  it('Assumed: while locked, a digit press sets the locked notice with an error cue (keys do not act)', () => {
    const locked = run(optAt(0), ENT);
    const s = run(locked, digit('5'));
    expect(s.screen).toBe('locked');
    expect(s.notice).toBe(LOCKED_NOTICE);
    expect(s.sound.cue).toBe('error');
  });

  it('Assumed: while locked, the unlock attempt CLR, 5, ENT does not unlock', () => {
    const s = run(optAt(0), ENT, CLR, digit('5'), ENT);
    expect(s.locked).toBe(true);
    expect(s.screen).toBe('locked');
    expect(s.unlockStage).toBe(0);
    expect(s.notice).toBe(LOCKED_NOTICE);
  });

  it('Assumed: while locked, ENT without a preceding CLR does not unlock', () => {
    const s = run(optAt(0), ENT, ENT);
    expect(s.locked).toBe(true);
    expect(s.notice).toBe(LOCKED_NOTICE);
  });

  it('Assumed: CLR then ENT unlocks: main screen, cue confirm, no notice', () => {
    const s = run(optAt(0), ENT, CLR, ENT);
    expect(s.locked).toBe(false);
    expect(s.screen).toBe('main');
    expect(s.unlockStage).toBe(0);
    expect(s.notice).toBeNull();
    expect(s.sound.cue).toBe('confirm');
  });

  it('Assumed: a wrong key between CLR and ENT cancels the unlock stage', () => {
    const s = run(optAt(0), ENT, CLR, digit('1'), ENT);
    expect(s.locked).toBe(true);
    expect(s.unlockStage).toBe(0);
  });

  it('Assumed: while locked, PTT and volume work; squelch and dial do not', () => {
    const locked = run(optAt(0), ENT);
    expect(reduce(locked, ptt(true)).mode).toBe('transmit');
    expect(reduce(locked, knob('knob-volume', 1)).volume).toBe(6);
    expect(reduce(locked, knob('knob-squelch', 1))).toBe(locked);
    expect(reduce(locked, knob('knob-channel', 1))).toBe(locked);
  });
});

describe('PTT', () => {
  it('Assumed: PTT down on the main screen sets transmit with a ptt-down cue', () => {
    const s = reduce(main(), ptt(true));
    expect(s.mode).toBe('transmit');
    expect(s.sound.cue).toBe('ptt-down');
  });

  it('Assumed: PTT up returns to standby with a ptt-up cue', () => {
    const s = run(main(), ptt(true), ptt(false));
    expect(s.mode).toBe('standby');
    expect(s.sound.cue).toBe('ptt-up');
  });

  it('Assumed: a second PTT down while transmitting returns the same state object', () => {
    const transmitting = reduce(main(), ptt(true));
    expect(reduce(transmitting, ptt(true))).toBe(transmitting);
  });

  it('Assumed: PTT up when not transmitting returns the same state object', () => {
    const on = main();
    expect(reduce(on, ptt(false))).toBe(on);
  });

  it('Assumed: PTT down works in the menu, edit and confirm screens', () => {
    expect(reduce(run(main(), digit('8')), ptt(true)).mode).toBe('transmit');
    expect(reduce(editFrequencyOf(0), ptt(true)).mode).toBe('transmit');
    const confirm = run(digits(editFrequencyOf(0), '450000'), ENT);
    expect(reduce(confirm, ptt(true)).mode).toBe('transmit');
  });
});

describe('battery simulation', () => {
  const withDrain = (s: RadioState): RadioState => ({ ...s, batteryDrain: true });

  it('Assumed: battery-tick does nothing when drain is off (same state object)', () => {
    const on = main();
    expect(on.batteryDrain).toBe(false);
    expect(reduce(on, BATTERY_TICK)).toBe(on);
  });

  it('Assumed: battery-tick does nothing while off (same state object)', () => {
    const offWithDrain = withDrain(initialState);
    expect(reduce(offWithDrain, BATTERY_TICK)).toBe(offWithDrain);
  });

  it('Assumed: with drain on, each battery-tick subtracts the drain step', () => {
    const s = reduce(withDrain(main()), BATTERY_TICK);
    expect(s.batteryPct).toBe(100 - BATTERY_DRAIN_STEP_PERCENT);
    expect(s.power).toBe('on');
  });

  it('Assumed: Battery Drain can be enabled from OPT and then drains', () => {
    const drain = run(optAt(4), ENT, CLR);
    expect(drain.batteryDrain).toBe(true);
    expect(reduce(drain, BATTERY_TICK).batteryPct).toBe(95);
  });

  it('Assumed: at 0 percent the radio powers off and battery stays at 0; further ticks change nothing', () => {
    let s = withDrain(main());
    for (let i = 0; i < 100 / BATTERY_DRAIN_STEP_PERCENT - 1; i += 1) s = reduce(s, BATTERY_TICK);
    expect(s.batteryPct).toBe(BATTERY_DRAIN_STEP_PERCENT);
    expect(s.power).toBe('on');
    const off = reduce(s, BATTERY_TICK);
    expect(off.batteryPct).toBe(0);
    expect(off.power).toBe('off');
    expect(off.screen).toBe('off');
    expect(reduce(off, BATTERY_TICK)).toBe(off);
  });

  it('Assumed: the battery never drops below 0 (3 percent drains to 0 and powers off, not -2)', () => {
    const low: RadioState = { ...withDrain(main()), batteryPct: 3 };
    const off = reduce(low, BATTERY_TICK);
    expect(off.batteryPct).toBe(0);
    expect(off.power).toBe('off');
  });

  it('Assumed: the low-battery threshold constant is 20 percent (used by the LCD)', () => {
    expect(LOW_BATTERY_PERCENT).toBe(20);
  });
});

describe('reset', () => {
  it('Assumed: the reset action returns powered-off defaults with default presets, keeping sound.seq', () => {
    const changed = run(main(), PRE_UP, PRE_UP, knob('knob-volume', 1), knob('knob-squelch', -1), ptt(true));
    const seq = changed.sound.seq;
    const reset = reduce(changed, { type: 'reset' });
    expect(reset.power).toBe('off');
    expect(reset.screen).toBe('off');
    expect(reset.preset).toBe(1);
    expect(reset.dial).toBe(1);
    expect(reset.volume).toBe(5);
    expect(reset.squelch).toBe(5);
    expect(reset.mode).toBe('standby');
    expect(reset.presets).toEqual(createDefaultPresets());
    expect(reset.sound.seq).toBe(seq);
  });

  it('Assumed: reset does not reduce sound.seq (seq never goes backwards)', () => {
    const before = run(main(), PRE_UP, PRE_UP, PRE_UP);
    const after = reduce(before, { type: 'reset' });
    expect(after.sound.seq).toBeGreaterThanOrEqual(before.sound.seq);
  });

  it('Secondary-source: OPT > Reset Simulator goes to the confirm screen with a reset pending', () => {
    const s = run(optAt(5), ENT);
    expect(s.screen).toBe('confirm');
    expect(s.pendingConfirm).toEqual({ kind: 'reset', prompt: RESET_PROMPT });
  });

  it('Assumed: CLR on the reset confirm cancels: menu shown, nothing changed', () => {
    const changed = run(optAt(5), knob('knob-volume', 1));
    const confirm = run(changed, ENT);
    const cancelled = run(confirm, CLR);
    expect(cancelled.screen).toBe('menu');
    expect(cancelled.pendingConfirm).toBeNull();
    expect(cancelled.volume).toBe(changed.volume);
    expect(cancelled.presets).toEqual(changed.presets);
    expect(cancelled.power).toBe('on');
  });

  it('Assumed: ENT on the reset confirm restores defaults and leaves the radio on the main screen', () => {
    const modified: RadioState = {
      ...main(),
      presets: createDefaultPresets().map((p, i) => (i === 0 ? { ...p, frequencyHz: 450_000_000 } : p)),
      brightness: 2,
      squelch: 9,
      volume: 9,
      monitor: true,
      preset: 4,
    };
    // OPT (7), cursor to Reset Simulator (index 5), ENT opens the reset confirm.
    const onConfirm = run(modified, digit('7'), ...Array.from({ length: 5 }, () => PRE_UP), ENT);
    expect(onConfirm.screen).toBe('confirm');
    expect(onConfirm.pendingConfirm).toEqual({ kind: 'reset', prompt: RESET_PROMPT });
    const reset = onConfirm;
    const restored = run(reset, ENT);
    expect(restored.power).toBe('on');
    expect(restored.screen).toBe('main');
    expect(restored.presets).toEqual(createDefaultPresets());
    expect(restored.volume).toBe(5);
    expect(restored.squelch).toBe(5);
    expect(restored.brightness).toBe(5);
    expect(restored.monitor).toBe(false);
    expect(restored.preset).toBe(1);
    expect(restored.menu).toBeNull();
    expect(restored.sound.seq).toBeGreaterThan(reset.sound.seq);
  });
});

describe('sound cues and sequence numbers', () => {
  it('every accepted key press that changes state bumps sound.seq by exactly one; ignored steps do not', () => {
    // Each row: the action, and the sound.seq expected after it.
    const steps: Array<[RadioAction, number]> = [
      [POWER, 1], // power on (cue)
      [TICK, 1], // tick is not a key press
      [digit('7'), 2], // OPT opens
      [CLR, 3], // OPT closes to main
      [digit('8'), 4], // PGM opens
      [ENT, 5], // System Preset Settings
      [ENT, 6], // System Presets
      [PRE_UP, 7], // cursor 0 -> 1
      [CLR, 8], // back to System Preset Settings
      [CLR, 9], // back to PGM
      [PRE_UP, 10], // cursor 0 -> 1 on PGM (2 entries)
      [PRE_UP, 10], // clamped at 1: ignored
    ];
    let s = initialState;
    for (const [action, expectedSeq] of steps) {
      s = reduce(s, action);
      expect(s.sound.seq).toBe(expectedSeq);
    }
  });

  it('ignored input does not bump sound.seq', () => {
    const on = main();
    expect(reduce(on, release('keypad-7')).sound.seq).toBe(on.sound.seq);
    expect(reduce(on, ENT).sound.seq).toBe(on.sound.seq);
    expect(reduce(on, TICK).sound.seq).toBe(on.sound.seq);
    expect(reduce(on, OVERLAY_CLEAR).sound.seq).toBe(on.sound.seq);
  });
});

describe('purity and determinism', () => {
  it('reduce never mutates its input, even with a deep-frozen state and presets', () => {
    const frozen = deepFreeze(deepCopy(run(optAt(0), ENT, CLR, digit('5'))));
    expect(() => reduce(frozen, CLR)).not.toThrow();
    expect(() => reduce(frozen, ENT)).not.toThrow();
  });

  it('a full frozen sequence runs without mutation and leaves presets equal to the defaults', () => {
    const frozen = deepFreeze(deepCopy(editFrequencyOf(2)));
    const after = run(frozen, digit('4'), digit('5'), digit('0'), digit('0'), digit('0'), digit('0'), ENT, ENT);
    expect(after.presets[2].frequencyHz).toBe(450_000_000);
    expect(frozen.presets).toEqual(createDefaultPresets());
    expect(frozen.screen).toBe('edit');
  });

  it('the same input always gives a deep-equal output', () => {
    const actions: RadioAction[] = [POWER, TICK, digit('8'), ENT, ENT, PRE_UP, ENT, ENT, digit('4'), digit('5'), digit('0'), digit('0'), digit('0'), digit('0'), ENT];
    const first = run(initialState, ...actions);
    const second = run(initialState, ...actions);
    expect(second).toEqual(first);
  });

  it('initialState is not changed by a sequence of actions', () => {
    const before = deepCopy(initialState);
    run(initialState, POWER, TICK, digit('7'), ENT, CLR, ptt(true));
    expect(initialState).toEqual(before);
  });
});

describe('review fixes (V5)', () => {
  it('Assumed: CLR on the main screen with nothing to clear changes nothing and makes no sound', () => {
    const s = main();
    expect(reduce(s, CLR)).toBe(s);
  });

  it('Assumed: CLR on the main screen clears a showing notice with a key cue', () => {
    const withNotice = reduce(main(), digit('5'));
    expect(withNotice.notice).toBe(NOT_USED_NOTICE);
    const cleared = reduce(withNotice, CLR);
    expect(cleared.notice).toBeNull();
    expect(cleared.sound.seq).toBe(withNotice.sound.seq + 1);
  });

  it('Assumed: the edit buffer is cleared when a valid entry moves to the confirm screen', () => {
    let s = run(main(), digit('8'), ENT, ENT, ENT, ENT);
    s = run(digits(s, '450000'), ENT);
    expect(s.screen).toBe('confirm');
    expect(s.edit).toBeNull();
    expect(s.pendingConfirm?.kind).toBe('frequency');
  });

  it('Assumed: when drain empties the battery the radio powers off, drain switches off, and it can be powered on again', () => {
    let s: RadioState = { ...main(), batteryPct: BATTERY_DRAIN_STEP_PERCENT, batteryDrain: true };
    s = reduce(s, BATTERY_TICK);
    expect(s.screen).toBe('off');
    expect(s.batteryPct).toBe(0);
    expect(s.batteryDrain).toBe(false);
    s = run(s, POWER, TICK, BATTERY_TICK);
    expect(s.screen).toBe('main');
    expect(s.batteryPct).toBeGreaterThan(0); // simulated fresh battery on power-on
  });
});

describe('radio-to-radio receive (link)', () => {
  const on = (): RadioState => {
    let s = reduce(initialState, { type: 'control', id: 'power', event: 'press' });
    s = reduce(s, { type: 'tick' });
    return s;
  };
  const heardAt = (s: RadioState, from: string, hz = activeFrequencyHz(s)) =>
    reduce(s, { type: 'rx-signal', from, frequencyHz: hz, active: true });

  it('receives when another instance is keyed on the same frequency', () => {
    const s = on();
    expect(isReceiving(s)).toBe(false);
    expect(isReceiving(heardAt(s, 'a'))).toBe(true);
  });
  it('ignores a different frequency, even on the same preset number', () => {
    const s = on();
    expect(isReceiving(heardAt(s, 'a', activeFrequencyHz(s) + 1_000))).toBe(false);
  });
  it('matches on frequency, not preset number', () => {
    let s = heardAt(on(), 'a', activeFrequencyHz(on()));
    s = reduce(s, { type: 'control', id: 'keypad-preset-up', event: 'press' });
    expect(isReceiving(s)).toBe(false);
  });
  it('does not receive while off, in startup, or while transmitting', () => {
    const hz = activeFrequencyHz(initialState);
    expect(isReceiving(heardAt(initialState, 'a', hz))).toBe(false);
    const started = reduce(initialState, { type: 'control', id: 'power', event: 'press' });
    expect(isReceiving(heardAt(started, 'a', hz))).toBe(false);
    expect(isReceiving(reduce(heardAt(on(), 'a'), { type: 'ptt', down: true }))).toBe(false);
  });
  it('stops receiving when the sender releases, and ignores a release from an unknown sender', () => {
    const s = heardAt(on(), 'a');
    const released = reduce(s, { type: 'rx-signal', from: 'a', frequencyHz: 0, active: false });
    expect(isReceiving(released)).toBe(false);
    expect(reduce(released, { type: 'rx-signal', from: 'zz', frequencyHz: 0, active: false })).toBe(released);
  });
  it('keeps hearing a sender until every sender on the frequency has released', () => {
    let s = heardAt(heardAt(on(), 'a'), 'b');
    s = reduce(s, { type: 'rx-signal', from: 'a', frequencyHz: 0, active: false });
    expect(isReceiving(s)).toBe(true);
  });
  it('returns the same state for a repeated heartbeat', () => {
    const s = heardAt(on(), 'a');
    expect(heardAt(s, 'a')).toBe(s);
  });
  it('shows RX and RECEIVING on the LCD', () => {
    const lcd = renderLcd(heardAt(on(), 'a'));
    expect(lcd.indicators.rx).toBe(true);
    expect(lcd.rows.some((r) => r.text === 'RECEIVING')).toBe(true);
  });
  it('keeps heard senders across reset', () => {
    const s = heardAt(on(), 'a');
    expect(reduce(s, { type: 'reset' }).heard).toEqual(s.heard);
  });
});
