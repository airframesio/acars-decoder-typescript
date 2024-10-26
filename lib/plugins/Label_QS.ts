import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

export class Label_QS extends DecoderPlugin {
  name = 'label-qs';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['QS'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'IN Report';

    ResultFormatter.departureAirport(decodeResult, message.text.substring(0, 4));
    ResultFormatter.arrivalAirport(decodeResult, message.text.substring(4, 8));
    ResultFormatter.in(decodeResult, message.text.substring(8, 12));
    ResultFormatter.unknown(decodeResult, message.text.substring(12));

    decodeResult.decoded = true;
    if(!decodeResult.remaining.text)
	decodeResult.decoder.decodeLevel = 'full';
    else
	decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
