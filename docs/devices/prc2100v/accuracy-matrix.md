# PRC2100V accuracy matrix

Classes as in `docs/accuracy-matrix.md`. Sources: S1 product page, S2 datasheet rev 191003, P1 user-supplied front-panel photograph (see `device-research.md`).

| Item | Simulated as | Class | Source |
|---|---|---|---|
| Frequency range 30 to 87.975 MHz | Tuning limits | Verified-public-doc | S2 |
| Channel spacing 12.5 / 25 kHz | Tuning step, toggled by the oval key | Verified-public-doc (spacings); key mapping Assumed | S2 |
| 100 memory channels | Channels 1 to 100, edited in place | Verified-public-doc (count); contents (500 kHz apart from 30.000) Assumed | S2 |
| Modes FF FM, FH, digital | Label only, cycled by the square key. No hopping, no crypto | Verified-public-doc (names); behaviour not simulated | S2 |
| TX power 0.5 to 10 W, 3 manpack settings | 0.5 / 5 / 10 W, cycled by the round key | Verified-public-doc (range, count); 5 W Assumed | S2 |
| LCD with battery icon, menus | Simple status display, no menus, no battery icon | Assumed layout; the photo shows only the title, a mode area, the main frequency and bars | P1 |
| PWR, VOLUME, XMODE, RADIO, AMP labels and positions | Drawn as in the photo; only PWR and VOLUME interactive | Verified-photo (existence and placement only) | P1 |
| PWR switch behaviour | On / off toggle | Assumed | P1 |
| Volume scale 0 to 10 | Level for link audio | Assumed | none |
| Four-way pad functions | Up/down channel, left/right tune | Assumed | none |
| Three keys under the LCD | Mode, TX power, spacing | Assumed | none |
| PTT | Simulator button and T key; no PTT is visible on the front panel | Simulator-specific | none |
| XMODE, RADIO, AMP, top connectors | Drawn, not interactive | Verified-photo (placement); function Unknown | P1 |
| Link | Channel frequency in Hz over the network relay; hears PRC-152s on the same frequency | Simulator-specific | none |
| Battery, GPS, BITE, data modes, retransmit | Not simulated | Unknown | S2 (existence only) |
