import { DecoderPlugin } from '../DecoderPlugin';
import { Message } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';

export class Label_H1_FTX extends DecoderPlugin {
  name = 'label-h1-ftx';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['FTX', '- #MDFTX'],
    };
  }

  decode(message: Message, options: any = {}): any {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Free Text';
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    const fulllyDecoded = H1Helper.decodeH1Message(decodeResult, message.text);
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = fulllyDecoded ? 'full' : 'partial';
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
