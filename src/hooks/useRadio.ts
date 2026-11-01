// Store wrapper around the radio logic (src/radio). Owns device state, pointer and keyboard wiring.
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  controlToAction,
  initialState,
  keyReleaseToAction,
  keyToAction,
  knobTurnToAction,
  reduce,
  renderLcd,
} from '../radio';
import type { ControlId, KnobId, LcdFrame, RadioAction, RadioState } from '../radio';
import { BATTERY_DRAIN_INTERVAL_MS, OVERLAY_MS } from '../radio/config';
import { useLink, type LinkSettings, type LinkStatus } from './useLink';
import type { Transport } from '../net/transport';

/** Placeholder startup length. The real startup timing is Unknown (docs/architecture.md). */
export const STARTUP_TICK_MS = 1200;

export type RadioControls = {
  state: RadioState;
  lcd: LcdFrame;
  /** Most recently pressed or turned control, for the info panel. */
  lastControl: ControlId | null;
  /** Simulator link to other instances (network). */
  link: { status: LinkStatus; transport: Transport | null };
  /** Pointer press (or Enter/Space press) on a control. Holds it until released. `pointerId` ties the hold to its pointer. */
  pointerDown: (id: ControlId, pointerId?: number) => void;
  /** Release of a control pressed with pointerDown (keyboard keyup). */
  release: (id: ControlId) => void;
  /** One detent of a knob (wheel, drag, arrow keys on a focused knob). */
  turnKnob: (id: KnobId, delta: -1 | 1) => void;
  /** Releases every held control and the PTT latch. Called when the view changes or the page is hidden. */
  releaseAll: () => void;
};

// Input types that take no typed text, so radio shortcuts still apply while they have focus.
const NON_TEXT_INPUT_TYPES = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'];

/** Text entry: radio shortcuts are ignored here so the user can type. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.includes(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

/** Elements with their own Enter and Space activation keep it: buttons, links, form buttons, and the details summary. */
function isNativeActivatable(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) return ['button', 'submit', 'reset'].includes(target.type);
  return target instanceof HTMLElement && target.closest('button, a, summary') !== null;
}

/** A control held by the pointer or the keyboard. `pointer` is the pointer id; null means a keyboard press. */
type Held = { id: ControlId; pointer: number | null };

const LINK_OFF: LinkSettings = { mode: 'off' };

