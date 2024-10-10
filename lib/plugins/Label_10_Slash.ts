import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';
import { RouteUtils } from '../utils/route_utils';

export class Label_10_Slash extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-10-slash';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['10'],
      preambles: ['/'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const parts = message.text.split('/');
    if (parts.length < 17) {
      if (options?.debug) {
        console.log(`Decoder: Unknown 10 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const lat = parts[1];
    const lon = parts[2];
    const position = {
      latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1)),
      longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1)),
    }
    ResultFormatter.position(decodeResult, position);
    ResultFormatter.heading(decodeResult, Number(parts[5]));
    ResultFormatter.altitude(decodeResult, 100*Number(parts[6]));
    ResultFormatter.arrivalAirport(decodeResult, parts[7]);
    ResultFormatter.eta(decodeResult, parts[8]+'00');
    const waypoints: Waypoint[] = [{
      name: parts[11],
    },{
      name: parts[12],
      time: DateTimeUtils.convertHHMMSSToTod(parts[13]+'00'),
      timeFormat: 'tod',
    },{
      name: parts[14],
      time: DateTimeUtils.convertHHMMSSToTod(parts[15]+'00'),
      timeFormat: 'tod',
    },];
    decodeResult.raw.route = { waypoints: waypoints };
    decodeResult.formatted.items.push({
        type: 'aircraft_route',
        code: 'ROUTE',
        label: 'Aircraft Route',
        value: RouteUtils.routeToString(decodeResult.raw.route),
    });

    if(parts[16]) {
      ResultFormatter.departureAirport(decodeResult, parts[16]);
    }

    decodeResult.remaining.text = [parts[3], parts[4], ...parts.slice(9,11), ...parts.slice(17)].join('/');

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};