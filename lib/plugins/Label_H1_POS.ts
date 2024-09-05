import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { FlightPlanUtils } from '../utils/flight_plan_utils';
import { RouteUtils } from '../utils/route_utils';

export class Label_H1_POS extends DecoderPlugin {
  name = 'label-h1-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['POS', '#M1BPOS', '/.POS'], //TODO - support data before #
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    const checksum = message.text.slice(-4);
    const header = findHeader(message.text.slice(0,-4));
    const decoded = FlightPlanUtils.processFlightPlan(decodeResult, header.split(':'));
    //strip POS and checksum
    const parts = message.text.replace(header, '').slice(0,-4).split(',');
    if(parts.length==1) {
      if(decoded) {
        processChecksum(decodeResult, checksum);
        decodeResult.decoded = true;
        decodeResult.decoder.decodeLevel = 'full';
      } else if(decodeResult.remaining.text.length > 0) {
        processChecksum(decodeResult, checksum);
        decodeResult.decoded = true;
        decodeResult.decoder.decodeLevel = 'partial';
      } else {
        decodeResult.decoded = false;
        decodeResult.decoder.decodeLevel = 'none';
      }
    } else if(parts.length === 10) { // variant 4
      processAlt(decodeResult, parts[3]);
      processRoute(decodeResult, parts[1], parts[2], parts[4], parts[5], parts[6]);
      processTemp(decodeResult, parts[7]);
      processUnknown(decodeResult, parts[8]);
      processUnknown(decodeResult, parts[9]);
      processChecksum(decodeResult, checksum);
      
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    } else if(parts.length === 11) { // variant 1

      processAlt(decodeResult, parts[3]);
      processRoute(decodeResult, parts[1], parts[2], parts[4], parts[5], parts[6], parts[10]);
      processTemp(decodeResult, parts[7]);
      processUnknown(decodeResult, parts[8]);
      processUnknown(decodeResult, parts[9]);
      processChecksum(decodeResult, checksum);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    }  else if(parts.length === 12) { // variant 9

      // convert DDMMYY to MMDDYY as that's what processRoute expects
      const date = parts[11].substring(2,4) + parts[11].substring(0,2) + parts[11].substring(4,6);
      processUnknown(decodeResult, parts[3]);
      processRoute(decodeResult, parts[1], parts[2], parts[4], parts[5], parts[6], date);
      processTemp(decodeResult, parts[7]);
      processUnknown(decodeResult, parts[8]);
      processUnknown(decodeResult, parts[9]);
      processUnknown(decodeResult, parts[10]); //message timestamp?
      processChecksum(decodeResult, checksum);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    }  else if(parts.length === 14) { // variant 2

      processAlt(decodeResult, parts[3]);
      processRoute(decodeResult, parts[1], parts[2], parts[4], parts[5], parts[6]);
      processTemp(decodeResult, parts[7]);
      processUnknown(decodeResult, parts[8]);
      processUnknown(decodeResult, parts[9]);
      processGndspd(decodeResult, parts[10]);
      processUnknown(decodeResult, parts[11]);
      processUnknown(decodeResult, parts[12]);
      processUnknown(decodeResult, parts[13]);
      processChecksum(decodeResult, checksum);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    } else if(parts.length === 15) { // variant 6
    processUnknown(decodeResult, parts[1]);
    let date = undefined;
    if(parts[2].startsWith('/DC')) {
      date = parts[2].substring(3);
    } else {
      processUnknown(decodeResult, parts[2]);
    }
    processUnknown(decodeResult, parts[3]);
    const fields = parts[4].split('/');
    for(let i=0; i<fields.length; ++i) {
      const field = fields[i];
      if(field.startsWith('PS')) {
        processPosition(decodeResult, field.substring(2));
      } else {
        if(i===0) {
          processUnknown(decodeResult, field);
        } else {
          processUnknown(decodeResult, '/'+field);
        }
      }
    }
    processRoute(decodeResult, parts[7], parts[5], parts[9], parts[8], undefined, date);
    processAlt(decodeResult, parts[6]);
    processTemp(decodeResult, parts[10]);
    processUnknown(decodeResult, parts[11]);
    processUnknown(decodeResult, parts[12]);
    processUnknown(decodeResult, parts[13]);
    processUnknown(decodeResult, parts[14]);
    processChecksum(decodeResult, checksum);

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
  } else if(parts.length === 21) { // variant 8
    processRunway(decodeResult, parts[1]);
    processUnknown(decodeResult,parts.slice(2,11).join(','));
    processTemp(decodeResult, parts[11]);
    processUnknown(decodeResult,parts.slice(12,20).join(','));
    FlightPlanUtils.processFlightPlan(decodeResult, parts[20].split(':'));
    processChecksum(decodeResult, checksum);

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
  }else if(parts.length === 32) { // #M1B long variant
      processRunway(decodeResult, parts[1]);
      const time = parts[2];
      processUnknown(decodeResult, parts[3]);
      const past = parts[4];
      processUnknown(decodeResult, parts[5]);
      const eta = parts[6];
      const next = parts[7];
      processUnknown(decodeResult, parts.slice(8,14).join(','));
      //processDeptApt(decodeResult, parts[14]); // in flightplan
      //processArrvApt(decodeResult, parts[15]); // in flightplan
      processUnknown(decodeResult, parts[16]);
      processUnknown(decodeResult, parts[17]);
      processUnknown(decodeResult, parts[18]);
      processGndspd(decodeResult, parts[19],)
      processUnknown(decodeResult, parts[20]);
      processUnknown(decodeResult, parts[21]);
      processAlt(decodeResult, parts[22]);
      processUnknown(decodeResult, parts.slice(23,31).join(','));
      const allProcessed = FlightPlanUtils.processFlightPlan(decodeResult, (parts[31]+checksum).split(':')); //checksum isnt a checksum here
      processRoute(decodeResult, past,time, next, eta); // TODO pull `then` from flight plan

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    } else {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      decodeResult.remaining.text += message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

	  return decodeResult;
  }
}

