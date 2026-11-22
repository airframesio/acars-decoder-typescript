import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Delta OOOI reports: a '<DD><HH><label> <origin> <destination><n>' header,
// then fixed four digit fields starting with the flight number.
//   13 OUT     '210513 KLAX KATL6\r\n07830550038005490542'
//              flight, OUT, fuel, two earlier times
//   10 OFF     '210610 KLAX KATL6\r\n07830603037905520549054205500550'
//              flight, OFF, fuel, three times, OUT, OUT
//   15 ON      '210515 KATL KDFW6\r\n081805460086\r\n      186896339280'
//              flight, ON, fuel
//   14 IN      '210614 KDTW KLAX6\r\n0694062900810084' flight, IN, fuel, fuel
//   11 IN+ON   '210511 KSLC KBOS8\r\n07020454    111200  0      0449'
//              flight, IN, ..., ON last on the line
// The meanings were checked on flights that sent several of them: DL816
// sent L15 0045, L14 0056 and L11 '0056 ... 0045'; NW783 sent L13 at 0550
// and its L10 at 0603 repeats 0550 as the OUT.
const HEADER_REGEX =
  /^(?<day>\d{2})(?<hour>\d{2})(?<label>1[0-5]) (?<origin>[A-Z0-9]{4}) (?<destination>[A-Z0-9]{4})\d\r?\n\t?/;

const BODY_REGEX: Record<string, RegExp> = {
  '13': /^(?<flight>\d{4})(?<out>\d{4})(?<fuel>\d{4})(?<rest>\d{8}[\s\S]*)$/,
  '10': /^(?<flight>\d{4})(?<off>\d{4})(?<fuel>\d{4})(?<times>[\d ]{12})(?<out>\d{4})\d{4}(?<rest>[\s\S]*)$/,
  '15': /^(?<flight>\d{4})(?<on>\d{4})(?<fuel>\d{4}) *(?<rest>(?:\r?\n[\s\S]*)?)$/,
  '14': /^(?<flight>\d{4})(?<in>\d{4})(?<fuel>[\d ]{4})(?<rest>[\d ]{4} *)$/,
  '11': /^(?<flight>\d{4})(?<in>\d{4})(?<fuel>[\d ]{4})(?<rest>\S[^\r\n]*?)(?<on>\d{4}|-{4})? *(?<tail>(?:\r?\n[\s\S]*)?)$/,
};

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

const DESCRIPTIONS: Record<string, string> = {
  '10': 'Takeoff Report',
  '11': 'In Gate Summary',
  '13': 'Out of Gate Report',
  '14': 'In Gate Report',
  '15': 'Landing Report',
};

export class Label_10Through15_Delta_OOOI extends DecoderPlugin {
  name = 'label-10-15-delta-oooi';

  qualifiers() {
    return {
      labels: ['10', '11', '13', '14', '15'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'OOOI Report');

    const header = HEADER_REGEX.exec(message.text);
    let body: Record<string, string> | undefined;
    if (header?.groups?.label === message.label) {
      const rest = message.text.substring(header[0].length);
      body = BODY_REGEX[message.label]?.exec(rest)?.groups;
    }
    const time = body?.out ?? body?.off ?? body?.on ?? body?.in;
    if (!header?.groups || !body || !time || !CLOCK_REGEX.test(time)) {
      this.debug(options, `Unknown Delta OOOI report: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.formatted.description = DESCRIPTIONS[message.label];
    ResultFormatter.day(decodeResult, Number(header.groups.day));
    ResultFormatter.departureAirport(decodeResult, header.groups.origin);
    ResultFormatter.arrivalAirport(decodeResult, header.groups.destination);
    ResultFormatter.flightNumber(decodeResult, String(Number(body.flight)));

    const tod = (hhmm: string) => DateTimeUtils.convertHHMMSSToTod(hhmm);
    if (body.out && CLOCK_REGEX.test(body.out)) {
      ResultFormatter.out(decodeResult, tod(body.out));
    }
    if (body.off) {
      ResultFormatter.off(decodeResult, tod(body.off));
    }
    if (body.on && CLOCK_REGEX.test(body.on)) {
      ResultFormatter.on(decodeResult, tod(body.on));
    }
    if (body.in) {
      ResultFormatter.in(decodeResult, tod(body.in));
    }

    // The fuel field is in hundreds of pounds on the samples seen, but that
    // is not confirmed, so it stays undecoded with the other fields.
    const unknown = [body.fuel, body.times, body.rest, body.tail]
      .filter((v) => v !== undefined)
      .map((v) => v.trim())
      .filter((v) => v !== '');
    if (unknown.length > 0) {
      ResultFormatter.unknownArr(decodeResult, unknown);
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
