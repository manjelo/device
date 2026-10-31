import { describe, expect, it } from 'vitest';
import { controlToAction, keyReleaseToAction, keyToAction, knobTurnToAction } from './keypad';

describe('keyToAction', () => {
  it('maps digits to keypad presses', () => {
    expect(keyToAction('7')).toEqual({ type: 'control', id: 'keypad-7', event: 'press' });
    expect(keyToAction('0')).toEqual({ type: 'control', id: 'keypad-0', event: 'press' });
  });

  it('maps Enter, Backspace, and Escape', () => {
    expect(keyToAction('Enter')).toEqual({ type: 'control', id: 'keypad-enter', event: 'press' });
    expect(keyToAction('Backspace')).toEqual({ type: 'control', id: 'keypad-clear', event: 'press' });
    expect(keyToAction('Escape')).toEqual({ type: 'control', id: 'keypad-clear', event: 'press' });
  });

  it('maps p to power and t to ptt down', () => {
    expect(keyToAction('p')).toEqual({ type: 'control', id: 'power', event: 'press' });
    expect(keyToAction('t')).toEqual({ type: 'ptt', down: true });
  });

  it('maps arrows to knobs', () => {
    expect(keyToAction('ArrowUp')).toEqual({ type: 'knob', id: 'knob-channel', delta: 1 });
    expect(keyToAction('ArrowDown')).toEqual({ type: 'knob', id: 'knob-channel', delta: -1 });
    expect(keyToAction('ArrowRight')).toEqual({ type: 'knob', id: 'knob-volume', delta: 1 });
    expect(keyToAction('ArrowLeft')).toEqual({ type: 'knob', id: 'knob-volume', delta: -1 });
  });

  it('returns null for unmapped keys', () => {
    expect(keyToAction('x')).toBeNull();
    expect(keyToAction('Shift')).toBeNull();
  });

  it('ptt release key returns ptt up', () => {
    expect(keyReleaseToAction('t')).toEqual({ type: 'ptt', down: false });
    expect(keyReleaseToAction('1')).toBeNull();
  });
});

describe('controlToAction', () => {
  it('maps ptt press and release to ptt down and up', () => {
    expect(controlToAction('ptt', 'press')).toEqual({ type: 'ptt', down: true });
    expect(controlToAction('ptt', 'release')).toEqual({ type: 'ptt', down: false });
    expect(controlToAction('ptt', 'longpress')).toBeNull();
  });

  it('passes keypad events through as control actions', () => {
    expect(controlToAction('keypad-5', 'press')).toEqual({ type: 'control', id: 'keypad-5', event: 'press' });
  });

  it('returns null for fn-1..fn-4 (removed in V3: not on original hardware evidence)', () => {
    for (const id of ['fn-1', 'fn-2', 'fn-3', 'fn-4'] as const) {
      expect(controlToAction(id, 'press')).toBeNull();
      expect(controlToAction(id, 'release')).toBeNull();
    }
  });

  it('PRE + and PRE - are key presses (not dial turns); the reducer steps the preset', () => {
    expect(controlToAction('keypad-preset-up', 'press')).toEqual({ type: 'control', id: 'keypad-preset-up', event: 'press' });
    expect(controlToAction('keypad-preset-down', 'press')).toEqual({ type: 'control', id: 'keypad-preset-down', event: 'press' });
    expect(controlToAction('keypad-preset-up', 'release')).toBeNull();
  });

  it('returns null for knobs and non-interactive ids', () => {
    expect(controlToAction('knob-volume', 'press')).toBeNull();
    expect(controlToAction('antenna', 'press')).toBeNull();
    expect(knobTurnToAction('knob-squelch', -1)).toEqual({ type: 'knob', id: 'knob-squelch', delta: -1 });
  });
});
