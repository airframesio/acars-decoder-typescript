// Escape-hatch port of lib/plugins/Label_16_POSA1.ts
// Called from generated plugin lib/plugins/generated/Label_16_POSA1.ts.

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

export function label_16_posa1_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const fields = message.text.split(',');
  if (fields.length !== 11 || !fields[0].startsWith('POSA1')) {
    if (options.debug) {
      console.log(`[${plugin.name}] Unknown message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  ResultFormatter.position(
    result,
    CoordinateUtils.decodeStringCoordinates(fields[0].substring(5)),
  ); // strip 'POSA1'
  const waypoint = fields[1].trim();
  const time = DateTimeUtils.convertHHMMSSToTod(fields[2]);
  ResultFormatter.altitude(result, Number(fields[3]) * 100);
  const nextWaypoint = fields[4].trim();
  const nextTime = DateTimeUtils.convertHHMMSSToTod(fields[5]);
  ResultFormatter.unknownArr(result, fields.slice(6), ',');
  ResultFormatter.route(result, {
    waypoints: [
      { name: waypoint, time: time },
      { name: nextWaypoint, time: nextTime },
    ],
  });
  result.decoded = true;
  result.decoder.decodeLevel = 'partial';

  return result;
}

export function label_16_posa1_format(_result: DecodeResult): void {
  // No-op.
}
