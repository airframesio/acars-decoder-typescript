# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added

- `Arinc702` performance reports (`/PR`): decode the 12-, 18- and 19-field
  layouts — fuel remaining at report time (`fuel_remaining`, idx3), current
  CG, reserve fuel, cost index, cruise wind, block fuel, taxi fuel, zero fuel
  weight, zero fuel CG, plan or block fuel (idx4), assumed temperature
  (`Pxx`) and probable derate (`Pyy`). The `/PR` wind is reported as
  `cruise_wind_direction` / `cruise_wind_speed` so it no longer overwrites the
  wind at the aircraft.

### Fixed

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
