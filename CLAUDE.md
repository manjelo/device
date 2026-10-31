# CLAUDE.md — Production Compatibility Rules

> Place this file at the **repository root** of every application deployed using the **VPS Production Deployment Runbook — Audited Edition**.
>
> These rules define the contract between the application repository and the production VPS. Claude must preserve this contract while implementing features, refactoring, changing infrastructure, or preparing releases.

> **Runbook and deploy script location**: the full runbook lives at `docs/VPS_PRODUCTION_DEPLOYMENT_RUNBOOK.md`, and the generic deployment wizard it describes lives at `scripts/vps-host.sh` (run from the VPS as `/srv/vps-host.sh` per the runbook's placement instructions).

---

# 0. This Project's Deployment Contract (radiosim)

This section fills in the generic contract from Section 4 with the concrete, current values for **this** repository. Treat every value below as compatibility-sensitive per Section 25 — do not change one without updating all affected artifacts and reporting it.

```text
PROJECT_NAME        radiosim
DOMAIN               TBD (set when the shared Nginx site is created)
GIT_BRANCH           main

COMPOSE_FILE         compose.prod.yaml
APP_SERVICE          app
APP_PORT             8080

PROJECT_DB           n/a (static front end, no database)
PROJECT_USER         n/a

MIGRATION_REQUIRED   No
MIGRATION_SERVICE    n/a
MIGRATION_COMMAND    n/a

HEALTH_PATH          /health  (nginx.conf, unauthenticated, static "ok")

HAS_USER_UPLOADS     No
MEDIA_STORAGE        n/a
MEDIA_VOLUME_OR_PATH n/a
```

Additional project-specific facts:

- **Proxy alias**: `radiosim-app` (unique on the shared `proxy` network). The app joins `proxy` only; it does not join `database`.
- **Stack**: React 19 + Vite + TypeScript SPA (RadioSim, Harris AN/PRC-152 simulator). No backend, no env vars. Dockerfile builds `dist/` and serves it with nginx on 8080 (`runner` target).
- **No secrets**: anything in `VITE_*` is public; never put secrets there.
- **Tests**: `npm run lint`, `npx tsc -b`, `npm test`, `npm run build`, `npm run test:e2e`.
- **Deployment**: `deploy.config.sh` at the repo root is sourced by the generic wizard at `../scripts/vps-host.sh`. The full runbook is at `../docs/VPS_PRODUCTION_DEPLOYMENT_RUNBOOK.md`.

---

# 1. Purpose

This repository must remain deployable using the standard VPS architecture:

```text
Internet
   |
   v
Shared Nginx reverse proxy
   |
   +--------------------- external Docker network: proxy
   |                              |
   |                              +-- this application
   |
   v
Application
   |
   +--------------------- internal Docker network: database
                                  |
                                  +-- shared PostgreSQL
```

The production server provides shared infrastructure.

The repository provides the application and its production deployment definition.

Claude must not redesign this boundary unless the user explicitly requests an architecture change.

---

# 2. Source of Truth and Priority

When making a change, use this priority order:

1. Explicit instructions from the user for the current task.
2. This `CLAUDE.md`.
3. The repository's existing architecture and documented contracts.
4. The VPS Production Deployment Runbook.
5. Framework conventions.

If the requested change conflicts with this production contract:

- do not silently break the contract;
- explain the conflict;
- preserve compatibility where possible;
- if compatibility must change, update every affected deployment artifact and clearly report the required production migration steps.

Never make infrastructure changes merely because another pattern is more familiar.

---

# 3. Core Production Invariants

These are non-negotiable unless the user explicitly changes the VPS architecture.

## 3.1 Shared PostgreSQL

Production uses the VPS's shared PostgreSQL container.

Therefore the production Compose file must **not** create its own PostgreSQL container.

Forbidden production pattern:

```yaml
services:
  db:
    image: postgres:...
```

when that service exists only to provide this application's production database.

Development/test Compose files may use a local database when useful, but production must connect to the shared PostgreSQL service.

Production PostgreSQL hostname:

```text
postgres
```

Production PostgreSQL port:

```text
5432
```

Each application has its own:

```text
database
database user
database password
```

Never configure the application to use the shared PostgreSQL administrator account.

---

## 3.2 Private Application Port

The production application must listen on its internal container port.

It must **not** publish that port to the VPS host.

Forbidden final production configuration:

```yaml
ports:
  - "3000:3000"
```

or:

```yaml
ports:
  - "8000:8000"
```

The application is reached by Nginx over the Docker `proxy` network.

If temporary port publishing is introduced for debugging, it must not remain in the final production Compose file.

---

## 3.3 Shared Nginx

Do not add a second public reverse proxy to this repository unless explicitly requested.

The VPS already has one shared Nginx container responsible for:

```text
80/tcp
443/tcp
TLS termination
HTTP -> HTTPS redirect
proxying to application containers
```

Application-level Nginx is allowed only when it serves a real application-specific purpose and does not replace or conflict with the shared VPS reverse proxy.

---

## 3.4 Docker Networks

The VPS provides these external Docker networks:

```text
proxy
database
```

An HTTP application served by shared Nginx must join:

```text
proxy
```

An application that uses shared PostgreSQL must join:

```text
database
```

A normal web application using PostgreSQL normally joins both.

Example:

```yaml
networks:
  database:
    external: true

  proxy:
    external: true
```

Do not create project-scoped replacements for these networks in production.

---

## 3.5 Unique Proxy Alias

Every public application must expose a unique alias on the `proxy` network:

```text
<PROJECT_NAME>-app
```

Example:

```text
kokoon-app
carrental-app
gym-app
```

Compose pattern:

```yaml
services:
  app:
    networks:
      database:
      proxy:
        aliases:
          - PROJECT_NAME-app
```

The actual value must be unique to this project.

Do not rely on generic names such as:

```text
app
web
api
```

as the cross-project Nginx upstream name.

Different Compose projects may reuse those service names.

The unique proxy alias is the stable interface between this repository and the shared Nginx configuration.

---

# 4. Required Deployment Contract

Before declaring the project production-ready, Claude must be able to identify all of the following:

```text
PROJECT_NAME
DOMAIN
GIT_BRANCH

COMPOSE_FILE
APP_SERVICE
APP_PORT

PROJECT_DB
PROJECT_USER

MIGRATION_REQUIRED
MIGRATION_SERVICE
MIGRATION_COMMAND

HEALTH_PATH

HAS_USER_UPLOADS
MEDIA_STORAGE
MEDIA_VOLUME_OR_PATH
```

Recommended defaults for a new project:

```text
GIT_BRANCH=main
COMPOSE_FILE=compose.prod.yaml
APP_SERVICE=app
MIGRATION_SERVICE=migrate
HEALTH_PATH=/health
```

Existing repositories do not need to be renamed merely to match these defaults.

Consistency is preferred, but preserving a working deployment contract is more important than cosmetic renaming.

---

# 5. Required Repository Artifacts

A production-deployable repository should contain, as applicable:

```text
Dockerfile
compose.prod.yaml
.env.example
.gitignore
CLAUDE.md
```

It may additionally contain:

```text
compose.dev.yaml
compose.test.yaml
Dockerfile.dev
deployment documentation
framework-specific configuration
migration files
```

Production secrets must never be committed.

The repository should provide enough examples/documentation that the production `.env` can be constructed without guessing variable names.

---

# 6. Production Compose Rules

The production Compose file is part of the repository's public deployment interface.

Claude must treat changes to it as production-sensitive.

A normal application service should resemble:

```yaml
services:
  app:
    build:
      context: .
      # target: runner

    restart: unless-stopped

    env_file:
      - .env

    networks:
      database:
      proxy:
        aliases:
          - PROJECT_NAME-app

    healthcheck:
      test: ["CMD", "..."]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s

networks:
  database:
    external: true

  proxy:
    external: true
```

Adapt this to the actual framework.

Do not copy fields that do not make sense for the project.

---

# 7. Application Service Rules

The main application service must:

- build successfully from the committed repository;
- start without interactive input;
- use production configuration;
- listen on the documented `APP_PORT`;
- listen on an interface reachable from other containers, normally `0.0.0.0`;
- join `proxy` when served by Nginx;
- join `database` when using shared PostgreSQL;
- have the unique `<PROJECT_NAME>-app` alias on `proxy`;
- use `restart: unless-stopped`;
- store irreplaceable persistent data outside the container writable layer;
- expose a real healthcheck when practical;
- shut down cleanly when Docker stops/replaces it.

Do not require an entire source-code bind mount for a normal production runtime.

Bad default:

```yaml
volumes:
  - .:/app
```

Development bind mounts belong in development configuration unless production genuinely requires them.

---

# 8. Do Not Use `container_name` for Application Services

Application services should normally rely on Compose service discovery and network aliases.

Do not add:

```yaml
container_name: some-fixed-name
```

to normal application, worker, or migration services without a concrete reason.

The shared VPS infrastructure intentionally uses stable container names for:

```text
postgres
nginx
```

Application repositories should not compete for global Docker container names.

Use the unique `proxy` network alias for Nginx routing instead.

---

# 9. Environment and Secret Rules

## 9.1 `.env`

Production uses a protected server-side `.env`.

The real production `.env` must:

- never be committed;
- be listed in `.gitignore`;
- contain production secrets only on the server/approved secret store;
- be readable only by the intended administrator where practical;
- not be copied into Docker images.

Recommended server permission:

```text
600
```

---

## 9.2 `.env.example`

Commit a safe example:

```text
.env.example
```

It must contain:

- every required variable name;
- safe placeholders;
- comments where a variable is not obvious;
- no real tokens;
- no passwords;
- no production URLs containing secrets;
- no private keys.

Example:

```dotenv
NODE_ENV=production

DATABASE_URL=postgresql://PROJECT_USER:CHANGE_ME@postgres:5432/PROJECT_DB

APP_URL=https://app.example.com
```

or separate PostgreSQL variables if the application uses them:

```dotenv
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=PROJECT_DB
POSTGRES_USER=PROJECT_USER
POSTGRES_PASSWORD=CHANGE_ME
```

---

## 9.3 Database Host Contract

Production database configuration must ultimately resolve to:

```text
host=postgres
port=5432
```

Do not hardcode:

```text
localhost
127.0.0.1
host.docker.internal
```

for the production database connection.

Inside the application container, PostgreSQL is another container on the shared `database` Docker network.

---

## 9.4 No Secret Build Arguments

Do not bake production secrets into:

```text
Dockerfile
image layers
Compose source
Git history
frontend bundles
NEXT_PUBLIC_*
VITE_*
EXPO_PUBLIC_*
```

unless the value is intentionally public.

Variables exposed to browser/mobile client code must be assumed public.

---

# 10. Development and Production Configuration Must Be Separable

Development conveniences must not leak into production.

Examples of development-only behavior:

```text
source bind mounts
hot reload
debug mode
development database containers
published application ports
test credentials
seed/reset commands
mock services
verbose debug tooling
```

If development requires these, use a separate file such as:

```text
compose.dev.yaml
```

or a clearly isolated override.

The production file must remain safe by itself.

---

# 11. Explicit Migration Contract

Database migrations must be explicit.

Claude must not assume that:

```bash
docker compose up -d
```

should mutate the production schema.

For applications with migrations, use a dedicated one-shot service.

Recommended pattern:

```yaml
services:
  app:
    # normal production application
    ...

  migrate:
    build:
      context: .
      # target: builder

    env_file:
      - .env

    profiles:
      - tools

    networks:
      - database
```

The migration service must:

- contain the actual migration CLI/dependencies;
- use the same production DB configuration as the app;
- join the `database` network;
- have no published ports;
- not be a long-running service;
- not use `restart: unless-stopped`;
- not start during normal `docker compose up -d`;
- exit non-zero when migration execution fails.

Production invocation should be possible as:

```bash
sudo docker compose \
  -f compose.prod.yaml \
  run --rm migrate \
  MIGRATION_COMMAND
```

Examples:

```bash
npx prisma migrate deploy
```

```bash
python manage.py migrate
```

Do not use development migration commands that create or rewrite migration history on the production VPS.

Examples of commands that normally belong in development, not production:

```text
prisma migrate dev
makemigrations
schema reset
drop-and-recreate
```

Migration files/schema history must be created and reviewed in development, committed to Git, and then applied in production.

---

# 12. Migration Safety Rules

When changing the schema:

1. determine whether existing production data is affected;
2. preserve existing data by default;
3. do not casually drop columns/tables or rewrite production data;
4. create committed migrations;
5. keep application and schema versions compatible during deployment;
6. prefer expand/migrate/contract for significant changes.

Preferred strategy:

```text
expand schema
   |
deploy compatible application
   |
migrate/backfill
   |
switch behavior
   |
remove obsolete schema later
```

If a migration is destructive or makes rollback unsafe, Claude must explicitly call this out before presenting the work as production-ready.

Never hide destructive schema behavior inside application startup.

---

# 13. Health Endpoint Contract

Every public application should expose a lightweight unauthenticated health endpoint.

Preferred:

```text
/health
```

Acceptable when appropriate:

```text
/api/health
```

The selected path becomes part of the deployment contract.

A health endpoint must:

- return quickly;
- not require login;
- avoid expensive business operations;
- avoid mutating data;
- return a 2xx response when the application is ready;
- return a non-2xx response when it is not ready.

Do not make the health endpoint dependent on an external third-party API unless that dependency is intentionally part of readiness.

---

# 14. Docker Healthcheck Contract

The production application should use its health endpoint in a Docker healthcheck.

Node example:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "node",
      "-e",
      "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
    ]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 20s
