// Tests for the pure LCD frame generator. The layout is a PLACEHOLDER (docs/device-research.md section 2), so
// row order, wording and sizes are Assumed simulator choices. Tests check the frame against the state, not against
// any real display.
import { describe, expect, it } from 'vitest';
import { PRESET_COUNT } from './config';
import { LCD_LABEL, renderLcd, frequencyTemplate, insetRows } from './lcd';
import { createDefaultPresets, initialState, reduce } from './stateMachine';
import type { ControlId, KnobId, LcdRow, RadioAction, RadioState } from './types';

const press = (id: ControlId): RadioAction => ({ type: 'control', id, event: 'press' });
const digit = (d: string): RadioAction => press(`keypad-${d}` as ControlId);
const knob = (id: KnobId, delta: -1 | 1): RadioAction => ({ type: 'knob', id, delta });
const ptt = (down: boolean): RadioAction => ({ type: 'ptt', down });
const TICK: RadioAction = { type: 'tick' };
const POWER = press('power');
const ENT = press('keypad-enter');
const CLR = press('keypad-clear');
const PRE_UP = press('keypad-preset-up');

function run(state: RadioState, ...actions: RadioAction[]): RadioState {
  return actions.reduce((s, a) => reduce(s, a), state);
}

function repeat(state: RadioState, action: RadioAction, n: number): RadioState {
  return run(state, ...Array.from({ length: n }, () => action));
}

function main(): RadioState {
  return run(initialState, POWER, TICK);
}

function optAt(cursor: number): RadioState {
  return repeat(run(main(), digit('7')), PRE_UP, cursor);
}

/** Frame text rows, for compact comparisons. */
function texts(state: RadioState): string[] {
  return renderLcd(state).rows.map((r) => r.text);
}

/** The single inverse row of a frame, or undefined when there is none. */
function inverseRows(rows: LcdRow[]): LcdRow[] {
  return rows.filter((r) => r.inverse === true);
}

/** Opens the Frequency edit for a preset (0-based index) via PGM > System Preset Settings > System Presets. */
function editFrequencyOf(presetIndex: number): RadioState {
  const atPresetList = run(main(), digit('8'), ENT, ENT);
  return run(repeat(atPresetList, PRE_UP, presetIndex), ENT, ENT);
}

describe('renderLcd: off screen', () => {
  it('Assumed: off screen is blank: no rows, all indicators false, battery 0, brightness 0, not approximated', () => {
    const frame = renderLcd(initialState);
    expect(frame.screen).toBe('off');
    expect(frame.rows).toEqual([]);
    expect(frame.indicators).toEqual({
      power: false,
      tx: false,
      rx: false,
      monitor: false,
      locked: false,
      lowBattery: false,
      battery: 0,
    });
    expect(frame.brightness).toBe(0);
    expect(frame.approximated).toBe(false);
    expect(frame.label).toBe('Simulated LCD (layout approximated)');
    expect(frame.label).toBe(LCD_LABEL);
  });

  it('after power off from the main screen the frame is blank again', () => {
    const frame = renderLcd(run(main(), POWER));
    expect(frame.rows).toEqual([]);
    expect(frame.brightness).toBe(0);
    expect(frame.indicators.power).toBe(false);
  });
});

describe('renderLcd: startup', () => {
  it('Assumed: startup shows RADIOSIM STARTING as a large first row and is marked approximated', () => {
    const frame = renderLcd(run(initialState, POWER));
    expect(frame.screen).toBe('startup');
    expect(frame.approximated).toBe(true);
    expect(frame.rows[0]).toEqual({ text: 'RADIOSIM STARTING', size: 'large' });
    expect(frame.indicators.power).toBe(true);
  });
});

