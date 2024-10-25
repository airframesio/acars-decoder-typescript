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
        console.log(`DEBUG: ${this.name}: Unknown variation. Field count: ${fields.length}, content: ${content}`);
      }
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const latDMS = fields[0].substring(1, 8);
    const lonDMS = fields[0].substring(9);
    const lat = CoordinateUtils.dmsToDecimalDegrees(Number(latDMS.substring(0, 3)), Number(latDMS.substring(3, 5)), Number(latDMS.substring(5)));
    const lon = CoordinateUtils.dmsToDecimalDegrees(Number(lonDMS.substring(0, 3)), Number(lonDMS.substring(3, 5)), Number(lonDMS.substring(5)));
    if (!isNaN(lat) || !isNaN(lon)) {
      ResultFormatter.position(decodeResult, {
        latitude: CoordinateUtils.getDirection(fields[0][0]) * lat, 
        longitude: CoordinateUtils.getDirection(fields[0][8]) * lon,
      });
    }

    ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[2]));
    ResultFormatter.altitude(decodeResult, Number(fields[3]));

    decodeResult.remaining.text = [fields[1], ...fields.slice(4)].join(',');
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