```

Python example:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "python",
      "-c",
      "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"
    ]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 20s
```

Use a command that actually exists in the runtime image.

Do not add `curl` or `wget` to the healthcheck merely by assumption.

---

# 15. User Uploads and Persistent Files

Claude must determine whether the application stores user-generated or irreplaceable files.

Examples:

```text
profile pictures
documents
receipts
attachments
uploaded images
generated files that cannot be recreated
```

These must not exist only in the container writable layer.

Use one of:

```text
stable Docker named volume
stable host bind mount
approved external object storage
```

The storage location must be documented.

If using a named volume, give it a stable explicit name when appropriate.

Example:

```yaml
volumes:
  media_data:
    name: PROJECT_NAME_media_data
```

If using a host bind mount, production data should normally live under:

```text
/srv/data/PROJECT_NAME/
```

Do not treat generated static/build assets as user uploads if they can be recreated from source.

---

# 16. Background Workers, Queues, Schedulers, and Cron

Long-running auxiliary processes must be separate Compose services.

Examples:

```text
worker
queue
scheduler
cron
consumer
```

They must not be hidden inside unrelated shell background commands in the main app service.

Each service must:

- have a clear command;
- use `restart: unless-stopped` when it is intended to be long-running;
- use the same production env contract when applicable;
- join only the networks it needs;
- avoid published ports unless genuinely required;
- store persistent data appropriately;
- be included in production verification.

