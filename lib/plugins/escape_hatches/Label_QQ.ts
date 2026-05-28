import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_QQ (OFF Report).
 *
 * Variant A: text[12:19] == '\r\n001FE' — long form with day, OFF time,
 * packed NSDDMM.M/EWDDDMM.M coordinates, an unknown 3-char block, then
 * optional groundspeed (when the unknown block != '---') or another
 * unknown chunk. Tail unknown bytes follow.
 *
 * Variant B (fallback): short form with OFF time only, then trailing
 * unknown bytes.
 *
 * Order of ResultFormatter.unknown calls matters because each one
 * appends to remaining.text (which the groundspeed branch reads).
 */
export function label_qq_dispatch(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  ResultFormatter.departureAirport(result, message.text.substring(0, 4));
  ResultFormatter.arrivalAirport(result, message.text.substring(4, 8));

  if (message.text.substring(12, 19) === '\r\n001FE') {
    result.raw.day = message.text.substring(19, 21);
    ResultFormatter.off(
      result,
      DateTimeUtils.convertHHMMSSToTod(message.text.substring(21, 27)),
    );
    const latdir = message.text.substring(27, 28);
    const latdeg = Number(message.text.substring(28, 30));
    const latmin = Number(message.text.substring(30, 34));
    const londir = message.text.substring(34, 35);
    const londeg = Number(message.text.substring(35, 38));
    const lonmin = Number(message.text.substring(38, 42));
    const pos = {
      latitude: (latdeg + latmin / 60) * (latdir === 'N' ? 1 : -1),
      longitude: (londeg + lonmin / 60) * (londir === 'E' ? 1 : -1),
    };
    ResultFormatter.unknown(result, message.text.substring(42, 45));
    ResultFormatter.position(result, pos);

    if (result.remaining.text !== '---') {
      ResultFormatter.groundspeed(
        result,
        Number(message.text.substring(45, 48)),
      );
    } else {
      ResultFormatter.unknown(result, message.text.substring(45, 48));
    }
    ResultFormatter.unknown(result, message.text.substring(48));
  } else {
    ResultFormatter.off(
      result,
      DateTimeUtils.convertHHMMSSToTod(message.text.substring(8, 12) + '00'),
    );
    ResultFormatter.unknown(result, message.text.substring(12));
  }

  result.decoded = true;
  if (!result.remaining.text) {
    result.decoder.decodeLevel = 'full';
  } else {
    result.decoder.decodeLevel = 'partial';
  }
  return result;
}
