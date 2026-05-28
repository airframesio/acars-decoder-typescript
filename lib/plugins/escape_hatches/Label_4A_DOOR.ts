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
 * Whole-plugin parse hatch for Label_4A_DOOR (DOOR preamble — Latest New Format).
 *
 * Ported from lib/plugins/Label_4A_DOOR.ts. Behavior:
 *   - Splits on ' '; expects exactly 3 fields.
 *   - door_event(door_name = fields[0].split('/')[1], state = fields[1]).
 *   - Timestamp = fields[2] + '00' via convertHHMMSSToTod.
 *   - On unexpected field count: decoded=false, emit message.text as unknown.
 */
export function label_4a_door_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.decoded = true;
  const fields = message.text.split(' ');
  if (fields.length === 3) {
    ResultFormatter.door_event(result, fields[0].split('/')[1], fields[1]);
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[2] + '00'),
    );
  } else {
    result.decoded = false;
    ResultFormatter.unknown(result, message.text);
  }
  plugin.setDecodeLevel(result, result.decoded);

  return result;
}
