import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_QR extends DecoderPlugin {
  name = 'label-qr';

  qualifiers() {
    return {
      labels: ['QR'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ON Report';

    ResultFormatter.departureAirport(
      decodeResult,
      message.text.substring(0, 4),
    );
    ResultFormatter.arrivalAirport(decodeResult, message.text.substring(4, 8));
    const time = message.text.substring(8, 12);
    if (/^\d{4}$/.test(time)) {
      ResultFormatter.on(decodeResult, DateTimeUtils.convertHHMMSSToTod(time));
      ResultFormatter.unknown(decodeResult, message.text.substring(12));
    } else {
      // time not reported (e.g. 'KSEAKORD    0276')
      ResultFormatter.unknown(decodeResult, message.text.substring(8));
    }

    decodeResult.decoded = true;
    if (!decodeResult.remaining.text) decodeResult.decoder.decodeLevel = 'full';
    else decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}