export default {};

function processUnknown(decodeResult: any, value: string) {
  decodeResult.remaining.text += ',' + value;
}

function processPosition(decodeResult: any, value: string) {
  const position = CoordinateUtils.decodeStringCoordinates(value);
  if(position) {
    decodeResult.raw.position = position
    decodeResult.formatted.items.push({
      type: 'aircraft_position',
      code: 'POS' ,
      label: 'Aircraft Position',
      value: CoordinateUtils.coordinateString(position),
    });
  }
}
function processAlt(decodeResult: any, value: string) {
  decodeResult.raw.altitude = Number(value)*100;
  decodeResult.formatted.items.push({
    type: 'altitude',
    code: 'ALT',
    label: 'Altitude',
    value: `${decodeResult.raw.altitude} feet`,
  });
}
function processTemp(decodeResult: any, value: string) {
  decodeResult.raw.outside_air_temperature = Number(value.substring(1)) * (value.charAt(0) === 'M' ? -1 : 1);
  decodeResult.formatted.items.push({
    type: 'outside_air_temperature',
    code: 'OATEMP',
    label: 'Outside Air Temperature (C)',
    value: `${decodeResult.raw.outside_air_temperature}`,
  });
}

function processRunway(decodeResult: any, value: string) {
  decodeResult.raw.arrival_runway = value.replace('RW', '');
  decodeResult.formatted.items.push({
    type: 'runway',
    label: 'Arrival Runway',
    value: decodeResult.raw.arrival_runway,
  });
};

function processGndspd(decodeResult: any, value: string) {
  decodeResult.raw.groundspeed = Number(value);
  decodeResult.formatted.items.push({
    type: 'aircraft_groundspeed',
    code: 'GSPD',
    label: 'Aircraft Groundspeed',
    value: `${decodeResult.raw.groundspeed}`
  });
}

function processRoute(decodeResult: any, last: string, time: string, next: string, eta: string, then?: string, date?: string) {
  const lastTime = date ? DateTimeUtils.convertDateTimeToEpoch(time, date) : DateTimeUtils.convertHHMMSSToTod(time);
  const nextTime = date ? DateTimeUtils.convertDateTimeToEpoch(eta, date) : DateTimeUtils.convertHHMMSSToTod(eta);
  const timeFormat = date ? 'epoch' : 'tod';

  const lastWaypoint = RouteUtils.getWaypoint(last);
  lastWaypoint.time = lastTime;
  lastWaypoint.timeFormat = timeFormat;

  const nextWaypoint = RouteUtils.getWaypoint(next);
  nextWaypoint.time = nextTime;
  nextWaypoint.timeFormat = timeFormat;

  const thenWaypoint = RouteUtils.getWaypoint(then || '?');
  
  const waypoints : Waypoint[] = [lastWaypoint, nextWaypoint, thenWaypoint];
  decodeResult.raw.route = {waypoints: waypoints};
  decodeResult.formatted.items.push({
    type: 'aircraft_route',
    code: 'ROUTE',
    label: 'Aircraft Route',
    value: RouteUtils.routeToString(decodeResult.raw.route),
  });
}

function processChecksum(decodeResult: any, value: string) {
  decodeResult.raw.checksum = Number("0x"+value);
  decodeResult.formatted.items.push({
    type: 'message_checksum',
    code: 'CHECKSUM',
    label: 'Message Checksum',
    value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
  });    
}

/**
 * naive implementation to find the end of the
 * 
 * corrently only lookint at `/TS in which the format is `/TSHHMMSS,DDMMYY
 * @param text 
 * @returns 
 */
function findHeader(text: string) {
  const parts = text.split(',');
  const header = parts[0];
  if(header.indexOf('/TS') === -1) {
    return header;
  }
  return parts[0] + ',' + parts[1];
}
