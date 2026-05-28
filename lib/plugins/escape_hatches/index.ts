// Per-plugin escape-hatch functions referenced from generated plugins
// (via `import * as hatches from '../escape_hatches'`). As Stage 2.5
// progresses, escape hatches for each plugin are added here as named
// exports.
//
// See docs/ESCAPE_HATCHES.md in airframes-decoder for the contract:
//   parse-level:    (plugin, message, result, options) => DecodeResult
//   field-level:    (value, args) => unknown
//   formatter-level:(result) => void
//
// Empty for now — the pilot swap (Label_10_POS) doesn't reference any
// hatches; future plugins will populate this module.
export {};
