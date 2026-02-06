import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_1L_070 extends DecoderPlugin {
  name = 'label-1l-070';

  qualifiers() {
    return {
      labels: ['1L'],
      preambles: ['000000070'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    if (!message.text.startsWith('000000070')) {
      if (options.debug) {
        console.log(`Decoder: Unknown 1L message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const parts = message.text.substring(9).split(',');

    if (parts.length !== 7) {
      if (options.debug) {
        console.log(`Decoder: Unknown 1L message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    ResultFormatter.departureAirport(decodeResult, parts[0]);
    ResultFormatter.arrivalAirport(decodeResult, parts[1]);
    ResultFormatter.time_of_day(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(parts[2]),
    );
    ResultFormatter.eta(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(parts[3]),
    );
    ResultFormatter.position(decodeResult, {
      latitude:
        CoordinateUtils.getDirection(parts[4][0]) *
        Number(parts[4].substring(1)),
      longitude:
        CoordinateUtils.getDirection(parts[5][0]) *
        Number(parts[5].substring(1)),
    });

    decodeResult.remaining.text = parts[6];

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}
