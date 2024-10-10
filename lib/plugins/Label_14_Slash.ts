import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';
import { RouteUtils } from '../utils/route_utils';

export class Label_14_Slash extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-14-slash';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['14'],
      preambles: ['/14'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Wheels Off Report';
    decodeResult.message = message;

    const lines = message.text.split('\r\n');
    const parts = lines[0].split('/');
    if (parts.length !== 4) {
      if (options?.debug) {
        console.log(`Decoder: Unknown 14 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }
    const take_off_data = parts[2].split(' ');
    ResultFormatter.departureAirport(decodeResult, take_off_data[1]);
    ResultFormatter.arrivalAirport(decodeResult, take_off_data[2]);
    ResultFormatter.wheelsUp(decodeResult, DateTimeUtils.convertHHMMSSToTod(take_off_data[4]));
    decodeResult.remaining.text = take_off_data[3];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith('/LOC')) {
        const location = lines[i].split(' ')[1].split(',');
        let position;
        if (location[0].startsWith('+') || location[0].startsWith('-')) {
          position = { latitude: Number(location[0]), longitude: Number(location[1]) };
        } else {
          position = {
            latitude: CoordinateUtils.getDirection(location[0][0]) * CoordinateUtils.dmsToDecimalDegrees(Number(location[0].substring(1, 3)), Number(location[0].substring(3, 5)), Number(location[0].substring(5, 7))),
            longitude:CoordinateUtils.getDirection(location[1][0])  * CoordinateUtils.dmsToDecimalDegrees(Number(location[1].substring(1, 4)), Number(location[1].substring(4, 6)), Number(location[1].substring(6, 8))),
          }
        }
        ResultFormatter.position(decodeResult, position);
      } else {
        decodeResult.remaining.text += '\r\n' + lines[i];
      }
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};