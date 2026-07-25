import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_30_Slash_EA (/EA preamble — ETA Report).
 *
 * Ported from lib/plugins/Label_30_Slash_EA.ts. Behavior:
 *   - Splits on /\n|\// and slices off the first element.
 *   - ETA = HHMMSS from results[0].substr(2, 4).
 *   - If results[1] starts with "DS", arrival airport = results[1][2..6]
 *     and results[2] is emitted (prefixed with '/') as unknown.
 *   - Otherwise results[1] and results[2] are joined with '/' and emitted
 *     as a single unknown (also prefixed with '/').
 *   - Always reports decoded=true, decodeLevel='partial'.
 */
export function label_30_slash_ea_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  // Style: /EA1830/DSKSFO/SK24
  const results = message.text.split(/\n|\//).slice(1); // Split by / and new line

  if (results) {
    if (options.debug) {
      console.log('Label 30 EA: results');
      console.log(results);
    }
  }

  ResultFormatter.eta(
    result,
    DateTimeUtils.convertHHMMSSToTod(results[0].substr(2, 4)),
  );

  if (results[1].substring(0, 2) === 'DS') {
    ResultFormatter.arrivalAirport(result, results[1].substring(2, 6));
    ResultFormatter.unknown(result, '/'.concat(results[2]));
  } else {
    ResultFormatter.unknown(
      result,
      '/'.concat(results[1], '/', results[2]),
    );
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';

  return result;
}
