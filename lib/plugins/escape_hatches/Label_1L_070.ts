// Escape-hatch port of lib/plugins/Label_1L_070.ts
// Called from generated plugin lib/plugins/generated/Label_1L_070.ts.

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

export function label_1l_070_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  if (!message.text.startsWith('000000070')) {
    if (options.debug) {
      console.log(`Decoder: Unknown 1L message: ${message.text}`);
    }
    result.remaining.text = message.text;
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const parts = message.text.substring(9).split(',');

  if (parts.length !== 7) {
    if (options.debug) {
      console.log(`Decoder: Unknown 1L message: ${message.text}`);
    }
    result.remaining.text = message.text;
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  ResultFormatter.departureAirport(result, parts[0]);
  ResultFormatter.arrivalAirport(result, parts[1]);
  ResultFormatter.timestamp(result, DateTimeUtils.convertHHMMSSToTod(parts[2]));
  ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(parts[3]));
  ResultFormatter.position(result, {
    latitude:
      CoordinateUtils.getDirection(parts[4][0]) *
      Number(parts[4].substring(1)),
    longitude:
      CoordinateUtils.getDirection(parts[5][0]) *
      Number(parts[5].substring(1)),
  });

  result.remaining.text = parts[6];

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  void plugin;
  return result;
}

export function label_1l_070_format(_result: DecodeResult): void {
  // No-op.
}
