# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added

- `Label_49`: flight-phase transition reports. The 4-letter code is two 2-letter
  segment codes; the body carries altitude, indicated airspeed and total air
  temperature. Supports the signed and unsigned body layouts, masked fields, the
  `M##AJL` variant and the OUT/OFF/ON/IN events. Only the documented segment
  codes (TO, IC, CL, ER, DC, AP) are expanded in the formatted state change;
  every other code keeps its raw letters and is reported as `Unknown XX`.
- `Arinc702` performance reports (`/PR`): decode the 12-, 18- and 19-field
  layouts — fuel remaining at report time (`fuel_remaining`, idx3), current
  CG, reserve fuel, cost index, cruise wind, block fuel, taxi fuel, zero fuel
  weight, zero fuel CG, plan or block fuel (idx4), assumed temperature
  (`Pxx`) and probable derate (`Pyy`). The `/PR` wind is reported as
  `cruise_wind_direction` / `cruise_wind_speed` so it no longer overwrites the
  wind at the aircraft.

### Fixed

- `Label_49`: keep the TAT sign when the altitude sign is masked
  (`******297.4- 11.1` now decodes −11.1 instead of +11.1). With the altitude
  sign masked its value stays unknown, and with both signs masked the TAT stays
  unknown instead of being guessed.
- `Label_22_POS`: decode the position field as DDMMSS (degrees, minutes,
  seconds) instead of dividing it by 10000, which placed aircraft about 18 nm
  off while still reporting a successful partial decode.
- `Arinc702` performance reports (`/PR`): fuel remaining (idx3) is published
  once. It is consumed when the POSN body, `/FB` (whatever its IEI order) or
  another element already reports the same figure in pounds, and left in the
  remaining text when the figures differ, so a report no longer carries two
  fuel items with different units.
- `Arinc702` `/FB` fuel on board: a value that is not all digits (for example
  `FB12A4`) is kept in the remaining text instead of being truncated by
  `parseInt` or published as `NaN`.
- `Arinc702` destination reports (`/DT`): the fuel field is the **predicted
  fuel remaining at destination** (ARINC 702A-5 Att. 7 §7, /DT element 3,
  0.1 Klbs per Boeing D922A601), now decoded as `destination_fuel` instead of
  overwriting `fuel_on_board` with the current fuel. The trailing element is
  the report stimulus, no longer exposed as `fuel_remaining`. Together with
  `/PR` idx3 this takes the share of fully decoded `PER/…/PR` messages from
  0 % to ~97 % on the 244 816-message corpus.

- `Arinc702` position reports: the POSN fuel field is decoded only when it is
  all digits (`-1` was published as −100 lb), and is published once when `/FB`
  reports the same figure; a differing figure stays in the remaining text.
- `Label_49`: a body that matches neither layout is no longer reported as a
  partial decode with nothing left over; the message is not decoded.

### Changed

- `/PR` fields 5 and 6 follow the ARINC Characteristic 702A-5 Attachment 7
  default element order: field 5 is now `reserve_fuel` (hundreds of pounds)
  and field 6 is `cost_index`; `taxi_fuel` (hundreds of pounds) moves to field
  15 of the 18-field layout. Field 4 is decoded as `plan_or_block_fuel` (raw
  number, unit per AOC host). Same-flight `REQPER/PQ` requests confirm the
  mapping.
- `Arinc702` position reports: the field after the temperature is decoded as
  wind (`DDDSSS`, leading zeros dropped), the next field as fuel remaining on
  board, and the long variant decodes ground speed, TAS and IAS. Four-digit
  wind values are left unknown because they are ambiguous. The Southwest
  21-field layout keeps its own fuel field. The POSN fuel is the FUEL REMAINING
  element of ARINC 702A-5 Att. 7, sent in 0.1 Klbs; it is now stored in pounds
  like the other fuel fields, so `fuel_remaining` changes from e.g. 191 to
  19100 on a POSN-only report.
- `/PR` reports with 11 fields (a 12-field layout missing its last field) now
  decode the surviving fields instead of leaving them in `remaining`.

## 1.11.0

### Added

- Label C1 "PRELIMINARY/FINAL LOAD INFO" uplinks, reported in the same `raw.loadsheet` shape as IATA loadsheets (based on #416 by @thepacket) (#586).
- Arrival and departure gate decoding: label RA gate uplinks (United, Republic, SkyWest), label B3 PDC departure gates, stands, bays and parking positions, and further airline gate formats in rounds 5 to 7 (#569, #577, #583). Gates are `raw.departure_gate` (formatted code `DGATE`) and `raw.arrival_gate` (`AGATE`). United RA uplinks can also set `gate_status`, `eon_time`, `ramp_frequency`, `ops_frequency`, `ground_power` and `planned_ground_time`, now declared on `RawFields`. The C1 load info also sets `raw.cabin_configuration` and `raw.fuel_on_board` beside `raw.loadsheet`.

### Changed

- Runtime dependency `pako` moved from `^1.0.11` to `^2.2.0` (2.2.0 or any later 2.x); it is the only dependency the package installs. Inflation uses `Z_SYNC_FLUSH`, which pako 2.0 and 2.1 never deliver, hence the 2.2.0 minimum. Babel 8 and typescript-eslint 8.74 are development tools only (#584).
- CI tests on Node 22, 24 and 26. The published package still supports Node 18 and later (#585).

## 1.10.0

### Breaking

- `DecoderPluginInterface.name` is now required, and `MessageDecoder.registerPlugin` throws on a blank or duplicate plugin name. Custom plugins passed to `registerPlugin` must set a unique `name`: subclasses of `DecoderPlugin` no longer inherit the default `'unknown'`. Callers that only use `decode()` with the built-in plugins are not affected (#574, #575).

### Added

- OOOI (OUT/OFF/ON/IN) report decoding for many airline layouts, plus ETA/ETD estimates and scheduled times (#562, #564, #566, #567, #570).
- Loadsheets (IATA AHM 517 FINAL/PRELIM), loadsheet acceptances and loadsheet requests on any label (#563).
- Military AMC message fields: mission number, OOI, DIS, weather, wind and speed (#561).

### Changed

- `decode()` no longer throws when a plugin fails on malformed text; that plugin is treated as not matching and the next one is tried (#565).
- Label 13-18 slash reports validate clock fields; impossible times now go to the unknown text instead of producing a bad time (#562).

### Fixed (output values change)

- Label 4T AGFSR: west and south positions applied the sign to the degrees only (71°43.4' W was 70.277 W, now 71.723 W) (#559).
- Labels 16 and 80: `DDMM.m` positions were divided by 1000 (`N42221` was 42.221°) and are now read as degrees plus decimal minutes (42.368°) (#560).

Stored positions from 1.9.x for these labels will move even though the message text is the same.

## 1.7.0

- Node.js support and CI:
  - Declare runtime support: Node >=18 in `package.json` engines
  - Build target via tsup set to `node18` to ensure compatibility across Node 18/20/22/24
  - CI matrix updated to test Node 18.x, 20.x, 22.x, 24.x, and “latest” for early signal on upcoming changes
  - Development types use latest stable `@types/node` (currently v24) as a devDependency

- Fixes:
  - Add explicit `Buffer` imports from `node:buffer` in `lib/utils/miam.ts` and `lib/plugins/Label_H1_OHMA.ts`
