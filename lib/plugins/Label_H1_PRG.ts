import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';

export class Label_H1_PRG extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-h1-prg';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
      preambles: ['PRG', '#M1BPRG'],
    };
  }

  // https://acars-vdl2.groups.io/g/main/topic/decoding_last_part_of_prg/28964299
  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Progress Report';
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