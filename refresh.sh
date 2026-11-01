#!/usr/bin/env bash
# refresh.sh — update a running RadioSim deployment on the VPS from Git.
# Run from the app directory (for example /srv/apps/radiosim):  ./refresh.sh
#
#   git pull --ff-only -> compose config check -> build -> up -d -> wait for healthy -> smoke test
#
# Safe to repeat. It never uses `down -v`, never deletes volumes, and never touches .env.
# RadioSim has no database and no migrations, so there is no backup or migrate step.
#
# Options:
#   --no-pull    skip git pull (build and restart the code already on disk)
#   --no-build   skip the image build (just recreate containers)
#   -h, --help   show this help
set -Eeuo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
APP_SERVICE="app"
RELAY_SERVICE="relay"
BRANCH="${GIT_BRANCH:-main}"
HEALTH_WAIT_SECONDS="${HEALTH_WAIT_SECONDS:-90}"

DO_PULL=1
DO_BUILD=1
for arg in "$@"; do
  case "$arg" in
    --no-pull) DO_PULL=0 ;;
    --no-build) DO_BUILD=0 ;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 2 ;;
  esac
done

say() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
[[ -f "$COMPOSE_FILE" ]] || die "$COMPOSE_FILE not found in $(pwd)"

# Use sudo for docker only when the current user cannot talk to the daemon.
if docker info >/dev/null 2>&1; then DOCKER=(docker); else DOCKER=(sudo docker); fi
compose() { "${DOCKER[@]}" compose -f "$COMPOSE_FILE" "$@"; }

if (( DO_PULL )); then
  say "Updating source from origin/$BRANCH (fast-forward only)"
  [[ "$(git rev-parse --abbrev-ref HEAD)" == "$BRANCH" ]] || die "Not on branch $BRANCH. Check out $BRANCH first."
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    die "Tracked files have local changes. Production should not be edited on the VPS; resolve them first."
  fi
  before="$(git rev-parse --short HEAD)"
  git pull --ff-only origin "$BRANCH"
  after="$(git rev-parse --short HEAD)"
  if [[ "$before" == "$after" ]]; then echo "Already up to date at $after."; else echo "Updated $before -> $after."; fi
fi

say "Validating $COMPOSE_FILE"
compose config --quiet
echo "Services: $(compose config --services | tr '\n' ' ')"

if (( DO_BUILD )); then
  say "Building images"
  compose build
fi

say "Starting / recreating services"
compose up -d --remove-orphans

say "Waiting for health (up to ${HEALTH_WAIT_SECONDS}s)"
health_of() {
  local id
  id="$(compose ps -q "$1" 2>/dev/null | head -n1)"
  [[ -n "$id" ]] || { echo missing; return; }
  "${DOCKER[@]}" inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id"
}
deadline=$(( SECONDS + HEALTH_WAIT_SECONDS ))
while :; do
  app="$(health_of "$APP_SERVICE")"; relay="$(health_of "$RELAY_SERVICE")"
  printf '  %s=%s  %s=%s\n' "$APP_SERVICE" "$app" "$RELAY_SERVICE" "$relay"
  [[ "$app" == healthy && "$relay" == healthy ]] && break
  if (( SECONDS >= deadline )); then
    compose ps
    compose logs --tail=60 "$APP_SERVICE" "$RELAY_SERVICE" || true
    die "Services did not become healthy in ${HEALTH_WAIT_SECONDS}s."
  fi
  sleep 3
done

say "Smoke test (from inside the proxy network)"
# Neither service publishes a port, so the check runs in the relay image on the same network.
# Host header matches the Origin, as a browser on the real domain would send.
smoke="$(compose exec -T "$RELAY_SERVICE" node -e "
const http = require('node:http');
const get = (host, port, path) => new Promise((res, rej) => http.get({ host, port, path }, (r) => { r.resume(); res(r.statusCode); }).on('error', rej));
Promise.all([get('radiosim-app', 8080, '/health'), get('127.0.0.1', 8081, '/health')])
  .then(([a, b]) => { console.log('app /health=' + a + ' relay /health=' + b); process.exit(a === 200 && b === 200 ? 0 : 1); })
  .catch((e) => { console.log('smoke failed: ' + e.message); process.exit(1); });
")" || { echo "$smoke"; die "Smoke test failed."; }
echo "$smoke"

say "Status"
compose ps
echo
echo "Done. Recent relay log:"
compose logs --tail=10 "$RELAY_SERVICE"
