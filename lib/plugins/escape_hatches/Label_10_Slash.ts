// Escape-hatch port of lib/plugins/Label_10_Slash.ts
// Called from generated plugin lib/plugins/generated/Label_10_Slash.ts.

import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
  Waypoint,
} from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_10_slash_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split('/');
  if (parts.length < 17) {
    if (options.debug) {
      console.log(`Decoder: Unknown 10 message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const lat = parts[1];
  const lon = parts[2];
  const position = {
    latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1)),
    longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1)),
  };
  ResultFormatter.position(result, position);
  ResultFormatter.heading(result, Number(parts[5]));
  ResultFormatter.altitude(result, 100 * Number(parts[6]));
  ResultFormatter.arrivalAirport(result, parts[7]);
  ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(parts[8]));
  const waypoints: Waypoint[] = [
    {
      name: parts[11],
    },
    {
      name: parts[12],
      time: DateTimeUtils.convertHHMMSSToTod(parts[13]),
    },
    {
      name: parts[14],
      time: DateTimeUtils.convertHHMMSSToTod(parts[15]),
    },
  ];
  ResultFormatter.route(result, { waypoints: waypoints });

  if (parts[16]) {
    ResultFormatter.departureAirport(result, parts[16]);
  }

  ResultFormatter.unknownArr(
    result,
    [parts[3], parts[4], ...parts.slice(9, 11), ...parts.slice(17)],
    '/',
  );

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  void plugin;
  return result;
}

export function label_10_slash_format(_result: DecodeResult): void {
  // No-op.
}
