import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RadioAction } from '../radio';
import { initialState, reduce } from '../radio';
import type { LinkMessage, Transport } from '../net/transport';
import { LINK_EXPIRY_MS, useLink } from './useLink';

/** In-memory stand-in for BroadcastChannel: delivers to every other endpoint. */
function makeBus() {
  const endpoints: Array<(m: LinkMessage) => void> = [];
  const sent: LinkMessage[] = [];
  const create = (): Transport => {
    let listener: ((m: LinkMessage) => void) | null = null;
    return {
      send: (m) => { sent.push(m); endpoints.forEach((e) => e !== listener && e(m)); },
      onMessage: (l) => { listener = l; endpoints.push(l); return () => { endpoints.splice(endpoints.indexOf(l), 1); }; },
      close: () => {},
    };
  };
  return { create, sent, inject: (m: LinkMessage) => endpoints.forEach((e) => e(m)) };
}

const TABS = { mode: 'network' } as const;
const on = () => reduce(reduce(initialState, { type: 'control', id: 'power', event: 'press' }), { type: 'tick' });

describe('useLink', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('dispatches rx-signal for another instance and expires it without a heartbeat', () => {
    const bus = makeBus();
    const dispatch = vi.fn<(a: RadioAction) => void>();
    renderHook(() => useLink(on(), dispatch, TABS, bus.create));
    act(() => bus.inject({ v: 1, from: 'other', active: true, frequencyHz: 30_000_000 }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'rx-signal', from: 'other', frequencyHz: 30_000_000, active: true });
    act(() => { vi.advanceTimersByTime(LINK_EXPIRY_MS + 2000); });
    expect(dispatch).toHaveBeenCalledWith({ type: 'rx-signal', from: 'other', frequencyHz: 0, active: false });
  });

  it('publishes on PTT with the active frequency, and sends a release when PTT ends', () => {
    const bus = makeBus();
    const dispatch = vi.fn();
    const keyed = reduce(on(), { type: 'ptt', down: true });
    const { rerender } = renderHook(({ s }) => useLink(s, dispatch, TABS, bus.create), { initialProps: { s: keyed } });
    expect(bus.sent.at(-1)).toMatchObject({ active: true, frequencyHz: 30_000_000 });
    rerender({ s: reduce(keyed, { type: 'ptt', down: false }) });
    expect(bus.sent.at(-1)).toMatchObject({ active: false });
  });

  it('does nothing when disabled', () => {
    const bus = makeBus();
    renderHook(() => useLink(reduce(on(), { type: 'ptt', down: true }), vi.fn(), { mode: 'off' }, bus.create));
    expect(bus.sent).toHaveLength(0);
  });
});
