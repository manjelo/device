# Code review: RadioSim initial build (2026-10-25)

Scope: `src/` (radio logic, components, hooks, styles, assets), `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `index.html`. Not reviewed: `e2e/`, `playwright.config.ts`.
Method: read-only. No builds, tests, or lint were run. No build, test, or lint result was supplied by the owner.

## Summary

The architecture contract holds: `src/radio/` has no React or DOM imports, every `ControlId` in the SVGs matches `controls.md` (23 front, 2 top, 1 side, 0 back), and the LCD percentages match the `#lcd-area` rect in `front.svg` (130/300, 58/520, 120/300, 82/520). Accuracy labels are honest, with no Assumed or Unknown behavior presented as verified. The main gaps are accessibility (the SVG controls are not exposed to assistive tech or to the keyboard), a keyboard conflict that swallows Enter on the view buttons, and touch targets under 44 px for CLR/ENT. Verdict: Ready with fixes.

## Verdict: Ready with fixes

Counts: Blocker 0, Major 4, Minor 10, Nit 6.

## Findings

| Severity | File:line | Issue | Suggested fix |
|---|---|---|---|
| Major | `src/assets/radio/front.svg:11`, `:46-141`; `src/components/radioSvg.ts` | Root `<svg role="img">` makes its descendants presentational. The `role="button"` and `role="slider"` groups with `aria-label` are therefore not exposed. None of the controls has `tabindex`, so they cannot be reached or operated from the keyboard. Keyboard operation exists only through window shortcuts. | Remove `role="img"` from the root (use `role="group"` with a label). Make controls focusable (`tabindex="0"`, Enter/Space handling) or document that shortcuts are the only keyboard path. Give knobs `aria-valuenow`. |
| Major | `src/hooks/useRadio.ts:78-83`; `src/components/ViewSwitcher.tsx:14-19` | `keydown` calls `preventDefault()` for Enter, Escape, and digits even when focus is on a view button, which is not a typing target. Enter on a focused "Back"/"Top"/"Side" button sends ENT to the radio and does not activate the button. | Skip shortcuts when the target is a button or link (or call `preventDefault` only for keys the target does not handle natively). Add a test for Enter on a view button. |
| Major | `src/assets/radio/front.svg:134-142` | CLR and ENT keys are 30 units tall. At the 340 px max width this renders about 34 px (about 29 px at 300 px). The side PTT (`side.svg:54-57`) renders about 34 px wide. Both are below the 44 px minimum. | Make the key 44 px high at the smallest supported width (for example 36 units at 1:1 scale or a larger `min-height` hit overlay), and widen the PTT hit area. |
| Major | Repository (no owner report) | No build, typecheck, lint, or test result was supplied. `package.json` has `build` (`tsc -b && vite build`) and `lint` (`oxlint`) scripts. Per the review rules, approval cannot be given without reported passes. | Owner reports `npm run build`, `npm run lint`, and `npx vitest run` results. |
| Minor | `src/components/controlInfo.ts:14-41` | Per-control accuracy and notes duplicate `src/assets/radio/controls.md`. The copies can drift. | Move the metadata into `src/radio/` (no DOM) keyed by `ControlId`, and add a test that parses `controls.md` or the SVG `data-control` set against it. |
| Minor | `src/components/controlInfo.ts:43-44`; `src/radio/types.ts:36`; `src/radio/index.ts:4-5` | `KnobId` is defined twice (`types.ts:36` and `controlInfo.ts:44`). `index.ts` does not export `KnobId`, so the duplicate exists. | Export `KnobId` from `src/radio/index.ts` and delete the local alias. |
| Minor | `src/hooks/useRadio.ts:13` | Hook imports `KnobId` from `components/controlInfo`, which inverts the layering (hooks should not depend on components). | Import `KnobId` from `../radio` once it is exported (see above). |
| Minor | `src/components/Lcd.tsx:10` | `role="status"` on the whole LCD makes it a polite live region. Every key press re-announces all six rows. | Use `role="img"` with the `aria-label`, or make only the notice row `aria-live="polite"`. |
| Minor | `src/styles/app.css:206-226` | LCD overlay geometry is hardcoded as percentages. The values match `front.svg` today, but the SVG and CSS can drift. | Keep the percentages but add a unit test or a shared constant, or set the geometry from the SVG rect. |
| Minor | `src/styles/app.css:213-234` | LCD font is `2.3cqw` (about 7.8 px at 340 px width), and the footer is `1.8cqw` (about 6 px). This is below readable size. | Set a minimum with `max(…px, …cqw)` and check the rendering at 375 px. |
| Minor | `src/components/ControlLegend.tsx:20`; `src/radio/README.md` (Simulator conveniences) | "The device has no documented keyboard mapping." is an absence claim with no source label. No accuracy row covers it. | Reword as "No keyboard mapping is documented in the sources used here" or add a matrix row marked Unknown. |
| Minor | `src/hooks/useRadio.ts:84-91` | `keyup` for `t` is ignored when focus is in a text input. If focus moves into an input while `t` is held, PTT stays latched in transmit. | Track the held PTT key in a ref and release on `keyup` regardless of target. |
| Minor | `src/radio/README.md` (Open items) | Stale. It says `controlToAction`, `knobTurnToAction`, and `keyReleaseToAction` are not re-exported, but `src/radio/index.ts:4` exports them. | Update the README. |
| Minor | `src/components/App.test.tsx`, `src/radio/*.test.ts` | Tests cover reducer and mapping but not: key repeat, typing-target guard, wheel and drag, listener cleanup on unmount, or control sizes. | Add hook tests for these, and a test that CLR/ENT hit areas are at least 44 px at the min width. |
| Minor | `src/styles/theme.css:18-48`; `:56-61` | Dark tokens are duplicated in two blocks. `overflow-x: hidden` on `html, body` hides overflow instead of fixing it. | Share the dark block via a single selector list. Remove the global `overflow-x` and fix the overflow at its source. |
| Nit | `index.html:7` | Title is still `radiosim-scaffold`. | Set `<title>RadioSim</title>`. |
| Nit | `src/radio/config.ts:12,16`; `src/radio/types.ts:38,47-48`; `src/radio/stateMachine.ts:31` | Unused or never-reached values: `FEATURE_HIGHBAND`, `FREQ_STEP_HZ`, `ControlEvent 'longpress'`, `outputPowerW` and `waveform` (never changed or shown), and `mode 'receive'` (never entered). | Keep as documented placeholders or remove. Note in README that they are not wired. |
| Nit | `src/assets/radio/side.svg:53-57` | PTT is `role="button"`; a switch would be `role="switch"`. | Use `role="switch"` with `aria-checked`. |
| Nit | `src/main.tsx:7` | Non-null assertion `document.getElementById('root')!` without a comment. | Add a short comment or a runtime check. |
| Nit | `src/components/radioSvg.ts:42`; `src/radio/keypad.ts:38` | `as unknown as SVGSVGElement` and template cast `as ControlId`. Both are justified, but neither has a comment. | Add one-line comments. |
| Nit | `src/radio/stateMachine.ts:98-114` | `reduceControl` uses a `default` branch instead of an exhaustive switch on `ControlId`. | Acceptable. An exhaustive switch would catch new IDs at compile time. |

