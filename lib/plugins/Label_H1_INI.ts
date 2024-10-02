import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';

export class Label_H1_INI extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-h1-ini';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
      preambles: ['INI', '- #MDINI'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = '??? Report';
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    const fulllyDecoded = H1Helper.decodeH1Message(decodeResult, message.text);
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = fulllyDecoded ? 'full' : 'partial';
    if (decodeResult.formatted.items.length === 0) {
      if (options?.debug) {
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