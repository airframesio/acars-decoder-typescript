import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_H1 extends DecoderPlugin {
  name = 'label-h1';
  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    const msg = message.text.replace(/\n|\r/g, "");
    const decoded = H1Helper.decodeH1Message(decodeResult, msg);
    decodeResult.decoded = decoded;

    decodeResult.decoder.decodeLevel = decodeResult.remaining.text.length===0 ? 'full' : 'partial';
    if (decodeResult.formatted.items.length === 0) {
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
    return decodeResult;
  }
}

export default {};
