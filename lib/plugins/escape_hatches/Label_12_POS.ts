// Escape-hatch port of lib/plugins/Label_12_POS.ts
// Called from generated plugin lib/plugins/generated/Label_12_POS.ts.

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

export function label_12_pos_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const data = message.text.substring(3).split(',');
  if (!message.text.startsWith('POS') || data.length !== 12) {
    if (options.debug) {
      console.log(`[${plugin.name}] Unknown message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const lat = data[0].substring(0, 8);
  const lon = data[0].substring(8);
  ResultFormatter.position(result, {
    latitude:
      CoordinateUtils.getDirection(lat[0]) *
      CoordinateUtils.dmsToDecimalDegrees(
        Number(lat.substring(1, 4)),
        Number(lat.substring(4, 6)),
        Number(lat.substring(6, 8)),
      ),
    longitude:
      CoordinateUtils.getDirection(lon[0]) *
      CoordinateUtils.dmsToDecimalDegrees(
        Number(lon.substring(1, 4)),
        Number(lon.substring(4, 6)),
        Number(lon.substring(6, 8)),
      ),
  });
  ResultFormatter.unknown(result, data[1]);
  ResultFormatter.timestamp(result, DateTimeUtils.convertHHMMSSToTod(data[2]));
  ResultFormatter.altitude(result, 10 * Number(data[3]));
  ResultFormatter.unknownArr(result, data.slice(4, 7));
  ResultFormatter.currentFuel(result, Number(data[7].substring(3).trim())); // strip FOB
  ResultFormatter.eta(
    result,
    DateTimeUtils.convertHHMMSSToTod(data[8].substring(3).trim()),
  ); // strip ETA
  ResultFormatter.departureAirport(result, data[9]);
  ResultFormatter.arrivalAirport(result, data[10]);
  ResultFormatter.unknown(result, data[11]);

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  return result;
}

export function label_12_pos_format(_result: DecodeResult): void {
  // No-op.
}
