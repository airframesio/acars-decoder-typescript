// Escape-hatch port of lib/plugins/Label_1M_Slash.ts
// Called from generated plugin lib/plugins/generated/Label_1M_Slash.ts.

import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_1m_slash_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  // Style: /BA0843/ETA01/230822/LDSP/EGLL/EGSS/2JK0(NEW LINE)1940/EGLL27L/10
  const results = message.text.split(/\n|\//).slice(1); // Split by / and new line

  if (results) {
    if (options.debug) {
      console.log('Label 1M ETA: results');
      console.log(results);
    }

    result.raw.flight_number = results[0];
    // results[1]: ETA01 (???)
    // results[2]: 230822 - UTC date of eta
    ResultFormatter.departureAirport(result, results[3]);
    ResultFormatter.arrivalAirport(result, results[4]);
    ResultFormatter.alternateAirport(result, results[5]);
    // results[6]: 2JK0 (???)
    // results[7] 1940 - UTC eta
    ResultFormatter.arrivalRunway(result, results[8].replace(results[4], '')); // results[8] EGLL27L
    // results[9]: 10(space) (???)

    const yymmdd = results[2];
    ResultFormatter.eta(
      result,
      DateTimeUtils.convertDateTimeToEpoch(
        results[7] + '00',
        yymmdd.substring(4, 6) +
          yymmdd.substring(2, 4) +
          yymmdd.substring(0, 2),
      ),
    );
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';

  void plugin;
  return result;
}

export function label_1m_slash_format(_result: DecodeResult): void {
  // No-op.
}
