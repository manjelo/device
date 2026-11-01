# Multi-device simulator: design

Status: **design, plus two early implementations** (the Motorola MTP850, plain not Ex, front panel only, is also built under `src/devices/mtp850/`, see `docs/devices/mtp850/`): the Datron PRC2100V (front panel only, minimal Assumed-labelled model) is built under `src/devices/prc2100v/` behind a device picker, without the full `DeviceModule` refactor of section 2. The PRC-152 is unchanged in `src/radio`. The rest is still design only. Goal: one site, a device picker, and several simulated device models, with the
AN/PRC-152 as the first. This builds on `docs/relay-design.md` (link and voice) and keeps the accuracy rules in
`docs/accuracy-matrix.md`: anything not documented in a public source is labelled Assumed or Unknown, and no control,
menu or behaviour is invented.

## 1. Requested devices and what I can and cannot say

| Requested | What I believe it is | Confidence |
|---|---|---|
| Motorola MTM5400 | TETRA vehicle-mounted (mobile) radio | Fairly sure |
| Motorola MTP3250 | TETRA handheld (MTP3000 series) | Fairly sure |
| Motorola MTP850 Ex (ATEX) | TETRA handheld, intrinsically safe variant | Fairly sure |
| "Tetra" | Not a model: TETRA is the radio standard the three above use | Needs your clarification |
| TCR1000 | Motorola covert (body-worn, discreet) TETRA terminal, announced 2008, discontinued; about 165 x 35 x 17 mm, under 165 g, 1 W, used with body-worn accessories (search-result summaries; the Connectel page you sent is behind a bot challenge and was not readable) | Identified from secondary summaries, not yet verified against its manual |
| "PRC2100 v Datron" | Datron Spectre V PRC2100V, tactical VHF manpack (30 to 87.975 MHz). See `docs/devices/prc2100v/` | Identified from the Datron datasheet |

Nothing here is verified yet. Step 1 of the plan is a research pass per device (public datasheets and manuals only), which
produces a device-research and accuracy-matrix document before any SVG or logic is written.

The list falls into two families, which decides how much code can be shared:

- **TETRA terminals** (MTM5400, MTP3250, MTP850 Ex, and a generic TETRA model if wanted): talkgroups instead of
  frequencies, trunked (TMO) and direct (DMO) modes, emergency button, status messages, SDS text, a menu-driven display.
  One shared `tetra-core` behaviour module, with a thin per-model "skin" (layout, keys, display size, which features exist).
- **Tactical VHF/UHF/HF radios** (AN/PRC-152 today, the Datron radio probably): frequency, presets and mode based. Like the
  current logic.

## 2. Framework

Today everything lives in `src/radio/` and is PRC-152 specific (`RadioState`, its keypad, menus and LCD). The change is to
put a small contract between the UI and any device.

```text
src/
  devices/
    registry.ts            id -> lazy loader + metadata (name, family, views)
    types.ts               DeviceModule contract (below)
    contract.test.ts       one test suite run against EVERY registered device
    prc152/                today's src/radio, moved, behaviour unchanged
    tetra-core/            shared TETRA behaviour (talkgroups, TMO/DMO, emergency, status, SDS)
    mtp850ex/  mtp3250/  mtm5400/   per-model skin: controls.ts, keymap.ts, menus.ts, svg/*.svg, accuracy.md
  net/  hooks/  components/  (generic, device-agnostic)
docs/devices/<id>/device-research.md + accuracy-matrix.md
```

```ts
interface DeviceModule<S, A> {
  id: string; name: string; family: 'tactical' | 'tetra';
  initialState: S;
  reduce(state: S, action: A): S;                 // pure, no DOM, no network
  renderLcd(state: S): LcdFrame;                  // rows + indicators, reused by the existing Lcd component
  controls: ControlDef[];                         // id, label, accuracy tag, view
  views: ViewDef[];                               // SVG per view (front, back, ...)
  keyToAction(key: string): A | null;             // keyboard shortcuts
  link: {
    channelOf(state: S): number | null;           // what this device is tuned to (section 3)
    isTransmitting(state: S): boolean;
    receiving(state: S, heard: Heard): boolean;
    volume(state: S): number;                     // 0..1 for playback gain
  };
}
```

What stays generic and is reused as is: the LCD component, view switcher, control legend/info panel, sound, the link hooks,
the relay, e2e helpers. What moves behind the contract: everything under `src/radio/`.

