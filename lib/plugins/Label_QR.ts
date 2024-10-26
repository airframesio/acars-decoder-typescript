import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

export class Label_QR extends DecoderPlugin {
  name = 'label-qr';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['QR'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ON Report';

    ResultFormatter.departureAirport(decodeResult, message.text.substring(0, 4));
    ResultFormatter.arrivalAirport(decodeResult, message.text.substring(4, 8));
    ResultFormatter.on(decodeResult, message.text.substring(8, 12));
    decodeResult.remaining.text = message.text.substring(12);

    decodeResult.decoded = true;
    if(!decodeResult.remaining.text) 
	decodeResult.decoder.decodeLevel = 'full';
    else
	decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
