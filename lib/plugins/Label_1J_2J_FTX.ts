import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_1J_2J_FTX extends DecoderPlugin {
  name = 'label-1j-2j-ftx';
  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['1J', '2J'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    const msg = message.text.replace(/\n|\r/g, "");
    const parts = msg.split('/');
    let decoded = false;
    if (parts[0].length > 3) {
      decoded = H1Helper.decodeH1Message(decodeResult, msg.slice(parts[0].length - 3));
      // flight number is already decoded in other fields
      decodeResult.remaining.text = parts[0].slice(0,3) + '/' + decodeResult.remaining.text;
    } else {
    decoded = H1Helper.decodeH1Message(decodeResult, msg);
    }
    decodeResult.decoded = decoded;

    decodeResult.decoder.decodeLevel = !decodeResult.remaining.text ? 'full' : 'partial';
    if (decodeResult.formatted.items.length === 0) {
      if (options.debug) {
        console.log(`Decoder: Unknown 1J/2J message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
    return decodeResult;
  }
}

export default {};
