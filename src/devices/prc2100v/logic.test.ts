import { describe, expect, it } from 'vitest';
import type { Prc2100vAction } from './logic';
import { scrambleSeed, FREQ_MAX_HZ, FREQ_MIN_HZ, activeFrequencyHz, formatMhz, initialState, isReceiving, reduce, renderLcd, activeChannel } from './logic';

const run = (...actions: Prc2100vAction[]) => actions.reduce(reduce, initialState);
const on = run({ type: 'power-toggle' });

describe('PRC2100V logic', () => {
  it('starts off with 100 channels from 30.000 MHz and shows nothing on the LCD', () => {
    expect(initialState.channels).toHaveLength(100);
    expect(activeFrequencyHz(initialState)).toBe(FREQ_MIN_HZ);
    expect(renderLcd(initialState)).toBeNull();
  });
  it('ignores controls while off', () => {
    expect(reduce(initialState, { type: 'tune', delta: 1 })).toBe(initialState);
    expect(reduce(initialState, { type: 'ptt', down: true })).toBe(initialState);
  });
  it('tunes in channel-spacing steps and stays within the documented range', () => {
    expect(activeFrequencyHz(reduce(on, { type: 'tune', delta: 1 }))).toBe(30_025_000);
    expect(activeFrequencyHz(reduce(on, { type: 'tune', delta: -1 }))).toBe(FREQ_MIN_HZ);
    let s = on;
    for (let i = 0; i < 3000; i += 1) s = reduce(s, { type: 'tune', delta: 1 });
    expect(activeFrequencyHz(s)).toBe(FREQ_MAX_HZ);
  });
  it('12.5 kHz spacing reaches 87.975 MHz and formats four decimals', () => {
    let s = reduce(on, { type: 'cycle-spacing' });
    for (let i = 0; i < 5000; i += 1) s = reduce(s, { type: 'tune', delta: 1 });
    expect(activeFrequencyHz(s)).toBe(FREQ_MAX_HZ);
    expect(formatMhz(FREQ_MAX_HZ)).toBe('87.975');
    expect(formatMhz(30_012_500)).toBe('30.0125');
    expect(formatMhz(30_000_000)).toBe('30.000');
  });
  it('tuning edits only the active channel, and channels wrap', () => {
    const s = reduce(reduce(on, { type: 'tune', delta: 1 }), { type: 'channel', delta: 1 });
    expect(s.channel).toBe(2);
    expect(activeFrequencyHz(s)).toBe(30_500_000);
    expect(reduce(on, { type: 'channel', delta: -1 }).channel).toBe(100);
  });
  it('cycles mode and power through the documented sets', () => {
    expect(renderLcd(reduce(on, { type: 'cycle-mode' }))?.mode).toBe('FH');
    expect(renderLcd(reduce(reduce(on, { type: 'cycle-mode' }), { type: 'cycle-mode' }))?.mode).toBe('DIG');
    let s = on;
    for (let i = 0; i < 3; i += 1) s = reduce(s, { type: 'cycle-power' });
    expect(s.powerIdx).toBe(0);
  });
  it('does not retune while keyed, and power off clears the key', () => {
    const tx = reduce(on, { type: 'ptt', down: true });
    expect(reduce(tx, { type: 'tune', delta: 1 })).toBe(tx);
    expect(reduce(tx, { type: 'power-toggle' }).mode).toBe('standby');
  });
  it('receives only a sender on the same frequency, and not while transmitting', () => {
    const heard = reduce(on, { type: 'rx-signal', from: 'x', frequencyHz: FREQ_MIN_HZ, active: true });
    expect(isReceiving(heard)).toBe(true);
    expect(renderLcd(heard)?.state).toBe('RX');
    expect(isReceiving(reduce(on, { type: 'rx-signal', from: 'x', frequencyHz: 40_000_000, active: true }))).toBe(false);
    expect(isReceiving(reduce(heard, { type: 'ptt', down: true }))).toBe(false);
    expect(isReceiving(reduce(heard, { type: 'rx-signal', from: 'x', frequencyHz: 0, active: false }))).toBe(false);
  });
  it('clamps volume', () => {
    let s = on;
    for (let i = 0; i < 20; i += 1) s = reduce(s, { type: 'volume', delta: 1 });
    expect(s.volume).toBe(10);
  });
});

