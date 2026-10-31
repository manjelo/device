// Public entry point for the radio logic layer (contract: docs/architecture.md, v5).
export {
  initialState,
  reduce,
  activeFrequencyHz,
  createDefaultPresets,
  parseFrequencyEntry,
  menuLength,
  currentMenuId,
} from './stateMachine';
export { renderLcd, frequencyTemplate, insetRows } from './lcd';
export { keyToAction, keyReleaseToAction, controlToAction, knobTurnToAction } from './keypad';
export { CONTROL_ACCURACY, CONTROL_LABEL } from './controls';
export type {
  RadioState,
  RadioAction,
  LcdFrame,
  LcdIndicators,
  LcdRow,
  ControlId,
  ControlEvent,
  KnobId,
  Accuracy,
  Screen,
  SoundCue,
  MenuId,
  Preset,
  Overlay,
} from './types';
