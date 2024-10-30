import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_H1_StarPOS extends DecoderPlugin {
  name = 'label-h1-star-pos';
  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
      preambles: ['*POS'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const msg = message.text;
    // assuming fixed length until other variants found
    if (msg.length !== 43 || !msg.startsWith('*POS')) {
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${msg}`);
      }
      ResultFormatter.unknown(decodeResult, msg);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    decodeResult.raw.month = Number(msg.substring(4, 6));
    decodeResult.raw.day_of_month = Number(msg.substring(6, 8));
    ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(msg.substring(8, 12) + '00'));
    ResultFormatter.position(decodeResult, { // Deg Min, no sec
      latitude: CoordinateUtils.getDirection(msg.substring(12,13)) * (Number(msg.substring(13, 15)) + Number(msg.substring(15, 17))/60), 
      longitude: CoordinateUtils.getDirection(msg.substring(17,18)) * (Number(msg.substring(18, 21)) + Number(msg.substring(21, 23))/60)
    });
    ResultFormatter.altitude(decodeResult, Number(msg.substring(23, 28)));
    ResultFormatter.unknown(decodeResult, msg.substring(28));
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