If a worker only needs PostgreSQL and outbound Internet, do not attach it to `proxy` merely by habit. Use the minimum network access compatible with the VPS architecture.

Document every production long-running service.

---

# 17. Scheduled Jobs

Do not implement production scheduling by relying on:

```text
a developer laptop
an interactive shell
a process started manually over SSH
```

A scheduled task must use an explicit durable scheduling mechanism appropriate to the application.

If the repository contains a scheduler service, it must be represented in production Compose.

If scheduling is expected to be managed by the VPS host, document the exact command/interface expected by the deployment runbook.

Never create duplicate schedulers that could execute the same production job twice.

---

# 18. Redis and Other Dependencies

If a project introduces Redis, a queue broker, search engine, or another stateful service:

- do not silently add it to production;
- determine whether it should be shared VPS infrastructure or project-local infrastructure;
- document persistence requirements;
- document backup requirements;
- document networks and ports;
- keep it private unless it intentionally serves public traffic;
- update the production deployment contract.

Adding a new stateful production dependency is an architecture change, not a minor implementation detail.

Call it out explicitly.

---

# 19. Dockerfile Rules

The production Dockerfile must support repeatable image builds from committed source.

It must not require files that exist only on a developer machine.

Do not copy the real production `.env` into the image.

Use `.dockerignore` to exclude unnecessary/sensitive content.

