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
 * Whole-plugin parse hatch for Label_24_Slash ("/" preamble — Position Report).
 *
 * Ported from lib/plugins/Label_24_Slash.ts. Behavior:
 *   - Splits on '/'; requires length 10 with both first and last empty
 *     (message begins and ends with '/').
 *   - Rearranges field[1] DDMMYY -> YYDDMM, appends '00' to field[2] HHMM,
 *     and computes raw.message_timestamp via DateTimeUtils.convertDateTimeToEpoch.
 *   - Char-prefix sign decoding (N/E => +1, S/W => -1) for coords.
 *   - Emits flight number, altitude, position, ETA, and one unknown field.
 *   - Unknown variations log via console.log (preserving original behavior).
 */
export function label_24_slash_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const fields = message.text.split('/');

  if (fields.length == 10 && fields[0] == '' && fields[9] == '') {
    // begin and ends with `/`
    const ddmmyy =
      fields[1].substring(2, 4) +
      fields[1].substring(4, 6) +
      fields[1].substring(0, 2); // YYDDMM
    const hhmmss = fields[2] + '00';
    result.raw.message_timestamp = DateTimeUtils.convertDateTimeToEpoch(
      hhmmss,
      ddmmyy,
    );
    ResultFormatter.flightNumber(result, fields[3]);
    ResultFormatter.altitude(result, Number(fields[4]));
    const lat = fields[5];
    const lon = fields[6];
    const position = {
      latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1)),
      longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1)),
    };
    ResultFormatter.position(result, position);
    ResultFormatter.eta(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[8]),
    );
    ResultFormatter.unknown(result, fields[7]);

    result.decoded = true;
    result.decoder.decodeLevel = 'partial';
  } else {
    // Unknown!
    if (options.debug) {
      console.log(
        `DEBUG: ${plugin.name}: Unknown variation. Field count: ${fields.length}. Message: ${message.text}`,
      );
    }
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
  }
  return result;
}
