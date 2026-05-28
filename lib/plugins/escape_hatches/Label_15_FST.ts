// Escape-hatch port of lib/plugins/Label_15_FST.ts
// Called from generated plugin lib/plugins/generated/Label_15_FST.ts.

import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_15_fst_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split(' ');
  // FST01KMCOEGKKN505552W00118021
  const header = parts[0];

  const stringCoords = header.substring(13);
  // Don't use decodeStringCoordinates here, because of different pos format

  const firstChar = stringCoords.substring(0, 1);
  const middleChar = stringCoords.substring(7, 8);
  result.raw.position = {} as { latitude: number; longitude: number };

  if (
    (firstChar === 'N' || firstChar === 'S') &&
    (middleChar === 'W' || middleChar === 'E')
  ) {
    const lat =
      (Number(stringCoords.substring(1, 7)) / 10000) *
      (firstChar === 'S' ? -1 : 1);
    const lon =
      (Number(stringCoords.substring(8, 15)) / 10000) *
      (middleChar === 'W' ? -1 : 1);
    ResultFormatter.position(result, { latitude: lat, longitude: lon });
    ResultFormatter.altitude(result, Number(stringCoords.substring(15)) * 100);
  } else {
    if (options.debug) {
      console.log(`[${plugin.name}] Unknown message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  ResultFormatter.departureAirport(result, header.substring(5, 9));
  ResultFormatter.arrivalAirport(result, header.substring(9, 13));

  ResultFormatter.unknownArr(result, parts.slice(1), ' ');

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  return result;
}

export function label_15_fst_format(_result: DecodeResult): void {
  // No-op.
}
