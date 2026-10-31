# RadioSim

A browser simulator of the original Harris Falcon III AN/PRC-152 handheld radio. It is an interface simulation: a physical-looking radio with four SVG views, a live LCD, a device state machine and optional sound. It is an approximation built from incomplete public sources, not a device reference and not a copy of the firmware.

**Safety scope.** RadioSim never transmits RF, never uses a microphone, and has no networking between radios. It has no cryptography, key loading, waveform processing, frequency hopping or hardware control. Entries for such features appear only as marked unavailable.

## Run it

```bash
npm install
npm run dev        # development server
npm run build      # typecheck and production build
npm test           # unit and component tests (Vitest)
npx playwright test   # end-to-end tests (starts the dev server on port 4173)
npx oxlint         # lint
```

## What you can do

1. Open the page and press the power button on the **Top** view. The LCD shows a short startup screen, then the main screen.
2. On the main screen, press **7** (OPT) or **8** (PGM) to open a menu. **PRE +** and **PRE -** change the active preset. The **channel dial** and PRE keys move the menu cursor.
3. PGM > System Preset Settings > System Presets > pick a preset > Frequency. Type six digits (MMM.KKK MHz), press ENT to check the entry, then ENT again on the confirm screen to save. CLR cancels.
4. OPT has options such as Keypad Lock, Monitor, Display Bright, RF Power, Battery Drain and Reset Simulator. Unsupported entries are shown as N/A.
5. Turn the **volume** knob (Top view) to see a temporary volume indicator. Hold the **PTT** switch (Left view) for simulated TX.
6. Switch views freely. Nothing resets, and saved presets survive a power cycle.

Keyboard shortcuts and the pointer controls are listed in the page's "Control status, shortcuts and technical notes" section.

## How accurate is it?

Read [`docs/device-functionality-v5.md`](docs/device-functionality-v5.md). It lists every implemented behavior with its source and one of these classifications: Verified-public-doc, Secondary-source, Approximated, Simulator-specific, or Unknown/Unsupported.

In V5 no behavior could be verified against a primary document for the original model. The operator manual and datasheet were not readable. Only a few things come from game-mod descriptions and are labelled Secondary-source: keys 7 and 8 as OPT and PGM, the PGM path "System Preset Settings" then "System Presets", the meanings of CLR, ENT and PRE +/-, and a temporary volume display. The other menu entries (Keypad Lock, Monitor, Display Bright, RF Power, Battery Drain, Reset Simulator) are simulator choices, and the LCD titles say "(simulator)". The research is in [`docs/research-v5-basic-operation.md`](docs/research-v5-basic-operation.md).

## Project layout

| Path | Purpose |
|---|---|
| `src/radio/` | Pure TypeScript device logic: state machine, data-driven menus, LCD frame, keypad mapping. No React or DOM. |
| `src/hooks/useRadio.ts` | Connects the logic to React: pointer and keyboard wiring, timers (startup, temporary indicators, battery). |
| `src/components/` | The radio view, the LCD, and the information panels. |
| `src/assets/radio/` | The four SVG views and `controls.md`, the control map. |
| `docs/` | Architecture, research, accuracy, and screenshots. |
| `e2e/` | Playwright tests and screenshot capture. |

`docs/architecture.md` describes the layers. `src/radio/README.md` describes the logic API.

## Prototype status

Working prototype: four SVG views, simulated LCD, preset editing, menus, sound. Not implemented (shown as N/A): dial positions S/F/Z/R/SCAN, COMSEC, `*`/`#` keys, preset name editing. Unverified behavior is labeled Assumed/Approximated in `docs/accuracy-matrix.md`.

## Production deployment (VPS)

Static SPA served by nginx; no database, uploads or migrations.

| Item | Value |
| --- | --- |
| PROJECT_NAME / proxy alias | `radiosim` / `radiosim-app` |
| COMPOSE_FILE / APP_SERVICE | `compose.prod.yaml` / `app` |
| APP_PORT / HEALTH_PATH | `8080` / `/health` |
| Networks | external `proxy` only |
| DOMAIN | set in the shared Nginx site config |

```bash
git pull --ff-only
sudo docker compose -f compose.prod.yaml config --quiet
sudo docker compose -f compose.prod.yaml build
sudo docker compose -f compose.prod.yaml up -d
```
