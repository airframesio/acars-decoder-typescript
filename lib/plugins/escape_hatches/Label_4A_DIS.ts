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
 * Whole-plugin parse hatch for Label_4A_DIS (DIS preamble — Latest New Format).
 *
 * Ported from lib/plugins/Label_4A_DIS.ts. Behavior:
 *   - Splits on ','.
 *   - Timestamp = fields[1].substring(2) + '00' via convertHHMMSSToTod
 *     (i.e. drops a 2-char prefix from fields[1] and appends '00').
 *   - Callsign = fields[2].
 *   - Text = fields.slice(3).join('') (no separator).
 *   - Always decoded=true; level inferred from remaining.text.
 */
export function label_4a_dis_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.decoded = true;
  const fields = message.text.split(',');
  ResultFormatter.timestamp(
    result,
    DateTimeUtils.convertHHMMSSToTod(fields[1].substring(2) + '00'),
  );
  ResultFormatter.callsign(result, fields[2]);
  ResultFormatter.text(result, fields.slice(3).join(''));

  plugin.setDecodeLevel(result, result.decoded);

  return result;
}