describe('renderLcd: main screen', () => {
  it('Assumed: main rows are preset line, 30.000 MHz large, STANDBY, DIAL 1 and nothing else', () => {
    const frame = renderLcd(main());
    expect(frame.screen).toBe('main');
    expect(frame.rows).toEqual([
      { text: 'PRESET 01  CHAN 01', size: 'small' },
      { text: '30.000 MHz', size: 'large' },
      { text: 'STANDBY', size: 'small' },
      { text: 'DIAL 1', size: 'small' },
    ]);
    expect(frame.brightness).toBe(5);
    expect(frame.approximated).toBe(true);
  });

  it('Assumed: main indicators are power on, nothing else lit, battery 100, not low', () => {
    expect(renderLcd(main()).indicators).toEqual({
      power: true,
      tx: false,
      rx: false,
      monitor: false,
      locked: false,
      lowBattery: false,
      battery: 100,
    });
  });

  it('Assumed: preset 100 shows its name and 508.800 MHz on the big row', () => {
    const frame = renderLcd({ ...main(), preset: PRESET_COUNT });
    expect(frame.rows[0].text).toBe('PRESET 100  CHAN 100');
    expect(frame.rows[1].text).toBe('508.800 MHz');
  });

  it('Assumed: the big row follows the active preset (preset 3 is 39.000 MHz)', () => {
    const s = repeat(main(), knob('knob-channel', 1), 2);
    expect(renderLcd(s).rows[0].text).toBe('PRESET 03  CHAN 03');
    expect(renderLcd(s).rows[1].text).toBe('39.000 MHz');
  });

  it('Assumed: with monitor on the mode row reads STANDBY  MON and the monitor indicator is lit', () => {
    const monitoring = run(optAt(1), ENT, CLR);
    const frame = renderLcd(monitoring);
    expect(frame.rows[2].text).toBe('STANDBY  MON');
    expect(frame.indicators.monitor).toBe(true);
  });

  it('Assumed: while PTT is down the mode row reads TRANSMIT and the tx indicator is lit', () => {
    const frame = renderLcd(run(main(), ptt(true)));
    expect(frame.rows[2].text).toBe('TRANSMIT');
    expect(frame.indicators.tx).toBe(true);
    expect(frame.indicators.rx).toBe(false);
  });

  it('after PTT up the mode row returns to STANDBY and tx is off', () => {
    const frame = renderLcd(run(main(), ptt(true), ptt(false)));
    expect(frame.rows[2].text).toBe('STANDBY');
    expect(frame.indicators.tx).toBe(false);
  });

  it('Assumed: the DIAL row shows the dial label (5 at position 5, S at position 6)', () => {
    const atFive = repeat(main(), knob('knob-channel', 1), 4);
    expect(texts(atFive)[3]).toBe('DIAL 5');
    expect(texts(reduce(atFive, knob('knob-channel', 1)))[3]).toBe('DIAL S');
  });

  it('Assumed: a notice (not-used digit) appears as an inverse last row and disappears after a clearing action', () => {
    const noticed = run(main(), digit('0'));
    const rows = renderLcd(noticed).rows;
    expect(rows[rows.length - 1]).toEqual({ text: 'NOT USED HERE', size: 'small', inverse: true, kind: 'notice' });
    const cleared = run(noticed, PRE_UP);
    expect(renderLcd(cleared).rows).toHaveLength(4);
    expect(inverseRows(renderLcd(cleared).rows)).toEqual([]);
  });

  it('Assumed: the unavailable notice for star is shown as an inverse last row', () => {
    const rows = renderLcd(run(main(), press('keypad-star'))).rows;
    expect(rows[rows.length - 1]).toEqual({ text: 'UNAVAILABLE IN SIM', size: 'small', inverse: true, kind: 'notice' });
  });
});

describe('renderLcd: volume and squelch overlay', () => {
  it('Assumed: a volume overlay appears as an inverse row VOLUME 6 after the main rows', () => {
    const rows = renderLcd(run(main(), knob('knob-volume', 1))).rows;
    expect(rows).toHaveLength(5);
    expect(rows[4]).toEqual({ text: 'VOLUME 6', size: 'small', inverse: true, kind: 'overlay' });
  });

  it('Assumed: a squelch overlay appears as an inverse row SQUELCH 4', () => {
    const rows = renderLcd(run(main(), knob('knob-squelch', -1))).rows;
    expect(rows[rows.length - 1]).toEqual({ text: 'SQUELCH 4', size: 'small', inverse: true, kind: 'overlay' });
  });

  it('after overlay-clear the overlay row is gone', () => {
    const rows = renderLcd(run(main(), knob('knob-volume', 1), { type: 'overlay-clear' })).rows;
    expect(texts({ ...main(), overlay: null })).toEqual(rows.map((r) => r.text));
  });
});

describe('renderLcd: keypad lock', () => {
  it('Assumed: the locked frame has the inverse KEYPAD LOCKED row and the CLR THEN ENT hint', () => {
    const locked = run(optAt(0), ENT);
    const frame = renderLcd(locked);
    expect(frame.screen).toBe('locked');
    expect(frame.indicators.locked).toBe(true);
    expect(frame.rows).toContainEqual({ text: 'KEYPAD LOCKED', size: 'small', inverse: true });
    expect(frame.rows).toContainEqual({ text: 'CLR THEN ENT = UNLOCK (SIM)', size: 'small' });
    expect(frame.rows[1].text).toBe('30.000 MHz');
  });

  it('after the unlock sequence the frame is the normal main frame with no lock rows', () => {
    const unlocked = run(optAt(0), ENT, CLR, ENT);
    const frame = renderLcd(unlocked);
    expect(frame.indicators.locked).toBe(false);
    expect(frame.rows.map((r) => r.text)).not.toContain('KEYPAD LOCKED');
    expect(frame.rows).toHaveLength(4);
  });
});