At minimum review exclusion of:

```text
.git
.env
.env.*
node_modules
build caches
local test artifacts
coverage
editor files
```

Keep `.env.example` if it is needed as documentation; do not exclude it simply because `.env*` is ignored.

If using multi-stage builds, ensure:

- the runtime stage contains everything required to start the app;
- the migration service uses a stage that contains its migration CLI;
- the production runtime is not accidentally dependent on development bind mounts.

Do not remove migration tooling from every image stage if production migrations depend on it.

---

# 20. Framework Build Artifacts

Build artifacts used in production must be generated reproducibly by the Docker build or a documented release process.

Do not require someone to manually build files on the VPS outside Docker unless explicitly designed that way.

Examples include:

```text
Next.js build output
compiled TypeScript
Python collected static files
frontend bundles
generated ORM clients
```

If generated code is required at runtime, ensure it exists in the final image.

---

# 21. Prisma Rules

If this project uses Prisma:

- production migration command must be `prisma migrate deploy` or the repository's documented equivalent;
- do not use `prisma migrate dev` on production;
- do not use `prisma db push` as a silent replacement for reviewed production migrations unless explicitly approved;
- the migration image/service must contain the Prisma CLI and generated client requirements;
- committed migrations must stay synchronized with the schema;
- schema changes require migration review before production readiness.

Typical production command:

```bash
npx prisma migrate deploy
```

If the final runtime image intentionally excludes the Prisma CLI, create/use a builder/tooling target for the `migrate` service.

---

# 22. Django Rules

If this project uses Django:

Production must use:

```text
DEBUG=False
```

The production domain must be represented correctly in:

```text
ALLOWED_HOSTS
CSRF_TRUSTED_ORIGINS
```

when applicable.

Production migration command:

```bash
python manage.py migrate
```

If `collectstatic` is required, it must be deterministic and incorporated into the documented build/start/deploy flow.

User-uploaded `MEDIA_ROOT` content must use persistent storage.

Generated static files that can be recreated with `collectstatic` do not need to be treated as irreplaceable user uploads.

---

# 23. Next.js / Node.js Rules

If this project uses Node.js or Next.js:

- production must run the production server, not a development server;
- do not use `next dev` in production;
- the app must bind to an interface reachable by Nginx from another container;
- public/browser-exposed environment variables must never contain secrets;
- build-time and runtime environment requirements must be documented;
- ORM migrations must remain explicit.

For Next.js, prefer a production image that contains only what is required to run the built application, provided migration tooling is still available through a separate build target/service when required.

---

# 24. Production Port and Binding

The application must clearly define `APP_PORT`.

The process inside the container must listen on that port.

For a web service intended to be reached over Docker networking, bind to:

```text
0.0.0.0
```

or the framework equivalent.

Do not bind only to:

```text
127.0.0.1
```

inside the application container if Nginx must reach it from another container.

Do not change `APP_PORT` casually.

Changing the internal production port requires updating:

