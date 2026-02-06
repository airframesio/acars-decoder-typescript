import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// On Runway Report
export class Label_44_ON extends DecoderPlugin {
  name = 'label-44-on';

  qualifiers() {
    return {
      labels: ['44'],
      preambles: ['00ON01', '00ON02', '00ON03', 'ON01', 'ON02', 'ON03'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'On Runway Report';
    decodeResult.message = message;

    const data = message.text.split(',');
    if (data.length >= 7) {
      if (options.debug) {
        console.log('Label 44 On Runway Report: groups');
        console.log(data);
      }

      ResultFormatter.position(
        decodeResult,
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes(data[1]),
      );
      ResultFormatter.departureAirport(decodeResult, data[2]);
      ResultFormatter.arrivalAirport(decodeResult, data[3]);
      ResultFormatter.month(decodeResult, Number(data[4].substring(0, 2)));
      ResultFormatter.day(decodeResult, Number(data[4].substring(2, 4)));
      ResultFormatter.on(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(data[5]),
      );
      const fuel = Number(data[6]);
      if (!isNaN(fuel)) {
        ResultFormatter.remainingFuel(decodeResult, Number(fuel));
      }

      if (data.length > 7) {
        ResultFormatter.unknownArr(decodeResult, data.slice(7));
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
