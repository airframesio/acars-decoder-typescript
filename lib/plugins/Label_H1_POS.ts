import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { FlightPlanUtils } from '../utils/flight_plan_utils';
import { H1Helper } from '../utils/h1_helper';
import { RouteUtils } from '../utils/route_utils';

export class Label_H1_POS extends DecoderPlugin {
  name = 'label-h1-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1", '4J'],
      preambles: ['POS', '#M1BPOS', '/.POS'], //TODO - support data before #
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    const fulllyDecoded = H1Helper.decodeH1Message(decodeResult, message.text);
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = fulllyDecoded ? 'full' : 'partial';
    if (decodeResult.formatted.items.length === 0) {
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

function processUnknown(decodeResult: any, value: string) {
  decodeResult.remaining.text += ',' + value;
}

function processPosition(decodeResult: any, value: string) {
  const position = CoordinateUtils.decodeStringCoordinates(value);
  if (position) {
    decodeResult.raw.position = position
    decodeResult.formatted.items.push({
      type: 'aircraft_position',
      code: 'POS',
      label: 'Aircraft Position',
      value: CoordinateUtils.coordinateString(position),
    });
  }
}
function processAlt(decodeResult: any, value: string) {
  decodeResult.raw.altitude = Number(value) * 100;
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

  const waypoints: Waypoint[] = [lastWaypoint, nextWaypoint, thenWaypoint];
  decodeResult.raw.route = { waypoints: waypoints };
  decodeResult.formatted.items.push({
    type: 'aircraft_route',
    code: 'ROUTE',
    label: 'Aircraft Route',
    value: RouteUtils.routeToString(decodeResult.raw.route),
  });
}

function processChecksum(decodeResult: any, value: string) {
  decodeResult.raw.checksum = Number("0x" + value);
  decodeResult.formatted.items.push({
    type: 'message_checksum',
    code: 'CHECKSUM',
    label: 'Message Checksum',
    value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
  });
}