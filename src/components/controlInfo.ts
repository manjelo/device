// UI helpers for control ids and views. Accuracy and labels come only from src/radio (CONTROL_ACCURACY, CONTROL_LABEL).
import { CONTROL_LABEL, type Accuracy, type ControlId, type KnobId } from '../radio';

export type ViewId = 'front' | 'left' | 'right' | 'top';

const KNOB_IDS: readonly KnobId[] = ['knob-channel', 'knob-volume', 'knob-squelch'];

export function isControlId(value: string | null | undefined): value is ControlId {
  return value != null && Object.prototype.hasOwnProperty.call(CONTROL_LABEL, value);
}

export function isKnobId(value: string | null | undefined): value is KnobId {
  return value != null && (KNOB_IDS as readonly string[]).includes(value);
}

/** Plain-language status for the accuracy values. Only Verified-public-doc may be shown as verified. */
export const ACCURACY_TEXT: Record<Accuracy, string> = {
  'Verified-public-doc': 'Verified against a public document.',
  'Verified-photo': 'Verified against a photo of the device. Existence and placement only.',
  'Secondary-source': 'From a secondary source. Not checked on the device.',
  Assumed: 'Assumed. A simulator choice, not verified.',
  Unknown: 'Unknown. Placeholder only; the real behavior is not known.',
};