- production Compose;
- healthcheck;
- shared Nginx site configuration;
- deployment worksheet/documentation;
- smoke-test commands.

---

# 25. Stable Deployment Interfaces

Treat these values as compatibility-sensitive interfaces:

```text
COMPOSE_FILE
APP_SERVICE
APP_PORT
proxy network alias
HEALTH_PATH
MIGRATION_SERVICE
MIGRATION_COMMAND
persistent volume names
persistent bind-mount paths
required production env variable names
```

Claude must not rename/change them during an unrelated feature or refactor.

If one must change:

1. explain why;
2. update all repository references;
3. update `.env.example` if relevant;
4. update healthchecks;
5. update deployment documentation;
6. identify VPS/Nginx/manual changes required;
7. provide upgrade steps;
8. provide rollback implications.

---

# 26. No Hidden Production Side Effects

Starting the normal app service must not unexpectedly:

```text
drop databases
reset schemas
seed destructive data
delete uploads
rewrite environment files
change filesystem ownership globally
generate new secrets every boot
run irreversible migrations without an explicit deployment step
```

Startup should be safe to repeat.

Container recreation must not destroy persistent application state.

---

# 27. Preserve Production Data

Never solve an application problem by suggesting or introducing:

```bash
docker compose down -v
```

as a normal deployment step.

Never delete or recreate a production:

```text
database
Docker volume
upload directory
.env
```

without explicit user approval and a verified recovery plan.

Do not add scripts named ambiguously such as:

```text
reset
clean
fresh
rebuild
```

that can destroy production state without strong safeguards.

Development reset commands must be clearly scoped to development/test environments.

---

# 28. Production Configuration Must Be Idempotent Where Practical

Repeated execution of normal deployment operations should be safe:

```bash
docker compose build
docker compose up -d
docker compose restart
```

A container restart must not require manual repair.

A server reboot must not require manually launching the application.

Long-running production services therefore need appropriate restart policies.

---

# 29. Repository Changes Must Come Through Git

Do not design a workflow that depends on editing source files directly on the VPS.

The expected production update path is:

```text
implement locally/in development
        |
test
        |
commit
        |
push
        |
git pull --ff-only on VPS
        |
build
        |
backup if migration
        |
run explicit migrations
        |
start/recreate
        |
health/smoke test
```

Production-specific secrets remain on the VPS and must not enter Git.

---

# 30. Do Not Commit or Push Unless Requested

Claude may modify the working tree as required by the task.

Do not:

```text
git commit
git push
force-push
create tags
publish releases
```

unless the user explicitly asks.

When the implementation is complete, provide a suggested commit message if useful.

---

# 31. Do Not Repeatedly Re-Explore the Same Codebase

At the beginning of a task, perform one targeted repository audit sufficient to understand:

```text
relevant architecture
deployment files
data model
affected modules
tests
existing conventions
```

Reuse that understanding during the same task.

Do not repeatedly perform broad codebase exploration before every small command.

Re-inspect only the files/areas that are relevant to the current change or may have changed.

---

# 32. Respect Existing Architecture

Before creating a new:

```text
service
utility
component
database abstraction
API pattern
authentication mechanism
background worker
configuration system
```

look for an existing project pattern first.

Prefer extending the established architecture over introducing a parallel solution.

Do not perform unrelated refactors while implementing a scoped feature.

---

# 33. Production-Sensitive Files

Treat modifications to these as high-risk:

```text
Dockerfile*
compose*.yaml
compose*.yml
docker-compose*.yaml
docker-compose*.yml
.env.example
database schema
migration files
startup scripts
entrypoints
health endpoints
persistent storage configuration
authentication/session configuration
reverse-proxy assumptions
background worker configuration
```

When changing one of these, Claude must explicitly review production compatibility before finishing.

---

# 34. Production Compose Validation Gate

Before declaring a Compose-related change complete, run when Docker/Compose is available:

```bash
docker compose \
  -f compose.prod.yaml \
  config --quiet
```

If the production Compose filename is different, use the actual `COMPOSE_FILE`.

Do **not** paste the output of plain:

```bash
docker compose config
```

when real production environment values may be resolved.

`config --quiet` is preferred for validation.

---

# 35. Service Discovery Validation

When changing Compose services or profiles, verify the expected services:

```bash
docker compose \
  -f COMPOSE_FILE \
  config --services
```

If profiles are used, verify them too:

```bash
docker compose \
  -f COMPOSE_FILE \
  config --profiles
```

Expected concepts should include, as applicable:

```text
APP_SERVICE
migrate
worker
scheduler
```

The `migrate` service may be hidden from normal startup by a tooling profile.

---

# 36. Build Validation Gate

For infrastructure/runtime changes, verify the production image builds:

```bash
docker compose \
  -f COMPOSE_FILE \
  build
```

Do not claim production compatibility when the production image has not been build-validated if the environment allows it.

If Docker is unavailable in the current environment, state that clearly and perform all static validation that is possible.

