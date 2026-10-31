import { describe, expect, it } from 'vitest';
import type { ViewId } from './controlInfo';
import { getViewSvg } from './radioSvg';

// Structural guard for the "no invisible controls" rule: every data-control group must draw something visible,
// and every interactive group needs a hit area of at least 44 units in both dimensions.
const VIEWS: ViewId[] = ['front', 'left', 'right', 'top'];
const MIN_HIT_UNITS = 44;
const SHAPES = new Set(['rect', 'circle', 'ellipse', 'path', 'line', 'polygon', 'polyline', 'text']);

function isHit(el: Element): boolean {
  return el.getAttribute('class')?.split(/\s+/).includes('hit') ?? false;
}

function isHidden(el: Element): boolean {
  return (el.getAttribute('style') ?? '').replace(/\s+/g, '').includes('display:none');
}

// A control is either a group of shapes (buttons, knobs, keys) or a single shape itself (the LCD window).
function visibleShapes(group: Element): Element[] {
  const candidates = SHAPES.has(group.tagName) ? [group] : Array.from(group.children);
  return candidates.filter((el) => SHAPES.has(el.tagName) && !isHit(el) && !isHidden(el));
}

function hitSize(group: Element): { w: number; h: number } | null {
  const hit = Array.from(group.children).find(isHit);
  if (!hit) return null;
  if (hit.tagName === 'circle') {
    const d = 2 * Number(hit.getAttribute('r'));
    return { w: d, h: d };
  }
  return { w: Number(hit.getAttribute('width')), h: Number(hit.getAttribute('height')) };
}

function controlsOf(view: ViewId): Element[] {
  return Array.from(getViewSvg(view).querySelectorAll('[data-control]'));
}

describe('radio SVG views: controls are visible and reachable', () => {
  for (const view of VIEWS) {
    it(`${view}: every control draws a visible shape and is not hidden`, () => {
      for (const group of controlsOf(view)) {
        const id = group.getAttribute('data-control');
        expect(isHidden(group), `${id} must not be display:none`).toBe(false);
        expect(visibleShapes(group).length, `${id} must draw a visible shape`).toBeGreaterThan(0);
      }
    });

    it(`${view}: every button and slider has a hit area of at least ${MIN_HIT_UNITS} units`, () => {
      for (const group of controlsOf(view)) {
        const id = group.getAttribute('data-control');
        const role = group.getAttribute('role');
        if (role !== 'button' && role !== 'slider') continue;
        const size = hitSize(group);
        expect(size, `${id} needs a .hit shape`).not.toBeNull();
        expect(size!.w, `${id} hit width`).toBeGreaterThanOrEqual(MIN_HIT_UNITS);
        expect(size!.h, `${id} hit height`).toBeGreaterThanOrEqual(MIN_HIT_UNITS);
      }
    });
  }

  it('front view: no power, volume or squelch hit target and no hidden function keys', () => {
    const ids = controlsOf('front').map((el) => el.getAttribute('data-control'));
    for (const id of ['power', 'knob-volume', 'knob-squelch']) expect(ids).not.toContain(id);
    expect(ids.some((id) => id?.startsWith('fn-'))).toBe(false);
  });

  it('top view: power, volume and squelch are visible controls', () => {
    const top = new Map(controlsOf('top').map((el) => [el.getAttribute('data-control'), el]));
    for (const id of ['power', 'knob-volume', 'knob-squelch']) {
      const group = top.get(id);
      expect(group, `${id} on top`).toBeDefined();
      expect(visibleShapes(group!).length).toBeGreaterThan(0);
    }
  });
});
