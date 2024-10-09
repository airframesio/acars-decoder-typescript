import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_QQ extends DecoderPlugin {
  name = 'label-qq';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['QQ'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    
    ResultFormatter.departureAirport(decodeResult, message.text.substring(0, 4));
    ResultFormatter.arrivalAirport(decodeResult, message.text.substring(4, 8));

    decodeResult.raw.wheels_off = message.text.substring(8, 12);

    if (message.text.substring(12, 19) === "\r\n001FE") {
        decodeResult.raw.day_of_month = message.text.substring(19, 21);
        decodeResult.raw.wheels_off = message.text.substring(21, 27);
        decodeResult.raw.position.latitude = message.text.substring(27, 34);
        decodeResult.raw.position.longitude = message.text.substring(34, 42);
        decodeResult.remaining.text = message.text.substring(42, 45);
        if (decodeResult.remaining.text !== "---") {
            ResultFormatter.groundspeed(decodeResult, message.text.substring(45, 48));
        } else {
            ResultFormatter.unknown(decodeResult, message.text.substring(45, 48));
        }
        ResultFormatter.unknown(decodeResult, message.text.substring(48));
    } else {
        decodeResult.remaining.text = message.text.substring(12);
    }

    decodeResult.formatted.description = 'OFF Report';

    decodeResult.formatted.items.push({
        type: 'wheels_off',
        code: 'WOFF',
        label: 'Wheels OFF',
        value: decodeResult.raw.wheels_off,
    });

    if (decodeResult.raw.position.latitude) {
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(decodeResult.raw.position),
        });
    }

    decodeResult.decoded = true;
    if(decodeResult.remaining.text === "") 
	decodeResult.decoder.decodeLevel = 'full';
    else
	decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
