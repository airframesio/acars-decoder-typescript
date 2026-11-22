import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// JAL (label 10) and ANA (label 11) OOOI reports:
//   'OUT04A21204409KSFO2044RJTT'   event, version, 'A', day, HHMMSS,
//                                  origin, HHMM, destination
//   'ONN04A21200226YSSY2002'       ON and IN name the arrival airport
//   'OFF01A21070436RJSSRJCC070421' (ANA) origin, destination, HHMMSS
const REPORT_REGEX =
  /^(?<event>OUT|OFF|ONN|INN)(?<version>\d{2})A(?<day>0[1-9]|[12]\d|3[01])(?<time>\d{6})(?<airport>[A-Z]{4})(?:(?<airport2>[A-Z]{4})(?<time2>\d{6})|(?<hhmm>\d{4})(?<airport3>[A-Z]{4})?)(?<rest>[\s\S]*)$/;

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d([0-5]\d)?$/;

const DESCRIPTIONS: Record<string, string> = {
  OUT: 'Out of Gate Report',
  OFF: 'Takeoff Report',
  ONN: 'Landing Report',
  INN: 'In Gate Report',
};

export class Label_10Through14_OOOI_Day extends DecoderPlugin {
  name = 'label-10-14-oooi-day';

  qualifiers() {
    return {
      labels: ['10', '11', '12', '13', '14'],
      preambles: ['OUT', 'OFF', 'ONN', 'INN'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'OOOI Report');

    const groups = REPORT_REGEX.exec(message.text)?.groups;
    if (!groups || !CLOCK_REGEX.test(groups.time)) {
      this.debug(options, `Unknown OOOI report: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.formatted.description = DESCRIPTIONS[groups.event];
    ResultFormatter.day(decodeResult, Number(groups.day));
    const second = groups.airport2 ?? groups.airport3;
    if (groups.event === 'OUT' || groups.event === 'OFF') {
      ResultFormatter.departureAirport(decodeResult, groups.airport);
      if (second) {
        ResultFormatter.arrivalAirport(decodeResult, second);
      }
    } else {
      ResultFormatter.arrivalAirport(decodeResult, groups.airport);
    }

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

    // The second time is not always the event time again: JAL OUT
    // '204409 ... 2044' repeats it, ANA OFF '070436 ... 070421' does not.
    const unknown = [groups.version, groups.time2 ?? groups.hhmm];
    // Which airport an ON/IN report names second is not known.
    if (groups.airport3 && groups.event !== 'OUT' && groups.event !== 'OFF') {
      unknown.push(groups.airport3);
    }
    if (groups.rest.trim()) {
      unknown.push(groups.rest.trim());
    }
    ResultFormatter.unknownArr(decodeResult, unknown);

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
