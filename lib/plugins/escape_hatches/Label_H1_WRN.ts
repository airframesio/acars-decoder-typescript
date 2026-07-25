import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_H1_WRN.
 *
 * Splits on '/WN'. The header before '/WN' becomes a chain of unknown
 * items (skipping fields[0], the msg type). The 20 bytes after '/WN'
 * carry datetime metadata (YYMMDDHHMMSS at offsets 0..12, reshuffled to
 * DDMMYY for convertDateTimeToEpoch) plus a trailing 8-byte unknown
 * block. The remainder of parts[1] is stored as the warning message
 * body and surfaced as a custom 'warning' / 'WRN' formatted item.
 */
export function label_h1_wrn_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split('/WN');

  if (parts.length > 1) {
    const fields = parts[0].split('/');
    ResultFormatter.unknownArr(result, fields.slice(1), '/');

    const data = parts[1].substring(0, 20);
    const msg = parts[1].substring(20);
    const datetime = data.substring(0, 12);
    const date =
      datetime.substring(4, 6) +
      datetime.substring(2, 4) +
      datetime.substring(0, 2);

    ResultFormatter.unknown(result, data.substring(12), '/');
    result.raw.message_timestamp = DateTimeUtils.convertDateTimeToEpoch(
      datetime.substring(6),
      date,
    );
    result.raw.warning_message = msg;
    result.formatted.items.push({
      type: 'warning',
      code: 'WRN',
      label: 'Warning Message',
      value: String(result.raw.warning_message),
    });
    result.decoded = true;
    result.decoder.decodeLevel = 'partial';
  } else {
    if (options.debug) {
      console.log(`[${result.decoder.name}] Unknown message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
  }

  return result;
}
