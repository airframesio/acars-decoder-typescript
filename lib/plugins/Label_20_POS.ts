import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Position Report
export class Label_20_POS extends DecoderPlugin {
  name = 'label-20-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['20'],
      preambles: ['POS'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    decodeResult.raw.preamble = message.text.substring(0, 3);

    const content = message.text.substring(3);
    const fields = content.split(',');

    if (fields.length == 11) {
      // N38160W077075,,211733,360,OTT,212041,,N42,19689,40,544
      if (options.debug) {
        console.log(`DEBUG: ${this.name}: Variation 1 detected`);
      }
      // Field 1: Coordinates
      const rawCoords = fields[0];
      ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinates(rawCoords));

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'full';
    } else if (fields.length == 5) {
      // N38160W077075,,211733,360,OTT
      if (options.debug) {
        console.log(`DEBUG: ${this.name}: Variation 2 detected`);
      }
      // Field 1: Coordinates
      const position = CoordinateUtils.decodeStringCoordinates(fields[0]);
      if (position) {
        ResultFormatter.position(decodeResult, position);
      }
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'full';
    } else {
      // Unknown!
      if (options.debug) {
        console.log(`DEBUG: ${this.name}: Unknown variation. Field count: ${fields.length}, content: ${content}`);
      }
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
    return decodeResult;
  }
}
