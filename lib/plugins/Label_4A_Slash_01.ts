import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4A_Slash_01 extends DecoderPlugin {
  name = 'label-4a-slash-01';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['4A'],
      preambles: ['/01'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Latest New Format';

    decodeResult.decoded = true;
    if (message.text.length === 5 && message.text.substring(0,4) === "/01-") {
        ResultFormatter.unknown(decodeResult, message.text.substring(4));
    } else {
        decodeResult.decoded = false;
        ResultFormatter.unknown(decodeResult, message.text);
    }

    if (decodeResult.decoded) {
        if(!decodeResult.remaining.text)
            decodeResult.decoder.decodeLevel = 'full';
        else
            decodeResult.decoder.decodeLevel = 'partial';
    } else {
        decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}
