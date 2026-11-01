import { describe, expect, it } from 'vitest';
import type { Mtp850Action } from './logic';
import { LINK_BASE_TMO_HZ, initialState, isReceiving, linkFrequencyHz, lcdSummary, reduce, renderLcd } from './logic';

const run = (...actions: Mtp850Action[]) => actions.reduce(reduce, initialState);
const on = run({ type: 'power-on' });
const toggleNet: Mtp850Action[] = [
  { type: 'menu' }, { type: 'nav', dir: 'down' }, { type: 'nav', dir: 'down' }, { type: 'nav', dir: 'down' },
  { type: 'select' }, { type: 'select' }, { type: 'menu' },
];
const run2 = (s: Parameters<typeof reduce>[0], ...a: Mtp850Action[]) => a.reduce(reduce, s);
const typed = (digits: string) => [...digits].map((digit) => ({ type: 'digit', digit }) as const);

describe('MTP850 logic', () => {
  it('MENU opens the main menu; Setup > Network toggles TMO / DMO; back exits', () => {
    const m = reduce(on, { type: 'menu' });
    expect(lcdSummary(m)).toBe('Main Menu: [Messages], Contacts, Security, Setup, More ...');
    const toSetup = run({ type: 'power-on' }, { type: 'menu' }, { type: 'nav', dir: 'down' }, { type: 'nav', dir: 'down' }, { type: 'nav', dir: 'down' }, { type: 'select' });
    expect(lcdSummary(toSetup)).toContain('Setup: [Network: TMO]');
    expect(reduce(toSetup, { type: 'select' }).net).toBe('DMO');
    expect(reduce(reduce(toSetup, { type: 'back' }), { type: 'back' }).menu).toBeNull();
    expect(reduce(run({ type: 'power-on' }, { type: 'menu' }, { type: 'select' }), { type: 'end' }).notice).toBeNull();
  });
  it('starts off with nothing displayed, and ignores controls while off', () => {
    expect(renderLcd(initialState)).toBeNull();
    expect(reduce(initialState, { type: 'knob', delta: 1 })).toBe(initialState);
  });
  it('shows the brochure sample screen on power-on', () => {
    expect(lcdSummary(on)).toBe('My Groups TalkGrp 1 TMO VOL 5');
  });
  it('the rotary knob selects talk groups and wraps within the documented counts', () => {
    expect(run({ type: 'power-on' }, { type: 'knob', delta: -1 }).tmoGroup).toBe(2048);
    const dmo = run({ type: 'power-on' }, ...toggleNet, { type: 'knob', delta: -1 });
    expect(dmo.net).toBe('DMO');
    expect(dmo.dmoGroup).toBe(1024);
  });
  it('TMO and DMO remember their own group', () => {
    const s = run({ type: 'power-on' }, { type: 'knob', delta: 1 }, ...toggleNet, { type: 'knob', delta: 1 }, { type: 'knob', delta: 1 }, ...toggleNet);
    expect(s.tmoGroup).toBe(2);
    expect(s.dmoGroup).toBe(3);
  });
  it('typed digits plus the call key jump to a group; invalid numbers are rejected', () => {
    expect(reduce(typed('12').reduce(reduce, on), { type: 'call' }).tmoGroup).toBe(12);
    const bad = reduce(typed('3000').reduce(reduce, on), { type: 'call' });
    expect(bad.tmoGroup).toBe(1);
    expect(bad.notice).toBe('INVALID GROUP');
    expect(reduce(typed('0').reduce(reduce, on), { type: 'call' }).notice).toBe('INVALID GROUP');
  });
  it('the end key clears entry', () => {
    expect(reduce(typed('12').reduce(reduce, on), { type: 'end' }).entry).toBe('');
  });
  it('emergency toggles the red emergency state and power off clears it', () => {
    const e = reduce(on, { type: 'emergency' });
    expect(renderLcd(e)?.emergency).toBe(true);
    expect(reduce(e, { type: 'power-off' }).emergency).toBe(false);
  });
  it('volume is clamped', () => {
    let s = on;
    for (let i = 0; i < 20; i += 1) s = reduce(s, { type: 'nav', dir: 'up' });
    expect(s.volume).toBe(10);
  });
  it('does not change group while transmitting', () => {
    const tx = reduce(on, { type: 'ptt', down: true });
    expect(reduce(tx, { type: 'knob', delta: 1 })).toBe(tx);
  });
  it('links by talk group and net', () => {
    expect(linkFrequencyHz(on)).toBe(LINK_BASE_TMO_HZ + 1);
    const heard = reduce(on, { type: 'rx-signal', from: 'x', frequencyHz: LINK_BASE_TMO_HZ + 1, active: true });
    expect(isReceiving(heard)).toBe(true);
    expect(isReceiving(run2(heard, ...toggleNet))).toBe(false); // DMO group 1 is a different channel
    expect(isReceiving(reduce(heard, { type: 'ptt', down: true }))).toBe(false);
  });
});
