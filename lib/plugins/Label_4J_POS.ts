import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4J_POS extends DecoderPlugin {
  name = 'label-4j-pos';
  qualifiers() {
    return {
      labels: ['4J'],
      preambles: ['POS/'],
    };
  }

  // copied from Label_H1.ts since i don't really want to have to have
  // something named like that decode more than 1 type
  // if we figure out a good name, i'll combine them
  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    const msg = message.text.replace(/\n|\r/g, '');
    const decoded = H1Helper.decodeH1Message(decodeResult, msg);
    decodeResult.decoded = decoded;

    decodeResult.decoder.decodeLevel = !decodeResult.remaining.text
      ? 'full'
      : 'partial';
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
