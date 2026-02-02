import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// General Aviation Position Report
export class Label_58 extends DecoderPlugin {
  name = 'label-58';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['58'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const data = message.text.split('/');
    if (data.length === 8) {
      ResultFormatter.flightNumber(decodeResult, data[0]);
      ResultFormatter.day(decodeResult, Number(data[1]));
      ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(data[2]));
      const lat = data[3];
      const lon = data[4];
      ResultFormatter.position(decodeResult, {
        latitude: CoordinateUtils.getDirection(lat[0]) * Number(lat.substring(1)), 
        longitude:CoordinateUtils.getDirection(lon[0]) * Number(lon.substring(1))
      });
      ResultFormatter.altitude(decodeResult, Number(data[5]));
      ResultFormatter.unknown(decodeResult, data[6], '/');
      ResultFormatter.unknown(decodeResult, data[7], '/');
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 58 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}
