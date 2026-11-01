// Simulator-only link between RadioSim instances. Not part of the device model: no RF, audio or crypto is involved.
// Messages carry only who is keyed and on which frequency. Phase 1 uses BroadcastChannel (same browser, same origin).
// A network transport can implement the same interface later without touching src/radio.

import { packAudio, unpackAudio, type AudioPacket } from './audio';

export type LinkMessage = {
  v: 1;
  /** Random per-instance id, so an instance can ignore its own messages. */
  from: string;
  /** true while the sender holds PTT (repeated as a heartbeat), false on release. */
  active: boolean;
  /** Sender's active frequency in integer Hz. */
  frequencyHz: number;
};

export type TransportStatus = 'connecting' | 'open' | 'closed';

export interface Transport {
  send(message: LinkMessage): void;
  /** Registers a listener. Returns an unsubscribe function. */
  onMessage(listener: (message: LinkMessage) => void): () => void;
  /** Voice, only on transports that carry it (the network relay). */
  sendAudio?(frequencyHz: number, pcm: Int16Array): void;
  onAudio?(listener: (packet: AudioPacket) => void): () => void;
  /** Connection status, only on transports that can be offline. */
  onStatus?(listener: (status: TransportStatus) => void): () => void;
  close(): void;
}

/** Validates data from the wire. Anything else is dropped. */
export function parseLinkMessage(data: unknown): LinkMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const m = data as Record<string, unknown>;
  if (m.v !== 1 || typeof m.from !== 'string' || m.from.length === 0 || m.from.length > 64) return null;
  if (typeof m.active !== 'boolean') return null;
  if (typeof m.frequencyHz !== 'number' || !Number.isFinite(m.frequencyHz)) return null;
  return { v: 1, from: m.from, active: m.active, frequencyHz: m.frequencyHz };
}

export const LINK_CHANNEL_NAME = 'radiosim-link-v1';

/** Same-origin tabs and windows of one browser. Returns null where BroadcastChannel does not exist. */
export function createBroadcastTransport(): Transport | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  const channel = new BroadcastChannel(LINK_CHANNEL_NAME);
  return {
    send: (message) => channel.postMessage(message),
    onMessage: (listener) => {
      const handler = (e: MessageEvent) => {
        const message = parseLinkMessage(e.data);
        if (message) listener(message);
      };
      channel.addEventListener('message', handler);
      return () => channel.removeEventListener('message', handler);
    },
    close: () => channel.close(),
  };
}

export type WebSocketLike = {
  binaryType: string;
  readyState: number;
  send(data: string | ArrayBuffer): void;
  close(): void;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onmessage: ((e: { data: unknown }) => void) | null;
};

const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 15_000;

/** Relay URL for this page: same origin, path /ws. Everyone shares the relay's single open room. */
export function relayUrl(loc: { protocol: string; host: string }): string {
  return `${loc.protocol === 'https:' ? 'wss' : 'ws'}://${loc.host}/ws`;
}

/** Network transport through the relay (relay/server.mjs). Reconnects with backoff; sends while offline are dropped. */
export function createWebSocketTransport(
  url: string,
  create: (url: string) => WebSocketLike = (u) => new WebSocket(u) as unknown as WebSocketLike,
): Transport {
  const messageListeners = new Set<(m: LinkMessage) => void>();
  const audioListeners = new Set<(p: AudioPacket) => void>();
  const statusListeners = new Set<(s: TransportStatus) => void>();
  let socket: WebSocketLike | null = null;
  let closed = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const setStatus = (status: TransportStatus) => statusListeners.forEach((l) => l(status));

  function connect() {
    if (closed) return;
    setStatus('connecting');
    const ws = create(url);
    socket = ws;
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      attempt = 0;
      setStatus('open');
    };
    ws.onmessage = (e) => {
      if (typeof e.data === 'string') {
        let parsed: unknown;
        try {
          parsed = JSON.parse(e.data);
        } catch {
          return;
        }
        const message = parseLinkMessage(parsed);
        if (message) messageListeners.forEach((l) => l(message));
      } else if (e.data instanceof ArrayBuffer) {
        const packet = unpackAudio(e.data);
        if (packet) audioListeners.forEach((l) => l(packet));
      }
    };
    ws.onclose = () => {
      if (socket !== ws) return;
      socket = null;
      setStatus('closed');
      if (closed) return;
      const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_MIN_MS * 2 ** attempt) * (0.75 + Math.random() * 0.5);
      attempt += 1;
      timer = setTimeout(connect, delay);
    };
  }
  connect();

  const subscribe = <T>(set: Set<T>) => (listener: T) => {
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  };

  return {
    send: (message) => {
      if (socket?.readyState === 1) socket.send(JSON.stringify(message));
    },
    onMessage: subscribe(messageListeners),
    sendAudio: (frequencyHz, pcm) => {
      if (socket?.readyState === 1) socket.send(packAudio(frequencyHz, pcm));
    },
    onAudio: subscribe(audioListeners),
    onStatus: subscribe(statusListeners),
    close: () => {
      closed = true;
      clearTimeout(timer);
      const ws = socket;
      socket = null;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      setStatus('closed');
    },
  };
}
