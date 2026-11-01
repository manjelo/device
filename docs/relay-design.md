# Phase 2 design: cross-device radio link (relay)

Status: **implemented as a prototype** (relay, network transport, push-to-talk voice). Differences from this design:
voice is included (raw 16 kHz PCM through the relay); `RELAY_ALLOWED_ORIGINS` is optional (default: same-origin check
instead of a required value); the client has no room field: everyone uses the relay's single `open` room (the relay still supports `?room=`, unused); the shared parser is duplicated
in `relay/server.mjs` instead of a `shared/` module. Phase 1 (tabs of one browser, `BroadcastChannel`) is also built.
This document covers linking radios on different devices. It is a simulator feature: no RF, audio, crypto or key material is
involved, and everything it adds is Simulator-specific in the accuracy matrix.

## 1. Goal

You and a friend each open the production site, tune to the same frequency (for example 060.000 MHz) and join the same
room. Your PTT makes their radio show RX / "RECEIVING"; theirs does the same for you. Frequency matching is unchanged
(`isReceiving` in `src/radio/stateMachine.ts`): the relay only moves "who is keyed, on which frequency".

## 2. Architecture

```text
Browser A ──wss──┐
                 ▼
          Shared Nginx (80/443, TLS)           unchanged
                 │  location /  (proxy network, alias radiosim-app:8080)
                 ▼
          app container (nginx, :8080)
             /        -> static SPA
             /health  -> "ok"
             /ws      -> proxy_pass http://radiosim-relay:8081   (NEW, app-level)
                 │  proxy network, alias radiosim-relay
                 ▼
          relay container (Node + ws, :8081)   NEW service, in memory only
                 ▲
Browser B ──wss──┘ (same path)
```

**Key choice: route `/ws` inside the app's own nginx, not in the shared Nginx.**
The wizard's generated site already forwards `Upgrade`/`Connection: upgrade` for `location /`
(`scripts/vps-host.sh`, `nginx_proxy_location`). So a WebSocket to `https://DOMAIN/ws` already reaches `radiosim-app:8080`.
The app nginx then forwards `/ws` to the relay. Result: **no shared Nginx change, no new public hostname, no new
certificate, and the browser stays same-origin** (no CORS, `wss://` for free). CLAUDE.md §3.3 allows app-level
nginx for an app-specific purpose that does not replace the shared proxy; this is that.

Rejected alternatives:

| Option | Why not |
|---|---|
| Separate `/ws` location in shared Nginx pointing at the relay | Works, but needs a manual edit of a site config the wizard regenerates, and a second alias to register. |
| Relay serves the SPA too | Couples static hosting to the Node process; loses the existing nginx cache headers and `/health` contract. |
| WebRTC peer-to-peer | Still needs a signaling server plus STUN/TURN; more moving parts for no benefit at this scale. |
| Hosted realtime service | New external dependency, secrets and cost; against the self-contained deployment model. |

## 3. Relay service

- Node 22 + the `ws` package (one new runtime dependency, used only by the relay image). About 150 lines in `relay/`.
- Listens on `0.0.0.0:8081`. `GET /health` returns `200 ok` (HTTP on the same port). Everything else upgrades to WebSocket
  at `/ws`.
- **Stateless and in-memory.** Rooms and presence live in a `Map`. Nothing is persisted: no volume, no migration, no
  backup. A restart drops connections; clients reconnect and the existing 1 s heartbeat repopulates state within a second.
- **Rooms.** The client connects to `/ws?room=CODE`. The relay forwards a message only to other sockets in the same room.
  Room code: 1 to 32 characters `[A-Za-z0-9_-]`. A room is deleted when its last socket leaves. Room codes are not
  secrets and give no authentication; they only separate groups.
- **Protocol.** Reuses `LinkMessage` (`src/net/transport.ts`): `{ v, from, active, frequencyHz }`. The shared parsing
  code moves to `shared/linkProtocol.ts`, imported by both the SPA and the relay, so they cannot drift.
- **Anti-spoofing.** The relay ignores the client's `from` and stamps each forwarded message with an id it assigned to that
  connection. One socket cannot impersonate another.
