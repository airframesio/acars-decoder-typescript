import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_30_Slash_EA extends DecoderPlugin {
  name = 'label-30-slash-ea';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["30"],
      preambles: ['/EA'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ETA Report';
    decodeResult.message = message;

    // Style: /EA1830/DSKSFO/SK24
    const results = message.text.split(/\n|\//).slice(1); // Split by / and new line

    if (results) {
      if (options.debug) {
        console.log(`Label 30 EA: results`);
        console.log(results);
      }
    }

    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(results[0].substr(2, 4)));

    if (results[1].substring(0,2) === "DS") {
      ResultFormatter.arrivalAirport(decodeResult, results[1].substring(2, 6));
      ResultFormatter.unknown(decodeResult, "/".concat(results[2]));
    } else {
      ResultFormatter.unknown(decodeResult, "/".concat(results[1], "/", results[2]));
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
