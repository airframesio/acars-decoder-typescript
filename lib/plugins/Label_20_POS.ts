import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Position Report
export class Label_20_POS extends DecoderPlugin {
  name = 'label-20-pos';

  qualifiers() {
    return {
      labels: ['20'],
      preambles: ['POS'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');

    decodeResult.raw.preamble = message.text.substring(0, 3);

    const content = message.text.substring(3);
    const fields = content.split(',');

    if (fields.length == 11) {
      this.debug(options, 'Variation 1 detected');
      const rawCoords = fields[0];
      ResultFormatter.position(
        decodeResult,
        CoordinateUtils.decodeStringCoordinates(rawCoords),
      );

      this.setDecodeLevel(decodeResult, true, 'full');
    } else if (fields.length == 5) {
      this.debug(options, 'Variation 2 detected');
      const position = CoordinateUtils.decodeStringCoordinates(fields[0]);
      if (position) {
        ResultFormatter.position(decodeResult, position);
      }
      this.setDecodeLevel(decodeResult, true, 'full');
    } else {
      this.debug(
        options,
        `Unknown variation. Field count: ${fields.length}, content: ${content}`,
      );
      this.setDecodeLevel(decodeResult, false);
    }
    return decodeResult;
  }
}
