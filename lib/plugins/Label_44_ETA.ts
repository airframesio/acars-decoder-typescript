import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// ETA Report — has a different field layout from the other Label 44 events
// (altitude between coords and airports), so it uses DecoderPlugin directly
// rather than Label_44_Base.
export class Label_44_ETA extends DecoderPlugin {
  name = 'label-44-eta';

  qualifiers() {
    return {
      labels: ['44'],
      preambles: ['00ETA01', '00ETA02', '00ETA03', 'ETA01', 'ETA02', 'ETA03'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, 'ETA Report');

    const data = message.text.split(',');
    if (data.length < 9) {
      return this.failUnknown(result, message.text, options);
    }

    this.debug(options, 'ETA Report: fields', data);

    ResultFormatter.position(
      result,
      CoordinateUtils.decodeStringCoordinatesDecimalMinutes(data[1]),
    );
    ResultFormatter.altitude(result, 100 * Number(data[2]));
    ResultFormatter.departureAirport(result, data[3]);
    ResultFormatter.arrivalAirport(result, data[4]);
    ResultFormatter.month(result, Number(data[5].substring(0, 2)));
    ResultFormatter.day(result, Number(data[5].substring(2, 4)));
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(data[6]),
    );
    ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(data[7]));

    const fuel = Number(data[8]);
    if (!isNaN(fuel)) {
      ResultFormatter.remainingFuel(result, fuel);
    }

    if (data.length > 9) {
      ResultFormatter.unknownArr(result, data.slice(9));
    }

    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
