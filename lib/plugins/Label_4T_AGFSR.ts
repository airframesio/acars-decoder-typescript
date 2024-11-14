import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// General Aviation Position Report
export class Label_4T_AGFSR extends DecoderPlugin {
  name = 'label-4t-agfsr';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['4T'],
      preambles: ['AGFSR'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const data = message.text.substring(5).split('/');

    if(!message.text.startsWith('AGFSR') || data.length !== 20) {
      if (options.debug) {
        console.log(`Decoder: Unknown 4T message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    ResultFormatter.flightNumber(decodeResult, data[0].trim());
    ResultFormatter.departureDay(decodeResult, Number(data[1]));
    ResultFormatter.arrivalDay(decodeResult, Number(data[2]));
    ResultFormatter.departureAirport(decodeResult, data[3].substring(0,3), 'IATA');
    ResultFormatter.arrivalAirport(decodeResult, data[3].substring(3), 'IATA');
    ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(data[4].substring(0,4))); // HHMMZ
    ResultFormatter.unknown(decodeResult, data[5], '/');
    const lat = data[6].substring(0,7);
    const lon = data[6].substring(7,15);
    console.log(lat);
    ResultFormatter.position(decodeResult, {
      latitude: CoordinateUtils.getDirection(lat[6]) * Number(lat.substring(0,2)) + Number(lat.substring(2,6))/60,
      longitude: CoordinateUtils.getDirection(lon[7]) * Number(lon.substring(0,3)) + Number(lon.substring(3, 7))/60
    });
    ResultFormatter.altitude(decodeResult, 100* Number(data[7]));
    //  8 - phase of flight?
    // 11 - temperature?
    ResultFormatter.unknownArr(decodeResult, data.slice(8), '/');

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
