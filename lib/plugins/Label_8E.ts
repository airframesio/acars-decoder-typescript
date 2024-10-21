import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// ETA
export class Label_8E extends DecoderPlugin {
  name = 'label-8e';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["8E"],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ETA Report';
    decodeResult.message = message;

    // Style: EGSS,1618
    // Match: arrival_icao,arrival_eta
    const regex = /^(?<arrival_icao>\w{4}),(?<arrival_eta>\d{4})$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 8E ETA: groups`);
        console.log(results.groups);
      }

      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(results.groups.arrival_eta + '00'));
      ResultFormatter.arrivalAirport(decodeResult, results.groups.arrival_icao);
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}

export default {};
