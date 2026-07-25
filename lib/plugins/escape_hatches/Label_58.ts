// Escape-hatch port of lib/plugins/Label_58.ts decode().

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

export function label_58_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const data = message.text.split('/');
  if (data.length === 8) {
    ResultFormatter.flightNumber(result, data[0]);
    ResultFormatter.day(result, Number(data[1]));
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(data[2]),
    );
    const lat = data[3];
    const lon = data[4];
    ResultFormatter.position(result, {
      latitude: CoordinateUtils.getDirection(lat[0]) * Number(lat.substring(1)),
      longitude: CoordinateUtils.getDirection(lon[0]) * Number(lon.substring(1)),
    });
    ResultFormatter.altitude(result, Number(data[5]));
    ResultFormatter.unknown(result, data[6], '/');
    ResultFormatter.unknown(result, data[7], '/');
  } else {
    if (options.debug) {
      console.log(`Decoder: Unknown 58 message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  return result;
}
