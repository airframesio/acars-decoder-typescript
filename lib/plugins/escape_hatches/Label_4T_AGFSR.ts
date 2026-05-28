// Escape-hatch port of lib/plugins/Label_4T_AGFSR.ts decode().

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

export function label_4t_agfsr_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const data = message.text.substring(5).split('/');

  if (!message.text.startsWith('AGFSR') || data.length !== 20) {
    if (options.debug) {
      console.log(`Decoder: Unknown 4T message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  ResultFormatter.flightNumber(result, data[0].trim());
  ResultFormatter.departureDay(result, Number(data[1]));
  ResultFormatter.arrivalDay(result, Number(data[2]));
  ResultFormatter.departureAirport(result, data[3].substring(0, 3), 'IATA');
  ResultFormatter.arrivalAirport(result, data[3].substring(3), 'IATA');
  ResultFormatter.timestamp(
    result,
    DateTimeUtils.convertHHMMSSToTod(data[4].substring(0, 4)),
  );
  ResultFormatter.unknown(result, data[5], '/');
  const lat = data[6].substring(0, 7);
  const lon = data[6].substring(7, 15);
  ResultFormatter.position(result, {
    latitude:
      CoordinateUtils.getDirection(lat[6]) * Number(lat.substring(0, 2)) +
      Number(lat.substring(2, 6)) / 60,
    longitude:
      CoordinateUtils.getDirection(lon[7]) * Number(lon.substring(0, 3)) +
      Number(lon.substring(3, 7)) / 60,
  });
  ResultFormatter.altitude(result, 100 * Number(data[7]));
  ResultFormatter.unknownArr(result, data.slice(8), '/');

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';

  return result;
}
