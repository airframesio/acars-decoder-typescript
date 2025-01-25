import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// In Air Report
export class Label_44_ETA extends DecoderPlugin {
  name = 'label-44-eta';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['44'],
      preambles: ['00ETA01', '00ETA02', '00ETA03', 'ETA01', 'ETA02', 'ETA03'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ETA Report';
    decodeResult.message = message;

    const data = message.text.split(',');
    if (data.length >= 9) {
      if (options.debug) {
        console.log(`Label 44 ETA Report: groups`);
        console.log(data);
      }

      ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinatesDecimalMinutes(data[1]));
      ResultFormatter.altitude(decodeResult, 100 * Number(data[2]));
      ResultFormatter.departureAirport(decodeResult, data[3]);
      ResultFormatter.arrivalAirport(decodeResult, data[4]);

      ResultFormatter.month(decodeResult, Number(data[5].substring(0, 2)));
      ResultFormatter.day(decodeResult, Number(data[5].substring(2, 4)));
      ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(data[6]));
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(data[7]));
      const fuel = Number(data[8]);
      if (!isNaN(fuel)) {
        ResultFormatter.remainingFuel(decodeResult, Number(fuel));
      }

      if (data.length > 9) {
        ResultFormatter.unknownArr(decodeResult, data.slice(9));
      }

    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 44 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}

export default {};
