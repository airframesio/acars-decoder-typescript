// Escape-hatch port of lib/plugins/Label_4T_ETA.ts decode().

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_4t_eta_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const data = message.text.substring(3).split('/');

  if (!message.text.startsWith('ETA') || data.length !== 3) {
    if (options.debug) {
      console.log(`Decoder: Unknown 4T message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  ResultFormatter.flightNumber(result, data[0].trim());
  ResultFormatter.departureDay(result, Number(data[1]));
  const etaData = data[2].split(' ');
  ResultFormatter.arrivalDay(result, Number(etaData[0]));
  ResultFormatter.arrivalAirport(result, etaData[1], 'IATA');
  ResultFormatter.eta(
    result,
    DateTimeUtils.convertHHMMSSToTod(etaData[2].substring(0, 4)),
  );

  result.decoded = true;
  result.decoder.decodeLevel = 'full';

  return result;
}
