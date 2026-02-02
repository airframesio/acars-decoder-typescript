import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { MIAMCoreUtils } from '../utils/miam';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_MA extends DecoderPlugin {
  name = 'label-ma';
  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['MA'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    const miamResult = MIAMCoreUtils.parse(message.text);
    if (miamResult.decoded && miamResult.message.data && miamResult.message.data.acars) {

      decodeResult.decoded = true;
      ResultFormatter.label(decodeResult, miamResult.message.data.acars.label);
      if(miamResult.message.data.acars.sublabel) {
        ResultFormatter.sublabel(decodeResult, miamResult.message.data.acars.sublabel);
      }
      if(miamResult.message.data.acars.tail) {
        ResultFormatter.tail(decodeResult, miamResult.message.data.acars.tail);
      }

      const messageText = miamResult.message.data.acars.text;
      // Only transplant message text if the MIAM core decoded message passed CRC and is complete
      if(miamResult.message.data.crcOk && miamResult.message.data.complete && messageText) {
        decodeResult.decoder.decodeLevel = 'full';
        const decoded = this.decoder.decode({
          label: miamResult.message.data.acars.label,
          sublabel: miamResult.message.data.acars.sublabel,
          text: messageText,
        }, options);

        if(decoded.decoded) {
          // decodeResult.decoder.decodeLevel = decoded.decoder.decodeLevel;
          decodeResult.raw = {...decodeResult.raw, ...decoded.raw};
          decodeResult.formatted.items.push(...decoded.formatted.items);
        } else {
          ResultFormatter.text(decodeResult, messageText);
        }
      } else if(messageText) {
        decodeResult.decoder.decodeLevel = 'partial';
        ResultFormatter.text(decodeResult, messageText);
      } else {
        decodeResult.decoder.decodeLevel = 'partial';
      }
    }
    return decodeResult;
  }
}
