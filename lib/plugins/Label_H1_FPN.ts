import { DecoderPlugin } from '../DecoderPlugin';
import { Message } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';

export class Label_H1_FPN extends DecoderPlugin {
  name = 'label-h1-fpn';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['FPN', '#M1BFPN'],
    };
  }

  decode(message: Message, options: any = {}): any {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Flight Plan';
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    const msg = message.text.replace(/\n|\r/g, "");
    const fulllyDecoded = H1Helper.decodeH1Message(decodeResult, msg);
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