- **Cleanup on disconnect.** The relay remembers whether each connection is currently keyed. If a socket closes while
  keyed, the relay broadcasts `active: false` for it, so receivers drop RX immediately instead of waiting for the 3 s
  expiry. The client expiry stays as the fallback.
- **Limits** (constants, tunable by env):
  - max message size 256 bytes (`maxPayload`); larger closes the socket;
  - at most 20 messages per second per socket (the client sends about 1 per second); excess closes with 1008;
  - at most 8 connections per client IP and 64 per room;
  - messages that fail `parseLinkMessage`, or carry a frequency outside 30 to 512 MHz, are dropped.
- **Keepalive.** The relay sends a WebSocket ping every 25 s and closes sockets that miss a pong. This also stops the
  shared Nginx's default 60 s `proxy_read_timeout` from cutting idle listeners, because ping frames count as traffic.
  `DEPLOY_PROXY_READ_TIMEOUT` is therefore not needed.
- **Origin check.** Upgrade requests whose `Origin` is not in `RELAY_ALLOWED_ORIGINS` are rejected (403). This keeps
  other websites from using the relay from visitors' browsers.
- **Logging.** One line per connect, disconnect and rejection to stdout (room, reason, count). Never message bodies,
  and never the full client IP in logs beyond what Docker already records.
- Runs as the non-root `node` user, read-only root filesystem, no capabilities needed, graceful shutdown on `SIGTERM`
  (closes sockets with 1001).

## 4. Client changes (SPA)

- `WebSocketTransport` implementing the existing `Transport` interface (`src/net/`), with reconnect and exponential
  backoff (1 s to 15 s, with jitter) and a status (`connecting | open | closed`).
- Link control grows from on/off to **Off / Tabs / Network**, plus a room field shown for Network. Choices are kept in
  `localStorage` only (a per-viewer convenience, wrapped in try/catch). Network mode does not also use `BroadcastChannel`,
  so two tabs on one device do not hear the same sender twice.
- The relay URL is derived from `location` (`wss://` on https, `ws://` otherwise) plus `/ws`. No `VITE_*` variable and
  no build-time configuration.
- The UI shows connection status ("Network: connected, room X"). If the relay is unreachable, the radio keeps working
  locally; the Link status says "offline". Startup never depends on the relay.
- `src/radio/` is untouched. The state machine still only receives `rx-signal` actions.

Dev: `vite.config.ts` proxies `/ws` to a locally started relay; the e2e suite starts the relay as a second web server.

## 5. Deployment contract changes (CLAUDE.md §18, §25, §42, §44, §45)

Unchanged and stays so: `PROJECT_NAME`, `COMPOSE_FILE`, `APP_SERVICE=app`, `APP_PORT=8080`, `HEALTH_PATH=/health`,
alias `radiosim-app`, no database, no uploads, no migrations, no host-published ports, shared Nginx config.

New:

| Item | Value |
|---|---|
| Service | `relay`, long-running, `restart: unless-stopped` |
| Build | new Dockerfile target `relay` (Node alpine, production dependencies only) |
| Networks | `proxy` only; alias `radiosim-relay`. Not on `database` (no DB). |
| Port | 8081, internal only. No `ports:`. |
| Healthcheck | `node -e "fetch('http://127.0.0.1:8081/health')..."` (node exists in the image; no curl/wget assumption) |
| Env | `RELAY_ALLOWED_ORIGINS` (required, e.g. `https://DOMAIN`). Added to `.env.example`. The relay refuses to start if it is missing (§49). Optional tuning vars with defaults. |
| Persistent data | none; stateless |
| `container_name` | not used |
| Hardening | `read_only: true`, `tmpfs: /tmp`, `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]`, memory limit (for example 128m), `init: true` |

Also required in the repo:

- `compose.prod.yaml`: add `relay`; add `env_file`/`environment` for it.
- `nginx.conf` (app nginx): add `location = /ws` with `proxy_pass` to `radiosim-relay:8081` using a **variable upstream and Docker DNS
  (`resolver 127.0.0.11`)** like the wizard does, so the app starts and `/health` stays up even when the relay is down.
  Set `Upgrade`, `Connection "upgrade"`, `proxy_http_version 1.1`, `proxy_read_timeout 120s`.
