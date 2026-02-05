import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_16_TOD extends DecoderPlugin {
  name = 'label-16-tod';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["16"],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const fields = message.text.split(',');
    const time = DateTimeUtils.convertHHMMSSToTod(fields[0])
    if (fields.length !== 5 || Number.isNaN(time)) {
      if (options.debug) {
        console.log(`Decoder: Unknown 16 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    ResultFormatter.time_of_day(decodeResult, time);
    if(fields[1] !== '') {
      ResultFormatter.altitude(decodeResult, Number(fields[1]));
    }
    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[2]));
    ResultFormatter.unknown(decodeResult, fields[3]);
    const temp = fields[4].split('/');
    const posFields = temp[0].split(' ');
    ResultFormatter.position(decodeResult, {
      latitude: CoordinateUtils.getDirection(posFields[0]) * Number(posFields[1]),
      longitude: CoordinateUtils.getDirection(posFields[2]) * Number(posFields[3]),
    });

    if(temp.length > 1) {
      ResultFormatter.flightNumber(decodeResult, temp[1]);
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';


    return decodeResult;
  }
}
