import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';
import { RouteUtils } from '../utils/route_utils';

export class Label_10_LDR extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-10-ldr';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['10'],
      preambles: ['LDR'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const parts = message.text.split(',');
    if (parts.length < 17) {
      if (options?.debug) {
        console.log(`Decoder: Unknown 10 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const lat = parts[5];
    const lon = parts[6];
    const position = {
      latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1).trim()),
      longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1).trim()),
    }
    processPosition(decodeResult, position);
    ResultFormatter.altitude(decodeResult, Number(parts[7]));
    ResultFormatter.departureAirport(decodeResult, parts[9]);
    ResultFormatter.arrivalAirport(decodeResult, parts[10]);
    // parts[11] is the alternate airport
    ResultFormatter.arrivalRunway(decodeResult, parts[12].slice(0,-1)); // TODO: find out if anything comes after `/` sometimes
    // parts[13] and parts[14] are alternate runways
    decodeResult.remaining.text = [...parts.slice(0,5), parts[11], ...parts.slice(13)].join(',');

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

function processPosition(decodeResult: DecodeResult, value:{latitude: number, longitude: number}) {
  decodeResult.formatted.items.push({
    type: 'aircraft_position',
    code: 'POS',
    label: 'Aircraft Position',
    value: CoordinateUtils.coordinateString(value),
  });
}

export default {};