describe('renderLcd: OPT menu', () => {
  it('Assumed: OPT frame has the title row then one row per entry (9 rows total)', () => {
    const rows = renderLcd(optAt(0)).rows;
    expect(rows[0]).toEqual({ text: 'OPTIONS (simulator)', size: 'small' });
    expect(rows).toHaveLength(9);
  });

  it('Assumed: OPT entry texts show the current value, N/A for unavailable entries and > for submenus', () => {
    expect(texts(optAt(0)).slice(1)).toEqual([
      'Keypad Lock',
      'Monitor  OFF',
      'Display Bright  5',
      'RF Power  0.25 W',
      'Battery Drain  OFF',
      'Reset Simulator',
      'COMSEC  N/A',
      'Waveform  N/A',
    ]);
  });

  it('Assumed: exactly one inverse row, the cursor row, when no notice is shown', () => {
    const rows = renderLcd(optAt(0)).rows;
    expect(inverseRows(rows)).toEqual([{ text: 'Keypad Lock', size: 'small', inverse: true, kind: 'cursor' }]);
  });

  it('Assumed: the inverse row follows the cursor', () => {
    const rows = renderLcd(optAt(3)).rows;
    expect(inverseRows(rows)).toEqual([{ text: 'RF Power  0.25 W', size: 'small', inverse: true, kind: 'cursor' }]);
  });

  it('Assumed: a monitor toggle shows ON in the Monitor entry; a battery drain toggle shows ON', () => {
    const monitorOn = run(optAt(1), ENT);
    expect(texts(monitorOn)).toContain('Monitor  ON');
    const drainOn = run(optAt(4), ENT);
    expect(texts(drainOn)).toContain('Battery Drain  ON');
  });

  it('Assumed: the brightness entry shows the brightness value (after a cycle, 1)', () => {
    const cycled = run(optAt(2), ENT);
    expect(texts(cycled)).toContain('Display Bright  1');
  });

  it('Secondary-source: the PGM root shows System Preset Settings with > and Other Programming as N/A', () => {
    const rows = renderLcd(run(main(), digit('8'))).rows;
    expect(rows.map((r) => r.text)).toEqual(['PROGRAM (simulator)', 'System Preset Settings  >', 'Other Programming  N/A']);
  });

  it('Assumed: the PGM System Preset Settings submenu lists System Presets with >', () => {
    const rows = renderLcd(run(main(), digit('8'), ENT)).rows;
    expect(rows.map((r) => r.text)).toEqual(['SYSTEM PRESET SETTINGS', 'System Presets  >']);
  });
});

describe('renderLcd: presets list', () => {
  it('Assumed: the presets list has the SYSTEM PRESETS title and a window of 5 rows from preset 1', () => {
    const rows = renderLcd(run(main(), digit('8'), ENT, ENT)).rows;
    expect(rows).toEqual([
      { text: 'SYSTEM PRESETS', size: 'small' },
      { text: '01 CHAN 01  30.000 MHz', size: 'small', inverse: true, kind: 'cursor' },
      { text: '02 CHAN 02  34.500 MHz', size: 'small', inverse: false },
      { text: '03 CHAN 03  39.000 MHz', size: 'small', inverse: false },
      { text: '04 CHAN 04  43.500 MHz', size: 'small', inverse: false },
      { text: '05 CHAN 05  48.000 MHz', size: 'small', inverse: false },
    ]);
  });

  it('Assumed: the list window follows the cursor and always includes the cursor row (every cursor 0..98)', () => {
    let s = run(main(), digit('8'), ENT, ENT);
    for (let cursor = 0; cursor < PRESET_COUNT; cursor += 1) {
      expect(s.menu?.cursor).toBe(cursor);
      const rows = renderLcd(s).rows;
      expect(rows).toHaveLength(6);
      const inverse = inverseRows(rows);
      expect(inverse).toHaveLength(1);
      expect(inverse[0].text.startsWith(`${String(cursor + 1).padStart(2, '0')} CHAN`)).toBe(true);
      if (cursor < PRESET_COUNT - 1) s = reduce(s, PRE_UP);
    }
  });

  it('Assumed: with the cursor at preset 100 the window shows presets 96 to 100', () => {
    const at99 = repeat(run(main(), digit('8'), ENT, ENT), PRE_UP, PRESET_COUNT - 1);
    const texts99 = texts(at99);
    expect(texts99.slice(1).map((t) => t.split(' ')[0])).toEqual(['96', '97', '98', '99', '100']);
  });
});

