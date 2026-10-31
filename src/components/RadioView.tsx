import { useEffect, useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { ControlId, KnobId } from '../radio';
import { DIAL_POSITIONS, SQUELCH_MAX, SQUELCH_MIN, VOLUME_MAX, VOLUME_MIN } from '../radio/config';
import type { RadioControls } from '../hooks/useRadio';
import { Lcd, LcdInset } from './Lcd';
import { getViewSvg } from './radioSvg';
import { isControlId, isKnobId, type ViewId } from './controlInfo';

// Vertical pixels of drag per knob detent. Simulator convenience.
const KNOB_DRAG_PX_PER_STEP = 12;

// Arrow keys on a focused knob turn that knob. Simulator convenience.
const KNOB_KEY_DELTA: Record<string, -1 | 1> = {
  ArrowUp: 1,
  ArrowRight: 1,
  PageUp: 1,
  ArrowDown: -1,
  ArrowLeft: -1,
  PageDown: -1,
};

type Drag = { id: KnobId; lastY: number; carry: number };

/** Returns the data-control id of the element under the event target, if it is a known control. */
function controlIdAt(target: EventTarget | null): ControlId | null {
  if (!(target instanceof Element)) return null;
  const id = target.closest('[data-control]')?.getAttribute('data-control');
  return isControlId(id) ? id : null;
}

/** Keeps the knobs' aria-valuenow in step with the radio state. */
function syncKnobValues(host: HTMLElement, state: RadioControls['state']): void {
  const values: [KnobId, number, number, number][] = [
    ['knob-channel', state.dial, 0, DIAL_POSITIONS.length - 1],
    ['knob-volume', state.volume, VOLUME_MIN, VOLUME_MAX],
    ['knob-squelch', state.squelch, SQUELCH_MIN, SQUELCH_MAX],
  ];
  for (const [id, now, min, max] of values) {
    const el = host.querySelector(`[data-control="${id}"]`);
    if (!el) continue;
    el.setAttribute('aria-valuemin', String(min));
    el.setAttribute('aria-valuemax', String(max));
    el.setAttribute('aria-valuenow', String(now));
    // The dial reads out its label (SCAN, 1 to 5, S, F, Z, R) instead of a bare index.
    if (id === 'knob-channel') el.setAttribute('aria-valuetext', `Position ${DIAL_POSITIONS[now]}`);
  }
}

export function RadioView({ view, radio }: { view: ViewId; radio: RadioControls }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const { pointerDown, release, turnKnob, releaseAll, state } = radio;

  useLayoutEffect(() => {
    hostRef.current?.replaceChildren(getViewSvg(view));
  }, [view]);

  // Switching views replaces the SVG under the pointer, which can drop the pointer-up. Release held controls so PTT never sticks.
  useEffect(() => {
    releaseAll();
  }, [view, releaseAll]);

  useEffect(() => {
    if (hostRef.current) syncKnobValues(hostRef.current, state);
  }, [view, state]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Wheel over a knob turns it one detent per wheel tick. Native listener so preventDefault works.
    const onWheel = (e: WheelEvent) => {
      const id = controlIdAt(e.target);
      if (!isKnobId(id) || e.deltaY === 0) return;
      e.preventDefault();
      turnKnob(id, e.deltaY < 0 ? 1 : -1);
    };
    host.addEventListener('wheel', onWheel, { passive: false });
    return () => host.removeEventListener('wheel', onWheel);
  }, [turnKnob]);

  const endDrag = () => {
    dragRef.current = null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const id = controlIdAt(e.target);
    if (!id) return;
    pointerDown(id, e.pointerId);
    if (isKnobId(id)) {
      dragRef.current = { id, lastY: e.clientY, carry: 0 };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
  };

  // Keyboard path for focusable controls. Enter/Space press and release the control like a pointer does.
  // stopPropagation keeps the window-level shortcut handler from acting on the same key again.
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const id = controlIdAt(e.target);
    if (!id) return;
    if (isKnobId(id)) {
      const delta = KNOB_KEY_DELTA[e.key];
      if (delta === undefined) return;
      e.preventDefault();
      e.stopPropagation();
      turnKnob(id, delta);
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) pointerDown(id);
  };

  const onKeyUp = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const id = controlIdAt(e.target);
    if (!id || isKnobId(id)) return;
    e.stopPropagation();
    release(id);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    // Dragging up increases the value.
    drag.carry += drag.lastY - e.clientY;
    drag.lastY = e.clientY;
    const steps = Math.trunc(drag.carry / KNOB_DRAG_PX_PER_STEP);
    if (steps === 0) return;
    drag.carry -= steps * KNOB_DRAG_PX_PER_STEP;
    const delta = steps > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(steps); i += 1) turnKnob(drag.id, delta);
  };

  return (
    <div className="rs-radio" data-radio-scope="">
      <div className="rs-radio-body">
        <div
          ref={hostRef}
          className="rs-svg-host"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
        />
        {view === 'front' && <LcdInset frame={radio.lcd} />}
      </div>
      {/* The LCD panel shows the same state in every view: power and volume controls are on the top view. */}
      <Lcd frame={radio.lcd} />
    </div>
  );
}
