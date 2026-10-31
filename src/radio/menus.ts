// Data-driven menus. No source documents the original AN/PRC-152 menu tree (docs/research-v5-basic-operation.md).
// What a secondary source (the ACRE2 game-mod wiki) names: the OPT key opens operational options, the PGM key opens
// programming, and the PGM path "System Preset Settings" then "System Presets" leads to the presets. Everything else
// here is a simulator choice and is labelled so. Entries the simulator cannot support are shown as unavailable.
import type { Accuracy, MenuId } from './types';

export type MenuAccuracy = Extract<Accuracy, 'Secondary-source' | 'Assumed' | 'Unknown'>;

export type MenuItemKind =
  | 'submenu' // ENT opens the menu named by `to`
  | 'toggle' // ENT flips an on/off value
  | 'cycle' // ENT steps a value and wraps
  | 'action' // ENT runs an action
  | 'edit' // ENT opens a numeric edit
  | 'unavailable'; // shown, not supported; ENT gives a notice

export type MenuItemId =
  | 'lock'
  | 'monitor'
  | 'brightness'
  | 'rfpower'
  | 'drain'
  | 'reset'
  | 'comsec'
  | 'waveform'
  | 'system-preset-settings'
  | 'other-programming'
  | 'system-presets'
  | 'frequency'
  | 'name';

export type MenuItem = {
  id: MenuItemId;
  label: string;
  kind: MenuItemKind;
  accuracy: MenuAccuracy;
  to?: MenuId;
};

export type MenuDef = {
  title: string;
  accuracy: MenuAccuracy;
  items: readonly MenuItem[];
};

/** Menus with fixed entries. 'pgm.presets' is built from the stored presets and is not listed here. */
export const MENUS: Record<Exclude<MenuId, 'pgm.presets'>, MenuDef> = {
  opt: {
    title: 'OPTIONS (simulator)',
    accuracy: 'Secondary-source', // the OPT key opening operational options. The entries below are simulator choices.
    items: [
      { id: 'lock', label: 'Keypad Lock', kind: 'action', accuracy: 'Unknown' },
      { id: 'monitor', label: 'Monitor', kind: 'toggle', accuracy: 'Unknown' },
      { id: 'brightness', label: 'Display Bright', kind: 'cycle', accuracy: 'Unknown' },
      { id: 'rfpower', label: 'RF Power', kind: 'cycle', accuracy: 'Assumed' },
      { id: 'drain', label: 'Battery Drain', kind: 'toggle', accuracy: 'Unknown' },
      { id: 'reset', label: 'Reset Simulator', kind: 'action', accuracy: 'Unknown' },
      { id: 'comsec', label: 'COMSEC', kind: 'unavailable', accuracy: 'Unknown' },
      { id: 'waveform', label: 'Waveform', kind: 'unavailable', accuracy: 'Unknown' },
    ],
  },
  pgm: {
    title: 'PROGRAM (simulator)',
    accuracy: 'Secondary-source', // the PGM key opening programming. "System Preset Settings" is a game-mod label.
    items: [
      { id: 'system-preset-settings', label: 'System Preset Settings', kind: 'submenu', accuracy: 'Secondary-source', to: 'pgm.system' },
      { id: 'other-programming', label: 'Other Programming', kind: 'unavailable', accuracy: 'Unknown' },
    ],
  },
  'pgm.system': {
    title: 'SYSTEM PRESET SETTINGS',
    accuracy: 'Secondary-source',
    items: [{ id: 'system-presets', label: 'System Presets', kind: 'submenu', accuracy: 'Secondary-source', to: 'pgm.presets' }],
  },
  'pgm.preset': {
    title: 'PRESET', // the LCD appends the preset number
    accuracy: 'Assumed',
    items: [
      { id: 'frequency', label: 'Frequency', kind: 'edit', accuracy: 'Assumed' },
      { id: 'name', label: 'Name', kind: 'unavailable', accuracy: 'Unknown' },
    ],
  },
};

export const PRESETS_MENU_TITLE = 'SYSTEM PRESETS';

/** Number of list rows the LCD shows at once on the presets list. */
export const LIST_WINDOW = 5;
