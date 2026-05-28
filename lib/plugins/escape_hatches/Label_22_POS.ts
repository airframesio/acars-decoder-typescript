import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_22_POS (N/S preambles — Position Report).
 *
 * Ported from lib/plugins/Label_22_POS.ts. Behavior:
 *   - Splits message.text on ',' and requires exactly 11 fields.
 *   - Position derives from field[0]: 7-char latitude at [1..8], longitude at
 *     [9..end], NSEW signs at offsets 0 and 8, divisor 10000.
 *   - Emits HHMMSS timestamp from field[2], altitude from field[3], then an
 *     unknownArr of [field[1], ...fields.slice(4)].
 */
export function label_22_pos_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const fields = message.text.split(',');

  if (fields.length !== 11) {
    plugin.debug(
      options,
      `Unknown variation. Field count: ${fields.length}, content: ${fields.join(',')}`,
    );
    plugin.setDecodeLevel(result, false);
    return result;
  }

  const latStr = fields[0].substring(1, 8);
  const lonStr = fields[0].substring(9);
  const lat = Number(latStr) / 10000;
  const lon = Number(lonStr) / 10000;
  ResultFormatter.position(result, {
    latitude: CoordinateUtils.getDirection(fields[0][0]) * lat,
    longitude: CoordinateUtils.getDirection(fields[0][8]) * lon,
  });

  ResultFormatter.timestamp(
    result,
    DateTimeUtils.convertHHMMSSToTod(fields[2]),
  );
  ResultFormatter.altitude(result, Number(fields[3]));

  ResultFormatter.unknownArr(result, [fields[1], ...fields.slice(4)]);

  plugin.setDecodeLevel(result, true, 'partial');
  return result;
}
