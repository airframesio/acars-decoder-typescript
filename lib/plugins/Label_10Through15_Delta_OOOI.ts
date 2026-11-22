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
// Some aircraft leave the day, the airports and the flight blank:
//   '  0313          6\r\n    033200740328    173165061208' (OUT 0332)
//   '  0110 ---- ----6\r\n0000----0196------------01550155' (no OFF yet)
const HEADER_REGEX =
  /^(?<day>0[1-9]|[12]\d|3[01]|  )(?:[01]\d|2[0-3])(?<label>1[0-5]) (?<origin>[A-Z0-9]{4}|-{4}| {4}) (?<destination>[A-Z0-9]{4}|-{4}| {4})\d\r?\n\t?/;

const BODY_REGEX: Record<string, RegExp> = {
  '13': /^(?<flight>\d{4}| {4})(?<out>\d{4})(?<fuel>\d{4})(?<rest>[\d-]{4}[\d -]{4}[\s\S]*)$/,
  '10': /^(?<flight>\d{4}| {4})(?<off>\d{4}|-{4})(?<fuel>\d{4})(?<times>[\d -]{12})(?<out>[\d -]{4})(?<out2>[\d -]{4})(?<rest>[\s\S]*)$/,
  '15': /^(?<flight>\d{4}| {4})(?<on>\d{4})(?<fuel>\d{4}) *(?<rest>(?:\r?\n[\s\S]*)?)$/,
  '14': /^(?<flight>\d{4}| {4})(?<in>\d{4})(?<fuel>[\d ]{4})(?<rest>[\d ]{4} *)$/,
  '11': /^(?<flight>\d{4}| {4})(?<in>\d{4})(?<fuel>[\d ]{4})(?<rest>\S[^\r\n]*?)(?<on>\d{4}|-{4})? *(?<tail>(?:\r?\n[\s\S]*)?)$/,
};

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

// The time each label is named for.
const PRIMARY: Record<string, string> = {
  '10': 'off',
  '11': 'in',
  '13': 'out',
  '14': 'in',
  '15': 'on',
};

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
    // The field the label is named for has to be a real clock; the other
    // times are formatted only when they are clocks, else kept as unknown.
    // A label 10 sent before takeoff has '----' for the OFF and only the OUT.
    const primary = body?.[PRIMARY[message.label]];
    const primaryOk =
      !!primary &&
      (CLOCK_REGEX.test(primary) ||
        (primary === '----' && CLOCK_REGEX.test(body?.out ?? '')));
    if (!header?.groups || !body || !primaryOk) {
      this.debug(options, `Unknown Delta OOOI report: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.formatted.description = DESCRIPTIONS[message.label];
    const blank = (v: string) => v.trim() === '' || v === '----';
    if (!blank(header.groups.day)) {
      ResultFormatter.day(decodeResult, Number(header.groups.day));
    }
    if (!blank(header.groups.origin)) {
      ResultFormatter.departureAirport(decodeResult, header.groups.origin);
    }
    if (!blank(header.groups.destination)) {
      ResultFormatter.arrivalAirport(decodeResult, header.groups.destination);
    }
    if (!blank(body.flight)) {
      ResultFormatter.flightNumber(decodeResult, String(Number(body.flight)));
    }

    const unknown: string[] = [];
    const tod = (hhmm: string) => DateTimeUtils.convertHHMMSSToTod(hhmm);
    const clock = (value: string | undefined, format: (t: number) => void) => {
      if (value === undefined || value === '----' || value.trim() === '') {
        return;
      }
      if (CLOCK_REGEX.test(value)) {
        format(tod(value));
      } else {
        unknown.push(value);
      }
    };
    clock(body.out, (t) => ResultFormatter.out(decodeResult, t));
    clock(body.off, (t) => ResultFormatter.off(decodeResult, t));
    clock(body.on, (t) => ResultFormatter.on(decodeResult, t));
    clock(body.in, (t) => ResultFormatter.in(decodeResult, t));

    // The fuel field is in hundreds of pounds on the samples seen, but that
    // is not confirmed, so it stays undecoded with the other fields.
    // The label 10 report repeats the OUT time; a copy that differs is kept.
    const out2 = body.out2 !== body.out ? body.out2 : undefined;
    unknown.push(
      ...[body.fuel, body.times, out2, body.rest, body.tail]
        .filter((v) => v !== undefined)
        .map((v) => v.trim())
        .filter((v) => v !== ''),
    );
    if (unknown.length > 0) {
      ResultFormatter.unknownArr(decodeResult, unknown);
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
