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

      // Only transplant message text if the MIAM core decoded message passed CRC and is complete
      if (miamResult.decoded &&
        miamResult.message.data !== undefined &&
        miamResult.message.data.crcOk &&
        miamResult.message.data.complete &&
        miamResult.message.data.acars !== undefined) {

          ResultFormatter.label(decodeResult, miamResult.message.data.acars.label);
          if(miamResult.message.data.acars.sublabel) {
          ResultFormatter.sublabel(decodeResult, miamResult.message.data.acars.sublabel);
          }
          if(miamResult.message.data.acars.tail) {
            ResultFormatter.tail(decodeResult, miamResult.message.data.acars.tail);
          }

        const decoded = this.decoder.decode({
          label: miamResult.message.data.acars.label,
          sublabel: miamResult.message.data.acars.sublabel,
          text: miamResult.message.data.acars.text? miamResult.message.data.acars.text : '',
        }, options);

        if(decoded.decoded) {
          decodeResult.raw = {...decodeResult.raw, ...decoded.raw};
          decodeResult.formatted.items.push(...decoded.formatted.items);
        } else if(miamResult.message.data.acars.text) {
          ResultFormatter.text(decodeResult, miamResult.message.data.acars.text);
        }

        decodeResult.decoded = true;
        decodeResult.decoder.decodeLevel = decoded.decoder.decodeLevel === 'full' ? 'full' : 'partial';
        // This is for the existing unit test, i don't know if we actually want to do this
        message.label = miamResult.message.data.acars.label;
        message.sublabel = miamResult.message.data.acars.sublabel;
        message.text = miamResult.message.data.acars.text? miamResult.message.data.acars.text : '';

        return decodeResult;
      }
    return decodeResult;
  }
}

export default {};
