import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// General Aviation Position Report
export class Label_15 extends DecoderPlugin {
  name = 'label-5z';

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

    const twoZeeRegex = /^\(2(?<between>.+)\(Z$/;
    const results = message.text.match(twoZeeRegex);
    if (results?.groups) {
      // Style: (2N38111W 82211266 76400-64(Z
      // console.log(`Label 15 Position Report: between = ${results.groups.between}`);
      ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinates(results.groups.between.substr(0,13)));
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
