// Escape-hatch port of lib/plugins/Label_10_LDR.ts
// Called from generated plugin lib/plugins/generated/Label_10_LDR.ts.

import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_10_ldr_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split(',');
  if (parts.length < 17) {
    if (options.debug) {
      console.log(`Decoder: Unknown 10 message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const lat = parts[5];
  const lon = parts[6];
  const position = {
    latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1).trim()),
    longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1).trim()),
  };
  ResultFormatter.position(result, position);
  ResultFormatter.altitude(result, Number(parts[7]));
  ResultFormatter.departureAirport(result, parts[9]);
  ResultFormatter.arrivalAirport(result, parts[10]);
  ResultFormatter.alternateAirport(result, parts[11]);
  ResultFormatter.arrivalRunway(result, parts[12].split('/')[0]); // TODO: find out if anything comes after `/` sometimes
  const altRwy = [parts[13].split('/')[0], parts[14].split('/')[0]]
    .filter((r) => r != '')
    .join(',');
  if (altRwy != '') {
    ResultFormatter.alternateRunway(result, altRwy); // TODO: find out if anything comes after `/` sometimes
  }
  ResultFormatter.unknownArr(result, [
    ...parts.slice(0, 5),
    ...parts.slice(15),
  ]);

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  // Reference plugin to avoid unused-param lint warnings.
  void plugin;
  return result;
}

export function label_10_ldr_format(_result: DecodeResult): void {
  // No-op; format is performed inline by the parse hatch.
}
