import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_21_POS (POS preamble — Position Report).
 *
 * Ported from lib/plugins/Label_21_POS.ts. Behavior:
 *   - Records the 3-char preamble to raw.preamble.
 *   - Splits remainder on ','; expects exactly 9 fields.
 *   - processPosition decodes a 16-char "N 39.841W 75.790" layout (NSEW at
 *     offsets 0 and 8) with the original's quirky `&&` guard predicate.
 *   - Emits timestamp (HHMMSS), altitude, whitespace-stripped temperature,
 *     ETA (HHMMSS), arrival airport, and an unknownArr of [f1, f4, f5].
 */
export function label_21_pos_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  result.raw.preamble = message.text.substring(0, 3);

  const content = message.text.substring(3);
  const fields = content.split(',');

  if (fields.length == 9) {
    // POSN 37.550W 76.436,  98,110800,23961,25820,  65,-23,114212,KRDU
    processPosition(result, fields[0].trim());
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[2]),
    );
    ResultFormatter.altitude(result, Number(fields[3]));
    ResultFormatter.temperature(result, fields[6].replace(/ /g, ''));
    ResultFormatter.eta(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[7]),
    );
    ResultFormatter.arrivalAirport(result, fields[8]);

    ResultFormatter.unknownArr(result, [fields[1], fields[4], fields[5]]);

    plugin.setDecodeLevel(result, true, 'partial');
  } else {
    plugin.debug(
      options,
      `Unknown variation. Field count: ${fields.length}, content: ${content}`,
    );
    plugin.setDecodeLevel(result, false);
  }
  return result;
}

function processPosition(decodeResult: DecodeResult, value: string) {
  // N 39.841W 75.790
  if (
    value.length !== 16 &&
    value[0] !== 'N' &&
    value[0] !== 'S' &&
    value[8] !== 'W' &&
    value[8] !== 'E'
  ) {
    return;
  }
  const latDir = value[0] === 'N' ? 1 : -1;
  const lonDir = value[8] === 'E' ? 1 : -1;
  const position = {
    latitude: latDir * Number(value.substring(1, 7)),
    longitude: lonDir * Number(value.substring(9, 15)),
  };

  ResultFormatter.position(decodeResult, position);
}
