import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Air Canada departure and arrival reports:
//   'ATD AC0128/22/22 YVR 0740Z' - sent at pushback (the PSHBK time), OUT
//   'ARV AC0856/21/22 LHR 0823Z' - sent at touchdown (the next AGFSR's ON time)
//   'EAA AC0856/21/22 LHR 0831Z' - updated arrival estimate, about 20 min out
//   (the earlier 'ETA AC0842/21/22 FRA 1010Z' is read by Label_4T_ETA)
//   flight, departure day, report day, station, time
const REPORT_REGEX =
  /^(?<kind>ATD|ARV|EAA) (?<flight>[A-Z0-9]{3,8})\/(?<departureDay>0[1-9]|[12]\d|3[01])\/(?<day>0[1-9]|[12]\d|3[01]) (?<station>[A-Z]{3}) (?<time>\d{4})Z\s*$/;

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_4T_ATD_ARV extends DecoderPlugin {
  name = 'label-4t-atd-arv';

  qualifiers() {
    return {
      labels: ['4T'],
      preambles: ['ATD', 'ARV', 'EAA'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Departure/Arrival Report');

    const groups = REPORT_REGEX.exec(message.text)?.groups;
    if (!groups || !CLOCK_REGEX.test(groups.time)) {
      this.debug(options, `Unknown 4T message: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const time = DateTimeUtils.convertHHMMSSToTod(groups.time);
    ResultFormatter.flightNumber(decodeResult, groups.flight);
    ResultFormatter.departureDay(decodeResult, Number(groups.departureDay));
    ResultFormatter.day(decodeResult, Number(groups.day));
    if (groups.kind === 'ATD') {
      decodeResult.formatted.description = 'Departure Report';
      ResultFormatter.departureAirport(decodeResult, groups.station, 'IATA');
      ResultFormatter.out(decodeResult, time);
    } else if (groups.kind === 'ARV') {
      decodeResult.formatted.description = 'Arrival Report';
      ResultFormatter.arrivalAirport(decodeResult, groups.station, 'IATA');
      ResultFormatter.on(decodeResult, time);
    } else {
      decodeResult.formatted.description = 'Arrival Estimate';
      ResultFormatter.arrivalAirport(decodeResult, groups.station, 'IATA');
      ResultFormatter.eta(decodeResult, time);
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
