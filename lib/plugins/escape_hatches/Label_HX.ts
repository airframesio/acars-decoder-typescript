import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_HX (Undelivered Uplink Report).
 *
 * Space-split message dispatches on parts[2]:
 *  - 'LOCATION': parts[3]/[4] are packed N/S/E/W coords
 *    (e.g. "N4009.6" + "W07540.8"), decoded as deg + min/60 with sign
 *    from the direction char. parts.slice(5) accumulated as unknown.
 *  - '43': parts[3] is the departure airport; parts.slice(4) become
 *    unknown.
 *  - anything else: decoded=false, decodeLevel='none'.
 */
export function label_hx_dispatch(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  const parts = message.text.split(' ');

  result.decoded = true;
  if (parts[2] === 'LOCATION') {
    const latdir = parts[3].substring(0, 1);
    const latdeg = Number(parts[3].substring(1, 3));
    const latmin = Number(parts[3].substring(3, 7));
    const londir = parts[4].substring(0, 1);
    const londeg = Number(parts[4].substring(1, 4));
    const lonmin = Number(parts[4].substring(4, 8));
    const pos = {
      latitude: (latdeg + latmin / 60) * (latdir === 'N' ? 1 : -1),
      longitude: (londeg + lonmin / 60) * (londir === 'E' ? 1 : -1),
    };
    ResultFormatter.unknownArr(result, parts.slice(5), ' ');
    ResultFormatter.position(result, pos);
  } else if (parts[2] === '43') {
    ResultFormatter.departureAirport(result, parts[3]);
    ResultFormatter.unknownArr(result, parts.slice(4), ' ');
  } else {
    result.decoded = false;
  }

  if (result.decoded) {
    if (!result.remaining.text) {
      result.decoder.decodeLevel = 'full';
    } else {
      result.decoder.decodeLevel = 'partial';
    }
  } else {
    result.decoder.decodeLevel = 'none';
  }

  return result;
}
