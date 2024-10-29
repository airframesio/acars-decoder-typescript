import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Position Report
export class Label_22_OFF extends DecoderPlugin {
  name = 'label-22-off';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['22'],
      preambles: ['OFF'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Takeoff Report';
    decodeResult.message = message;

    if (message.text.startsWith('OFF01')) { // variant 1
      const fields = message.text.substring(5).split('/');

      if (fields.length != 2) {
        decodeResult.decoded = false;
        decodeResult.decoder.decodeLevel = 'none';
        return decodeResult;
      }

      ResultFormatter.flightNumber(decodeResult, fields[0]);
      ResultFormatter.departureDay(decodeResult, Number(fields[1].substring(0, 2))); // departure day
      ResultFormatter.arrivalDay(decodeResult, Number(fields[1].substring(2,4))); // arrival day
      ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[1].substring(4, 8) + '00')); //HHMM
      ResultFormatter.departureAirport(decodeResult, fields[1].substring(8, 12));
      ResultFormatter.arrivalAirport(decodeResult, fields[1].substring(12, 16));
      ResultFormatter.off(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[1].substring(16,22)));
      ResultFormatter.unknown(decodeResult, fields[1].substring(22));

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';

    } else if (message.text.startsWith('OFF02\r\n')) { // varaint 3
      const fields = message.text.substring(7).split(',');
      if (fields.length != 4) {
        decodeResult.decoded = false;
        decodeResult.decoder.decodeLevel = 'none';
        return decodeResult;
      }

      ResultFormatter.departureAirport(decodeResult, fields[0]);
      ResultFormatter.arrivalAirport(decodeResult, fields[1]);
      ResultFormatter.off(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[2] + '00'));
      ResultFormatter.unknown(decodeResult, fields[3]);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';

    } else if (message.text.startsWith('OFF02')) { // varaint 2
      const fields = message.text.substring(5).split('/');
      if (fields.length != 2) {
        decodeResult.decoded = false;
        decodeResult.decoder.decodeLevel = 'none';
        return decodeResult;
      }

      ResultFormatter.flightNumber(decodeResult, fields[0]);
      const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(fields[1].substring(0, 14));
      if (position) {
        ResultFormatter.position(decodeResult, position);
      }
      ResultFormatter.day(decodeResult, Number(fields[1].substring(14, 16)));
      ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[1].substring(16, 20) + '00'));
      ResultFormatter.departureAirport(decodeResult, fields[1].substring(20, 24));
      ResultFormatter.arrivalAirport(decodeResult, fields[1].substring(24, 28));
      ResultFormatter.off(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[1].substring(28, 32) + '00'));
      ResultFormatter.unknown(decodeResult, fields[1].substring(32, 36));
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[1].substring(36,40) + '00'));
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';


    } else {
      if (options.debug) {
        console.log(`DEBUG: ${this.name}: Unknown variation.`);
      }
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
    return decodeResult;
  }
}

export default {};
