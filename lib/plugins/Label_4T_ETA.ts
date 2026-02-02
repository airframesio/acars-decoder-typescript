import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// General Aviation Position Report
export class Label_4T_ETA extends DecoderPlugin {
  name = 'label-4t-eta';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['4T'],
      preambles: ['ETA'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ETA Report';
    decodeResult.message = message;

    const data = message.text.substring(3).split('/');

    if(!message.text.startsWith('ETA') || data.length !== 3) {
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
    const etaData = data[2].split(' ');
    ResultFormatter.arrivalDay(decodeResult, Number(etaData[0]));
    ResultFormatter.arrivalAirport(decodeResult, etaData[1], 'IATA');
    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(etaData[2].substring(0,4)));

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}
