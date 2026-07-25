import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_20_POS (POS preamble — Position Report).
 *
 * Ported from lib/plugins/Label_20_POS.ts. Behavior:
 *   - Records the 3-char preamble to raw.preamble.
 *   - Splits remainder on ',' and branches on 11-field vs 5-field variants;
 *     both extract position from field[0] via CoordinateUtils.
 *   - Unknown field counts produce decoded=false / decodeLevel='none'.
 */
export function label_20_pos_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  result.raw.preamble = message.text.substring(0, 3);

  const content = message.text.substring(3);
  const fields = content.split(',');

  if (fields.length == 11) {
    plugin.debug(options, 'Variation 1 detected');
    const rawCoords = fields[0];
    ResultFormatter.position(
      result,
      CoordinateUtils.decodeStringCoordinates(rawCoords),
    );

    plugin.setDecodeLevel(result, true, 'full');
  } else if (fields.length == 5) {
    plugin.debug(options, 'Variation 2 detected');
    const position = CoordinateUtils.decodeStringCoordinates(fields[0]);
    if (position) {
      ResultFormatter.position(result, position);
    }
    plugin.setDecodeLevel(result, true, 'full');
  } else {
    plugin.debug(
      options,
      `Unknown variation. Field count: ${fields.length}, content: ${content}`,
    );
    plugin.setDecodeLevel(result, false);
  }
  return result;
}
