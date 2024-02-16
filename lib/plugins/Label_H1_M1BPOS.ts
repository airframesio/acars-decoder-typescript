import { DecoderPlugin } from '../DecoderPlugin';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { RouteUtils } from '../utils/route_utils';

export class Label_H1_M1BPOS extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-h1-m1bpos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
      preambles: ['#M1BPOS'],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;

    if (options.debug) {
      console.log('DECODER: #M1BPOS detected');
    }
    const parts = message.text.replace('#M1BPOS', '').split('/');
    const firstHalf = parts[0];
    const secondHalf = parts[1];
    const items = firstHalf.split(',');

    decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(items[0]);
    if(decodeResult.raw.position) {
     decodeResult.formatted.items.push({
        type: 'position',
        code: 'POS' ,
        label: 'Position',
        value: CoordinateUtils.coordinateString(decodeResult.raw.position),
      });
    }

      const route = items.slice(1).filter((part: any) => !/^\d(.+)$/.test(part));
      const waypoints = route.map((hop: any) => RouteUtils.getWaypoint(hop || '?'));
      decodeResult.raw.route = {waypoints: waypoints};

      decodeResult.formatted.description = 'Position Report';

      decodeResult.formatted.items.push({
          type: 'route',
          label: 'Route',
          value: RouteUtils.routeToString(decodeResult.raw.route),
      });

      decodeResult.decoded = true;
      decodeResult.decodeLevel = 'partial';
    decodeResult.remaining.text = secondHalf;

    return decodeResult;
  }
}

export default {};
