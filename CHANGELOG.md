# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Fixes

- `Label_22_POS`: decode the position field as DDMMSS (degrees, minutes,
  seconds) instead of dividing it by 10000, which placed aircraft about 18 nm
  off while still reporting a successful partial decode.

## 1.7.0

- Node.js support and CI:
  - Declare runtime support: Node >=18 in `package.json` engines
  - Build target via tsup set to `node18` to ensure compatibility across Node 18/20/22/24
  - CI matrix updated to test Node 18.x, 20.x, 22.x, 24.x, and “latest” for early signal on upcoming changes
  - Development types use latest stable `@types/node` (currently v24) as a devDependency

- Fixes:
  - Add explicit `Buffer` imports from `node:buffer` in `lib/utils/miam.ts` and `lib/plugins/Label_H1_OHMA.ts`
