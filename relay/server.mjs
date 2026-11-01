// RadioSim relay: forwards "who is keyed on which frequency" and push-to-talk audio between browsers in the same room.
// Simulator feature, not part of the device model. Stateless: rooms live in memory only. See docs/relay-design.md.
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';

const FREQ_MIN_HZ = 30_000_000;
const FREQ_MAX_HZ = 512_000_000;
const AUDIO = 1; // binary frame type byte
const IN_HEADER = 5; // type + frequency u32 (client -> relay)
const OUT_HEADER = 9; // type + sender id u32 + frequency u32 (relay -> client)
const ROOM_RE = /^[A-Za-z0-9_-]{1,32}$/;

export const LIMITS = {
  maxPayload: 4096, // bytes per message; a 40 ms audio frame is 1285
  maxMessagesPerSecond: 80, // audio at 40 ms is 25 per second, plus 1 control heartbeat
  maxPerIp: 8,
  maxPerRoom: 64,
  pingMs: 25_000, // also keeps idle sockets alive under the shared Nginx read timeout
};

const inBand = (hz) => Number.isFinite(hz) && hz >= FREQ_MIN_HZ && hz <= FREQ_MAX_HZ;

export function createRelay({ port = 8081, host = '0.0.0.0', allowedOrigins = [], limits = {}, log = () => {} } = {}) {
  const lim = { ...LIMITS, ...limits };
  const rooms = new Map(); // room -> Set<conn>
  const perIp = new Map();
  let nextId = 1;

  const server = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('ok\n');
      return;
    }
    res.writeHead(404);
    res.end();
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: lim.maxPayload });

  function originAllowed(req) {
    const origin = req.headers.origin;
    if (!origin) return true; // browsers always send one; this only lets non-browser tools through
    if (allowedOrigins.length > 0) return allowedOrigins.includes(origin);
    try {
      return new URL(origin).host === req.headers.host; // default: same origin as the page that served us
    } catch {
      return false;
    }
  }

  const clientIp = (req) => String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '').split(',')[0].trim();

  function reject(socket, code, reason) {
    socket.write(`HTTP/1.1 ${code} ${reason}\r\nConnection: close\r\n\r\n`);
    socket.destroy();
  }

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://relay');
    if (url.pathname !== '/ws') return reject(socket, 404, 'Not Found');
    if (!originAllowed(req)) {
      log(`reject origin=${req.headers.origin}`);
      return reject(socket, 403, 'Forbidden');
    }
    const room = url.searchParams.get('room') || 'open';
    if (!ROOM_RE.test(room)) return reject(socket, 400, 'Bad Request');
    const ip = clientIp(req);
    if ((perIp.get(ip) ?? 0) >= lim.maxPerIp || (rooms.get(room)?.size ?? 0) >= lim.maxPerRoom) {
      log(`reject limit room=${room}`);
      return reject(socket, 429, 'Too Many Requests');
    }
    wss.handleUpgrade(req, socket, head, (ws) => join(ws, room, ip));
  });

  function peers(conn) {
    return [...(rooms.get(conn.room) ?? [])].filter((c) => c !== conn && c.ws.readyState === 1);
  }

  function join(ws, room, ip) {
    const conn = { id: nextId++, ws, room, ip, keyedAt: null, alive: true, windowStart: Date.now(), count: 0 };
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(conn);
    perIp.set(ip, (perIp.get(ip) ?? 0) + 1);
    log(`connect room=${room} n=${rooms.get(room).size}`);

    ws.on('pong', () => { conn.alive = true; });
    ws.on('message', (data, isBinary) => {
      const now = Date.now();
      if (now - conn.windowStart >= 1000) { conn.windowStart = now; conn.count = 0; }
      if (++conn.count > lim.maxMessagesPerSecond) return ws.close(1008, 'rate limit');
      if (isBinary) onAudio(conn, data);
      else onControl(conn, data.toString());
    });
    ws.on('close', () => {
      rooms.get(room)?.delete(conn);
      if (rooms.get(room)?.size === 0) rooms.delete(room);
      perIp.set(ip, Math.max(0, (perIp.get(ip) ?? 1) - 1));
      if (perIp.get(ip) === 0) perIp.delete(ip);
      if (conn.keyedAt !== null) broadcastControl(conn, false, conn.keyedAt); // release a keyed radio that vanished
      log(`disconnect room=${room}`);
    });
    ws.on('error', () => ws.terminate());
  }

  function broadcastControl(conn, active, frequencyHz) {
    const text = JSON.stringify({ v: 1, from: String(conn.id), active, frequencyHz });
    for (const peer of peers(conn)) peer.ws.send(text);
  }

  function onControl(conn, text) {
    let m;
    try { m = JSON.parse(text); } catch { return; }
    if (!m || m.v !== 1 || typeof m.active !== 'boolean') return;
    const frequencyHz = m.active ? m.frequencyHz : (conn.keyedAt ?? m.frequencyHz);
    if (!inBand(frequencyHz)) return;
    conn.keyedAt = m.active ? frequencyHz : null;
    broadcastControl(conn, m.active, frequencyHz);
  }

  function onAudio(conn, buf) {
    if (buf.length <= IN_HEADER || (buf.length - IN_HEADER) % 2 !== 0 || buf[0] !== AUDIO) return;
    const frequencyHz = buf.readUInt32BE(1);
    if (!inBand(frequencyHz)) return;
    const out = Buffer.allocUnsafe(OUT_HEADER + buf.length - IN_HEADER);
    out[0] = AUDIO;
    out.writeUInt32BE(conn.id, 1);
    out.writeUInt32BE(frequencyHz, 5);
    buf.copy(out, OUT_HEADER, IN_HEADER);
    for (const peer of peers(conn)) peer.ws.send(out, { binary: true });
  }

  const pinger = setInterval(() => {
    for (const set of rooms.values()) {
      for (const conn of set) {
        if (!conn.alive) { conn.ws.terminate(); continue; }
        conn.alive = false;
        conn.ws.ping();
      }
    }
  }, lim.pingMs);
  pinger.unref();

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      resolve({
        port: server.address().port,
        close: () => new Promise((done) => {
          clearInterval(pinger);
          for (const set of rooms.values()) for (const c of set) c.ws.close(1001, 'shutting down');
          wss.close();
          server.close(() => done());
          setTimeout(done, 500).unref();
        }),
      });
    });
  });
}

// Run as a service: node relay/server.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const allowedOrigins = (process.env.RELAY_ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const relay = await createRelay({
    port: Number(process.env.RELAY_PORT ?? 8081),
    allowedOrigins,
    log: (line) => console.log(line),
  });
  console.log(`relay listening on :${relay.port}${allowedOrigins.length ? ` origins=${allowedOrigins.join(',')}` : ' (same-origin check)'}`);
  const stop = () => relay.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