- `deploy.config.sh`: **no `DEPLOY_*` variables describe a second service.** The wizard builds and starts services via the Compose
  file, so `relay` starts with `docker compose up -d`. Confirm in a dry run on the VPS that the wizard's health and
  smoke checks (which target `app`) still pass and that `relay` appears in `ps`. If the wizard only starts
  `APP_SERVICE`, the manual step is `docker compose -f compose.prod.yaml up -d`.
- `CLAUDE.md` section 0: record the relay service, port 8081, alias `radiosim-relay`, env var, and "no persistent data".
- `.dockerignore`/`.env.example`: add the env var; keep `.env` out of images.

Manual VPS steps (one time): add `RELAY_ALLOWED_ORIGINS=https://DOMAIN` to the server `.env` (mode 600); then the usual
`git pull --ff-only`, `config --quiet`, `build`, `up -d`, `ps`, `logs --tail=150 relay`.

Shared Nginx impact: **none expected.** WebSocket upgrade headers are already forwarded by the wizard-generated `location /`,
and ping frames keep idle sockets open under the default read timeout. Verify on the VPS with the smoke test in section 8.

## 6. Security and abuse

- Public, unauthenticated, anonymous. Anyone who knows the site and a room code can join that room and hear when radios are
  keyed. Messages carry only frequency and keyed state, no personal data.
- Abuse limits as in section 3 (size, rate, per IP, per room), plus the `Origin` allow-list.
- The relay trusts forwarded client IPs only from the shared Nginx (`X-Forwarded-For` first hop); direct access is not
  possible because no port is published.
- Optional later: a room passphrase checked by the relay. Not in scope: it would add secrets to the contract.
- No secrets in `VITE_*`. None are needed.

## 7. Rollout, compatibility and rollback

- Backward compatible: the SPA defaults to the current Tabs behavior, so an old client and a new relay (or the reverse)
  keep working. Message `v: 1` is unchanged; unknown versions are dropped.
- Deploy order: relay and app nginx ship in the same image set; the SPA's Network mode simply shows "offline" if the
  relay is missing.
- Rollback: **safe.** No schema, no volume, no migration. Reverting the commit removes the relay service; the old
  `compose.prod.yaml` leaves an orphan container that `docker compose up -d --remove-orphans` clears (not `down -v`).

## 8. Validation plan

Repository:
1. Unit tests for the relay: room isolation, spoofing prevented, size/rate/IP/room limits, Origin rejection, release
   on disconnect, malformed message dropped, ping/pong cleanup. Unit tests for `WebSocketTransport` reconnect/backoff
   with a fake socket.
2. Playwright: two **separate browser contexts** (not tabs) against a local relay: A keys on the same frequency and room,
   B shows RECEIVING; different room or different frequency does not; killing and restarting the relay recovers.
3. `npm run lint`, `npx tsc -b`, `npm test`, `npm run build`, `npm run test:e2e`.
4. `docker compose -f compose.prod.yaml config --quiet`, `config --services` (`app`, `relay`), `build`; start the stack
   against a local `proxy` network and confirm the relay is not reachable from the host.

VPS smoke test after deploy:
1. `docker compose -f compose.prod.yaml ps` shows `app` and `relay` healthy.
2. `curl -sS https://DOMAIN/health` returns `ok`.
3. Two real devices (or a device and a phone on mobile data) join the same room and frequency; PTT on one produces RX on
   the other; changing frequency stops it.
4. Idle for 3 minutes with no PTT, then key: still received (confirms no proxy timeout cuts listeners).
5. `docker compose logs --tail=150 relay` shows connects and no rejected-origin lines for the real domain.

## 9. Open decisions

1. **Room model.** Required room code (safer, the design above) or one global room per frequency? Recommendation: required
   code, default empty room disabled, so strangers on 060.000 MHz do not join you.
2. **Capacity target.** The limits above assume tens of users. Say if you expect more.
3. **Domain.** `RELAY_ALLOWED_ORIGINS` needs the final domain (currently TBD in CLAUDE.md).
4. **Wizard behavior** with a second Compose service needs the VPS dry run in section 5 before relying on it.