---

# 37. Application Quality Gates

Before marking implementation complete, run the repository's relevant existing checks.

Examples:

```text
formatter/check
lint
typecheck
unit tests
integration tests
framework build
ORM/schema validation
production Docker build
Compose validation
```

Do not invent a command.

Inspect the repository's package/configuration files and use the actual commands defined by the project.

For Node.js projects, common examples may be:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For Python projects, use the project's actual configured tools.

A task is not complete merely because the changed code looks correct.

---

# 38. Migration Validation Gate

When schema/migration files change:

Claude must verify, as applicable:

```text
schema syntax/validation
migration files exist
migration history is coherent
generated clients/types are current
tests pass
production migration command is still valid
migrate service contains required tooling
```

Do not apply a destructive production migration merely to prove it works.

Use development/test databases for migration testing unless explicitly operating on production with user approval.

---

# 39. Health Validation Gate

When changing:

```text
startup
routing
authentication middleware
server configuration
health endpoint
database boot behavior
```

verify that the configured `HEALTH_PATH` still returns an appropriate success response when the app is healthy.

The health endpoint must remain reachable without login.

Do not accidentally protect it with authentication middleware.

---

# 40. Persistent Storage Validation Gate

When changing file handling, verify:

1. where the file is written;
2. whether it survives container replacement;
3. whether it is user-generated/irreplaceable;
4. whether backup tooling can reach it;
5. whether volume/path names changed.

Never introduce new persistent user data without updating the storage contract.

---

# 41. Production `.env.example` Validation

When code introduces a new required environment variable:

1. add it to `.env.example`;
2. document whether it is required or optional;
3. provide a safe placeholder/default where appropriate;
4. ensure no secret is committed;
5. include it in deployment notes if production must manually set it.

Do not make production fail after `git pull` because a required env variable was added silently.

---

# 42. New Dependency Review

Before adding a runtime dependency that requires infrastructure, ask:

```text
Does it require a network service?
Does it store persistent state?
Does it require a new port?
Does it require new secrets?
Does it require backups?
Does it require a background process?
Does it affect migrations?
Does it affect startup?
```

If yes, treat it as a production compatibility change and update the appropriate deployment contract.

---

# 43. External API Requirements

If the application calls external APIs:

- keep tokens in protected env variables;
- do not expose secrets to clients;
- ensure the application has outbound network access;
- implement failure handling appropriate to the feature;
- do not make core app startup depend unnecessarily on an external API;
- document new production environment variables.

Do not attach a service to `proxy` merely to obtain outbound Internet if another suitable non-internal network exists in the project architecture.

---

# 44. Nginx Compatibility

The repository does not own the shared Nginx configuration, but it must preserve the interface Nginx expects:

```text
proxy alias: PROJECT_NAME-app
port: APP_PORT
health path: HEALTH_PATH
domain behavior: DOMAIN
```

If a code change affects:

```text
base path
HTTP/HTTPS redirect behavior
host validation
WebSockets
streaming
request body size requirements
long-running requests
forwarded-header handling
```

Claude must report whether the shared Nginx configuration may need an update.

Do not silently assume that changing application routing has no reverse-proxy impact.

---

# 45. WebSocket / Streaming Features

If adding WebSockets, Server-Sent Events, streaming responses, or long-lived HTTP connections:

- implement the application side correctly;
- identify the internal route/port;
- explicitly state that shared Nginx may require proxy configuration changes;
- do not expose a new host port as a workaround.

Preserve the shared reverse-proxy architecture.

---

# 46. Large Upload Features

If adding large file uploads:

- use persistent storage;
- enforce application-level validation;
- document expected maximum size;
- explicitly report any required Nginx `client_max_body_size` change;
- consider request timeout requirements;
- ensure backups include the uploaded files when required.

Do not work around proxy limits by publishing the application port publicly.

---

# 47. Authentication and Secure Cookies Behind Proxy

When authentication behavior depends on HTTPS, host, client IP, or secure cookies, remember that TLS terminates at shared Nginx.

Use the framework's supported proxy/forwarded-header configuration when required.

Do not disable secure-cookie or HTTPS protections merely because the app receives proxied HTTP on the internal Docker network.

If changing proxy-trust behavior, report it as production-sensitive.

---

# 48. Logs

Application logs should go to stdout/stderr unless the project has an explicit centralized logging design.

Do not store unlimited application logs inside a container filesystem.

Do not log:

```text
passwords
database URLs containing passwords
session secrets
access tokens
private keys
full sensitive request bodies
```

Production debugging must not require enabling unsafe secret logging.

---

# 49. Startup Failures Must Be Visible

If required production configuration is missing, fail clearly.

Prefer an explicit startup/configuration error over silently running with an unsafe default.

Examples of unsafe silent defaults:

```text
DEBUG=true
empty auth secret
development database
localhost database
temporary in-memory storage for required persistent data
anonymous default administrator credentials
```

