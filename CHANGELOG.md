# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Military (AMC-format) ARINC 702 messages:
  - Parse the 12-character mission number from `/ID` into `raw.mission` (`prefix`, `basic`, `suffix`, `day_of_year`) with a `MSN` formatted item; placeholder values such as `COLLINSAM123` are left unparsed
  - Export `MissionNumberUtils` (parse, format, resolve the operating date from the day of year)
  - Decode `OOI` (OOOI event) and `DIS` reports, and the `/OF`, `/OT`, `/LL` and `/MT` fields
  - Decode the weather text returned to `WXR` requests into `raw.weather_report`
  - Decode wind, Mach and true airspeed at the end of 9-field `/PS` positions

## 1.7.0

- Node.js support and CI:
  - Declare runtime support: Node >=18 in `package.json` engines
  - Build target via tsup set to `node18` to ensure compatibility across Node 18/20/22/24
  - CI matrix updated to test Node 18.x, 20.x, 22.x, 24.x, and “latest” for early signal on upcoming changes
  - Development types use latest stable `@types/node` (currently v24) as a devDependency

- Fixes:
  - Add explicit `Buffer` imports from `node:buffer` in `lib/utils/miam.ts` and `lib/plugins/Label_H1_OHMA.ts`
