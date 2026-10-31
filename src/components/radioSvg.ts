// Loads the four SVG views as raw text and parses them with DOMParser (no innerHTML).
// The parsed <svg> nodes are inserted as real DOM, so every data-control element is queryable.
// Hit areas come from the SVGs themselves (.hit shapes); nothing is injected here.
import frontRaw from '../assets/radio/front.svg?raw';
import leftRaw from '../assets/radio/left.svg?raw';
import rightRaw from '../assets/radio/right.svg?raw';
import topRaw from '../assets/radio/top.svg?raw';
import { CONTROL_LABEL, type ControlId } from '../radio';
import { isControlId, isKnobId, type ViewId } from './controlInfo';

// Connectors and the LCD have no action in the logic layer. They are labelled, not focusable.
const NON_INTERACTIVE: ReadonlySet<ControlId> = new Set<ControlId>(['lcd-area', 'antenna', 'conn-top']);

const RAW: Record<ViewId, string> = {
  front: frontRaw,
  left: leftRaw,
  right: rightRaw,
  top: topRaw,
};

const parsed = new Map<ViewId, SVGSVGElement>();

/**
 * Exposes the controls to assistive technology and the keyboard.
 * The SVG root ships with role="img", which hides its children, so it is changed to a labelled group.
 * Interactive controls get a role, an accessible name from CONTROL_LABEL, and tabindex="0".
 */
function decorateControls(root: Element): void {
  root.setAttribute('role', 'group');
  root.querySelectorAll('[data-control]').forEach((el) => {
    const id = el.getAttribute('data-control');
    if (!isControlId(id)) return;
    el.setAttribute('aria-label', CONTROL_LABEL[id]);
    if (NON_INTERACTIVE.has(id)) {
      el.setAttribute('role', 'img');
      return;
    }
    el.setAttribute('role', isKnobId(id) ? 'slider' : 'button');
    el.setAttribute('tabindex', '0');
  });
}

function parseView(view: ViewId): SVGSVGElement {
  const doc = new DOMParser().parseFromString(RAW[view], 'image/svg+xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error(`Could not parse the ${view} SVG view.`);
  }
  // The cast is needed because importNode returns Node, and the parsed root is always an <svg>.
  const root = document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
  root.setAttribute('class', 'rs-svg');
  decorateControls(root);
  return root;
}

/** Returns a fresh copy of the view's SVG root, ready to append. */
export function getViewSvg(view: ViewId): SVGSVGElement {
  let template = parsed.get(view);
  if (!template) {
    template = parseView(view);
    parsed.set(view, template);
  }
  return template.cloneNode(true) as SVGSVGElement;
}
