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
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    // Most messages never mention a loadsheet: bail out before any parsing.
    const ls = mayBeLoadsheet(message.text)
      ? parseLoadsheet(message.text)
      : null;
    if (!ls) {
      if (options.debug && mayBeLoadsheet(message.text)) {
        console.log(`Decoder: Unknown loadsheet message: ${message.text}`);
      }
      return decodeResult;
    }

    decodeResult.formatted.description = DESCRIPTIONS[ls.kind];
    if (ls.flight_number)
      ResultFormatter.flightNumber(decodeResult, ls.flight_number);
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

    decodeResult.decoded = true;
    // The full text carries more (compartment loads, trim, SI remarks) than
    // the fields decoded, so a loadsheet is a partial decode.
    decodeResult.decoder.decodeLevel =
      ls.kind === 'loadsheet' ? 'partial' : 'full';
    return decodeResult;
  }
}
