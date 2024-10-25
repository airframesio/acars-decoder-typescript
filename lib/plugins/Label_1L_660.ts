import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_1L_660 extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-1l-660';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['1L'],
      preambles: ['000000660'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    if (!message.text.startsWith('000000660')) {
      if (options.debug) {
        console.log(`Decoder: Unknown 1L message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }


    const parts = message.text.substring(9).split(',');

    if (parts.length !== 5) {
      if (options.debug) {
        console.log(`Decoder: Unknown 1L message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(parts[0]);
    if(position) {
      ResultFormatter.position(decodeResult, position);
    }
    const hhmmss = parts[1].substring(0, 6);
    ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(hhmmss));
    const fl = parts[1].substring(6,9);
    ResultFormatter.altitude(decodeResult, Number(fl) * 100);
    const next = parts[1].substring(9);
    ResultFormatter.route(decodeResult, [{name: next.trim()}]);

    decodeResult.remaining.text = parts.slice(2).join(',');

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};