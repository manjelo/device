// Store wrapper for the MTP850 logic: reducer, link, keyboard shortcuts (simulator convenience, not device behavior).
import { useCallback, useEffect, useReducer } from 'react';
import { useLink, type LinkSettings } from '../../hooks/useLink';
import { initialState, linkFrequencyHz, reduce, type Mtp850Action } from './logic';

function isTyping(t: EventTarget | null): boolean {
  return t instanceof HTMLElement && (t.isContentEditable || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement);
}

export function useMtp850(linkSettings: LinkSettings) {
  const [state, dispatch] = useReducer(reduce, initialState);
  const link = useLink(state, dispatch, linkSettings, undefined, linkFrequencyHz);
  const send = useCallback((a: Mtp850Action) => dispatch(a), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      const k = e.key;
      let action: Mtp850Action | null = null;
      if (k === 't') { if (e.repeat) { e.preventDefault(); return; } action = { type: 'ptt', down: true }; }
      else if (k === 'p') { if (e.repeat) return; action = { type: 'power-toggle' }; }
      else if (/^[0-9]$/.test(k)) action = { type: 'digit', digit: k };
      else if (k === 'Enter') action = { type: 'call' };
      else if (k === 'Escape' || k === 'Backspace') action = { type: 'end' };
      else if (k === 'e') action = { type: 'emergency' };
      else if (k === 'm') action = { type: 'menu' };
      else if (k === '[' || k === ']') action = { type: 'knob', delta: k === ']' ? 1 : -1 };
      else if (k === 'ArrowUp') action = { type: 'nav', dir: 'up' };
      else if (k === 'ArrowDown') action = { type: 'nav', dir: 'down' };
      else if (k === 'ArrowLeft') action = { type: 'nav', dir: 'left' };
      else if (k === 'ArrowRight') action = { type: 'nav', dir: 'right' };
      if (!action) return;
      e.preventDefault();
      dispatch(action);
    };
    const up = (e: KeyboardEvent) => { if (e.key === 't') dispatch({ type: 'ptt', down: false }); };
    const stop = () => dispatch({ type: 'ptt', down: false });
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', stop);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', stop);
    };
  }, []);

  return { state, link, send };
}
