import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { mayBeLoadsheet, parseLoadsheet } from '../utils/loadsheet';
import { ResultFormatter } from '../utils/result_formatter';

const DESCRIPTIONS = {
  loadsheet: 'Loadsheet',
  acceptance: 'Loadsheet Acceptance',
  request: 'Loadsheet Request',
};

/**
 * Weight and balance loadsheets (IATA AHM 517 "LOADSHEET FINAL/PRELIM"),
 * loadsheet acceptances and loadsheet requests. Airlines send these on many
 * labels behind their own routing headers, so this runs on every label and
 * looks for the loadsheet inside the text.
 */
export class Loadsheet extends DecoderPlugin {
  name = 'loadsheet';

  qualifiers() {
    return {
      labels: ['*'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    // Most messages never mention a loadsheet: bail out before any parsing.
    const ls = parseLoadsheet(message.text);
    const decodeResult = this.initResult(
      message,
      ls ? DESCRIPTIONS[ls.kind] : 'Unknown',
    );
    if (!ls) {
      if (mayBeLoadsheet(message.text))
        this.debug(options, `Unknown loadsheet message: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    if (ls.flight_number)
      ResultFormatter.flightNumber(decodeResult, ls.flight_number);
    if (ls.flight_day !== undefined)
      ResultFormatter.day(decodeResult, ls.flight_day);
    if (ls.registration) ResultFormatter.tail(decodeResult, ls.registration);
    if (ls.departure)
      ResultFormatter.departureAirport(
        decodeResult,
        ls.departure,
        ls.departure.length === 4 ? 'ICAO' : 'IATA',
      );
    if (ls.arrival)
      ResultFormatter.arrivalAirport(
        decodeResult,
        ls.arrival,
        ls.arrival.length === 4 ? 'ICAO' : 'IATA',
      );
    ResultFormatter.loadsheet(decodeResult, ls);

    if (ls.kind === 'loadsheet') {
      // The text carries more than the fields decoded (compartment loads,
      // trim, SI remarks), so a loadsheet is always a partial decode.
      this.setDecodeLevel(decodeResult, true, 'partial');
    } else {
      // A one-line acceptance or request is fully read; anything longer
      // (acknowledgement boilerplate, crew codes) stays in remaining.
      const lines = message.text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length > 1) ResultFormatter.unknown(decodeResult, message.text);
      this.setDecodeLevel(decodeResult, true);
    }
    return decodeResult;
  }
}
