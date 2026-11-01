// Single source for control accuracy and accessible labels. Copied from src/assets/radio/controls.md
// (the human-readable copy). ptt is on the left view (V3 placement Assumed); the view is not part of these records.
import type { Accuracy, ControlId } from './types';

export const CONTROL_ACCURACY: Record<ControlId, Accuracy> = {
  power: 'Assumed',
  ptt: 'Assumed',
  // Verified-photo: existence and placement only (top-mounted rotary dial with SCAN and numeral positions).
  // The dial labels (SCAN, 1-5, S, F, Z, R) have no documented meaning. V5 simulates positions 1-5 as presets 1-5 and
  // shows the others as unsupported. The dial is a separate control from the 100 stored presets (PRE + and PRE -).
  'knob-channel': 'Verified-photo',
  'knob-volume': 'Assumed',
  'knob-squelch': 'Assumed',
  'keypad-0': 'Secondary-source',
  'keypad-1': 'Secondary-source',
  'keypad-2': 'Secondary-source',
  'keypad-3': 'Secondary-source',
  'keypad-4': 'Secondary-source',
  'keypad-5': 'Secondary-source',
  'keypad-6': 'Secondary-source',
  'keypad-7': 'Secondary-source',
  'keypad-8': 'Secondary-source',
  'keypad-9': 'Secondary-source',
  'keypad-star': 'Unknown',
  'keypad-hash': 'Unknown',
  'keypad-clear': 'Assumed',
  'keypad-enter': 'Assumed',
  // V5: PRE + and PRE - keys. Behaviour is a 25 kHz frequency step on the main screen (Assumed, user-supplied); the placement is Unknown.
  'keypad-preset-up': 'Assumed',
  'keypad-preset-down': 'Assumed',
  // REMOVED V3: not on original hardware evidence. Kept only so the ids stay valid; no front-panel action.
  'fn-1': 'Unknown',
  'fn-2': 'Unknown',
  'fn-3': 'Unknown',
  'fn-4': 'Unknown',
  antenna: 'Secondary-source',
  'conn-top': 'Secondary-source',
  'lcd-area': 'Unknown',
};

export const CONTROL_LABEL: Record<ControlId, string> = {
  power: 'Power',
  ptt: 'Push-to-talk (PTT)',
  'knob-channel': 'Channel knob',
  'knob-volume': 'Volume knob',
  'knob-squelch': 'Squelch knob',
  'keypad-0': 'Key 0',
  'keypad-1': 'Key 1',
  'keypad-2': 'Key 2',
  'keypad-3': 'Key 3',
  'keypad-4': 'Key 4',
  'keypad-5': 'Key 5',
  'keypad-6': 'Key 6',
  'keypad-7': 'Key 7 (OPT)',
  'keypad-8': 'Key 8 (PGM)',
  'keypad-9': 'Key 9',
  'keypad-star': 'Key *',
  'keypad-hash': 'Key #',
  'keypad-clear': 'Clear (CLR)',
  'keypad-enter': 'Enter (ENT)',
  'keypad-preset-up': 'Tune up 25 kHz (+)',
  'keypad-preset-down': 'Tune down 25 kHz (−)',
  'fn-1': 'Function key F1',
  'fn-2': 'Function key F2',
  'fn-3': 'Function key F3',
  'fn-4': 'Function key F4',
  antenna: 'Antenna connector (TNC)',
  'conn-top': 'Top connector (U-229)',
  'lcd-area': 'LCD display',
};
