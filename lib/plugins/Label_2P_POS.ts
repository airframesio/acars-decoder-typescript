import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_2P_POS extends DecoderPlugin {
  name = 'label-2p-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["2P"],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
      let decodeResult = this.defaultResult();
      decodeResult.decoder.name = this.name;
      decodeResult.message = message;

      const msg = message.text.replace(/\n|\r/g, "");
      const decoded = H1Helper.decodeH1Message(decodeResult, msg);
      decodeResult.decoded = decoded;

      decodeResult.decoder.decodeLevel = !decodeResult.remaining.text ? 'full' : 'partial';
      if (decodeResult.formatted.items.length === 0) {
        if (options.debug) {
          console.log(`Decoder: Unknown H1 message: ${message.text}`);
        }
        ResultFormatter.unknown(decodeResult, message.text);
        decodeResult.decoded = false;
        decodeResult.decoder.decodeLevel = 'none';
      }
      return decodeResult;
    }
}

export default {};
