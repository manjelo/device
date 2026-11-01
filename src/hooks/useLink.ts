// Connects a radio to other RadioSim instances: publishes this radio's PTT and feeds what it hears into the radio logic.
// Simulator-specific. The radio logic never sees the transport; it only receives 'rx-signal' actions.
import { useEffect, useState } from 'react';
import type { Dispatch } from 'react';
import { activeFrequencyHz } from '../radio';
import type { RadioAction, RadioState } from '../radio';
import {
  createBroadcastTransport,
  createWebSocketTransport,
  relayUrl,
  type Transport,
  type TransportStatus,
} from '../net/transport';

/** Off: no link. Tabs: other tabs of this browser. Network: other devices, through the relay (one open room for everyone). */
export type LinkMode = 'off' | 'tabs' | 'network';
export type LinkSettings = { mode: LinkMode };
/** What the UI shows. 'connecting' and 'offline' only occur in network mode. */
export type LinkStatus = 'off' | 'connecting' | 'connected' | 'offline';

/** A transmitting instance repeats its signal this often. */
export const LINK_HEARTBEAT_MS = 1000;
/** A heard sender is dropped after this long without a repeat, so a closed or frozen tab never leaves RX stuck. */
export const LINK_EXPIRY_MS = 3000;

export type TransportFactory = (settings: LinkSettings) => Transport | null;

export const defaultTransportFactory: TransportFactory = (settings) => {
  if (settings.mode === 'tabs') return createBroadcastTransport();
  if (settings.mode === 'network') return createWebSocketTransport(relayUrl(window.location));
  return null;
};

function newInstanceId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `i-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function useLink(
  state: RadioState,
  dispatch: Dispatch<RadioAction>,
  settings: LinkSettings,
  createTransport: TransportFactory = defaultTransportFactory,
): { status: LinkStatus; transport: Transport | null } {
  const [instanceId] = useState(newInstanceId);
  const [active, setActive] = useState<{ transport: Transport; status: LinkStatus } | null>(null);

  const transmitting = state.mode === 'transmit';
  const frequencyHz = activeFrequencyHz(state);
  const { mode } = settings;

  // Open the transport and listen. Expire senders that go quiet; forget everyone heard when the link drops.
  useEffect(() => {
    if (mode === 'off') return;
    const transport = createTransport({ mode });
    if (!transport) return;
    setActive({ transport, status: mode === 'network' ? 'connecting' : 'connected' });
    const lastSeen = new Map<string, number>();
    const forgetAll = () => {
      for (const from of lastSeen.keys()) dispatch({ type: 'rx-signal', from, frequencyHz: 0, active: false });
      lastSeen.clear();
    };
    const offMessage = transport.onMessage((m) => {
      if (m.from === instanceId) return;
      if (m.active) lastSeen.set(m.from, Date.now());
      else lastSeen.delete(m.from);
      dispatch({ type: 'rx-signal', from: m.from, frequencyHz: m.frequencyHz, active: m.active });
    });
    // Audio from a sender counts as a heartbeat too.
    const offAudio = transport.onAudio?.((p) => {
      if (lastSeen.has(p.from)) lastSeen.set(p.from, Date.now());
    });
    const offStatus = transport.onStatus?.((s: TransportStatus) => {
      if (s !== 'open') forgetAll();
      setActive((cur) =>
        cur && cur.transport === transport
          ? { transport, status: s === 'open' ? 'connected' : s === 'connecting' ? 'connecting' : 'offline' }
          : cur,
      );
    });
    const sweep = window.setInterval(() => {
      const now = Date.now();
      for (const [from, seen] of lastSeen) {
        if (now - seen > LINK_EXPIRY_MS) {
          lastSeen.delete(from);
          dispatch({ type: 'rx-signal', from, frequencyHz: 0, active: false });
        }
      }
    }, LINK_HEARTBEAT_MS);
    return () => {
      window.clearInterval(sweep);
      offMessage();
      offAudio?.();
      offStatus?.();
      forgetAll();
      transport.close();
      setActive(null);
    };
  }, [mode, createTransport, dispatch, instanceId]);

  const transport = mode === 'off' ? null : (active?.transport ?? null);

  // Publish while PTT is held, repeat as a heartbeat, and always send a release when it stops or the frequency changes.
  useEffect(() => {
    if (!transport || !transmitting) return;
    const send = (isActive: boolean) => transport.send({ v: 1, from: instanceId, active: isActive, frequencyHz });
    send(true);
    const beat = window.setInterval(() => send(true), LINK_HEARTBEAT_MS);
    return () => {
      window.clearInterval(beat);
      send(false);
    };
  }, [transport, transmitting, frequencyHz, instanceId]);

  return { status: mode === 'off' ? 'off' : (active?.status ?? 'connecting'), transport };
}