describe('PRC2100V channel window and setting page', () => {
  const nums = (s: typeof on) => renderLcd(s)!.channels.map((c) => c.text);
  it('shows five channels with the selected one in the middle, blank-padded at the ends', () => {
    expect(nums(on)).toEqual(['', '', '001', '002', '003']);
    const mid = run({ type: 'power-toggle' }, ...Array.from({ length: 49 }, () => ({ type: 'channel', delta: 1 }) as const));
    expect(nums(mid)).toEqual(['048', '049', '050', '051', '052']);
    expect(renderLcd(mid)!.channels.map((c) => c.selected)).toEqual([false, false, true, false, false]);
    const last = reduce(on, { type: 'channel', delta: -1 });
    expect(nums(last)).toEqual(['098', '099', '100', '', '']);
  });
  it('the oval key opens the setting page of the selected channel and closes it again', () => {
    const open = reduce(on, { type: 'select' });
    expect(open.screen).toBe('settings');
    expect(renderLcd(open)!.settings.map((r) => r.key)).toEqual(['F', 'H', 'C', 'S']);
    expect(reduce(open, { type: 'back' }).screen).toBe('main');
    expect(reduce(on, { type: 'back' })).toBe(on); // back on the main screen does nothing
  });
  it('on the setting page pad up/down moves the row and left/right tunes only on the frequency row (other rows set their option)', () => {
    let s = reduce(on, { type: 'select' });
    expect(activeFrequencyHz(reduce(s, { type: 'tune', delta: 1 }))).toBe(30_025_000);
    expect(reduce(s, { type: 'channel', delta: -1 }).channel).toBe(1); // up on the first row stays put
    s = reduce(s, { type: 'channel', delta: 1 }); // down
    expect(s.cursor).toBe(1);
    expect(activeFrequencyHz(reduce(s, { type: 'tune', delta: 1 }))).toBe(FREQ_MIN_HZ); // right sets H, not the frequency
    expect(reduce(s, { type: 'channel', delta: -1 }).cursor).toBe(0);
  });
  it('is closed by power off and cannot open while keyed', () => {
    expect(reduce(reduce(on, { type: 'select' }), { type: 'power-toggle' }).screen).toBe('main');
    expect(reduce(reduce(on, { type: 'ptt', down: true }), { type: 'select' }).screen).toBe('main');
  });
});

describe('PRC2100V H, C and S options', () => {
  const open = reduce(on, { type: 'select' });
  const down = { type: 'channel', delta: 1 } as const;
  const up = { type: 'channel', delta: -1 } as const;
  const right = { type: 'tune', delta: 1 } as const;
  const left = { type: 'tune', delta: -1 } as const;
  const at = (rows: number) => Array.from({ length: rows }, () => down).reduce(reduce, open);

  it('H is a visual flag, right turns it on and left off, and it shows on the channel row', () => {
    const s = reduce(at(1), right);
    expect(activeChannelFlags(s)).toBe('H');
    expect(renderLcd(s)!.channels[2].flags).toBe('H');
    expect(activeChannelFlags(reduce(s, left))).toBe('');
    expect(scrambleSeed(s)).toBeNull();
  });
  it('options belong to the selected channel only', () => {
    const s = reduce(at(2), right);
    const other = reduce(reduce(s, { type: 'back' }), down);
    expect(activeChannelFlags(other)).toBe('');
  });
  it('C turns on voice scrambling', () => {
    const s = reduce(at(2), right);
    expect(activeChannelFlags(s)).toBe('C');
    expect(scrambleSeed(s)).not.toBeNull();
    expect(scrambleSeed(reduce(s, left))).toBeNull();
  });
  it('S on opens the 4-digit password: up/down changes a digit, right moves on, last digit finishes', () => {
    let s = reduce(at(3), right);
    expect(s.editing).toBe(true);
    s = reduce(reduce(s, up), up); // 0 -> 1 -> 2
    expect(renderLcd(s)!.settings[3].value).toBe('ON [2]000');
    s = [right, right, right].reduce(reduce, s);
    expect(s.editing).toBe(true);
    s = reduce(reduce(s, up), right); // last digit 1, then done
    expect(s.editing).toBe(false);
    expect(activeChannel(s).password).toBe('2001');
    expect(renderLcd(s)!.settings[3].value).toBe('ON ****');
  });
  it('the password changes the scramble seed, so different passwords do not understand each other', () => {
    const a = reduce(reduce(at(3), right), { type: 'select' });
    const b = reduce(reduce(reduce(at(3), right), up), { type: 'select' });
    expect(scrambleSeed(a)).not.toBe(scrambleSeed(b));
  });
  it('back leaves the password first, and only then closes the page', () => {
    const s = reduce(at(3), right);
    expect(reduce(s, { type: 'back' })).toMatchObject({ screen: 'settings', editing: false });
    expect(reduce(reduce(s, { type: 'back' }), { type: 'back' }).screen).toBe('main');
  });
  it('select acts on the row: F toggles spacing, H and C toggle, S opens the password, and select confirms it', () => {
    const sel = { type: 'select' } as const;
    expect(renderLcd(reduce(open, sel))!.spacing).toBe('12.5K');
    expect(activeChannelFlags(reduce(at(1), sel))).toBe('H');
    expect(activeChannelFlags(reduce(reduce(at(1), sel), sel))).toBe('');
    expect(activeChannelFlags(reduce(at(2), sel))).toBe('C');
    const secure = reduce(at(3), sel);
    expect(secure).toMatchObject({ editing: true, screen: 'settings' });
    expect(reduce(secure, sel)).toMatchObject({ editing: false, screen: 'settings' });
  });
});
function activeChannelFlags(s: typeof on): string {
  return renderLcd(s)!.flags;
}
