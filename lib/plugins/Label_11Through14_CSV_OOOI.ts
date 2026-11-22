import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Cathay Pacific CSV OOOI reports:
//   'OUT,V02,CX 837 20261121 1,CYVR,VHHH,2044,2036,----, 1179' (label 11)
//   'OFF,V02,CX 837 20261121 1,CYVR,VHHH,2044,2104,1004, 1175' (label 12)
//   'ONE,V02,CX 105 20261122 1,VHHH,YMML,0124,   96'           (label 13)
// event, version, flight and date, origin, destination, event time, ...
// OFF gives the OUT time first, then OFF, ETA (V03: 'CX') and fuel.
// INC (sent before departure) has another layout and no OOOI time.
const REPORT_REGEX =
  /^(?<event>OUT|OFF|ONE),(?<version>V\d{2}),(?:(?<airline>[A-Z0-9]{2}) ?(?<number>\d{1,4}) *(?<date>\d{8}) (?<seq>\d)|-+),(?<origin>[A-Z0-9]{4}|-{4}),(?<destination>[A-Z0-9]{4}|-{4}),(?<time>\d{4})(?<rest>[\s\S]*)$/;

// End of flight summary, label 16: OUT, OFF, ON, IN on the second line.
//   'CAR,V03,CX 181 20261122 1,CX0181,22NOV26,VHHH,YSSY,01,Y\r\n1655,1721,0151,0157,1655,0829,---,...'
const CAR_REGEX =
  /^CAR,(?<version>V\d{2}),(?<airline>[A-Z0-9]{2}) ?(?<number>\d{1,4}) *(?<date>\d{8}) (?<seq>\d),[A-Z0-9]*,\d{2}[A-Z]{3}\d{2},(?<origin>[A-Z0-9]{4}|-{4}),(?<destination>[A-Z0-9]{4}|-{4}),\d{2},[A-Z]\r?\n(?<out>[\d-]{4}),(?<off>[\d-]{4}),(?<on>[\d-]{4}),(?<in>[\d-]{4}),(?<rest>[\s\S]*)$/;

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_11Through14_CSV_OOOI extends DecoderPlugin {
  name = 'label-11-14-csv-oooi';

  qualifiers() {
    return {
      labels: ['11', '12', '13', '14', '16'],
      preambles: ['OUT,V', 'OFF,V', 'ONE,V', 'CAR,V'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'OOOI Report');

    if (message.text.startsWith('CAR,')) {
      return this.decodeSummary(message, decodeResult, options);
    }
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
    let rest = groups.rest;
    if (groups.event === 'OUT') {
      decodeResult.formatted.description = 'Out of Gate Report';
      ResultFormatter.out(decodeResult, tod);
    } else if (groups.event === 'OFF') {
      const off = /^,(?<off>\d{4})(?<more>[\s\S]*)$/.exec(rest)?.groups;
      if (!off || !CLOCK_REGEX.test(off.off)) {
        this.debug(options, `Unknown CSV OOOI report: ${message.text}`);
        this.setDecodeLevel(decodeResult, false);
        return decodeResult;
      }
      decodeResult.formatted.description = 'Takeoff Report';
      ResultFormatter.out(decodeResult, tod);
      ResultFormatter.off(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(off.off),
      );
      rest = off.more;
      const eta = /^,(?<eta>\d{4})(?<more>[\s\S]*)$/.exec(rest)?.groups;
      if (eta && CLOCK_REGEX.test(eta.eta)) {
        ResultFormatter.eta(
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(eta.eta),
        );
        rest = eta.more;
      }
    } else {
      decodeResult.formatted.description = 'Landing Report';
      ResultFormatter.on(decodeResult, tod);
    }

    ResultFormatter.unknown(decodeResult, groups.version);
    if (groups.seq) {
      // The digit after the date is not known yet.
      ResultFormatter.unknown(decodeResult, groups.seq);
    }
    if (rest.replace(/^,/, '').trim()) {
      ResultFormatter.unknown(decodeResult, rest.replace(/^,/, ''));
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }

  private decodeSummary(
    message: Message,
    decodeResult: DecodeResult,
    options: Options,
  ): DecodeResult {
    const groups = CAR_REGEX.exec(message.text)?.groups;
    const times = groups ? [groups.out, groups.off, groups.on, groups.in] : [];
    if (!groups || !times.some((t) => CLOCK_REGEX.test(t))) {
      this.debug(options, `Unknown CSV OOOI summary: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.formatted.description = 'Flight Summary Report';
    ResultFormatter.flightNumber(
      decodeResult,
      groups.airline + Number(groups.number),
    );
    ResultFormatter.departureDay(
      decodeResult,
      Number(groups.date.substring(6)),
    );
    if (groups.origin !== '----') {
      ResultFormatter.departureAirport(decodeResult, groups.origin);
    }
    if (groups.destination !== '----') {
      ResultFormatter.arrivalAirport(decodeResult, groups.destination);
    }
    const add = [
      ResultFormatter.out,
      ResultFormatter.off,
      ResultFormatter.on,
      ResultFormatter.in,
    ];
    times.forEach((time, i) => {
      if (CLOCK_REGEX.test(time)) {
        add[i].call(
          ResultFormatter,
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(time),
        );
      }
    });
    ResultFormatter.unknown(decodeResult, groups.version);
    ResultFormatter.unknown(decodeResult, groups.seq);
    if (groups.rest.trim()) {
      ResultFormatter.unknown(decodeResult, groups.rest.trim());
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
