// Escape-hatch port of lib/plugins/Label_8E.ts decode().
// NOTE: TS unconditionally marks decoded=true even if regex doesn't match.

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_8e_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  // Style: EGSS,1618
  // Match: arrival_icao,arrival_eta
  const regex = /^(?<arrival_icao>\w{4}),(?<arrival_eta>\d{4})$/;
  const results = message.text.match(regex);
  if (results?.groups) {
    if (options.debug) {
      console.log('Label 8E ETA: groups');
      console.log(results.groups);
    }

    ResultFormatter.eta(
      result,
      DateTimeUtils.convertHHMMSSToTod(results.groups.arrival_eta),
    );
    ResultFormatter.arrivalAirport(result, results.groups.arrival_icao);
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'full';

  return result;
}
