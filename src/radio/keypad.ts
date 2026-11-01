// Maps control events and keyboard keys to RadioAction values.
// Keyboard shortcuts are SIMULATOR CONVENIENCES, not device behavior (see README.md).
import type { ControlEvent, ControlId, KnobId, RadioAction } from './types';

/**
 * Maps a pointer/DOM control event to an action. Returns null for controls with no action.
 * Ptt press and release become ptt down and up. Knob presses are ignored; use knobTurnToAction.
 */
export function controlToAction(id: ControlId, event: ControlEvent): RadioAction | null {
  if (id === 'ptt') {
    if (event === 'press') return { type: 'ptt', down: true };
    if (event === 'release') return { type: 'ptt', down: false };
    return null;
  }
  if (id === 'knob-channel' || id === 'knob-volume' || id === 'knob-squelch') return null;
  // V5: PRE + and PRE - are keys. The reducer tunes the active preset by 25 kHz on the main screen (see stepFrequency) and moves the
  // cursor in a menu. They are not dial turns: the dial is a separate control from the stored presets.
  if (id === 'keypad-preset-up' || id === 'keypad-preset-down') {
    return event === 'press' ? { type: 'control', id, event } : null;
  }
  if (id === 'antenna' || id === 'conn-top' || id === 'lcd-area') return null;
  // REMOVED V3: fn-1..fn-4 are not on original hardware evidence. No front-panel action.
  // The placeholder menu is reached from main by keypad-enter with an empty entry buffer.
  if (id === 'fn-1' || id === 'fn-2' || id === 'fn-3' || id === 'fn-4') return null;
  return { type: 'control', id, event };
}

/** Maps a knob turn (one detent) to an action. */
export function knobTurnToAction(id: KnobId, delta: -1 | 1): RadioAction {
  return { type: 'knob', id, delta };
}

/**
 * Maps a keyboard key on key DOWN to an action. Returns null for unmapped keys.
 * Shortcuts (simulator convenience):
 *   0-9              keypad-0 .. keypad-9
 *   Enter            keypad-enter
 *   Backspace/Escape keypad-clear
 *   p                power
 *   t                ptt down (release with keyReleaseToAction)
 *   ArrowUp/Down     channel +1 / -1
 *   ArrowRight/Left  volume +1 / -1
 *   PageUp/PageDown  squelch +1 / -1
 *   + or =  / -      PRE + / PRE -
 * On the main screen keys 7 and 8 open OPT and PGM (a secondary function; see stateMachine.ts).
 */
export function keyToAction(key: string): RadioAction | null {
  if (/^[0-9]$/.test(key)) return { type: 'control', id: `keypad-${key}` as ControlId, event: 'press' };
  switch (key) {
    case 'Enter':
      return { type: 'control', id: 'keypad-enter', event: 'press' };
    case 'Backspace':
    case 'Escape':
      return { type: 'control', id: 'keypad-clear', event: 'press' };
    case '+':
    case '=':
      return { type: 'control', id: 'keypad-preset-up', event: 'press' };
    case '-':
      return { type: 'control', id: 'keypad-preset-down', event: 'press' };
    case 'p':
    case 'P':
      return { type: 'control', id: 'power', event: 'press' };
    case 't':
    case 'T':
      return { type: 'ptt', down: true };
    case 'ArrowUp':
      return knobTurnToAction('knob-channel', 1);
    case 'ArrowDown':
      return knobTurnToAction('knob-channel', -1);
    case 'ArrowRight':
      return knobTurnToAction('knob-volume', 1);
    case 'ArrowLeft':
      return knobTurnToAction('knob-volume', -1);
    case 'PageUp':
      return knobTurnToAction('knob-squelch', 1);
    case 'PageDown':
      return knobTurnToAction('knob-squelch', -1);
    default:
      return null;
  }
}

/** Maps a keyboard key on key UP to an action. Only the ptt key has one (ptt up). */
export function keyReleaseToAction(key: string): RadioAction | null {
  return key === 't' || key === 'T' ? { type: 'ptt', down: false } : null;
}
