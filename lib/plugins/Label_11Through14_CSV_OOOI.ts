import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Cathay Pacific CSV OOOI reports:
//   'OUT,V02,CX 837 20261121 1,CYVR,VHHH,2044,2036,----, 1179' (label 11)
//   'ONE,V02,CX 105 20261122 1,VHHH,YMML,0124,   96'           (label 13)
// event, version, flight and date, origin, destination, event time, ...
const REPORT_REGEX =
  /^(?<event>OUT|OFF|ON[A-Z]?|IN[A-Z]?),(?<version>V\d{2}),(?:(?<airline>[A-Z0-9]{2}) ?(?<number>\d{1,4}) (?<date>\d{8}) \d|-+),(?<origin>[A-Z0-9]{4}|-{4}),(?<destination>[A-Z0-9]{4}|-{4}),(?<time>\d{4})(?<rest>[\s\S]*)$/;

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_11Through14_CSV_OOOI extends DecoderPlugin {
  name = 'label-11-14-csv-oooi';

  qualifiers() {
    return {
      labels: ['11', '12', '13', '14'],
      preambles: ['OUT,V', 'OFF,V', 'ON', 'IN'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'OOOI Report');

    const groups = REPORT_REGEX.exec(message.text)?.groups;
    if (!groups || !CLOCK_REGEX.test(groups.time)) {
      this.debug(options, `Unknown CSV OOOI report: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    if (groups.airline) {
      ResultFormatter.flightNumber(
        decodeResult,
        groups.airline + Number(groups.number),
      );
      ResultFormatter.departureDay(
        decodeResult,
        Number(groups.date.substring(6)),
      );
    }
    if (groups.origin !== '----') {
      ResultFormatter.departureAirport(decodeResult, groups.origin);
    }
    if (groups.destination !== '----') {
      ResultFormatter.arrivalAirport(decodeResult, groups.destination);
    }

    const tod = DateTimeUtils.convertHHMMSSToTod(groups.time);
    if (groups.event === 'OUT') {
      decodeResult.formatted.description = 'Out of Gate Report';
      ResultFormatter.out(decodeResult, tod);
    } else if (groups.event === 'OFF') {
      decodeResult.formatted.description = 'Takeoff Report';
      ResultFormatter.off(decodeResult, tod);
    } else if (groups.event.startsWith('ON')) {
      decodeResult.formatted.description = 'Landing Report';
      ResultFormatter.on(decodeResult, tod);
    } else {
      decodeResult.formatted.description = 'In Gate Report';
      ResultFormatter.in(decodeResult, tod);
    }

    ResultFormatter.unknown(decodeResult, groups.version);
    if (groups.rest.replace(/^,/, '').trim()) {
      ResultFormatter.unknown(decodeResult, groups.rest.replace(/^,/, ''));
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
