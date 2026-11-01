# Motorola MTP850 - device research

Public sources only. This is the **plain MTP850** (2007 datasheet), not the MTP850 Ex (ATEX) variant from the design doc; the Ex is a different product and is not covered here.

## Sources

| ID | Source | Used for |
|---|---|---|
| S1 | Motorola "TETRA MTP850" brochure, AN3-04-007 Rev.3 (the PDF supplied, hosted by a reseller) | Features, specifications, annotated front photograph |
| P1 | Annotated front photograph on page 2 of S1 | Control names and positions, display sample |

No user manual or menu tree was available. Everything about how the keys behave beyond the labels in S1 is Assumed.

## Documented specifications (S1)

| Item | Value |
|---|---|
| Type | TETRA portable (handheld), "cellular-style" interface |
| Bands | 380-430, 350-390, 806-870 MHz; 25 kHz channel bandwidth |
| RF power | 1 W |
| Display | 130 x 130 pixel colour display, 65,536 colours; flip display and large text options |
| Talk groups | 2048 TMO, 1024 DMO; scan lists: 40 lists of 20 groups; address book 1000; text messages 20; status list 100 |
| Services | Group call TMO/DMO, private call, emergency call TMO/DMO, "hot mic" emergency, SDS, status messages, GPS location, scanning, DGNA, late entry |
| Security | Air interface encryption TEA1 / TEA3, authentication, end-to-end encryption module, PIN/PUK |
| Safety | Dedicated emergency button, red display colour in emergency mode, keypad lock, talk group lock, transmit inhibit |
| UI | 2 context-sensitive softkeys, 2 programmable function buttons, 4-way navigation, top multi-function rotary knob (talk group selector and volume control), keypad |
| Size, weight | 125 x 50 x 33.5 mm (standard battery); 189 g radio only, 230 g with 950 mAh Li-Ion |
| Environment | IP54, MIL-STD 810, -25 to +60 C |
| Battery | 950 mAh or 1850 mAh Li-Ion |

## Front view as annotated in S1 (P1)

| Element | Where | Documented function |
|---|---|---|
| Multi-function rotary knob | Top edge, left of centre | Talk group selector and volume control (S1) |
| Dedicated emergency button | Top edge, orange | Emergency (S1) |
| Antenna with integrated GPS | Top edge, right | TETRA and GPS (S1) |
| Speaker grille | Above the logo | Main loudspeaker (front mounted, S1) |
| Colour display | Centre | Sample screen: "My Groups / TalkGrp 1", softkey labels `Optns` and `Contcs`, small status icons top right |
| Two softkeys | Dots left and right of MENU | Context-sensitive (labels on the display) |
| MENU key | Centre, below the display | Menu (label printed) |
| 4-way navigation button | Centre, oval | Menu navigation (S1) |
| Call key | Left of navigation, green handset | Call (symbol only) |
| Power on/off, End and Home key | Right of navigation, red | Named in S1 |
| Keypad | 1-9, `*`, 0, `#` with letters; 0 also marked `+ next`; `#` has a shift symbol | Numeric entry, text entry |
| Programmable side buttons | Left edge, two | Function Unknown (programmable) |
| Push-to-talk button | Left edge, large, between the side buttons | PTT (S1, "large push to talk button") |
| Audio accessory side connector | Right edge | Accessories |
| Microphones, bottom speaker | Bottom area | Not interactive |

Back, top and bottom views and the Ex variant were not available.

## Consequences for the simulator

- Front panel plus the controls visible from the front (knob and emergency button on the top edge, PTT on the left edge) are drawn as in P1.
- Documented behaviours simulated: TMO and DMO talk groups (2048 / 1024), group selection by the rotary knob, red emergency display, softkey labels, PTT.
- Assumed (labelled in the UI): navigation and MENU key functions, digit entry plus call key to jump to a group number, the end key clearing entry, long-press power off, volume scale.
- Not simulated: trunking, registration, TEA encryption, GPS, SDS, private calls, menus. A real TETRA network is not modelled; the link only matches talk group numbers across simulator instances.
- Link channel (stop-gap, see accuracy matrix): the existing relay accepts 30 to 512 MHz, so a TMO group N is sent as 511,000,000 + N Hz and a DMO group N as 509,000,000 + N Hz. This avoids a relay protocol change. The planned "channel number" protocol v2 in `docs/multi-device-design.md` would replace it.
