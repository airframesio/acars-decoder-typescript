import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

// CPDLC
export class Label_B6_Forwardslash extends DecoderPlugin {
  name = 'label-b6-forwardslash';

  qualifiers() {
    return {
      labels: ['B6'],
      preambles: ['/'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'CPDLC Message';
    decodeResult.message = message;

    if (options.debug) {
      console.log('CPDLC: ' + message);
    }

    return decodeResult;
  }
}
