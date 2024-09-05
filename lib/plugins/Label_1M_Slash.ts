import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

export class Label_1M_Slash extends DecoderPlugin {
  name = 'label-1m-slash';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["1M"],
      preambles: ['/'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ETA Report';
    decodeResult.message = message;

    // Style: /BA0843/ETA01/230822/LDSP/EGLL/EGSS/2JK0(NEW LINE)1940/EGLL27L/10
    const results = message.text.split(/\n|\//).slice(1); // Split by / and new line

    if (results) {
      if (options.debug) {
        console.log(`Label 1M ETA: results`);
        console.log(results);
      }

      decodeResult.raw.flight_number = results[0];
      // results[1]: ETA01 (???)
      // results[2]: 230822 - UTC date of eta
      decodeResult.raw.departure_icao = results[3];
      decodeResult.raw.arrival_icao = results[4];
      decodeResult.raw.alternate_icao = results[5];
      // results[6]: 2JK0 (???)
      // results[7] 1940 - UTC eta
      decodeResult.raw.arrival_runway = results[8].replace(decodeResult.raw.arrival_icao, ""); // results[8] EGLL27L
      // results[9]: 10(space) (???)

      decodeResult.formatted.items.push({
        type: 'eta',
        code: 'ETA',
        label: 'Estimated Time of Arrival',
        value: DateTimeUtils.UTCDateTimeToString(results[2], results[7]),
      });

      decodeResult.formatted.items.push({
        type: 'destination',
        code: 'DST',
        label: 'Destination',
        value: decodeResult.raw.arrival_icao,
      });

      decodeResult.formatted.items.push({
        type: 'origin',
        code: 'ORG',
        label: 'Origin',
        value: decodeResult.raw.departure_icao,
      });
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
