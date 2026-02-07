import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_1M_Slash extends DecoderPlugin {
  name = 'label-1m-slash';

  qualifiers() {
    return {
      labels: ['1M'],
      preambles: ['/'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ETA Report';
    decodeResult.message = message;

    // Style: /BA0843/ETA01/230822/LDSP/EGLL/EGSS/2JK0(NEW LINE)1940/EGLL27L/10
    const results = message.text.split(/\n|\//).slice(1); // Split by / and new line

    if (results) {
      if (options.debug) {
        console.log('Label 1M ETA: results');
        console.log(results);
      }

      decodeResult.raw.flight_number = results[0];
      // results[1]: ETA01 (???)
      // results[2]: 230822 - UTC date of eta
      ResultFormatter.departureAirport(decodeResult, results[3]);
      ResultFormatter.arrivalAirport(decodeResult, results[4]);
      ResultFormatter.alternateAirport(decodeResult, results[5]);
      // results[6]: 2JK0 (???)
      // results[7] 1940 - UTC eta
      ResultFormatter.arrivalRunway(
        decodeResult,
        results[8].replace(results[4], ''),
      ); // results[8] EGLL27L
      // results[9]: 10(space) (???)

      const yymmdd = results[2];
      ResultFormatter.eta(
        decodeResult,
        DateTimeUtils.convertDateTimeToEpoch(
          results[7] + '00',
          yymmdd.substring(2, 4) +
            yymmdd.substring(4, 6) +
            yymmdd.substring(0, 2),
        ),
        'epoch',
      );
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}
