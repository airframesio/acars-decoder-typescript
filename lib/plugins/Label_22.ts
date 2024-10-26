import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Position Report
export class Label_22 extends DecoderPlugin {
  name = 'label-22';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['22'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const fields = message.text.split(',');

    if (fields.length !== 11) {
      if (options.debug) {
        console.log(`DEBUG: ${this.name}: Unknown variation. Field count: ${fields.length}, content: ${fields.join(',')}`);
      }
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const latStr = fields[0].substring(1, 8);
    const lonStr = fields[0].substring(9);
    const lat = Number(latStr) / 10000;
    const lon = Number(lonStr) / 10000;
    if (!isNaN(lat) || !isNaN(lon)) {
      ResultFormatter.position(decodeResult, {
        latitude: CoordinateUtils.getDirection(fields[0][0]) * lat, 
        longitude: CoordinateUtils.getDirection(fields[0][8]) * lon,
      });
    }

    ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[2]));
    ResultFormatter.altitude(decodeResult, Number(fields[3]));

    ResultFormatter.unknownArr(decodeResult, [fields[1], ...fields.slice(4)]);
    
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
