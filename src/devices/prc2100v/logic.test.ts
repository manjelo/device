import { describe, expect, it } from 'vitest';
import type { Prc2100vAction } from './logic';
import { FREQ_MAX_HZ, FREQ_MIN_HZ, activeFrequencyHz, formatMhz, initialState, isReceiving, reduce, renderLcd } from './logic';

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
    const open = reduce(on, { type: 'settings-toggle' });
    expect(open.screen).toBe('settings');
    expect(renderLcd(open)!.settings.map((r) => r.key)).toEqual(['F', 'H', 'C', 'S']);
    expect(reduce(open, { type: 'settings-toggle' }).screen).toBe('main');
  });
  it('on the setting page pad up/down moves the row and left/right tunes only on the frequency row', () => {
    let s = reduce(on, { type: 'settings-toggle' });
    expect(activeFrequencyHz(reduce(s, { type: 'tune', delta: 1 }))).toBe(30_025_000);
    expect(reduce(s, { type: 'channel', delta: -1 }).channel).toBe(1); // up on the first row stays put
    s = reduce(s, { type: 'channel', delta: 1 }); // down
    expect(s.cursor).toBe(1);
    expect(reduce(s, { type: 'tune', delta: 1 })).toBe(s);
    expect(reduce(s, { type: 'channel', delta: -1 }).cursor).toBe(0);
  });
  it('is closed by power off and cannot open while keyed', () => {
    expect(reduce(reduce(on, { type: 'settings-toggle' }), { type: 'power-toggle' }).screen).toBe('main');
    expect(reduce(reduce(on, { type: 'ptt', down: true }), { type: 'settings-toggle' }).screen).toBe('main');
  });
});
