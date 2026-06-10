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
 * Whole-plugin parse hatch for Label_4A_01 (01 preamble — Latest New Format).
 *
 * Ported from lib/plugins/Label_4A_01.ts. Behavior:
 *   - Single multiline regex with 9 capture groups.
 *   - On match: emits state_change (rgx[1] → rgx[2]), callsign (rgx[3]),
 *     timestamp from rgx[4] + '00', departure (rgx[5]), arrival (rgx[6]),
 *     altitude (rgx[7] with whitespace stripped from sign), unknown rgx[8],
 *     temperature (rgx[9] with whitespace stripped from sign).
 *   - On miss: marks decoded=false and emits message.text as unknown.
 *   - setDecodeLevel is called with the final decoded flag.
 */
export function label_4a_01_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.decoded = true;
  const rgx = message.text.match(
    /^01([A-Z]{2})([A-Z]{2})\s*(\w+)\/(\d{6})([A-Z]{4})([A-Z]{4})\r\n([+-]\s*\d+)(\d{3}\.\d)([+-]\s*\d+\.\d)/,
  );
  if (rgx) {
    ResultFormatter.state_change(result, rgx[1], rgx[2]);
    ResultFormatter.callsign(result, rgx[3]);
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(rgx[4] + '00'),
    );
    ResultFormatter.departureAirport(result, rgx[5]);
    ResultFormatter.arrivalAirport(result, rgx[6]);
    ResultFormatter.altitude(result, Number(rgx[7].replace(/ /g, '')));
    ResultFormatter.unknown(result, rgx[8]);
    ResultFormatter.temperature(result, rgx[9].replace(/ /g, ''));
  } else {
    result.decoded = false;
    ResultFormatter.unknown(result, message.text);
  }

  plugin.setDecodeLevel(result, result.decoded);

  return result;
}