describe('renderLcd: preset edit pages', () => {
  it('Assumed: the preset page title is PRESET 03  CHAN 03 with Frequency showing the current MHz and Name as N/A', () => {
    const rows = renderLcd(run(main(), digit('8'), ENT, ENT, PRE_UP, PRE_UP, ENT)).rows;
    expect(rows).toEqual([
      { text: 'PRESET 03  CHAN 03', size: 'small' },
      { text: 'Frequency  39.000 MHz', size: 'small', inverse: true, kind: 'cursor' },
      { text: 'Name  N/A', size: 'small', inverse: false },
    ]);
  });

  it('Assumed: the edit frame shows the title, CURRENT row, empty template and the key hint', () => {
    const rows = renderLcd(editFrequencyOf(0)).rows;
    expect(rows).toEqual([
      { text: 'PRESET 01 FREQUENCY', size: 'small' },
      { text: 'CURRENT 30.000 MHz', size: 'small' },
      { text: '___.___ MHz', size: 'large' },
      { text: 'ENT=next  CLR=clear/back', size: 'small' },
    ]);
  });

  it('Assumed: the edit template shows the typed digits (45 -> 45_.___ MHz) on the large row', () => {
    const rows = renderLcd(run(editFrequencyOf(0), digit('4'), digit('5'))).rows;
    expect(rows[2]).toEqual({ text: '45_.___ MHz', size: 'large' });
  });

  it('Assumed: a full six-digit buffer shows 450.000 MHz on the large row', () => {
    const rows = renderLcd(run(editFrequencyOf(0), digit('4'), digit('5'), digit('0'), digit('0'), digit('0'), digit('0'))).rows;
    expect(rows[2].text).toBe('450.000 MHz');
  });

  it('Assumed: an incomplete ENT shows the ENTER 6 DIGITS notice as an inverse last row', () => {
    const rows = renderLcd(run(editFrequencyOf(0), digit('1'), ENT)).rows;
    expect(rows[rows.length - 1]).toEqual({ text: 'ENTER 6 DIGITS', size: 'small', inverse: true, kind: 'notice' });
  });
});

describe('frequencyTemplate', () => {
  it('Assumed: an empty buffer is the full underscore template ___.___ MHz', () => {
    expect(frequencyTemplate('')).toBe('___.___ MHz');
  });

  it('Assumed: one digit fills the first position: 1__.___ MHz', () => {
    expect(frequencyTemplate('1')).toBe('1__.___ MHz');
  });

  it('Assumed: two digits: 15_.___ MHz', () => {
    expect(frequencyTemplate('15')).toBe('15_.___ MHz');
  });

  it('Assumed: three digits close the integer part: 150.___ MHz', () => {
    expect(frequencyTemplate('150')).toBe('150.___ MHz');
  });

  it('Assumed: four digits fill the first kHz digit: 150.0__ MHz', () => {
    expect(frequencyTemplate('1500')).toBe('150.0__ MHz');
  });

  it('Assumed: six digits give the full value: 450.000 MHz', () => {
    expect(frequencyTemplate('450000')).toBe('450.000 MHz');
    expect(frequencyTemplate('030000')).toBe('030.000 MHz');
  });
});

describe('renderLcd: confirm screens', () => {
  it('Assumed: the frequency confirm frame shows NEW 450.000 MHz large and the apply prompt', () => {
    const rows = renderLcd(run(editFrequencyOf(2), digit('4'), digit('5'), digit('0'), digit('0'), digit('0'), digit('0'), ENT)).rows;
    expect(rows).toEqual([
      { text: 'PRESET 03 FREQUENCY', size: 'small' },
      { text: 'NEW 450.000 MHz', size: 'large' },
      { text: 'Apply? ENT=yes CLR=no', size: 'small' },
    ]);
  });

  it('Assumed: the reset confirm frame shows RESET SIMULATOR, DEFAULTS and the reset prompt', () => {
    const rows = renderLcd(run(optAt(5), ENT)).rows;
    expect(rows).toEqual([
      { text: 'RESET SIMULATOR', size: 'small' },
      { text: 'DEFAULTS', size: 'large' },
      { text: 'Reset simulator? ENT=yes CLR=no', size: 'small' },
    ]);
  });
});

