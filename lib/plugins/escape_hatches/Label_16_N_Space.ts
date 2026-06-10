// Escape-hatch port of lib/plugins/Label_16_N_Space.ts
// Called from generated plugin lib/plugins/generated/Label_16_N_Space.ts.

import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_16_n_space_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  // Style: N 44.203,W 86.546,31965,6, 290
  const variant1Regex =
    /^(?<lat>[NS])\s(?<lat_coord>.*),(?<long>[EW])\s*(?<long_coord>.*),(?<alt>.*),(?<unkwn1>.*),\s*(?<unkwn2>.*)$/;

  // Style: N 28.177/W 96.055
  const variant2Regex =
    /^(?<lat>[NS])\s(?<lat_coord>.*)\/(?<long>[EW])\s*(?<long_coord>.*)$/;

  let results = message.text.match(variant1Regex);
  if (results?.groups) {
    if (options.debug) {
      console.log('Label 16 N : results');
      console.log(results);
    }

    const pos = {
      latitude:
        Number(results.groups.lat_coord) *
        (results.groups.lat == 'N' ? 1 : -1),
      longitude:
        Number(results.groups.long_coord) *
        (results.groups.long == 'E' ? 1 : -1),
    };
    const altitude =
      results.groups.alt == 'GRD' || results.groups.alt == '***'
        ? 0
        : Number(results.groups.alt);

    ResultFormatter.position(result, pos);
    ResultFormatter.altitude(result, altitude);

    ResultFormatter.unknownArr(result, [
      results.groups.unkwn1,
      results.groups.unkwn2,
    ]);
    result.decoded = true;
    result.decoder.decodeLevel = 'partial';

    void plugin;
    return result;
  }

  results = message.text.match(variant2Regex);
  if (results?.groups) {
    if (options.debug) {
      console.log('Label 16 N : results');
      console.log(results);
    }

    const pos = {
      latitude:
        Number(results.groups.lat_coord) *
        (results.groups.lat == 'N' ? 1 : -1),
      longitude:
        Number(results.groups.long_coord) *
        (results.groups.long == 'E' ? 1 : -1),
    };

    ResultFormatter.position(result, pos);

    result.decoded = true;
    result.decoder.decodeLevel = 'full';
    void plugin;
    return result;
  }

  // Unknown
  if (options.debug) {
    console.log(`Decoder: Unknown 16 message: ${message.text}`);
  }
  ResultFormatter.unknown(result, message.text);
  result.decoded = false;
  result.decoder.decodeLevel = 'none';

  void plugin;
  return result;
}

export function label_16_n_space_format(_result: DecodeResult): void {
  // No-op.
}
