import type { DecodeResult } from '@airframes/ads-runtime-ts';

/**
 * Field-level + formatter hatches for Label_4A (top-level Latest New Format).
 *
 * NOTE: Unlike most plugins in this batch, the Label_4A spec at
 * vendor/airframes-decoder/spec/labels/4A.yaml does NOT use a whole-plugin
 * parse-custom hatch. It uses declarative `parse` + `variants` with two
 * field-level custom hatches and a formatter-level custom hatch:
 *
 *   - label_4a_variant_2_decode (field-level)   → (value, args) => unknown
 *   - label_4a_variant_3_position (field-level) → (value, args) => unknown
 *   - label_4a_format (formatter-level)         → (result) => void
 *
 * The generated plugin (lib/plugins/generated/Label_4A.ts) stores the
 * helpers' return values into result.raw.* (timestamp, eta, altitude,
 * tail, callsign, departure_icao, arrival_icao, variant_2_result,
 * position) but does NOT emit any ResultFormatter.* items inline.
 * That means label_4a_format(result) must be the sole producer of
 * formatted.items for every variant — a non-trivial design decision that
 * needs clarification against the hand-written behavior (see
 * lib/plugins/Label_4A.ts and lib/plugins/Label_4A.test.ts for expected
 * items per variant).
 *
 * Stubbing per the task brief ("Bias toward correctness. Stub with throw
 * for anything too complex to do cleanly in this pass.") so we don't ship
 * a guess that drifts from the hand-written plugin's output. The
 * hand-written Label_4A continues to be registered in MessageDecoder
 * until the format/decode hatch contract is finalized.
 */

export function label_4a_variant_2_decode(
  _value: unknown,
  _args: Record<string, unknown>,
): unknown {
  throw new Error(
    'TODO: port from lib/plugins/Label_4A.ts (variant 2 branch). Design ' +
      'question: should the field-level hatch return position+altitude+' +
      'route+temperature+unknownArr as a structured object that ' +
      'label_4a_format consumes, or should it call ResultFormatter ' +
      'directly via a captured result reference? The generated plugin ' +
      'only stores the return into result.raw.variant_2_result.',
  );
}

export function label_4a_variant_3_position(
  _value: unknown,
  _args: Record<string, unknown>,
): unknown {
  throw new Error(
    'TODO: port from lib/plugins/Label_4A.ts (variant 3 branch). The ' +
      'hand-written plugin builds the position from ' +
      '`(fields[4] + fields[5]).replace(/[ \\.]/g, "")` via ' +
      'CoordinateUtils.decodeStringCoordinates. The generated plugin ' +
      'stores the return into result.raw.position.',
  );
}

export function label_4a_format(_result: DecodeResult): void {
  throw new Error(
    'TODO: port from lib/plugins/Label_4A.ts. label_4a_format must emit ' +
      'all formatted.items for every variant because the generated ' +
      'plugin only writes to result.raw.* (no inline ResultFormatter ' +
      'calls). See lib/plugins/Label_4A.test.ts for the expected items ' +
      'per variant.',
  );
}
