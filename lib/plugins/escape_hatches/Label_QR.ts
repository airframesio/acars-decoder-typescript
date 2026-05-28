import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_QR (ON Report).
 * Mirrors QP but emits ON time instead of OUT time.
 */
export function label_qr_dispatch(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  ResultFormatter.departureAirport(result, message.text.substring(0, 4));
  ResultFormatter.arrivalAirport(result, message.text.substring(4, 8));
  ResultFormatter.on(
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
