# Datron PRC2100V (Spectre V) - device research

Step 1 of `docs/multi-device-design.md` for this device. Public sources only. Nothing here is implemented yet.

## Sources

| ID | Source | Used for |
|---|---|---|
| S1 | https://www.dtwc.com/prc2100v (product page) | Overview, feature list |
| S2 | Datron datasheet "PRC2100V Spectre V Tactical VHF Manpack Radio", rev 191003 (via the page's PDF link) | Specifications, front-panel photograph |

No user manual, menu tree or keypad documentation was found. The page says "Intranet Login" is internal only.

## Identity

The PRC2100V is Datron World Communications' Spectre V tactical VHF manpack radio (S1, S2). The design doc's "PRC2100 v Datron" is therefore resolved as this model, so the earlier "Unknown, do not guess" entry can become "Identified". It is a VHF FM radio, so it belongs to the tactical family (frequency and memory-channel based), not TETRA.

## Documented specifications (S2)

| Item | Value |
|---|---|
| Frequency range | 30 to 87.975 MHz (S1 rounds to 30 to 88) |
| Channel spacing | 12.5 or 25 kHz |
| Memory channels | 100, all mode information programmable per channel; programmed from front panel or remotely by computer |
| Scanning | Any or all channels in a group (up to 100) |
| Modes | Voice and data: FF FM, FH (frequency hopping), digital encryption; simplex or half-duplex. Data 9600 and 19,200 bps async in, 16 kbps out |
| Embedded functions | ECCM (full or partial band hopping), COMSEC, GPS (position, time of day) |
| TX power | Manpack 500 mW to 10 W (3 adjustable settings); mobile/base 500 mW to 75 W (4 settings) |
| Input power | 11 to 15 Vdc; BB-NM10 NiMH pack (up to 11.1 Ah) |
| Display | Backlit multi-function custom LCD ("large graphic display" in S1); battery icon is the low-battery indicator; menus in the operator's language |
| Antenna | BNC port (50 ohm broadband or external amplifier), whip port; internal antenna matching; GPS uses an external TNC connector |
| Size, weight | 8.5 x 3.5 x 9.5 in (216 x 89 x 241 mm) incl. battery; 9.46 lb (4.2 kg) without battery, battery 4 lb (1.8 kg) |
| Environment | MIL-STD-810, immersible, -20 to +60 C |
| Other | Module-level BITE; roles: base, vehicle, manpack, retransmit; interoperable with the HH2100V handheld |
| Squelch | Tone or carrier |

## Front panel (user-supplied photograph, plus S2)

Scope decision (user): front panel only. There are no controls on the sides, so no other views are modelled.
Observed from the photograph; "Function" is documented only where a printed label or the datasheet says so.

| Element | Observation | Function |
|---|---|---|
| LCD | Backlit graphic LCD, dark text on green. Top line reads roughly `0 SPECTRE` with small status boxes (`GPS`, `SIL`, `H C S` legible, others partly unreadable). Main line shows a marker and `30.000` (frequency, MHz). A vertical bar scale sits at the right edge. Bottom line shows `VOL`, `PWR` with signal-style bars, and boxes at the right (partly unreadable) | Layout only; the exact meaning of each field is Unknown |
| Four-way pad | Diamond of four rubber arrow keys, upper right of the LCD | Unknown (arrows suggest navigation; not stated) |
| Three keys under the LCD | Small square key, round key, wide oval key; unlabeled | Unknown |
| `PWR` | Toggle-style switch, bottom left, label printed above the cap | Power, by label (switch positions Unknown) |
| `VOLUME` | Small capped control next to PWR, label printed | Volume, by label (control type Unknown) |
| `XMODE` | Brass threaded cap/connector, label printed | Unknown (label only) |
| `RADIO` | Large capped round connector, bottom centre-right, label printed | Connector, by label |
| `AMP` | Capped connector, upper right of the radio, label printed | Amplifier connector, by label |
| Top-left connector | Large circular military connector with lanyard, plus two small capped connectors below it | Unknown |
| Latch | Silver hinged clasp between XMODE and RADIO | Physical only |
| Handles | Rigid carry handle at each side | Physical only |
| Adjacent panel (right of the photo) | A separate panel with labelled `CONTROL` (large capped connector) and `RADIO` (small connector with a green LED below) | Probably a different unit (vehicle or control panel), not part of the manpack front. Do not model without confirmation |

There is no numeric keypad or mode selector visible. Datasheet confirms the LCD is a "multi-function custom LCD" with a battery icon and menus.

## Consequences for the simulator

- A faithful front view can be drawn from the photographs and the dimensions, using only the printed labels above (PWR, VOLUME, XMODE, RADIO, AMP) and **no invented labels** on the unlabeled keys.
- The device cannot be given a believable menu tree or keypad from public data. Anything beyond the specs table would be Assumed and must be labelled so in the UI and accuracy matrix.
- What can be simulated honestly with Documented status: power-on state, 30 to 87.975 MHz in 12.5/25 kHz steps, 100 memory channels, mode choice FF FM / FH / digital, power-level settings (3 for manpack), battery icon, link channel = frequency in Hz (same rule as the PRC-152).
- Likely needed next to go further: the Spectre V operator manual or quick-reference card (not public so far). Ask whether you have one.

## Open questions

1. Do you have the PRC2100V operator manual? Without it, what the pad, the three keys and the LCD fields do stays Unknown, so the model stays minimal and Assumed-labelled.
2. Should it ship as a minimal model now (specs-only behaviour) or wait for more material?
