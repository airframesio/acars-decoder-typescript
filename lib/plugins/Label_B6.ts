import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

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
    const decodeResult = this.initResult(message, 'CPDLC Message');

    // Full ATN/PM-CPDLC parsing isn't implemented yet, but the body
    // (everything after the leading "/") is at least preserved in the
    // decoded output so consumers don't lose it.
    const body = message.text.substring(1);
    if (body.length > 0) {
      ResultFormatter.text(decodeResult, body);
      this.setDecodeLevel(decodeResult, true, 'partial');
    } else {
      this.setDecodeLevel(decodeResult, false);
    }

    this.debug(options, 'CPDLC body:', body);
    return decodeResult;
  }
}
