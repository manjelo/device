# Harris Falcon III AN/PRC-152 (original) - Device Research Notes

Scope: the original Harris Falcon III AN/PRC-152. The AN/PRC-152A is a different variant. Where a source covers only the 152A, this is stated explicitly.
Research date: 2026-10-25. All sources were read as untrusted text. No downloads were executed.

Status legend (used here and in accuracy-matrix.md): Verified-public-doc, Verified-photo, Secondary-source, Assumed, Unknown.

## Source inventory

| ID | Source | Model covered | Access |
|---|---|---|---|
| S1 | EDN, "Harris Corporation announces AN/PRC-152 handheld radio - first radio implementing SCA certified by the NSA", dated 2005-08-24 (https://www.edn.com/harris-corporation-announces-an-prc-152-handheld-radio-first-radio-implementing-sca-certified-by-the-nsa/, retrieved 2026-10-25) | Original AN/PRC-152 (2005 launch) | Read |
| S2 | L3Harris Falcon III AN/PRC-152A datasheet, Type 1 Wideband Networking Handheld Radio (mirror: https://www.zsis.hr/UserDocsImages/Sigurnost/pdfs/AN_PRC-152A.pdf; original L3Harris URL https://www.l3harris.com/sites/default/files/2020-07/cs_tc_datasheet_falcon-iii-an-prc-152a-wideband-networking-handheld-radio.pdf, not reachable, see Inaccessible) | AN/PRC-152A only | Read via mirror. Second pass: full text extracted (pdftotext) from a saved copy; the document is DS475L, dated 07/2019 (not 2020). 152A only. |
| S3 | Wikipedia, "AN/PRC-152" (https://en.wikipedia.org/wiki/AN/PRC-152, retrieved 2026-10-25) | Mixed; body attributes specs to the 152A datasheet (S2 citation) | Read |
| S4 | Crypto Museum, "AN/PRC-152" stub, last changed 2024-05-10 (https://cryptomuseum.com/radio/prc152, retrieved 2026-10-25) | Names AN/PRC-152 and AN/PRC-152A, RT-1916x(P)(C)/U; states 10 Hz step, 250 mW to 5 W, 30-512 MHz, 234 x 64 x 43 mm, U-229 top connector; last changed 2024-05-10. Second pass: fetched and re-read, same values. | Read |
| S5 | RigReference, "Harris AN/PRC-152" (https://rigreference.com/rigs/6048-harris-anprc-152, retrieved 2026-10-25) | Unspecified variant | Read |
| S6 | L3Harris Falcon III AN/PRC-152A sell sheet, 2026 (https://www.l3harris.com/sites/default/files/2026-08/l3harris-an-prc-152a-wideband-networking-handheld-radio-sell-sheet-csd.pdf) | AN/PRC-152A only | Search snippet only; not fetched |
| S7 | Original AN/PRC-152 datasheet, https://tcpremier.l3harris.com/pdf/datasheets/AN-PRC-152.pdf | Original | NOT reachable (DNS failure). Known only from search-result snippets: "full numeric keypad", "NVG compatible display", "99 presets", "100 Hz front panel tuning". Treat as unverified. |
| S8 | Arma Reforger RHS Status Quo wiki, AN/PRC-152 (https://docs.rhsmods.org/rhs-status-quo-user-documentation/arma-reforger/rhs-status-quo/blufor/gadgets/an-prc-152) | Video-game mod, not real hardware | Read. Used ONLY to show what is NOT to be copied. See section 8. |
| S9 | Electronic Design, L. Frenzel, "NSA Certifies Software-Defined Military Radio", 2005-10-13 (https://www.electronicdesign.com/technologies/communications/article/21775497/nsa-certifies-software-defined-military-radio) | Original (2005 trade press) | Read. 30-512 MHz, 10 Hz tuning resolution, 250 mW to 5 W. Secondary-source. |
| S10 | Wikimedia Commons, File:Harris_PRC-152_multiband_radio.agr.jpg (https://commons.wikimedia.org/wiki/File:Harris_PRC-152_multiband_radio.agr.jpg) | Unspecified (caption "Voice encryptor"; museum caption and file name are the only identity basis) | Inspected 2026-10-25 (third pass). 3024 x 4032 px, angled handheld. Verified-photo for layout only. |
| S11 | Wikimedia Commons, File:AN_PRC-152.jpg (https://commons.wikimedia.org/wiki/File:AN_PRC-152.jpg) | Unspecified (USMC, public domain) | Inspected 2026-10-25 (third pass). 253 x 485 px, low resolution. Verified-photo for low-resolution layout only. |
| S12 | Military Aerospace, 2005-08-25, NSA certification article (https://www.militaryaerospace.com/rf-analog/article/16712545/harris-wins-nsa-certification-for-anprc152-softwaredefined-handheld-radio) | Original (2005) | Read. GPS option and vehicular adapter. Secondary-source. |
| S13 | Radionerds wiki, AN/PRC-152 (https://www.radionerds.com/index.php/AN/PRC-152) | Unspecified | Read; no specs. |
| S14 | greenradio.de, "e PRC152" (https://www.greenradio.de/htm2/e_prc152.htm) | Different (TRI-built) PRC-152 | Read. Excluded, not Harris. |
| S15 | Moody AFB photo pages 2000363217 and 2000248776 (https://www.moody.af.mil/News/Photos/igphoto/2000363217/) | Unspecified | HTTP 403. Search snippet only. |
| S16 | Air Combat Command photo 2002477295 (https://www.acc.af.mil/News/Photos/igphoto/2002477295/) | Unspecified | HTTP 403. Snippet only. |
| S17 | marines.mil photo 2001542001 (https://www.marines.mil/Photos/igphoto/2001542001) | Unspecified | HTTP 403. Snippet only. |
| S18 | NATO NIAPC product page, AN-PRC-152A_1061 (https://www.ia.nato.int/niapc/Product/AN-PRC-152A_1061) | 152A | HTTP 403. |
| S19 | lrseries.com, TRI AN/PRC152 manual listing (https://www.lrseries.com/TM115820150013TRI-TECHNICAL-MANUAL-TRI-ANPRC152-NEW-REPLACEMENT) | TRI-built variant | Vendor listing. Not used. |
| S20 | Polish military unit museum page, https://www.szpzl-zegrze.waw.pl/wps/anprc_152/anprc_152.html (read 2026-10-25, Polish text) | Original family, not stated as model-specific | Read (third pass). Secondary-source (unit museum page). |
| S21 | Army Radio Operator Handbook, studylib document 10744589 | Army handbook (PRC-152 coverage per request) | BLOCKED: HTTP 429 to fetch tool, HTTP 403 to curl (2026-10-25). Not read. |
| S22 | Falcon III student guide, studylib document 26288460 | Falcon III training guide | BLOCKED: HTTP 429 to fetch tool, HTTP 403 to curl (2026-10-25). Not read. |
| S23 | Reserved | - | No source assigned in the third-pass request. |
| S24 | Reserved | - | No source assigned in the third-pass request. |

## 1. Physical layout and controls

### 1.1 Confirmed for the original model
- The original AN/PRC-152 is a handheld radio made by Harris Corporation, with the designation AN/PRC-152 assigned to the NSA-certified Falcon III handheld (S1, 2005-08-24). Verified-public-doc.
- Optional embedded GPS is available as an option (S1). Verified-public-doc.
- A vehicular adapter option fits the radio to the US-standard combat net radio mount (S1). Verified-public-doc.
- Physical dimensions, weight, and battery are reported by secondary sources only (see section 1.3).

### 1.2 Front-panel and top layout (photo of the 152A variant only)
- WITHDRAWN (second pass, third-pass review): the earlier front layout taken from the AN/PRC-152A datasheet image (S2) is no longer used for the original. That image showed a 4 x 4 keypad, two top-corner bosses, and a "FALCON III" badge; none of these is supported for the original by an accessible source. The 4 x 4 grid and FN1-FN4 keys are Unknown.
- Third-pass photo findings (S10, S11, both inspected 2026-10-25; Verified-photo for the features listed, model identity Secondary-source):
  - Top: black whip antenna at top centre-rear (S10) or top-left to centre (S11); a rotary function dial with white labels SCAN, 1 to 5, S, F, Z, R (S10); two round metal-ringed connectors with black dust caps, one either side of the dial (S10); a black lanyard lug on the top front (S10).
  - Front, upper: HARRIS logo and MULTI-BAND text on the upper left (S10); perforated speaker grille on the upper front (S10, S11).
  - Front, middle: small, wide, green LCD below the grille (S11, low resolution).
  - Front, lower: keypad of about 4 rows by 3 columns of grey keys (S11), raised keys on the lower front (S10). Key labels are not legible.
  - Right side: black recessed rectangular panel with holes (S10). Function Unknown.
  - Lower right: black rotating latch (S10). Function Unknown.
  - Bottom: larger battery block (S11).
- Not established by any photo or text source: PTT location, squelch and volume controls, cipher switch, microphone location, and the function of the right-side panel. All Unknown. The previous "left side PTT" placement was an Assumed architecture choice and is withdrawn.

### 1.3 Connectors and antenna (secondary, original family)
- A U-229 receptacle at the top carries audio, data, and fill connections (S4). Pin assignments listed by S4 include ground, speaker, PTT, microphone, receive, transmit, clock, and fill acknowledgment. Secondary-source; pin-level detail not verified against Harris documentation.
- Conflict (third pass): S4 describes one U-229 top receptacle, but the S10 photo shows two round metal-ringed connectors on the top, either side of the function dial. Which one is the U-229 is Unknown. The photo confirms existence and position only.
- Right-side recessed panel with holes (S10): existence and position Verified-photo; its function is Unknown and it is not identified as a connector.
- Antenna connector: TNC, 50 ohm (S5). Secondary-source.
- Other interfaces named by S4: RS-232, USB, ADF, Ethernet. Secondary-source.
- Remote control options for the 152A (USB, RS-232, Remote Keypad Display Unit, Software Keypad Display Unit) come from S6 and S2. These are 152A-only claims. Not applied to original.

### 1.4 Knobs and switches
- The 152A sell sheet describes a function knob with positions Off, 1-5 presets, scan, front panel, Z-All, PT, LD and CT (S6, snippet only). 152A-only. The original model's knob or switch positions: Unknown.
- The game mod S8 describes a "power and channel knob" with a menu on the keypad and [G]+[R] power toggling. This is a video-game implementation and is NOT used as a source for the real radio. Unknown for the real radio.
- Third pass: the original has a rotary function dial on the top (S10, Verified-photo for existence and placement). Legible printed labels: SCAN, numerals 1 to 5, letters S, F, Z, R, with a position dot. The meaning of each label is Unknown. The 152A knob list in S2 (Off, 1-5 presets, scan, front panel, Z-All, PT, LD, CT) does not match these labels and is not applied to the original.
- Third pass: a cipher switch is not visible in S10 or S11 and no source names one. Unknown.

### 1.5 Dimensions and weight (secondary, conflicting)
- S4: 234 x 64 x 43 mm with battery; weight 1220 g with battery and GPS.
- S3: 234 mm high, 64 mm wide (68.6 mm with GPS), 43 mm deep, with battery; weight 1.22 kg with battery and GPS. Also cites the 152A datasheet.
- S5: 74 x 244 x 64 mm with battery and GPS; weight 1.18 kg with batteries. S5 also swaps the length order in its intro text.
- Conclusion: height and depth agree across S3 and S4; width and weight differ slightly. Secondary-source with conflicts. Use 234 x 64 x 43 mm and about 1.2 kg only as approximate values, labelled Assumed in the simulator until a Harris original datasheet is obtained.

## 2. Display

- S3 and S7 (snippet) say the radio has an NVG-compatible display. S3 cites the 152A datasheet for this. Secondary-source for the original.
- Third pass: S11 (low-resolution photo) shows a small, wide, green LCD below the speaker grille. Verified-photo for proportions and placement only.
- Display size, resolution, technology, backlight behaviour, icons, and layout for the original model: Unknown.
- The game mod S8 gives an icon and text layout ("R/T", battery icon, L/M/H power mode, preset number and frequency, transmission bar). This is a video-game layout and is NOT used as source. Unknown for the real device.

## 3. Menus and modes

- No accessible source documents a menu tree, menu item names, button sequences, or mode-switch procedure for the original AN/PRC-152. Unknown.
- The operator manual (TM 11-5820 series or equivalent) was searched for and not found in accessible sources. Unknown.
- The Marine Corps training file FMST 306 (https://www.trngcmd.marines.mil/Portals/207/Docs/FMTBE/Student%20Materials/FMST/Block3/FMST%20306.pdf) returned HTTP 403. Not read.
- S8 (game mod) lists menu positions (BEEP, POWER, LED, SCND TRANS, ENC KEY, CUST KEY, FREQ RES, PRE FREQ, NEW PRE) and key combinations. These are game-mod features and are NOT evidence of real firmware. Excluded from the accuracy matrix as claims. Unknown for the real device.
- Modes publicly named for the original family (S3, S4): SINCGARS, VHF/UHF AM/FM, ANDVT, HAVEQUICK I/II, HPW, SATCOM, OTAR, optional P25. Secondary-source. Whether each is a selectable mode on the front panel is Unknown.
- Third pass (S20): beacon mode with a 300-3300 Hz audio tone, user-changeable frequency, power, and interval. Secondary-source (single unit museum page). The front-panel path to set beacon parameters is Unknown.

## 4. Frequency, waveform, and presets

- Frequency range: 30 to 512 MHz (S4, S5, S9; S3 body text "30 to 511.99 MHz"; S7 snippet). Secondary-source.
- Third pass (S20): 30.0000 to 511.9999 MHz continuous. Upper limit conflict: 512.000 (S4, S5, S9) vs 511.9999 (S20) vs 511.99 (S3). Recommended band limit for the simulator: 30.0000 to 511.9999 MHz, flagged as Secondary-source.
- Third pass (S20) VULOS sub-bands: long UHF 30-89.9999 MHz; short UHF 90-224.9999 MHz; VHF 225-511.9999 MHz. Optional HAVEQUICK AM 225.000 to 399.975 MHz. SATCOM channels in 25 kHz and 5 kHz steps. Optional HPW with KG-84C. All Secondary-source.
- Optional high band 762-870 MHz (S5 "optional"; S3 infobox). The 152A datasheet (S2) describes this as part of a highband enhancement that extends coverage to 520 MHz and adds 762-870 MHz. The original model's standard or optional status: Unknown.
- Frequency step: PARTLY RESOLVED in the second pass (see addendum, section A3). Original-model sources give 10 Hz (S9, S4, and the 10 Hz entry that S3 cites from the older datasheet): Secondary-source. The 100 Hz front-panel and 1 Hz ASCII-remote values are in the 152A datasheet DS475L (S2), so they apply to the 152A only: Verified-public-doc for the 152A.
- Presets: 99 system presets (S4; S7 snippet). Secondary-source.
- Presets per knob position, preset naming, and the 5-preset default described by S8 are game-mod claims. Unknown for the real device.
- Waveforms: SINCGARS; VHF/UHF AM/FM (VULOS); ANDVT MIL-STD-188-181B with 56 kbit/s data; HAVEQUICK I/II; HPW; SATCOM; OTAR; optional P25 with 3-DES (S3, S4). Secondary-source.
- Frequency stability 2.5 ppm (S5). Secondary-source.
- Anti-jamming: HAVEQUICK frequency hopping (S4). Secondary-source.
- Voice codecs: CVSD wideband 16 kb/s, LPC-10e narrowband 2400 baud, MELP (S4). Secondary-source.
- Modulation list: FM, AM, PSK, FSK, ASK, CPM, GMSK (S4); FSK, PSK31/63 (S5). Secondary-source.

## 5. Power, battery, and RF output

- RF output 250 mW to 5 W (S3, S4, S5). Secondary-source.
- 10 W SATCOM burst (S2 for 152A; S3 "VSAT figure of 10 W"; S5 "10 W SATCOM burst"). Secondary-source for original.
- Power level names and settings for the original (LOW, MEDIUM, HIGH and their wattages): Unknown. The game mod S8 lists LOW/MEDIUM/HIGH with 0.5, 2, and 5 W and approximate ranges; these are not verified.
- Battery: S5 states a Li-ion battery. Secondary-source. Capacity, chemistry details, battery life, and charger: Unknown.
- Receiver sensitivity -116 dBm (S4) and SSB -113 dBm for 10 dB SINAD (S5). Secondary-source.

## 6. Encryption and security

- The AN/PRC-152 was the first radio certified by NSA for the JTRS SCA operating environment to protect voice and data up to TOP SECRET, and the first system certified using Harris's Sierra II software-programmable encryption module (S1, 2005). Verified-public-doc.
- Sierra II is described as a small, reprogrammable, low-power, low-cost cryptographic device (S1). Verified-public-doc.
- Encryption list in S4: NSA Type 1, SIERRA II, SAVILLE, AES, DES. Secondary-source.
- Export version RF-310M-HH lacks NSA Type 1 and uses Citadel II (S3, S4). Secondary-source.
- Key-entry and key-storage UI on the original: Unknown.
- Optional 3-DES on P25 (S3, S4). Secondary-source.

## 7. Environment, mechanical, and accessories

- Operating temperature -31 C to +60 C and 2 m immersion rating (S4). Secondary-source.
- GPS option and vehicular adapter option (S1). Verified-public-doc.
- Accessories listed in the accessible sources: none specific to the original beyond the above. Battery pouch and third-party accessories are not treated as device behaviour. Unknown for the official accessory list.
- Remote control and data-cable options: 152A-only claims (S2, S6). Unknown for original.

## 8. Sources not used as evidence

- S8 (Arma Reforger RHS Status Quo wiki) is a video-game mod. Its controls, key combinations, menu tree, LCD layout, and power-level values are not evidence of real device behaviour. They must not be used to set real button sequences in the simulator. The only real-world claims in S8 (Harris manufacturer, JTRS SCA compliance, NSA TS certification) are already supported by S1.
- Search-result snippets from unrelated or spam sites (internal-mongodb.champds.com, manualguide.onrender.com, usermanual123.onrender.com, eadsec.universidadebrasil.edu.br) were not used.
- S2 and S6 are 152A-only. Their numbers are not applied to the original without a note.

## 9. Inaccessible sources

- https://tcpremier.l3harris.com/pdf/datasheets/AN-PRC-152.pdf: DNS resolution failed (getaddrinfo EAI_AGAIN). This is the only known original-model datasheet and is the highest-priority blocker.
- https://www.l3harris.com/... (all URLs): DNS resolution failed in this environment.
- https://web.archive.org/...: fetch refused by the tool.
- https://www.trngcmd.marines.mil/...FMST%20306.pdf: HTTP 403.
- https://www.businesswire.com/...20121022005937...: HTTP 403.
- https://internal-mongodb.champds.com/archive-ga-23-05/an-prc-152-manual.pdf: not fetched (judged untrustworthy from its search title and host).

## 10. Open questions (blocking for accurate simulation)

1. Original AN/PRC-152 operator or technical manual, including the front-panel control map and menu tree. Blocking.
2. Original AN/PRC-152 datasheet (S7) for keypad, display, and dimensions. Blocking.
3. Exact front-panel control positions and labels for the original model. Third pass narrowed this: keypad grid (about 4 x 3) and top dial labels are Verified-photo; key labels (including the removed FN1-FN4), dial meanings, PTT, squelch and volume, cipher switch, and the right-side panel function remain Unknown. Blocking.
4. LCD size, resolution, and icon/layout for the original. Blocking.
5. Frequency tuning step: 10 Hz vs 100 Hz. Blocking for the frequency entry UI. Partly resolved (10 Hz for the original, Secondary-source; 100 Hz is 152A-only). Needs the original Harris datasheet to verify.
6. Power level names and wattages for the original. Needed for the power menu.
7. Whether the highband (762-870 MHz) is standard or optional on the original. Needed for the band list.
8. Whether SATCOM, HAVEQUICK, and waveforms are selectable from the front panel or only configured by programming. Needed for mode selection.
9. Official accessory list for the original.
10. Battery capacity and life. Needed only for the battery indicator behaviour.

## Second pass (2026-10-25)

Scope: find public references for the original AN/PRC-152 (not 152A) and resolve the open conflicts. Full list with access results: docs/references.md. Accuracy statuses: docs/accuracy-matrix.md.

### A1. New sources
- S9: Electronic Design, Louis E. Frenzel, "NSA Certifies Software-Defined Military Radio", published 2005-10-13 (https://www.electronicdesign.com/technologies/communications/article/21775497/nsa-certifies-software-defined-military-radio, read 2026-10-25). Quoted: "Also known as the AN/PRC-152, the Falcon III operates in the military bands from 30 to 512 MHz with 10-Hz tuning resolution"; "The output power is variable from 250 mW to 5 W." Secondary-source (trade press, contemporaneous with the original).
- S12: Military Aerospace, 2005-08-25, "Harris wins NSA certification for AN/PRC-152 software-defined handheld radio" (https://www.militaryaerospace.com/rf-analog/article/16712545/harris-wins-nsa-certification-for-anprc152-softwaredefined-handheld-radio, read 2026-10-25). Quoted: "An embedded global positioning system (GPS) is an option on the radio." and the vehicular adapter sentence. Corroborates S1. Secondary-source.
- S10: Wikimedia Commons, File:Harris_PRC-152_multiband_radio.agr.jpg (https://commons.wikimedia.org/wiki/File:Harris_PRC-152_multiband_radio.agr.jpg, read 2026-10-25). Caption: "Voice encryptor"; National Cryptologic Museum; author ArnoldReinhold; 2019-09-06; CC BY-SA 4.0. The image was NOT inspected (metadata only, no download). Model (original or 152A) not stated.
- S11: Wikimedia Commons, File:AN_PRC-152.jpg (https://commons.wikimedia.org/wiki/File:AN_PRC-152.jpg, read 2026-10-25). Caption "AN/PRC-152 handheld radio"; US Marine Corps; 2015-09-20; public domain (US government work); 253 x 485 px. Source cited: USMC student handout B191716. Image not inspected. Model not stated.
- S13: Radionerds wiki page for AN/PRC-152 (https://www.radionerds.com/index.php/AN/PRC-152, read 2026-10-25). No specifications, controls or LCD text in the fetched content. It names an image file AN-PRC-152.png. Not used as evidence.
- S14: greenradio.de page on "e PRC152" (https://www.greenradio.de/htm2/e_prc152.htm, read 2026-10-25). This is a DIFFERENT PRC-152 product (Tri-built replica bands, 100 channels, 5 and 6.25 kHz steps, 100 mW to 5 W, 214 x 67 x 39 mm). Not Harris. Excluded from all Harris values. Records that non-Harris "TRI" AN/PRC-152 variants exist, so specification searches must check the manufacturer.

### A2. Correction to existing sources
- S2 (152A datasheet): full text read this pass. Document is DS475L, 07/2019. It gives front panel tuning 100 Hz, ASCII remote 1 Hz, highband tuning 5 kHz, a 1 x 10^-6 frequency stability (drift +/-0.5 ppm per year), receiver LOS FM -116 dBm @ 12 dB SINAD, and dimensions 9.6 H x 3.0 W x 1.9 D in (24.5 x 7.6 x 4.8 cm) non-GPS and 10.25 x 3.0 x 2.5 in (26.5 x 7.6 x 6.4 cm) with GPS. Weight is 1.1 kg (non-GPS) and 1.2 kg (GPS) with battery and antenna. Function knob: Off, 1-5 presets, scan, front panel, Z-All, PT, LD, CT. Encryption modes are listed. Highband is described as a standard enhancement for the 152A. Every value is Verified-public-doc for the 152A only.
- S4 (Crypto Museum): re-read. It is a stub. It gives 10 Hz step, 250 mW to 5 W, 30-512 MHz, a U-229 connector at the top, and 234 x 64 x 43 mm with battery. It does not describe controls, keypad, or display. It lists AN/PRC-152 and AN/PRC-152A.
- Section 1.5 (dimensions): the 152A datasheet (S2) gives a different size and weight from S3 and S4: 244 x 76 x 48 mm non-GPS, 265 x 76 x 64 mm with GPS. S5's "74 x 244 x 64 mm" matches the 152A height. Conflict now recorded in accuracy-matrix. Treat 234 x 64 x 43 mm as Secondary-source for the original only.
- Section 2 (display): S2 has no display description. The NVG claim remains Secondary-source (S3, S7 snippet).
- Section 1.2 (front layout): the earlier "visible from the image" description was of the 152A datasheet page image. It is still Assumed for the original.

### A3. Frequency step conflict (10 Hz vs 100 Hz): partly resolved
- Original-model sources: 10 Hz (S9, S4). S3 also has a "Tuning Resolution: 10 Hz" entry that cites the older datasheet (Secondary-source).
- 152A-only source: 100 Hz front panel and 1 Hz ASCII remote (S2, DS475L 2019).
- Interpretation: the values most likely differ by model, so 10 Hz for the original is the best-supported value. This is still Secondary-source because the original Harris datasheet (S7) and manual are not accessible. Keep FREQ_STEP_HZ = 10 with a note. Do not present it as verified.

### A4. Highband and power levels
- Original frequency range in 2005 trade press (S9): 30-512 MHz only. No highband is mentioned. Highband for the original stays Unknown. The 762-870 MHz band is documented for the 152A (S2, "standard highband enhancement") and appears in the undated Wikipedia infobox (S3). Keep FEATURE_HIGHBAND = false.
- Output power for the original: 250 mW to 5 W (S9, S4, S3): Secondary-source. 10 W SATCOM burst is documented for the 152A (S2) and in the S3 "VSAT 10 W" line. Original SATCOM power remains Secondary-source.
- Power level names (LOW, MEDIUM, HIGH) and their wattages: no source found for the original. Unknown. The 152A datasheet gives only the programmable range (250 mW to 5 W).

### A5. Photographs and controls
- Reference photographs of the original: two Commons images (S10, S11) with captions only. No photo was inspected in this pass. Verified-photo count stays at 0.
- Control positions, keypad geometry, speaker and microphone placement, PTT position, and LCD size: no public source found for the original. The 152A function knob and feature list are the only control data (S2), and they are 152A-only.
- Military photo pages (S15, S16, S17) returned HTTP 403, so their captions were not read. Their search snippets describe a 2006 Air Force PRC-152 photo (S15) that is not verified.

### A6. Manuals
- No official TM 11-5820 operator or technical manual for the AN/PRC-152 was found in a fetchable source. The only PRC-152 manual hit is a commercial vendor reprint of a TRI-built radio manual (S19). It was not used.
- The DLA ASSIST and DTIC databases were not reachable through search results. Not fetched.
- Unknown: operator manual, menu tree, button sequences, LCD layout, PTT location, and speaker placement remain Unknown.

### A7. Access changes this pass
- Still DNS failures: https://tcpremier.l3harris.com/pdf/datasheets/AN-PRC-152.pdf (S7); https://www.l3harris.com/... (S2 original mirror, S6 resource page). The search index returns these URLs, but this environment cannot resolve them.
- HTTP 403: Moody AFB, ACC, marines.mil photo pages (S15, S16, S17); NATO NIAPC AN-PRC-152A page (S18); FMST 306 (already known).
- Read OK: S2 (zsis mirror), S4, S3, S9, S10, S11, S12, S13, S14.

## Third pass (2026-10-25)

Scope: re-evaluate the front-panel and top-panel controls against the photos and the new sources. Original AN/PRC-152 only. No application code was written. No downloads were executed.

### T1. Source access this pass
- S7 (Harris original datasheet, tcpremier.l3harris.com/pdf/datasheets/AN-PRC-152.pdf): BLOCKED. DNS failure. Still the highest-priority blocker. Prior claims that rely on S7 stay at Secondary-source.
- S21 (Army Radio Operator Handbook, studylib 10744589): BLOCKED. HTTP 429 to the fetch tool; HTTP 403 to curl.
- S22 (Falcon III student guide, studylib 26288460): BLOCKED. HTTP 429 to the fetch tool; HTTP 403 to curl.
- S20 (Polish unit museum page): read. Secondary-source.
- S10 and S11 (Commons photos): inspected. Verified-photo for layout features only. Model identity is Secondary-source.
- S23 and S24: reserved, no source assigned.

### T2. Re-evaluation of the ten control items
Status is set per row in docs/accuracy-matrix.md. Summary:

1. Front keypad layout and labels: grid of about 4 rows by 3 columns is Verified-photo (S11). Labels Unknown. The prior 4 x 4 grid and FN1-FN4 keys are NOT supported by any accessible source. FN1-FN4 are recorded as Unknown and should be removed from the simulator.
2. Speaker grille: Verified-photo (S10, S11). Upper front. The prior "upper left" placement is not used.
3. LCD proportions and placement: Verified-photo (S11, low resolution). Wide, short, below the grille. Size, resolution, icons: Unknown.
4. PTT location: Unknown. The prior left-side placement is withdrawn.
5. Squelch and volume: Unknown.
6. Function selector: rotary dial on top is Verified-photo (S10) for existence and placement. Legible labels SCAN, 1 to 5, S, F, Z, R are Verified-photo as printed. Their meanings are Unknown.
7. Cipher switch: Unknown.
8. Antenna connector: top centre-rear position is Verified-photo (S10, S11). TNC 50 ohm type is Secondary-source (S5).
9. Side connector: right-side recessed panel is Verified-photo for existence and position (S10). Function Unknown.
10. Battery compartment: bottom block is Verified-photo for position (S11). Capacity Unknown. Li-ion type is Secondary-source (S5).

### T3. Counts
Accuracy matrix (66 rows): Verified-public-doc 9 (6 original, 3 152A only), Verified-photo 9, Secondary-source 30, Assumed 0, Unknown 18.

Assumed count went from 1 to 0. The 152A-derived front layout row was withdrawn, not re-labelled.

### T4. Blocking unknowns after this pass
1. Dial position meanings (S/F/Z/R, numerals) and whether the dial is the mode or channel selector.
2. Key labels for the keypad, including whether any function keys exist.
3. PTT, squelch, and volume controls: existence and location.
4. Original datasheet S7 and the operator manual (S21, S22 blocked): needed to confirm all photo-based layout and the menu tree.
5. Upper frequency limit: 511.9999 MHz (S20) vs 512.000 MHz (S4, S5, S9).
6. Which top connector is the U-229 (S4 describes one, S10 shows two).
7. Right-side panel function.
