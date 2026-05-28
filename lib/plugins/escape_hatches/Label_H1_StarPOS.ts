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
 * Whole-plugin parse hatch for Label_H1_StarPOS.
 *
 * The message is a fixed 43-character "*POS" report with packed substring
 * fields: month, day, HHMM time-of-day, deg-min lat/lon, altitude, and
 * trailing unknown bytes. Any deviation from the length or prefix falls
 * back to an unknown report.
 */
export function label_h1_starpos_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const msg = message.text;
  if (msg.length !== 43 || !msg.startsWith('*POS')) {
    if (options.debug) {
      console.log(`Decoder: Unknown H1 message: ${msg}`);
    }
    ResultFormatter.unknown(result, msg);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  ResultFormatter.month(result, Number(msg.substring(4, 6)));
  ResultFormatter.day(result, Number(msg.substring(6, 8)));
  ResultFormatter.timestamp(
    result,
    DateTimeUtils.convertHHMMSSToTod(msg.substring(8, 12)),
  );
  ResultFormatter.position(result, {
    latitude:
      CoordinateUtils.getDirection(msg.substring(12, 13)) *
      (Number(msg.substring(13, 15)) + Number(msg.substring(15, 17)) / 60),
    longitude:
      CoordinateUtils.getDirection(msg.substring(17, 18)) *
      (Number(msg.substring(18, 21)) + Number(msg.substring(21, 23)) / 60),
  });
  ResultFormatter.altitude(result, Number(msg.substring(23, 28)));
  ResultFormatter.unknown(result, msg.substring(28));
  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  return result;
}
