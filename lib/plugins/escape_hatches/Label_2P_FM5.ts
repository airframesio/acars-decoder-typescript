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
 * Whole-plugin parse hatch for Label_2P_FM5 (Flight Report — FM5 variant).
 *
 * Ported from lib/plugins/Label_2P_FM5.ts. Behavior:
 *   - Splits on ',' and requires 12 fields.
 *   - header = parts[0].split('FM5 '); departure airport = header[1].
 *   - Arrival airport = parts[1]; timestamp = parts[2], eta = parts[3]
 *     (both via DateTimeUtils.convertHHMMSSToTod).
 *   - Coords from parts[4]/parts[5] (whitespace-stripped, bare decimals).
 *   - Altitude parts[6]; parts[7..9] emitted as unknown.
 *   - Trimmed flight number = parts[10]; parts[11] emitted as unknown.
 */
export function label_2p_fm5_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split(',');

  if (parts.length === 12) {
    const header = parts[0].split('FM5 ');
    if (header.length == 0) {
      // can't use preambles, as there can be info before `FM4`
      // so let's check if we want to decode it here
      ResultFormatter.unknown(result, message.text);
      result.decoded = false;
      result.decoder.decodeLevel = 'none';
      return result;
    }

    ResultFormatter.departureAirport(result, header[1]);
    ResultFormatter.arrivalAirport(result, parts[1]);
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(parts[2]),
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
    // TODO: decode further
    ResultFormatter.unknown(result, parts[7]);
    ResultFormatter.unknown(result, parts[8]);
    ResultFormatter.unknown(result, parts[9]);
    ResultFormatter.flightNumber(result, parts[10].trim());
    ResultFormatter.unknown(result, parts[11]);

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
