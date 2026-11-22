import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Air Canada pushback report:
//   'PSHBK AC0281/21/22 YVR 0603Z/    Z/    Z/0605Z'
//   flight, departure day, report day, station, pushback (OUT) time, ...
const REPORT_REGEX =
  /^PSHBK (?<flight>[A-Z0-9]{3,8})\/(?<departureDay>\d{2})\/(?<day>\d{2}) (?<station>[A-Z]{3}) (?<time>\d{4})Z(?<rest>[\s\S]*)$/;

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_4T_PSHBK extends DecoderPlugin {
  name = 'label-4t-pshbk';

  qualifiers() {
    return {
      labels: ['4T'],
      preambles: ['PSHBK'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Pushback Report');

    const groups = REPORT_REGEX.exec(message.text)?.groups;
    if (!groups || !CLOCK_REGEX.test(groups.time)) {
      this.debug(options, `Unknown 4T message: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    ResultFormatter.flightNumber(decodeResult, groups.flight);
    ResultFormatter.departureDay(decodeResult, Number(groups.departureDay));
    ResultFormatter.day(decodeResult, Number(groups.day));
    ResultFormatter.departureAirport(decodeResult, groups.station, 'IATA');
    ResultFormatter.out(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(groups.time),
    );
    if (groups.rest.trim()) {
      ResultFormatter.unknown(decodeResult, groups.rest, '');
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
