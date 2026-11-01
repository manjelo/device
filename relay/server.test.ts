// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
// @ts-expect-error plain JS module without types
import { createRelay } from './server.mjs';

type Relay = { port: number; close: () => Promise<void> };
let relay: Relay;
const sockets: WebSocket[] = [];

beforeEach(async () => { relay = await createRelay({ port: 0, host: '127.0.0.1' }); });
afterEach(async () => { sockets.forEach((s) => s.terminate()); sockets.length = 0; await relay.close(); });

async function connect(room = 'r1', headers: Record<string, string> = {}) {
  const ws = new WebSocket(`ws://127.0.0.1:${relay.port}/ws?room=${room}`, { headers });
  const received: Array<string | Buffer> = [];
  ws.on('message', (d, bin) => received.push(bin ? (d as Buffer) : d.toString()));
  sockets.push(ws);
  await new Promise<void>((res, rej) => { ws.once('open', () => res()); ws.once('error', rej); ws.once('unexpected-response', (_q, r) => rej(new Error(`HTTP ${r.statusCode}`))); });
  return { ws, received };
}
const settle = () => new Promise((r) => setTimeout(r, 80));
const audio = (hz: number, samples = 4) => {
  const b = Buffer.alloc(5 + samples * 2); b[0] = 1; b.writeUInt32BE(hz, 1); return b;
};

describe('relay', () => {
  it('serves /health', async () => {
    const r = await fetch(`http://127.0.0.1:${relay.port}/health`);
    expect(r.status).toBe(200);
  });

  it('forwards control messages to others in the room only, stamping its own sender id', async () => {
    const a = await connect('r1'), b = await connect('r1'), c = await connect('r2');
    a.ws.send(JSON.stringify({ v: 1, from: 'spoofed', active: true, frequencyHz: 60_000_000 }));
    await settle();
    expect(b.received).toHaveLength(1);
    const msg = JSON.parse(b.received[0] as string);
    expect(msg).toMatchObject({ v: 1, active: true, frequencyHz: 60_000_000 });
    expect(msg.from).not.toBe('spoofed');
    expect(a.received).toHaveLength(0);
    expect(c.received).toHaveLength(0);
  });

  it('forwards audio with the sender id and frequency, not back to the sender', async () => {
    const a = await connect(), b = await connect();
    a.ws.send(audio(60_000_000, 8));
    await settle();
    const buf = b.received[0] as Buffer;
    expect(buf[0]).toBe(1);
    expect(buf.readUInt32BE(5)).toBe(60_000_000);
    expect(buf.length).toBe(9 + 16);
    expect(a.received).toHaveLength(0);
  });

  it('drops malformed, odd-length and out-of-band frames', async () => {
    const a = await connect(), b = await connect();
    a.ws.send('not json');
    a.ws.send(JSON.stringify({ v: 1, active: true, frequencyHz: 1 }));
    a.ws.send(audio(1_000, 4));
    a.ws.send(Buffer.concat([audio(60_000_000, 4), Buffer.from([0])]));
    await settle();
    expect(b.received).toHaveLength(0);
  });

  it('releases a keyed radio when its socket closes', async () => {
    const a = await connect(), b = await connect();
    a.ws.send(JSON.stringify({ v: 1, active: true, frequencyHz: 60_000_000 }));
    await settle();
    a.ws.close();
    await settle();
    const last = JSON.parse(b.received.at(-1) as string);
    expect(last).toMatchObject({ active: false, frequencyHz: 60_000_000 });
  });

  it('rejects a bad room, a foreign origin, and oversize messages', async () => {
    await expect(connect('bad room!')).rejects.toThrow();
    await expect(connect('r1', { Origin: 'https://evil.example' })).rejects.toThrow('403');
    const a = await connect();
    const closed = new Promise<number>((res) => a.ws.once('close', (code) => res(code)));
    a.ws.send(Buffer.alloc(5000));
    expect(await closed).toBe(1009);
  });

  it('accepts the same-origin Origin header', async () => {
    await connect('r1', { Origin: `http://127.0.0.1:${relay.port}` });
  });

  it('enforces the per-IP connection limit', async () => {
    const small = await createRelay({ port: 0, host: '127.0.0.1', limits: { maxPerIp: 2 } });
    const open = () => new WebSocket(`ws://127.0.0.1:${small.port}/ws?room=x`);
    const ok = [open(), open()];
    await Promise.all(ok.map((w) => new Promise((r) => w.once('open', r))));
    const third = open();
    await expect(new Promise((res, rej) => { third.once('open', res); third.once('error', rej); })).rejects.toThrow();
    [...ok, third].forEach((w) => w.terminate());
    await small.close();
  });

  it('closes a socket that exceeds the message rate', async () => {
    const small = await createRelay({ port: 0, host: '127.0.0.1', limits: { maxMessagesPerSecond: 5 } });
    const ws = new WebSocket(`ws://127.0.0.1:${small.port}/ws?room=x`);
    await new Promise((r) => ws.once('open', r));
    const closed = new Promise<number>((res) => ws.once('close', (c) => res(c)));
    for (let i = 0; i < 10; i += 1) ws.send(JSON.stringify({ v: 1, active: false, frequencyHz: 60_000_000 }));
    expect(await closed).toBe(1008);
    await small.close();
  });
});
