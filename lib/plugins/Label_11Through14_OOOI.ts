import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// 'OUT01    ETH309/22220151HKJKHAAB\r\n0151 16510600'
//  event, version, flight, '/', flight day, report day + HHMM,
//  origin, destination, then the event time HHMM on the next line
const REPORT_REGEX =
  /^(?<event>OUT|OFF|ONN|INN)01(?<flight>[A-Z0-9 ]{1,10})\/(?<flightDay>\d{2})(?<reportDay>\d{2})(?<reportTime>\d{4})(?<origin>[A-Z0-9]{4})(?<destination>[A-Z0-9]{4})\r?\n\t?(?<time>\d{4})(?<rest>[\s\S]*)$/;

// British Airways sends it without the flight and '/':
// 'OUT0105400525LSZHEGLL' event time, a second time, origin, destination
// 'OFF010247DIA02KEWREGLL0859BAB7...' event time, origin, destination, ETA
// 'ONN010223CYVR', 'INN010611EGLL 484 480  56  54', 'INN011053----'
const COMPACT_OUT_REGEX =
  /^OUT01(?<time>\d{4})(?<time2>\d{4})(?<origin>[A-Z]{4})(?<destination>[A-Z]{4})(?<rest>[\s\S]*)$/;
const COMPACT_OFF_REGEX =
  /^OFF01(?<time>\d{4})DIA(?<dia>\d{2})(?<origin>[A-Z]{4})(?<destination>[A-Z]{4})(?<eta>\d{4})?(?<rest>[\s\S]*)$/;
const COMPACT_ON_IN_REGEX =
  /^(?<event>ONN|INN)01(?<time>\d{4})(?<destination>[A-Z]{4}|-{4})(?<rest>[\s\S]*)$/;

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
    if (!groups) {
      return this.decodeCompact(message, decodeResult, options);
    }
    if (
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

  private decodeCompact(
    message: Message,
    decodeResult: DecodeResult,
    options: Options,
  ): DecodeResult {
    const text = message.text;
    const event = text.substring(0, 3);
    const groups = (
      event === 'OUT'
        ? COMPACT_OUT_REGEX
        : event === 'OFF'
          ? COMPACT_OFF_REGEX
          : COMPACT_ON_IN_REGEX
    ).exec(text)?.groups;
    if (!groups || !CLOCK_REGEX.test(groups.time)) {
      this.debug(options, `Unknown OOOI report: ${text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.formatted.description = DESCRIPTIONS[event];
    if (groups.origin) {
      ResultFormatter.departureAirport(decodeResult, groups.origin);
    }
    if (groups.destination && groups.destination !== '----') {
      ResultFormatter.arrivalAirport(decodeResult, groups.destination);
    }
    const tod = DateTimeUtils.convertHHMMSSToTod(groups.time);
    switch (event) {
      case 'OUT':
        ResultFormatter.out(decodeResult, tod);
        ResultFormatter.unknown(decodeResult, groups.time2);
        break;
      case 'OFF':
        ResultFormatter.off(decodeResult, tod);
        // The two digits after DIA are not known yet.
        ResultFormatter.unknown(decodeResult, groups.dia);
        if (groups.eta && CLOCK_REGEX.test(groups.eta)) {
          ResultFormatter.eta(
            decodeResult,
            DateTimeUtils.convertHHMMSSToTod(groups.eta),
          );
        } else if (groups.eta) {
          ResultFormatter.unknown(decodeResult, groups.eta);
        }
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
