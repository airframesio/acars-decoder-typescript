// Escape-hatch port of lib/plugins/Label_1L_660.ts
// Called from generated plugin lib/plugins/generated/Label_1L_660.ts.

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

export function label_1l_660_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  if (!message.text.startsWith('000000660')) {
    if (options.debug) {
      console.log(`Decoder: Unknown 1L message: ${message.text}`);
    }
    result.remaining.text = message.text;
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const parts = message.text.substring(9).split(',');

  if (parts.length !== 5) {
    if (options.debug) {
      console.log(`Decoder: Unknown 1L message: ${message.text}`);
    }
    result.remaining.text = message.text;
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
    parts[0],
  );
  if (position) {
    ResultFormatter.position(result, position);
  }
  const hhmmss = parts[1].substring(0, 6);
  ResultFormatter.timestamp(result, DateTimeUtils.convertHHMMSSToTod(hhmmss));
  const fl = parts[1].substring(6, 9);
  ResultFormatter.altitude(result, Number(fl) * 100);
  const next = parts[1].substring(9);
  ResultFormatter.route(result, { waypoints: [{ name: next.trim() }] });

  result.remaining.text = parts.slice(2).join(',');

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  void plugin;
  return result;
}

export function label_1l_660_format(_result: DecodeResult): void {
  // No-op.
}
