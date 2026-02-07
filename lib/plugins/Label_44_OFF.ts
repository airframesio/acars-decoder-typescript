import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Off Runway Report
export class Label_44_OFF extends DecoderPlugin {
  name = 'label-44-off';

  qualifiers() {
    return {
      labels: ['44'],
      preambles: ['00OFF01', '00OFF02', '00OFF03', 'OFF01', 'OFF02', 'OFF03'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Off Runway Report';
    decodeResult.message = message;

    const data = message.text.split(',');
    if (data.length >= 8) {
      if (options.debug) {
        console.log('Label 44 Off Runway Report: groups');
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
      ResultFormatter.off(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(data[5]),
      );
      ResultFormatter.eta(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(data[6]),
      );
      const fuel = Number(data[7]);
      if (!isNaN(fuel)) {
        ResultFormatter.remainingFuel(decodeResult, Number(fuel));
      }

      if (data.length > 8) {
        ResultFormatter.unknownArr(decodeResult, data.slice(8));
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
