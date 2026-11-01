import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWebSocketTransport, relayUrl, type WebSocketLike } from './transport';

class FakeSocket implements WebSocketLike {
  static all: FakeSocket[] = [];
  binaryType = 'blob';
  readyState = 0;
  sent: Array<string | ArrayBuffer> = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  url: string;
  constructor(url: string) { this.url = url; FakeSocket.all.push(this); }
  send(d: string | ArrayBuffer) { this.sent.push(d); }
  close() { this.readyState = 3; }
  open() { this.readyState = 1; this.onopen?.(); }
  drop() { this.readyState = 3; this.onclose?.(); }
}

describe('relayUrl', () => {
  it('uses wss on https and ws on http, on the page host', () => {
    expect(relayUrl({ protocol: 'https:', host: 'x.com' })).toBe('wss://x.com/ws');
    expect(relayUrl({ protocol: 'http:', host: 'localhost:5173' })).toBe('ws://localhost:5173/ws');
  });
});

describe('WebSocket transport', () => {
  beforeEach(() => { FakeSocket.all = []; vi.useFakeTimers(); });
  afterEach(() => vi.useRealTimers());

  it('reports status, delivers control and audio, and drops sends while offline', () => {
    const t = createWebSocketTransport('ws://h/ws', (u) => new FakeSocket(u));
    const status: string[] = [];
    const msgs: unknown[] = [];
    const audio: unknown[] = [];
    t.onStatus?.((s) => status.push(s));
    t.onMessage((m) => msgs.push(m));
    t.onAudio?.((p) => audio.push(p));
    const s = FakeSocket.all[0];
    t.send({ v: 1, from: 'a', active: true, frequencyHz: 60_000_000 });
    expect(s.sent).toHaveLength(0);
    s.open();
    expect(s.binaryType).toBe('arraybuffer');
    t.send({ v: 1, from: 'a', active: true, frequencyHz: 60_000_000 });
    t.sendAudio?.(60_000_000, new Int16Array([1, 2]));
    expect(s.sent).toHaveLength(2);
    s.onmessage?.({ data: JSON.stringify({ v: 1, from: '7', active: true, frequencyHz: 60_000_000 }) });
    s.onmessage?.({ data: 'garbage' });
    expect(msgs).toHaveLength(1);
    const frame = new ArrayBuffer(11);
    new DataView(frame).setUint8(0, 1);
    s.onmessage?.({ data: frame });
    expect(audio).toHaveLength(1);
    expect(status).toEqual(['open']); // 'connecting' fires before anyone can subscribe
  });

  it('reconnects after a drop with backoff, and stops after close()', () => {
    const t = createWebSocketTransport('ws://h/ws', (u) => new FakeSocket(u));
    FakeSocket.all[0].open();
    FakeSocket.all[0].drop();
    expect(FakeSocket.all).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    expect(FakeSocket.all).toHaveLength(2);
    t.close();
    FakeSocket.all[1].drop();
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.all).toHaveLength(2);
  });
});