describe('renderLcd: indicators and brightness', () => {
  it('brightness mirrors state.brightness on the frame', () => {
    expect(renderLcd({ ...main(), brightness: 3 }).brightness).toBe(3);
    expect(renderLcd(run(optAt(2), ENT)).brightness).toBe(1);
  });

  it('Assumed: low-battery indicator is lit at exactly 20 percent and not at 21 percent', () => {
    expect(renderLcd({ ...main(), batteryPct: 20 }).indicators.lowBattery).toBe(true);
    expect(renderLcd({ ...main(), batteryPct: 21 }).indicators.lowBattery).toBe(false);
    expect(renderLcd({ ...main(), batteryPct: 20 }).indicators.battery).toBe(20);
  });

  it('the locked indicator follows the lock state', () => {
    expect(renderLcd(main()).indicators.locked).toBe(false);
    expect(renderLcd(run(optAt(0), ENT)).indicators.locked).toBe(true);
  });

  it('the monitor indicator follows state.monitor', () => {
    expect(renderLcd(main()).indicators.monitor).toBe(false);
    expect(renderLcd({ ...main(), monitor: true }).indicators.monitor).toBe(true);
  });

  it('the preset name on the first row comes from state.presets, not a hard-coded label', () => {
    const frame = renderLcd({ ...main(), presets: createDefaultPresets().map((p) => ({ ...p, name: 'X' })) });
    expect(frame.rows[0].text).toBe('PRESET 01  X');
  });
});

describe('insetRows: the two rows the in-radio display shows', () => {
  it('Assumed: the main screen shows the frequency and the preset row', () => {
    const { main: big, second } = insetRows(renderLcd(main()));
    expect(big?.text).toBe('30.000 MHz');
    expect(second?.text).toBe('PRESET 01  CHAN 01');
  });

  it('Assumed: a menu shows its title and the cursor row', () => {
    const { main: first, second } = insetRows(renderLcd(optAt(2)));
    expect(first?.text).toBe('OPTIONS (simulator)');
    expect(second?.text).toBe('Display Bright  5');
  });

  it('Assumed: a notice is shown instead of the cursor row, so it is never hidden', () => {
    const withNotice = reduce(optAt(6), ENT); // COMSEC is unavailable
    expect(texts(withNotice)).toContain('UNAVAILABLE IN SIM');
    expect(insetRows(renderLcd(withNotice)).second?.text).toBe('UNAVAILABLE IN SIM');
  });

  it('Assumed: a temporary volume row is shown on the main screen', () => {
    const turned = reduce(main(), knob('knob-volume', 1));
    expect(insetRows(renderLcd(turned)).second?.text).toBe('VOLUME 6');
  });

  it('Assumed: the SAVED notice reaches the in-radio display after a frequency save', () => {
    let s = run(main(), digit('8'), ENT, ENT, ENT, ENT);
    s = run(s, digit('4'), digit('5'), digit('0'), digit('0'), digit('0'), digit('0'), ENT, ENT);
    expect(s.notice).toBe('SAVED');
    expect(insetRows(renderLcd(s)).second?.text).toBe('SAVED');
  });

  it('Assumed: the off frame has no rows to show', () => {
    expect(insetRows(renderLcd(initialState))).toEqual({ main: undefined, second: undefined });
  });
});

describe('renderLcd: five-channel window', () => {
  const texts5 = (preset: number) => renderLcd({ ...main(), preset }).channels?.map((c) => c.text.split(' ')[0]);

  it('Assumed: five presets are shown with the active one in the middle', () => {
    expect(texts5(50)).toEqual(['48', '49', '50', '51', '52']);
    const ch = renderLcd({ ...main(), preset: 50 }).channels ?? [];
    expect(ch.map((c) => c.selected)).toEqual([false, false, true, false, false]);
    expect(ch[2].detail).toMatch(/MHz$/);
  });

  it('Assumed: slots before preset 1 and after the last preset stay blank, keeping the active one centred', () => {
    expect(texts5(1)).toEqual(['', '', '01', '02', '03']);
    expect(texts5(PRESET_COUNT)).toEqual(['98', '99', '100', '', '']);
  });

  it('has no channel window when the radio is off or in a menu', () => {
    expect(renderLcd({ ...main(), screen: 'off' }).channels).toBeUndefined();
    expect(renderLcd(run(main(), digit('8'))).channels).toBeUndefined();
  });
});
