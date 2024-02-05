import { decode } from 'base85';
import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { RouteUtils } from '../utils/route_utils';

export class Label_H1_FPN extends DecoderPlugin {
  name = 'label-h1-fpn';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['FPN'],
    };
  }

  decode(message: any, options: any = {} ): any {
    let decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Flight Plan';
    decodeResult.message = message;

    const checksum = message.text.slice(-4);
    const data = message.text.slice(0, message.text.length-4).split(':');

    if(data[0].startsWith('FPN/')) {
      let allKnownFields = parseHeader(decodeResult, data[0]);
      for(let i=1; i< data.length; i+=2) {
        const key = data[i];
        const value = data[i+1];
        // TODO: discuss how store commented out bits as both raw and formatted
        switch(key) {
          // case 'A': // Arrival Procedure (?)
          // break;
          case 'AA':
            addArrivalAirport(decodeResult, value);
          break;
          // case 'CR': // Current Route (?)
          // break;
          // case 'D': // Departure Procedure
          // break;
          case 'DA':
            addDepartureAirport(decodeResult, value);
          break;
          case 'F': // First Waypoint
            addRoute(decodeResult, value);
          break;
          case 'R':
            addDepartureRunway(decodeResult, value);
          default:
            if(allKnownFields) {
              decodeResult.remaining.text = '';
              allKnownFields = false;
            }
            decodeResult.remaining.text += `,${data[i]}`;
            decodeResult.decoder.decodeLevel = 'partial';
        }
      }

      addChecksum(decodeResult, checksum);
      decodeResult.decoded = true;
      if(allKnownFields) {
        decodeResult.decoder.decodeLevel = 'full';
      }
    } else {// Unknown
      if (options?.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
	  return decodeResult;
  }
}

export default {};

function parseHeader(decodeResult: any, header: string): boolean {
  let allKnownFields = true;
  const fields = header.split('/');
  if(fields.length == 3) {
    decodeResult.raw.flight_number = fields[1].substring(2); // Strip off 'FN'
  } else if(fields.length > 3) {
    decodeResult.remaining.text = fields.slice(2,-1).join('/');
    allKnownFields = false
  }
  decodeResult.raw.route_status = fields[fields.length - 1];

  var text;
  if(decodeResult.raw.route_status == 'RP'){
    text = 'Route Planned';
  } else if(decodeResult.raw.route_status == 'RI') {
    text = 'Route Inactive';
  } else {
    text = decodeResult.raw.route_status;
  }
  decodeResult.formatted.items.push({
    type: 'status',
    code: 'ROUTE_STATUS',
    label: 'Route Status',
    value: text,
  });
  return allKnownFields;
};

function addChecksum(decodeResult: any, value: string) {
  decodeResult.raw.checksum = Number("0x"+value);
  decodeResult.formatted.items.push({
    type: 'message_checksum',
    code: 'CHECKSUM',
    label: 'Message Checksum',
    value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
  });    
};

function addArrivalAirport(decodeResult: any, value: string) {
  decodeResult.raw.arrival_icao = value;
  decodeResult.formatted.items.push({
    type: 'destination',
    code: 'DST',
    label: 'Destination',
    value: decodeResult.raw.arrival_icao,
  });
};

function addDepartureAirport(decodeResult: any, value: string) {
  decodeResult.raw.departure_icao = value;
  decodeResult.formatted.items.push({
    type: 'origin',
    code: 'ORG',
    label: 'Origin',
    value: decodeResult.raw.departure_icao,
  });
};

function addDepartureRunway(decodeResult: any, value: string) {
  decodeResult.raw.runway = value;
  decodeResult.formatted.items.push({
    type: 'runway',
    label: 'Runway',
    value: decodeResult.raw.runway,
  });
};

function addRoute(decodeResult: any, value: string) {
  const route = value.split('.');
  decodeResult.raw.route = route.map((leg)=> CoordinateUtils.getWaypoint(leg));
  decodeResult.formatted.items.push({
    type: 'aircraft_route',
    code: 'ROUTE',
    label: 'Aircraft Route',
    value: RouteUtils.routeToString(decodeResult.raw.route),
  });
};



