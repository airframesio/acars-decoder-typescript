import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

export class Label_H1 extends DecoderPlugin {
  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult: any = this.defaultResult();
    // console.log('DECODER: H1 detected');

    return decodeResult;
  }
}

export default {};
