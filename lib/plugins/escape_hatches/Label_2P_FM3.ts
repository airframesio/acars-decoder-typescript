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
 * Whole-plugin parse hatch for Label_2P_FM3 (Flight Report — FM3 variant).
 *
 * Ported from lib/plugins/Label_2P_FM3.ts. Behavior:
 *   - Splits on ',' and requires 7 fields.
 *   - header = parts[0].split('FM3 '); if header[0] is non-empty the first
 *     4 chars are emitted as unknown and the remainder as flight number.
 *   - timestamp and eta come via DateTimeUtils.convertHHMMSSToTod.
 *   - Coords (parts[2], parts[3]) are whitespace-stripped; if lat starts
 *     with N/S the char prefix sign-encodes the value, otherwise the value
 *     is treated as a bare decimal.
 *   - Altitude from parts[4]; parts[5] and parts[6] emitted as unknown.
 *   - Unknown variation: ResultFormatter.unknown + decoded=false / 'none'.
 */
export function label_2p_fm3_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split(',');

  if (parts.length === 7) {
    const header = parts[0].split('FM3 ');
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

    if (header[1].length === 4) {
      ResultFormatter.timestamp(
        result,
        DateTimeUtils.convertHHMMSSToTod(header[1]),
      );
    } else {
      ResultFormatter.timestamp(
        result,
        DateTimeUtils.convertHHMMSSToTod(header[1]),
      );
    }
    ResultFormatter.eta(
      result,
      DateTimeUtils.convertHHMMSSToTod(parts[1]),
    );
    const lat = parts[2].replaceAll(' ', '');
    const lon = parts[3].replaceAll(' ', '');
    if (lat[0] === 'N' || lat[0] === 'S') {
      ResultFormatter.position(result, {
        latitude:
          CoordinateUtils.getDirection(lat[0]) * Number(lat.substring(1)),
        longitude:
          CoordinateUtils.getDirection(lon[0]) * Number(lon.substring(1)),
      });
    } else {
      ResultFormatter.position(result, {
        latitude: Number(lat),
        longitude: Number(lon),
      });
    }
    ResultFormatter.altitude(result, Number(parts[4]));
    // TODO: decode further
    ResultFormatter.unknown(result, parts[5]);
    ResultFormatter.unknown(result, parts[6]);

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
