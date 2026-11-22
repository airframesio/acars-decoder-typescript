# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Fixes

- `Label_22_POS`: decode the position field as DDMMSS (degrees, minutes,
  seconds) instead of dividing it by 10000, which placed aircraft about 18 nm
  off while still reporting a successful partial decode.

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
