// Integration scenarios: each test runs a sequence of actions through reduce() and checks the result with renderLcd().
// Pure functions only. Behaviour is the simulator's state machine (Assumed or Secondary-source as tagged in the names).
import { describe, expect, it } from 'vitest';
import { initialState, createDefaultPresets, reduce } from './stateMachine';
import { renderLcd } from './lcd';
import type { ControlId, KnobId, RadioAction, RadioState } from './types';

const press = (id: ControlId): RadioAction => ({ type: 'control', id, event: 'press' });
const digit = (d: string): RadioAction => press(`keypad-${d}` as ControlId);
const knob = (id: KnobId, delta: -1 | 1): RadioAction => ({ type: 'knob', id, delta });
const POWER = press('power');
const ENT = press('keypad-enter');
const CLR = press('keypad-clear');
const PRE_UP = press('keypad-preset-up');
const PRE_DOWN = press('keypad-preset-down');
const TICK: RadioAction = { type: 'tick' };

function run(state: RadioState, ...actions: RadioAction[]): RadioState {
  return actions.reduce((s, a) => reduce(s, a), state);
}

/** Types a digit string on the current screen. */
function type(state: RadioState, text: string): RadioState {
  return run(state, ...[...text].map(digit));
}

/** Power on and the startup tick: the main screen. */
function powerOnToMain(): RadioState {
  return run(initialState, POWER, TICK);
}

/** The big row (second LCD row) of the current frame. */
function bigRow(state: RadioState): string {
  return renderLcd(state).rows[1].text;
}

/** Index of the presets menu cursor after PGM > System Preset Settings > System Presets. */
function atPresetList(state: RadioState): RadioState {
  return run(state, digit('8'), ENT, ENT);
}

describe('scenario: program a preset and select it (Secondary-source menu path, Assumed frequency rules)', () => {
  it('Assumed: power on, PGM, set preset 3 to 450.000 MHz with ENT confirm, back to main, select preset 3, then power cycle keeps the preset', () => {
    // Power on and reach the main screen.
    let s = powerOnToMain();
    expect(s.screen).toBe('main');

    // PGM (8), System Preset Settings (ENT), System Presets (ENT).
    s = atPresetList(s);
    expect(s.screen).toBe('menu');
    expect(s.menu?.path).toEqual(['pgm', 'pgm.system', 'pgm.presets']);

    // PRE + twice moves the cursor to preset 3 (cursor index 2). ENT opens the preset page.
    s = run(s, PRE_UP, PRE_UP);
    expect(s.menu?.cursor).toBe(2);
    s = run(s, ENT);
    expect(s.menu?.path).toEqual(['pgm', 'pgm.system', 'pgm.presets', 'pgm.preset']);
    expect(s.menu?.target).toBe(2);

    // ENT on Frequency opens the edit. Type 450000 (450.000 MHz), ENT for the confirm, ENT to apply.
    s = run(s, ENT);
    expect(s.screen).toBe('edit');
    s = run(type(s, '450000'), ENT, ENT);
    expect(s.screen).toBe('menu');
    expect(s.notice).toBe('SAVED');
    expect(s.presets[2].frequencyHz).toBe(450_000_000);

    // CLR back up to the main screen (pgm.preset -> presets -> system -> PGM -> main).
    s = run(s, CLR, CLR, CLR, CLR);
    expect(s.screen).toBe('main');
    expect(s.menu).toBeNull();

    // Select preset 3 on the main screen with the dial (two clicks). The big row shows the new frequency.
    s = run(s, knob('knob-channel', 1), knob('knob-channel', 1));
    expect(s.preset).toBe(3);
    expect(bigRow(s)).toBe('450.000 MHz');

    // A no-op action leaves the state object unchanged (a view switch is a UI concern, so only the reducer is checked).
    expect(reduce(s, TICK)).toBe(s);

    // Power off and on: saved presets persist; the menu and edit state are cleared.
    const off = run(s, POWER);
    expect(off.screen).toBe('off');
    const on = run(off, POWER, TICK);
    expect(on.screen).toBe('main');
    expect(on.presets[2].frequencyHz).toBe(450_000_000);
    expect(on.menu).toBeNull();
    expect(on.edit).toBeNull();
    expect(on.pendingConfirm).toBeNull();
    expect(bigRow(on)).toBe('450.000 MHz');
  });
});

describe('scenario: cancelling a confirm leaves the preset unchanged (Assumed)', () => {
  it('CLR on the confirm screen cancels: the preset keeps its default 39.000 MHz', () => {
    let s = powerOnToMain();
    s = atPresetList(s);
    s = run(s, PRE_UP, PRE_UP, ENT, ENT);
    s = run(type(s, '450000'), ENT);
    expect(s.screen).toBe('confirm');
    s = run(s, CLR);
    expect(s.screen).toBe('menu');
    expect(s.presets).toEqual(createDefaultPresets());

    // Select preset 3 on the main screen and check the big row still shows the default.
    s = run(s, CLR, CLR, CLR, CLR);
    expect(s.screen).toBe('main');
    s = run(s, knob('knob-channel', 1), knob('knob-channel', 1));
    expect(bigRow(s)).toBe('39.000 MHz');
  });
});

