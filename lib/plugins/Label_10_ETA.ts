import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// KLM ETA report: a number, day, message time, flight, departure, arrival,
// ETA day and time, then the arrival again and a number.
// 'ETA31A22055150KLC1708 ELLXEHAM220602EHAM  30'
const ETA_REGEX =
  /^ETA(\d{2})A(0[1-9]|[12]\d|3[01])(\d{6})([A-Z]{3}\d{1,4}) ([A-Z]{4})([A-Z]{4})(0[1-9]|[12]\d|3[01])(\d{4})(.*)$/s;
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d([0-5]\d)?$/;

export class Label_10_ETA extends DecoderPlugin {
  name = 'label-10-eta';

  qualifiers() {
    return {
      labels: ['10'],
      preambles: ['ETA'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'ETA Report');
    const m = ETA_REGEX.exec(message.text);
    if (!m || !CLOCK_REGEX.test(m[3]) || !CLOCK_REGEX.test(m[8])) {
      if (options.debug) {
        console.log(`Decoder: Unknown 10 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    ResultFormatter.unknown(decodeResult, m[1]);
    ResultFormatter.day(decodeResult, Number(m[2]));
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(m[3]),
    );
    ResultFormatter.flightNumber(decodeResult, m[4]);
    ResultFormatter.departureAirport(decodeResult, m[5]);
    ResultFormatter.arrivalAirport(decodeResult, m[6]);
    ResultFormatter.arrivalDay(decodeResult, Number(m[7]));
    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(m[8]));
    if (m[9].trim()) {
      ResultFormatter.unknown(decodeResult, m[9].trim());
    }
    this.setDecodeLevel(decodeResult, true, 'partial');
    return decodeResult;
  }
}
