import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';
import { RouteUtils } from '../utils/route_utils';

export class Label_13Through18_Slash extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-13-18-slash';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['13', '14', '15', '16', '17', '18'],
      preambles: ['/'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    const lines = message.text.split('\r\n');
    const parts = lines[0].split('/');
    const labelNumber = Number(parts[1].substring(0, 2));
    decodeResult.formatted.description = getMsgType(labelNumber);

    // labels 13-17 have 4 parts, label 18 has 7 parts
    if ((labelNumber !== 18 && parts.length !== 4) || (labelNumber === 18 && parts.length !== 7)) {
      if (options?.debug) {
        console.log(`Decoder: Unknown OOOI message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    // parts[0] === ''
    const data = parts[2].split(' ');
    ResultFormatter.departureAirport(decodeResult, data[1]);
    ResultFormatter.arrivalAirport(decodeResult, data[2]);
    decodeResult.raw.day_of_month = Number(data[3]);
    const time = DateTimeUtils.convertHHMMSSToTod(data[4])
    if (labelNumber === 13) {
      ResultFormatter.out(decodeResult, time);
    } else if (labelNumber === 14) {
      ResultFormatter.off(decodeResult, time);
    } else if (labelNumber === 15) {
      ResultFormatter.on(decodeResult, time);
    } else if (labelNumber === 16) {
      ResultFormatter.in(decodeResult, time);
    }

    if (parts.length === 7) {
      ResultFormatter.unknownArr(decodeResult, parts.slice(4), '/');
    }

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith('/LOC')) {
        const location = lines[i].substring(5).split(','); // strip off '/LOC'
        let position;
        if (location[0].startsWith('+') || location[0].startsWith('-')) {
          position = { latitude: Number(location[0]), longitude: Number(location[1]) };
        } else {
          position = {
            latitude: CoordinateUtils.getDirection(location[0][0]) * CoordinateUtils.dmsToDecimalDegrees(Number(location[0].substring(1, 3)), Number(location[0].substring(3, 5)), Number(location[0].substring(5, 7))),
            longitude: CoordinateUtils.getDirection(location[1][0]) * CoordinateUtils.dmsToDecimalDegrees(Number(location[1].substring(1, 4)), Number(location[1].substring(4, 6)), Number(location[1].substring(6, 8))),
          }
        }
        ResultFormatter.position(decodeResult, position);
      } else {
        ResultFormatter.unknown(decodeResult, lines[i], "\r\n");
      }
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = decodeResult.remaining.text ? 'partial' : 'full';
    return decodeResult;
  }
}

export default {};

function getMsgType(labelNumber: number): string {
  if (labelNumber === 13) {
    return 'Out of Gate Report'
  }
  if (labelNumber === 14) {
    return 'Takeoff Report'
  }
  if (labelNumber === 15) {
    return 'On Ground Report'
  }
  if (labelNumber === 16) {
    return 'In Gate Report'
  }
  if (labelNumber === 17) {
    return 'Post Report'
  }
  if (labelNumber === 18) {
    return 'Post Times Report'
  }

  return 'Unknown';
}
