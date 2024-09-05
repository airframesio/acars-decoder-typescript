import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';

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
    const decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';

    const twoZeeRegex = /^\(2(?<between>.+)\(Z$/;
    const results = message.text.match(twoZeeRegex);
    if (results) {
      // Style: (2N38111W 82211266 76400-64(Z
      // console.log(`Label 15 Position Report: between = ${results.groups.between}`);
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(results.groups.between.substr(0,13));
      if(decodeResult.raw.position) {
	decodeResult.formatted.items.push({
        type: 'position',
	code: 'POS' ,
        label: 'Position',
        value: CoordinateUtils.coordinateString(decodeResult.raw.position),
      });
     }
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