export function useRadio(linkSettings: LinkSettings = LINK_OFF): RadioControls {
  const [state, dispatch] = useReducer(reduce, initialState);
  const link = useLink(state, dispatch, linkSettings);
  const [lastControl, setLastControl] = useState<ControlId | null>(null);
  const heldRef = useRef<Held | null>(null);
  // True while the keyboard PTT key (t) holds the transmit latch. Pointer PTT uses heldRef.
  const keyboardPttRef = useRef(false);

  const dispatchAction = useCallback((action: RadioAction | null) => {
    if (action) dispatch(action);
  }, []);

  /** Sends the release for a held control. PTT stays on while the other input (the t key) still holds it. */
  const releaseHeldControl = useCallback(
    (held: Held) => {
      if (held.id === 'ptt' && keyboardPttRef.current) return;
      dispatchAction(controlToAction(held.id, 'release'));
    },
    [dispatchAction],
  );

  const pointerDown = useCallback(
    (id: ControlId, pointerId?: number) => {
      heldRef.current = { id, pointer: pointerId ?? null };
      setLastControl(id);
      dispatchAction(controlToAction(id, 'press'));
    },
    [dispatchAction],
  );

  const release = useCallback(
    (id: ControlId) => {
      const held = heldRef.current;
      if (!held || held.id !== id) return;
      heldRef.current = null;
      releaseHeldControl(held);
    },
    [releaseHeldControl],
  );

  const turnKnob = useCallback((id: KnobId, delta: -1 | 1) => {
    setLastControl(id);
    dispatch(knobTurnToAction(id, delta));
  }, []);

  // PTT must never stay latched: this clears the held control, the keyboard latch, and the transmit flag.
  // The reducer ignores a ptt-up when the radio is not transmitting, so calling it is always safe.
  const releaseAll = useCallback(() => {
    const held = heldRef.current;
    heldRef.current = null;
    if (held) dispatchAction(controlToAction(held.id, 'release'));
    keyboardPttRef.current = false;
    dispatch({ type: 'ptt', down: false });
  }, [dispatchAction]);

  useEffect(() => {
    // Only the pointer that pressed a control releases it, so another finger or mouse button lifting does not end a PTT hold.
    const onPointerEnd = (e: PointerEvent) => {
      const held = heldRef.current;
      if (!held || held.pointer === null || held.pointer !== e.pointerId) return;
      heldRef.current = null;
      releaseHeldControl(held);
    };
    const releaseKeyboardPtt = () => {
      if (!keyboardPttRef.current) return;
      keyboardPttRef.current = false;
      dispatch({ type: 'ptt', down: false });
    };
    // Focus moving into text entry while t is held releases the keyboard PTT latch.
    const onFocusIn = (e: FocusEvent) => {
      if (isTypingTarget(e.target)) releaseKeyboardPtt();
    };
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('blur', releaseAll);
    window.addEventListener('focusin', onFocusIn);
    // A hidden tab can miss the pointer-up or key-up, so release everything when it hides.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') releaseAll();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('blur', releaseAll);
      window.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [releaseHeldControl, releaseAll]);

  useEffect(() => {
    // Simulator keyboard shortcuts (see keypad.ts). Not device behavior.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      // Enter and Space on a native button activate that button, not the radio.
      if ((e.key === 'Enter' || e.key === ' ') && isNativeActivatable(e.target)) return;
      const action = keyToAction(e.key);
      if (!action) return;
      e.preventDefault();
      // Knob turns may auto-repeat. Other keys ignore repeats so digits and ptt do not re-fire.
      if (e.repeat && action.type !== 'knob') return;
      if (action.type === 'control') setLastControl(action.id);
      if (action.type === 'knob') setLastControl(action.id);
      if (action.type === 'ptt' && action.down) {
        setLastControl('ptt');
        // The pointer already holds PTT: do not take the keyboard latch, so the t key-up cannot end that hold.
        if (heldRef.current?.id === 'ptt') return;
        keyboardPttRef.current = true;
      }
      dispatch(action);
    };
    // Release on keyup regardless of focus, but only for a t press that this hook latched.
    const onKeyUp = (e: KeyboardEvent) => {
      const action = keyReleaseToAction(e.key);
      if (!action || !keyboardPttRef.current) return;
      keyboardPttRef.current = false;
      // A pointer that is still holding PTT keeps the transmit flag until it lets go.
      if (heldRef.current?.id === 'ptt') return;
      dispatch(action);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [dispatchAction]);

  // Startup is a placeholder (Unknown timing). The frontend sends tick to leave it. Power off or unmount cancels it.
  const screen = state.screen;
  useEffect(() => {
    if (screen !== 'startup') return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), STARTUP_TICK_MS);
    return () => window.clearTimeout(timer);
  }, [screen]);

  // The temporary volume or squelch indicator clears after OVERLAY_MS. A new turn replaces the overlay object, which restarts the timer.
  const overlay = state.overlay;
  useEffect(() => {
    if (!overlay) return;
    const timer = window.setTimeout(() => dispatch({ type: 'overlay-clear' }), OVERLAY_MS);
    return () => window.clearTimeout(timer);
  }, [overlay]);

  // Simulated battery drain runs only while the radio is on and drain is enabled (off by default).
  const draining = state.power === 'on' && state.batteryDrain;
  useEffect(() => {
    if (!draining) return;
    const timer = window.setInterval(() => dispatch({ type: 'battery-tick' }), BATTERY_DRAIN_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [draining]);

  const lcd = useMemo(() => renderLcd(state), [state]);

  return { state, lcd, lastControl, link, pointerDown, release, turnKnob, releaseAll };
}