A missing required secret should not cause the application to invent a new secret on every container boot unless that behavior is explicitly designed and safe.

---

# 50. Database Connection Behavior

Application database connections must tolerate normal container startup ordering.

Do not assume that a simple Compose start order means PostgreSQL is immediately ready.

Use the framework/driver's normal connection retry behavior where appropriate.

Do not create scripts that repeatedly recreate schemas when the first connection attempt fails.

---

# 51. Backward-Compatible Deployments

For changes likely to be deployed without stopping every dependent process simultaneously, preserve compatibility across the deployment window.

Particularly review:

```text
database schema changes
worker payloads
queue message formats
API contracts
session formats
cached objects
shared files
```

When a new application version cannot safely coexist with the previous schema/version, report the deployment constraint explicitly.

---

# 52. Rollback Awareness

Before completing a production-sensitive change, determine whether code rollback remains safe after its migration.

Classify schema changes mentally as:

```text
rollback-safe
requires coordinated rollback
irreversible/destructive
```

If rollback is not straightforward, state that in the completion report.

Do not claim:

```text
"just revert the commit"
```

when the database has already undergone an incompatible change.

---

# 53. No Blind Production Resets

Claude must never recommend as a routine fix:

```text
drop database
delete volume
delete migration history
prisma migrate reset
flush all data
rm -rf persistent storage
docker compose down -v
```

on production.

If a destructive recovery action is genuinely necessary:

- clearly label it destructive;
- require a verified backup;
- explain what will be lost;
- get explicit user approval before execution.

---

# 54. Compatibility Review Before Finishing Any Task

Before declaring work complete, Claude must ask internally:

### Docker

- Did I alter the Dockerfile?
- Did I alter the production Compose file?
- Does the app still build?
- Is the app still private from the host?
- Are network memberships correct?
- Is the proxy alias unchanged/correct?

### Database

- Did I alter the schema?
- Are migrations committed?
- Does the production migration command still work?
- Is `postgres:5432` still the production DB endpoint?
- Did I introduce destructive migration behavior?

### Runtime

- Does `APP_SERVICE` still exist?
- Does it still listen on `APP_PORT`?
- Does it bind so Nginx can reach it?
- Does `HEALTH_PATH` still work?
- Are new required env vars documented?

### Storage

- Did I introduce/change persistent files?
- Are uploads still on persistent storage?
- Does backup/restore need an update?

### Operations

- Did I add a worker/scheduler/service?
- Does it have a restart policy?
- Does it need new infrastructure?
- Does shared Nginx require a change?
- Does deployment/rollback behavior change?

If any answer requires operational work, include it in the final report.

---

# 55. Required Completion Report from Claude

For implementation tasks, Claude's final response should be concise but must include these items when relevant:

```text
Implemented
- what changed

Production compatibility
- unchanged, or exact compatibility changes

Database
- migration added / no migration
- migration command
- rollback concern if any

Environment
- new/changed env vars

Deployment
- any manual VPS/Nginx/storage steps

Validation
- exact checks actually run
- pass/fail

Not performed
- anything that could not be validated

Commit
- suggested commit message if the user has not asked Claude to commit
```

Do not say "production-ready" if required production validation was skipped.

---

# 56. New Feature Checklist

For every substantial new feature:

```text
[ ] Follow existing project architecture
[ ] No unrelated refactor
[ ] No production secrets committed
[ ] New env vars added to .env.example
[ ] Schema changes have committed migrations
[ ] Production migration path remains explicit
[ ] APP_SERVICE remains valid
[ ] APP_PORT remains valid
[ ] HEALTH_PATH remains valid
[ ] Proxy alias remains valid
[ ] No application port published publicly
[ ] No project-local PostgreSQL added to production
[ ] Persistent user data uses durable storage
[ ] New workers/schedulers represented explicitly
[ ] Production Compose still validates
[ ] Production image still builds when applicable
[ ] Existing lint/typecheck/tests/build pass as applicable
[ ] Production-impacting changes reported
```

---

# 57. Production Infrastructure Change Checklist

If modifying Docker/deployment behavior:

```text
[ ] Read this CLAUDE.md first
[ ] Inspect existing production Compose
[ ] Preserve shared PostgreSQL architecture
[ ] Preserve shared Nginx architecture
[ ] Preserve external database/proxy networks
[ ] Preserve unique PROJECT_NAME-app alias
[ ] Preserve private application ports
[ ] Preserve protected .env handling
[ ] Preserve explicit migration service
[ ] Preserve healthcheck
[ ] Preserve persistent storage
[ ] Validate Compose with config --quiet
[ ] Inspect config --services
[ ] Inspect config --profiles if used
[ ] Build production images
[ ] Run relevant tests
[ ] Document any VPS-side action
[ ] Document rollback implications
```

---

# 58. Things Claude Must Never Do Silently

Never silently:

