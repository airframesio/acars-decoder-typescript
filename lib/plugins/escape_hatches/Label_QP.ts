import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_QP (OUT Report).
 *
 *   text[0:4]  -> departure ICAO
 *   text[4:8]  -> arrival ICAO
 *   text[8:12] -> OUT time (HHMM, internally padded to HHMMSS)
 *   text[12:]  -> trailing unknown bytes
 */
export function label_qp_dispatch(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  ResultFormatter.departureAirport(result, message.text.substring(0, 4));
  ResultFormatter.arrivalAirport(result, message.text.substring(4, 8));
  ResultFormatter.out(
    result,
    DateTimeUtils.convertHHMMSSToTod(message.text.substring(8, 12)),
  );
  ResultFormatter.unknown(result, message.text.substring(12));

  result.decoded = true;
  if (!result.remaining.text) {
    result.decoder.decodeLevel = 'full';
  } else {
    result.decoder.decodeLevel = 'partial';
  }
  return result;
}
