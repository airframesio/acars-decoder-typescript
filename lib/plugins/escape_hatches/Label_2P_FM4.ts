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
 * Whole-plugin parse hatch for Label_2P_FM4 (Flight Report — FM4 variant).
 *
 * Ported from lib/plugins/Label_2P_FM4.ts. Behavior:
 *   - Splits on ',' and requires 10 fields.
 *   - header = parts[0].split('FM4'); if header[0] is non-empty the first
 *     4 chars are emitted as unknown and the remainder as flight number.
 *   - Departure airport from header[1], arrival from parts[1].
 *   - Day = parts[2].substring(0,2), timestamp = parts[2].substring(2).
 *   - ETA from parts[3]; coords are bare decimals from parts[4]/parts[5]
 *     (whitespace-stripped). Altitude parts[6], heading parts[7].
 *   - parts[8] and parts[9] emitted as unknown.
 */
export function label_2p_fm4_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split(',');

  if (parts.length === 10) {
    const header = parts[0].split('FM4');
    if (header.length == 0) {
      // can't use preambles, as there can be info before `FM4`
      // so let's check if we want to decode it here
      ResultFormatter.unknown(result, message.text);
      result.decoded = false;
      result.decoder.decodeLevel = 'none';
      return result;
    }
    if (header[0].length > 0) {
      ResultFormatter.unknown(result, header[0].substring(0, 4));
      ResultFormatter.flightNumber(result, header[0].substring(4));
    }
    ResultFormatter.departureAirport(result, header[1]);
    ResultFormatter.arrivalAirport(result, parts[1]);
    ResultFormatter.day(result, Number(parts[2].substring(0, 2)));
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(parts[2].substring(2)),
    );
    ResultFormatter.eta(
      result,
      DateTimeUtils.convertHHMMSSToTod(parts[3]),
    );
    ResultFormatter.position(result, {
      latitude: Number(parts[4].replaceAll(' ', '')),
      longitude: Number(parts[5].replaceAll(' ', '')),
    });
    ResultFormatter.altitude(result, Number(parts[6]));
    ResultFormatter.heading(result, Number(parts[7]));
    // TODO: decode further
    ResultFormatter.unknown(result, parts[8]);
    ResultFormatter.unknown(result, parts[9]);

    result.decoded = true;
    result.decoder.decodeLevel = 'partial';
  } else {
    // Unknown
    if (options.debug) {
      console.log(`Decoder: Unknown H1 message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
  }

  return result;
}
