import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// 'OUT01    ETH309/22220151HKJKHAAB\r\n0151 16510600'
//  event, version, flight, '/', flight day, report day + HHMM,
//  origin, destination, then the event time HHMM on the next line
const REPORT_REGEX =
  /^(?<event>OUT|OFF|ONN|INN)01(?<flight>[A-Z0-9 ]{1,10})\/(?<flightDay>\d{2})(?<reportDay>\d{2})(?<reportTime>\d{4})(?<origin>[A-Z0-9]{4})(?<destination>[A-Z0-9]{4})\r?\n(?<time>\d{4})(?<rest>[\s\S]*)$/;

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

const DESCRIPTIONS: Record<string, string> = {
  OUT: 'Out of Gate Report',
  OFF: 'Takeoff Report',
  ONN: 'Landing Report',
  INN: 'In Gate Report',
};

// OOOI reports on labels 11 (OUT), 12 (OFF), 13 (ON) and 14 (IN)
export class Label_11Through14_OOOI extends DecoderPlugin {
  name = 'label-11-14-oooi';

  qualifiers() {
    return {
      labels: ['11', '12', '13', '14'],
      preambles: ['OUT01', 'OFF01', 'ONN01', 'INN01'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'OOOI Report');

    const groups = REPORT_REGEX.exec(message.text)?.groups;
    if (
      !groups ||
      !CLOCK_REGEX.test(groups.reportTime) ||
      !CLOCK_REGEX.test(groups.time)
    ) {
      this.debug(options, `Unknown OOOI report: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.formatted.description = DESCRIPTIONS[groups.event];
    ResultFormatter.flightNumber(decodeResult, groups.flight.trim());
    ResultFormatter.departureDay(decodeResult, Number(groups.flightDay));
    ResultFormatter.day(decodeResult, Number(groups.reportDay));
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(groups.reportTime),
    );
    ResultFormatter.departureAirport(decodeResult, groups.origin);
    ResultFormatter.arrivalAirport(decodeResult, groups.destination);

    const tod = DateTimeUtils.convertHHMMSSToTod(groups.time);
    switch (groups.event) {
      case 'OUT':
        ResultFormatter.out(decodeResult, tod);
        break;
      case 'OFF':
        ResultFormatter.off(decodeResult, tod);
        break;
      case 'ONN':
        ResultFormatter.on(decodeResult, tod);
        break;
      case 'INN':
        ResultFormatter.in(decodeResult, tod);
        break;
    }

    if (groups.rest.trim()) {
      ResultFormatter.unknown(decodeResult, groups.rest.trim());
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