## Accuracy claims lacking a source label

- `src/components/ControlLegend.tsx:20` and `src/radio/README.md`: "The device has no documented keyboard mapping." (absence claim, see Minor above).
- `src/components/controlInfo.ts` notes for `knob-volume` and `knob-squelch` ("Volume, 0 to 10 with clamp.") carry no ASSUMED tag in the note text. The row's `accuracy` field is Assumed, so the UI label is correct. Optional: add "Assumed" to the note.

No other verified-as-fact copy found. The LCD (`lcd.ts`, `Lcd.tsx`), menu (`menus.ts`), battery (`config.ts`), and power behavior are labeled as placeholders or Unknown.

## Checked and passing

- `src/radio/` imports: no `react`, `react-dom`, or DOM globals (grep clean).
- ControlId parity: 23 in `front.svg`, 2 in `top.svg`, 1 in `side.svg`, 0 in `back.svg`, matching `controls.md`.
- LCD overlay percentages match `front.svg` `#lcd-area` (x 130, y 58, w 120, h 82 in a 300 x 520 viewBox).
- Power hit target: visible r=14, hit r=26 (about 59 px at 340 px width, at least 44 px down to about 255 px).
- Listeners: `useRadio` window listeners and the wheel listener are removed in cleanup. Pointer handling uses React props (no leak).
- Repeat: digits, Enter, and `t` ignore `e.repeat`. Knob arrow keys allow repeat by design.
- Typing guard on keydown covers INPUT, TEXTAREA, SELECT, and contentEditable.
- Reducer: no mutation, no randomness, no time dependence. Power-off clears entry buffer, menu, notice, and transmit.
- Strict mode is on in both tsconfigs. `noUnusedLocals` and `noUnusedParameters` are set.
- `dangerouslySetInnerHTML`, `innerHTML`, `fetch`, and `Math.random` are not used in `src/`.