describe('scenario: invalid frequency entries are rejected and nothing is saved (Assumed)', () => {
  it('an incomplete entry, then out-of-range entries, never reach confirm and never change a preset', () => {
    let s = powerOnToMain();
    s = run(atPresetList(s), PRE_UP, PRE_UP, ENT, ENT);
    expect(s.screen).toBe('edit');

    // Incomplete: four digits.
    s = run(type(s, '1500'), ENT);
    expect(s.screen).toBe('edit');
    expect(s.notice).toBe('ENTER 6 DIGITS');
    expect(s.presets).toEqual(createDefaultPresets());

    // Out of range (29.999 MHz): the notice clears when a digit is typed, so retype.
    s = run(run(s, CLR), ...[...'029999'].map(digit), ENT);
    expect(s.screen).toBe('edit');
    expect(s.notice).toBe('OUT OF RANGE');

    // Out of range (150.000 MHz, in the VHF/UHF gap).
    s = run(run(s, CLR), ...[...'150000'].map(digit), ENT);
    expect(s.notice).toBe('OUT OF RANGE');
    expect(s.pendingConfirm).toBeNull();
    expect(s.presets).toEqual(createDefaultPresets());

    // Leaving the edit with nothing saved: CLR clears the buffer, CLR again returns to the menu.
    s = run(s, CLR, CLR);
    expect(s.screen).toBe('menu');
    expect(s.presets).toEqual(createDefaultPresets());
  });
});

describe('scenario: uncommitted edit is discarded by power off (Assumed)', () => {
  it('power off during an edit discards the typed digits; the preset is unchanged after power on', () => {
    let s = powerOnToMain();
    s = run(atPresetList(s), PRE_UP, PRE_UP, ENT, ENT);
    s = type(s, '450000');
    expect(s.edit).toEqual({ buffer: '450000' });

    s = run(s, POWER);
    expect(s.screen).toBe('off');
    expect(s.edit).toBeNull();
    expect(s.pendingConfirm).toBeNull();

    s = run(s, POWER, TICK);
    expect(s.screen).toBe('main');
    expect(s.presets).toEqual(createDefaultPresets());
    expect(s.menu).toBeNull();
  });
});

describe('scenario: keypad lock round trip with a wrong unlock attempt (Assumed)', () => {
  it('lock from OPT, a wrong attempt does not unlock, then CLR and ENT unlock', () => {
    let s = run(powerOnToMain(), digit('7'), ENT);
    expect(s.screen).toBe('locked');
    expect(renderLcd(s).rows.map((r) => r.text)).toContain('KEYPAD LOCKED');

    // A digit does nothing but shows the locked notice.
    s = run(s, digit('5'));
    expect(s.screen).toBe('locked');
    expect(s.notice).toBe('KEYPAD LOCKED');

    // CLR, 5, ENT: the 5 breaks the sequence, so the radio stays locked.
    s = run(s, CLR, digit('5'), ENT);
    expect(s.locked).toBe(true);
    expect(s.screen).toBe('locked');
    expect(s.notice).toBe('KEYPAD LOCKED');

    // The correct sequence: CLR then ENT.
    s = run(s, CLR, ENT);
    expect(s.locked).toBe(false);
    expect(s.screen).toBe('main');
    expect(s.notice).toBeNull();
    expect(renderLcd(s).rows.map((r) => r.text)).not.toContain('KEYPAD LOCKED');
  });
});

describe('scenario: volume overlay appears and clears (Assumed)', () => {
  it('a volume turn shows the VOLUME row, and overlay-clear removes it', () => {
    let s = powerOnToMain();
    s = run(s, knob('knob-volume', 1));
    expect(s.volume).toBe(6);
    expect(renderLcd(s).rows.at(-1)).toEqual({ text: 'VOLUME 6', size: 'small', inverse: true, kind: 'overlay' });

    s = reduce(s, { type: 'overlay-clear' });
    expect(s.overlay).toBeNull();
    expect(renderLcd(s).rows.map((r) => r.text)).not.toContain('VOLUME 6');
    expect(renderLcd(s).rows).toHaveLength(4);
  });
});

describe('scenario: + and - retune the active preset in 25 kHz steps (Assumed)', () => {
  it('+ three times and - once change only the active preset frequency and leave the dial alone', () => {
    let s = powerOnToMain();
    const defaults = createDefaultPresets();
    s = run(s, PRE_UP, PRE_UP, PRE_UP);
    expect(s.preset).toBe(1);
    expect(s.dial).toBe(1);
    expect(bigRow(s)).toBe('30.075 MHz');
    s = run(s, PRE_DOWN);
    expect(bigRow(s)).toBe('30.050 MHz');
    expect(s.presets.slice(1)).toEqual(defaults.slice(1));
  });

  it('+ walks across the gap from the top of VHF to the bottom of UHF and - walks back', () => {
    let s = atPresetList(powerOnToMain());
    s = run(s, ENT, ENT, ...[...'087950'].map(digit), ENT, ENT, CLR, CLR, CLR, CLR);
    expect(s.screen).toBe('main');
    expect(bigRow(s)).toBe('87.950 MHz');
    s = run(s, PRE_UP);
    expect(bigRow(s)).toBe('87.975 MHz');
    s = run(s, PRE_UP);
    expect(bigRow(s)).toBe('225.000 MHz');
    s = run(s, PRE_DOWN);
    expect(bigRow(s)).toBe('87.975 MHz');
  });
});