The picker: a device selector in the header, kept in the URL (`?device=mtp850ex`) and `localStorage`. Each device module is
loaded with a dynamic `import()`, so the PRC-152 bundle does not grow when more models are added. Switching device resets
that device's state to its defaults; per-device saved presets/talkgroups are kept per device.

## 3. Link between different models

The link currently matches on exact frequency in Hz. TETRA matches on talkgroup, and a conventional radio and a TETRA
terminal do not really interoperate. Proposed rule, simple and honest:

- Every device exposes one **channel number** (u32). Conventional radios: the frequency in Hz (always below 2^29).
  TETRA in TMO: `0x80000000 | GSSI` (the talkgroup ID, 24 bits). TETRA in DMO: `0x40000000 | frequency in kHz`.
- Two devices hear each other only when their channel numbers are equal. A PRC-152 therefore never hears a TETRA
  talkgroup, and two different TETRA models in the same talkgroup do. Cross-family communication is not simulated.
- The audio and control frames already carry a u32 frequency; they carry the channel number instead. The relay stops
  checking a 30 to 512 MHz band and checks only that the value is non-zero. **This is a protocol change (v2):** relay and app must be
  deployed together. `refresh.sh` already does that. Unknown versions are dropped, so an old browser tab simply stops linking
  until reloaded.
- All of this is Simulator-specific. It models no TETRA air interface, encryption (TEA), trunking infrastructure or
  registration.

## 4. Accuracy and legal rules

- Per device, before building: `docs/devices/<id>/device-research.md` (physical controls and where they are, public
  documentation, LCD and menu structure that is publicly documented) and `accuracy-matrix.md`, same classes as today
  (Verified-public-doc, Verified-photo, Secondary-source, Assumed, Unknown).
- SVGs are drawn by us from public photos and dimensions. Official artwork is not copied. Unknown controls are not drawn.
- Motorola and Datron are trademarks of their owners. The site keeps the existing "unofficial simulator, not a device
  reference, no RF" banner and states it is not affiliated with or endorsed by any manufacturer.
- Behaviour that is not documented is shown as unavailable on the LCD, as the PRC-152 simulator does today.

## 5. Deployment impact

- Front end only; no new service, port, env var, database or volume. The production contract in `CLAUDE.md` section 0
  does not change, except for one note: relay protocol v2.
- Relay: one small change (channel number instead of a frequency band check) and a version bump, with tests.
- Rollback is safe (no data). Rolling back app and relay together restores v1.

## 6. Plan

0. **Confirm the device list** (questions below).
1. **Research** each confirmed device with the radio-researcher agent, one at a time. Output: research and accuracy docs. No
   code yet. You review them.
2. **Framework refactor with no behaviour change:** move `src/radio` to `src/devices/prc152`, add the `DeviceModule`
   contract, registry, device-agnostic hooks, and the contract test suite. Acceptance: all existing 271 unit tests and 95
   e2e tests pass unchanged apart from import paths.
3. **Picker and link v2:** picker UI, URL/localStorage, lazy loading, channel-number link, relay v2 and tests. With one
   device the site looks the same.
4. **`tetra-core` plus the first TETRA model** (suggest MTP3250 or MTP850 Ex, the handhelds): research-driven, tests for
   talkgroup selection, TMO/DMO, emergency, status, and linking by talkgroup.
5. **Remaining TETRA models** as skins on `tetra-core` (the MTP850 Ex differs mainly in being the ATEX variant; the MTM5400
   has a different form factor and a handset/head unit), then the Datron radio once identified.
6. Per model: unit tests, contract tests, e2e smoke test, docs update, then deploy with `refresh.sh`.

Each phase ends with lint, `tsc -b`, unit, e2e, build and `docker compose config --quiet` passing, and its own commit.

## 7. Questions

1. **TCR1000:** confirm it is the Motorola covert TETRA terminal (the link says "convert", most likely a typo for "covert"). It probably has little or no display and is operated through accessories, so its skin will differ from the handhelds. Public manuals exist and will be the research source.
2. **"Tetra":** a generic TETRA terminal with no brand, or something specific that I should not guess at?
3. **"PRC2100 v Datron":** the exact model name and a reference (it is not clear to me which radio this is, and I will not
   guess its controls).
4. **Order:** start with a TETRA handheld (my recommendation, since three of your devices are TETRA) or with the Datron radio
   (closest to the PRC-152)?
5. **Reference material:** do you have manuals, datasheets or photos for any of these? Sources you trust shorten the research
   phase and improve accuracy.
