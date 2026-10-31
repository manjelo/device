#!/usr/bin/env bash
# deploy.config.sh — deployment defaults for RadioSim, read by vps-host.sh.
# Mirrors CLAUDE.md Section 0; keep the two in sync.
# Static nginx SPA: no database, no uploads, no migrations, no env vars.

DEPLOY_APP_SERVICE="app"
DEPLOY_APP_PORT="8080"
DEPLOY_BUILD_TARGET="runner"
DEPLOY_COMPOSE_FILE="compose.prod.yaml"
DEPLOY_USE_DB="N"
DEPLOY_PROXY_ALIAS="radiosim-app"
