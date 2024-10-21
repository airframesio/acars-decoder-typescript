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
    decodeResult.message = message;
    decodeResult.formatted.description = 'OFF Report';
    
    ResultFormatter.departureAirport(decodeResult, message.text.substring(0, 4));
    ResultFormatter.arrivalAirport(decodeResult, message.text.substring(4, 8));

    decodeResult.raw.wheels_off = message.text.substring(8, 12);

    if (message.text.substring(12, 19) === "\r\n001FE") {
        decodeResult.raw.day_of_month = message.text.substring(19, 21);
        decodeResult.raw.wheels_off = message.text.substring(21, 27);
        let latdir = message.text.substring(27, 28);
        let latdeg = Number(message.text.substring(28, 30));
        let latmin = Number(message.text.substring(30, 34));
        let londir = message.text.substring(34, 35);
        let londeg = Number(message.text.substring(35, 38));
        let lonmin = Number(message.text.substring(38, 42));
        decodeResult.raw.position = {
            latitude: (latdeg + latmin/60) * (latdir === 'N' ? 1 : -1),
            longitude: (londeg + lonmin/60) * (londir === 'E' ? 1 : -1),
        };
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

    decodeResult.formatted.items.push({
        type: 'wheels_off',
        code: 'WOFF',
        label: 'Wheels OFF',
        value: decodeResult.raw.wheels_off,
    });

    if (decodeResult.raw.position) {
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(decodeResult.raw.position),
        });
    }

    decodeResult.decoded = true;
    if(!decodeResult.remaining.text)
        decodeResult.decoder.decodeLevel = 'full';
    else
        decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
