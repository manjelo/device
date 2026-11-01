# MTP850 accuracy matrix

Classes as in `docs/accuracy-matrix.md`. Sources: S1 brochure AN3-04-007 Rev.3, P1 its annotated front photograph (see `device-research.md`).

| Item | Simulated as | Class | Source |
|---|---|---|---|
| TMO 2048 and DMO 1024 talk groups | Group number 1..2048 / 1..1024, kept per net | Verified-public-doc (counts); names `TalkGrp N` are the brochure sample, Assumed for the rest | S1, P1 |
| Rotary knob = talk group selector and volume control | Selects talk group; volume is on navigation up/down | Verified-public-doc (role); volume placement Assumed | S1 |
| Emergency button, red display in emergency | Orange top button toggles a red screen with `EMERGENCY` | Verified-public-doc (button, red display); toggling Assumed; no emergency call is simulated | S1, P1 |
| PTT button, large, left edge | Drawn on the left edge, hold to transmit on the link | Verified-public-doc / Verified-photo | S1, P1 |
| Two programmable side buttons | Drawn, not interactive | Verified-photo (placement); function Unknown | P1 |
| Colour display, softkey labels `Optns` / `Contcs`, "My Groups / TalkGrp 1" | Static labels on a blue gradient; red when emergency | Verified-photo (sample screen); wallpaper and layout Assumed | P1 |
| Status icons (top right of the display) | Net label (TMO / DMO) and TX / RX text instead | Assumed | P1 |
| Two softkeys (dots) | Drawn, not interactive | Verified-photo (placement); function Unknown | P1 |
| MENU key | Switches TMO / DMO. The real key opens menus (none simulated) | Assumed | P1 |
| 4-way navigation | Up/down volume, left/right previous / next group | Assumed | S1 |
| Call key (green), end / power / home key (red) | Call goes to a typed group number; short end clears entry; hold powers off; short press while off powers on | Verified-photo (symbols), Verified-public-doc (end, home, power key named); behaviour Assumed | S1, P1 |
| Keypad 1-9, 0 | Typing a talk group number | Verified-photo (layout, letters); function Assumed. `*` and `#` drawn, not interactive | P1 |
| Antenna with integrated GPS, side accessory connector | Drawn, not interactive | Verified-photo | S1, P1 |
| Link | TMO group N is sent as 511,000,000 + N Hz and DMO group N as 509,000,000 + N Hz through the existing relay | Simulator-specific stop-gap (avoids a relay change; replaces the planned channel-number protocol v2) | none |
| Trunking, registration, TEA encryption, GPS, SDS, private calls, scanning, menus, battery | Not simulated | Unknown / not modelled | S1 (existence only) |