- expose the application on a host port;
- expose PostgreSQL;
- introduce a second production PostgreSQL container;
- change the DB host away from `postgres`;
- change the shared network names;
- remove the unique proxy alias;
- rename the app/migration service used by deployment without updating the contract;
- change `APP_PORT`;
- remove/break the health endpoint;
- move uploads to ephemeral container storage;
- embed secrets in Docker images;
- commit `.env`;
- move secrets into frontend-public env variables;
- run destructive migrations at startup;
- replace reviewed migrations with schema reset/push behavior;
- add a new stateful production dependency;
- delete persistent volumes;
- use `docker compose down -v` as normal maintenance;
- change production deployment semantics during an unrelated feature;
- claim validation was run when it was not;
- commit or push unless explicitly asked.

---

# 59. Preferred Production Repository Shape

A typical repository should converge toward:

```text
project/
├── CLAUDE.md
├── Dockerfile
├── .dockerignore
├── .gitignore
├── .env.example
├── compose.prod.yaml
├── compose.dev.yaml              # optional
│
├── src/                          # framework-dependent
├── migrations/                   # framework-dependent
├── prisma/                       # Prisma, if applicable
│
├── scripts/                      # optional project scripts
│
└── tests/
```

Do not force this exact layout if the framework/repository already has a clean established structure.

The important part is the deployment contract, not cosmetic folder names.

---

# 60. Example Standard Production Compose

This is a reference pattern, not something to paste blindly.

```yaml
services:
  app:
    build:
      context: .
      target: runner

    restart: unless-stopped

    env_file:
      - .env

    networks:
      database:
      proxy:
        aliases:
          - PROJECT_NAME-app

    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
        ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s

  migrate:
    build:
      context: .
      target: builder

    env_file:
      - .env

    profiles:
      - tools

    networks:
      - database

networks:
  database:
    external: true

  proxy:
    external: true
```

Important:

- replace `PROJECT_NAME-app` with the actual unique alias;
- replace healthcheck command/port/path with the actual runtime;
- omit `database` when the application does not use PostgreSQL;
- omit `migrate` when the application has no migration system;
- add durable volumes when user uploads/persistent files exist;
- add separate worker/scheduler services when required;
- do not add public `ports:` to the application.

---

# 61. Example Deployment Interface

A project following this contract should be deployable approximately as:

```bash
cd /srv/apps/PROJECT_NAME

git pull --ff-only

sudo docker compose \
  -f COMPOSE_FILE \
  config --quiet

sudo docker compose \
  -f COMPOSE_FILE \
  build
```

If an existing production DB requires a migration:

```bash
sudo backup-PROJECT_NAME
```

Then:

```bash
sudo docker compose \
  -f COMPOSE_FILE \
  run --rm MIGRATION_SERVICE \
  MIGRATION_COMMAND
```

Then:

```bash
sudo docker compose \
  -f COMPOSE_FILE \
  up -d
```

Then:

```bash
sudo docker compose \
  -f COMPOSE_FILE \
  ps
```

and:

```bash
sudo docker compose \
  -f COMPOSE_FILE \
  logs --tail=150 APP_SERVICE
```

The VPS runbook handles:

```text
shared PostgreSQL
shared Nginx
DNS
TLS
S3 backups
restore procedures
systemd backup timers
provider-level recovery
```

The repository must keep its side of this interface predictable.

---

# 62. Definition of Production-Compatible

A repository is production-compatible with this VPS plan when all applicable statements are true:

```text
[ ] It builds from committed source.
[ ] It has an identifiable production Compose file.
[ ] It does not create a project-local PostgreSQL in production.
[ ] It connects to shared PostgreSQL through postgres:5432.
[ ] It has its own database credentials.
[ ] Its public app joins the external proxy network.
[ ] Its DB-using services join the external database network.
[ ] Its public app has a unique PROJECT_NAME-app proxy alias.
[ ] Its application port is not published to the host.
[ ] Its app listens on the documented internal APP_PORT.
[ ] Its app is reachable from another container on proxy.
[ ] It exposes a stable health endpoint.
[ ] Docker can healthcheck the app.
[ ] Production migrations are explicit.
[ ] Migration tooling exists in the migrate service/image.
[ ] Production secrets remain outside Git and image layers.
[ ] Required env vars are represented safely in .env.example.
[ ] User uploads use persistent storage.
[ ] Long-running auxiliary processes are explicit Compose services.
[ ] Production Compose validates.
[ ] Relevant tests/lint/typecheck/build checks pass.
[ ] Deployment-impacting changes are documented.
```

If one of these is intentionally not applicable, document why.

---

# 63. Final Rule

When choosing between:

```text
a change that is locally convenient
```

and:

```text
a change that preserves the established production contract
```

preserve the production contract unless the user explicitly asks to change the architecture.

Features and refactors must fit the deployment system.

The deployment system must not be accidentally rewritten by ordinary feature work.
