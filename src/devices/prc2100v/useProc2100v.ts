// Store wrapper for the PRC2100V logic: reducer, link, keyboard shortcuts (simulator convenience, not device behavior).
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useLink, type LinkSettings } from '../../hooks/useLink';
import { activeFrequencyHz, initialState, reduce, type Prc2100vAction } from './logic';

export type Prc2100vControl = 'power' | 'volume' | 'pad-up' | 'pad-down' | 'pad-left' | 'pad-right' | 'key-square' | 'key-round' | 'key-oval' | 'ptt';

/** What each control does here. Every mapping except power and volume is Assumed: the real functions are not public. */
export function controlAction(id: Prc2100vControl, delta: -1 | 1 = 1): Prc2100vAction {
  switch (id) {
    case 'power': return { type: 'power-toggle' };
    case 'volume': return { type: 'volume', delta };
    case 'pad-up': return { type: 'channel', delta: 1 };
    case 'pad-down': return { type: 'channel', delta: -1 };
    case 'pad-right': return { type: 'tune', delta: 1 };
    case 'pad-left': return { type: 'tune', delta: -1 };
    case 'key-square': return { type: 'cycle-mode' };
    case 'key-round': return { type: 'cycle-power' };
    case 'key-oval': return { type: 'settings-toggle' };
    case 'ptt': return { type: 'ptt', down: delta === 1 };
  }
}

const KEYS: Record<string, Prc2100vControl> = {
  p: 'power', ArrowUp: 'pad-up', ArrowDown: 'pad-down', ArrowLeft: 'pad-left', ArrowRight: 'pad-right',
  m: 'key-square', w: 'key-round', s: 'key-oval',
};

function isTyping(t: EventTarget | null): boolean {
  return t instanceof HTMLElement && (t.isContentEditable || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement);
}

export function useProc2100v(linkSettings: LinkSettings) {
  const [state, dispatch] = useReducer(reduce, initialState);
  const link = useLink(state, dispatch, linkSettings, undefined, activeFrequencyHz);
  const [last, setLast] = useState<Prc2100vControl | null>(null);

  const press = useCallback((id: Prc2100vControl, delta: -1 | 1 = 1) => {
    setLast(id);
    dispatch(controlAction(id, delta));
  }, []);
  const ptt = useCallback((down: boolean) => dispatch({ type: 'ptt', down }), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === 't') { e.preventDefault(); if (!e.repeat) { setLast('ptt'); ptt(true); } return; }
      if (e.key === '[' || e.key === ']') { e.preventDefault(); press('volume', e.key === ']' ? 1 : -1); return; }
      const id = KEYS[e.key];
      if (!id) return;
      e.preventDefault();
      if (!e.repeat || id.startsWith('pad')) press(id);
    };
    const up = (e: KeyboardEvent) => { if (e.key === 't') ptt(false); };
    const stop = () => ptt(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', stop);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', stop);
    };
  }, [press, ptt]);

  return { state, link, last, press, ptt };
}
