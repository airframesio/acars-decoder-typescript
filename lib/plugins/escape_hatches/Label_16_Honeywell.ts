// Escape-hatch port of lib/plugins/Label_16_Honeywell.ts
// Called from generated plugin lib/plugins/generated/Label_16_Honeywell.ts.

import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

export function label_16_honeywell_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  if (
    message.text.startsWith('(2') &&
    message.text.endsWith('(Z') &&
    message.text.length >= 29
  ) {
    const between = message.text.substring(2, message.text.length - 2);
    ResultFormatter.unknown(result, between.substring(0, 4), ''); // Session ID
    ResultFormatter.position(
      result,
      CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
        between.substring(4, 17),
      ),
    );
    if (between.charAt(17) === '-') {
      // Waypoint mode
      const waypoint1 = between.substring(18, 23).trim();
      const waypoint2 = between.substring(23, 28).trim();
      if (waypoint2) {
        ResultFormatter.route(result, {
          waypoints: [{ name: waypoint1 }, { name: waypoint2 }],
        });
      } else {
        ResultFormatter.route(result, {
          waypoints: [{ name: waypoint1 }],
        });
      }
    } else {
      // Route mode
      ResultFormatter.departureAirport(result, between.substring(17, 21));
      ResultFormatter.arrivalAirport(result, between.substring(21, 25));
      //ignore the rest (should just be '-')
    }
    ResultFormatter.unknown(result, between.substring(between.length - 2), '');
  } else {
    if (options.debug) {
      console.log(`Decoder: Unknown 16 Honeywell message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  void plugin;
  return result;
}

export function label_16_honeywell_format(_result: DecodeResult): void {
  // No-op.
}
