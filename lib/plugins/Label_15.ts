import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// General Aviation Position Report
export class Label_15 extends DecoderPlugin {
  name = 'label-15';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['15'],
      preambles: ['(2'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const twoZeeRegex = /^\(2(?<between>.+)\(Z$/;
    const results = message.text.match(twoZeeRegex);
    if (results?.groups) {
      // Style: (2N38111W 82211266 76400-64(Z
      const between = results.groups.between
      ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinatesDecimalMinutes(between.substring(0,13)));
      ResultFormatter.altitude(decodeResult, 100 * Number(between.substring(19, 22)));
      ResultFormatter.unknown(decodeResult, between.substring(13,19) + between.substring(22));
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 15 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
