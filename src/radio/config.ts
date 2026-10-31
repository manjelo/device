// Configurable radio constants. Each value lists its source and accuracy status.
// Source IDs (S1-S8) are defined in docs/device-research.md; status values follow docs/accuracy-matrix.md.
// Values marked Assumed are simulator choices, not device facts.

// Band limits. Secondary-source: S3 body "30 to 511.99 MHz", S4, S5, S7 snippet.
// The matrix uses 512.000 MHz as the upper limit; S3 gives 511.99 MHz. Conflict noted, not resolved.
export const FREQ_MIN_HZ = 30_000_000;
export const FREQ_MAX_HZ = 512_000_000;

// Optional highband 762-870 MHz. Secondary-source (S5, S3 infobox); standard vs optional is Unknown.
// Kept off. The reducer does not model the highband.
export const FEATURE_HIGHBAND = false;

// Frequency step. Unknown: S4 says 10 Hz, S7 snippet (152A datasheet) says 100 Hz. The conflict is
// not resolved. The value is not enforced; front-panel and menu entry use whole MHz (Assumed).
export const FREQ_STEP_HZ = 10;

// Presets. Verified-public-doc: 100 presets (Harris data sheet DS-321D, 2006; docs/datasheet-ds321d.md). Earlier
// secondary sources said 99. Preset knob positions are Unknown.
export const PRESET_COUNT = 100;
export const CHANNEL_MIN = 1; // Assumed: presets are numbered from 1.
export const INITIAL_PRESET = 1; // Assumed.

// RF output. Secondary-source: 250 mW to 5 W (S3, S4, S5). Only the endpoints are used.
// Intermediate power levels are DISABLED: their values and names are Unknown.
export const POWER_LEVELS_W: readonly number[] = [0.25, 5];

// Waveforms. Secondary-source (S3, S4). Info list only; selection path from the front panel is Unknown.
export const WAVEFORMS: readonly string[] = [
  'SINCGARS',
  'VHF/UHF AM/FM (VULOS)',
  'ANDVT',
  'HAVEQUICK I/II',
  'HPW',
  'SATCOM',
  'OTAR',
  'P25 (optional)',
];

// Knob ranges. Assumed: 0..10 for volume and squelch, per the architecture contract.
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 10;
export const SQUELCH_MIN = 0;
export const SQUELCH_MAX = 10;
export const INITIAL_VOLUME = 5; // Assumed.
export const INITIAL_SQUELCH = 5; // Assumed.
export const INITIAL_OUTPUT_POWER_W = POWER_LEVELS_W[0];
export const INITIAL_WAVEFORM = WAVEFORMS[0];
export const INITIAL_FREQUENCY_HZ = FREQ_MIN_HZ; // Assumed.

// Keypad entry on the main screen. Assumed: whole MHz digits, at most 7 digits.
export const ENTRY_MAX_DIGITS = 7;
export const INVALID_FREQ_NOTICE = 'INVALID FREQ'; // Assumed label.

// Placeholder menu draft entry. Assumed: frequency is whole MHz (max 3 digits, 512 MHz);
// volume and squelch are 0..10 (max 2 digits). Power is changed with the channel knob only.
export const FREQ_DRAFT_MAX_DIGITS = 3;
export const KNOB_DRAFT_MAX_DIGITS = 2;
export const OUT_OF_RANGE_NOTICE = 'OUT OF RANGE'; // Assumed label.

// Battery. Unknown: the device's battery behavior is not documented. This is a placeholder percentage.
export const BATTERY_PLACEHOLDER_PERCENT = 100;

// V5 simulator constants. None of these is a documented device value (docs/device-functionality-v5.md).

// Simulated default presets. Unknown: the factory presets are not documented. Preset n gets a distinct frequency so
// that preset changes are visible: 30 MHz plus 4.5 MHz per step (preset 100 = 475.5 MHz, inside the band).
export const DEFAULT_PRESET_BASE_HZ = FREQ_MIN_HZ;
export const DEFAULT_PRESET_STEP_HZ = 4_500_000;

// Front-panel frequency entry. Simulator-specific: six digits, MMM.KKK MHz, so the entry increment is 1 kHz.
// The device tuning resolution (FREQ_STEP_HZ, 10 Hz, Secondary-source) is finer; every 1 kHz value is a valid multiple of it.
export const FREQ_ENTRY_DIGITS = 6;
export const FREQ_ENTRY_INTEGER_DIGITS = 3;

// Top function dial. The labels come from top.svg. Their meaning on the original is Unknown. Simulator-specific:
// positions 1 to 5 select presets 1 to 5; the other positions are shown but not supported.
export const DIAL_POSITIONS: readonly string[] = ['SCAN', '1', '2', '3', '4', '5', 'S', 'F', 'Z', 'R'];
export const INITIAL_DIAL_INDEX = 1;
export const DIAL_PRESET_POSITIONS = 5;

// Display brightness. Simulator-specific: 1..5, applied to both the in-radio LCD and the enlarged preview.
export const BRIGHTNESS_MIN = 1;
export const BRIGHTNESS_MAX = 5;
export const INITIAL_BRIGHTNESS = 5;

// Battery simulation. Simulator-specific. Drain is off by default so tests and demos are deterministic.
// The frontend sends a battery-tick every BATTERY_DRAIN_INTERVAL_MS while drain is on.
export const LOW_BATTERY_PERCENT = 20;
export const BATTERY_DRAIN_STEP_PERCENT = 5;
export const BATTERY_DRAIN_INTERVAL_MS = 60_000;

// Temporary indicator (volume, squelch) length. The frontend clears it after this many milliseconds.
export const OVERLAY_MS = 1500;

export const UNAVAILABLE_NOTICE = 'UNAVAILABLE IN SIM';
export const ENTRY_INCOMPLETE_NOTICE = 'ENTER 6 DIGITS';
export const SAVED_NOTICE = 'SAVED';
