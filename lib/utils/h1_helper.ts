import { DateTimeUtils } from '../DateTimeUtils';
import { DecodeResult } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { Wind } from '../types/wind';
import { CoordinateUtils } from './coordinate_utils';
import { FlightPlanUtils } from './flight_plan_utils';
import { ResultFormatter } from './result_formatter';
import { RouteUtils } from './route_utils';

export class H1Helper {
  public static decodeH1Message(decodeResult: DecodeResult, message: string) {
    const checksum = message.slice(-4);
    const data = message.slice(0, message.length - 4);
    if (calculateChecksum(data) !== checksum) {
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';

      return false;
    }
    const fields = data.split('/');
    const canDecode = parseMessageType(decodeResult, fields[0]);
    if (!canDecode) {
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return false;
    }

    for (let i = 1; i < fields.length; ++i) {
      const key = fields[i].substring(0, 2);
      const data = fields[i].substring(2);
      switch (key) {
        case 'AF':
          processAirField(decodeResult, data.split(','));
          break;
        case 'AK':
          ResultFormatter.unknown(decodeResult, fields[i], '/');
          // processAK(decodeResult, data.split(','));
          break;
        case 'CG':
          processCenterOfGravity(decodeResult, data.split(','));
          break;
        case 'DC':
          processDateCode(decodeResult, data.split(','));
          break;
        case 'DI':
          ResultFormatter.unknown(decodeResult, fields[i], '/');
          // processDI(decodeResult, data.split(','));
          break;
        case 'DT': //processDestination?
          processDT(decodeResult, data.split(','));
          break;
        case 'DQ':
          ResultFormatter.unknown(decodeResult, fields[i], '/');
          // processDQ(decodeResult, data.split(','));
          break;
        case 'ET':
          processETA(data, decodeResult, fields, i);
          break;
        case 'FB':
          ResultFormatter.currentFuel(decodeResult, parseInt(data, 10));
          break;
        case 'FN':
          decodeResult.raw.flight_number = data;
          break;
        case 'FX':
          ResultFormatter.freetext(decodeResult, data);
          break;
        case 'GA':
          ResultFormatter.unknown(decodeResult, fields[i], '/');
          // processGA(decodeResult, data.split(','));
          break;
        case 'ID':
          processIdentification(decodeResult, data.split(','));
          break;
        case 'LR':
          processLandingReport(decodeResult, data.split(','));
          break;
        case 'PR':
          // TODO: decode /PR fields
          ResultFormatter.unknown(decodeResult, fields[i], '/');
          break;
        case 'PS': // Position
          H1Helper.processPS(decodeResult, data.split(','));
          break;
        case 'RF':
        case 'RI':
        case 'RM':
        case 'RP':
          // TODO - use key/data instead of whole message
          FlightPlanUtils.processFlightPlan(decodeResult, fields[i].split(':'));
          break;
        case 'SN':
          decodeResult.raw.serial_number = data;
          break;
        case 'SP':
          ResultFormatter.unknown(decodeResult, fields[i], '/');
          // processSP(decodeResult, data.split(','));
          break;
        case 'TD':
          processTimeOfDeparture(decodeResult, data.split(','));
          break;
        case 'TS':
          H1Helper.processTimeStamp(decodeResult, data.split(','));
          break;
        case 'VR':
          ResultFormatter.version(decodeResult, parseInt(data, 10) / 10);
          break;
        case 'WD':
          processWindData(decodeResult, data);
          break;
        case 'WQ':
          ResultFormatter.unknown(decodeResult, fields[i], '/');
          // processWindQuery(decodeResult, data);
          break;
        default:
          ResultFormatter.unknown(decodeResult, fields[i], '/');
      }
    }

    ResultFormatter.checksum(decodeResult, checksum);

    return true;
  }

  public static processPS(decodeResult: DecodeResult, data: string[]) {
    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
      data[0],
    );
    if (position) {
      decodeResult.raw.position = position;
      decodeResult.formatted.items.push({
        type: 'aircraft_position',
        code: 'POS',
        label: 'Aircraft Position',
        value: CoordinateUtils.coordinateString(position),
      });
    }
    if (data.length === 9) {
      // variant 7
      processRoute(decodeResult, data[3], data[1], data[5], data[4], undefined);
      ResultFormatter.altitude(decodeResult, Number(data[2]) * 100);
      ResultFormatter.temperature(decodeResult, data[6]);
      ResultFormatter.unknown(decodeResult, data[7]);
      ResultFormatter.unknown(decodeResult, data[8]);
    }
    if (data.length === 14) {
      // variant 2
      ResultFormatter.altitude(decodeResult, Number(data[3]) * 100);
      processRoute(decodeResult, data[1], data[2], data[4], data[5], data[6]);
      ResultFormatter.temperature(decodeResult, data[7]);
      ResultFormatter.unknownArr(decodeResult, data.slice(8));
    }
  }

  public static processPosition(decodeResult: DecodeResult, data: string[]) {
    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
      data[0],
    );
    if (position) {
      ResultFormatter.position(decodeResult, position);
    }
    if (data.length >= 10) {
      // variant 1, short
      ResultFormatter.altitude(decodeResult, Number(data[3]) * 100);
      processRoute(decodeResult, data[1], data[2], data[4], data[5], data[6]);
      ResultFormatter.temperature(decodeResult, data[7]);
      ResultFormatter.unknown(decodeResult, data[8]);
      ResultFormatter.unknown(decodeResult, data[9]);
    }
    if (data.length >= 14) {
      // variant 2,long
      ResultFormatter.unknownArr(decodeResult, data.slice(10));
    }
  }

  public static processTimeStamp(decodeResult: DecodeResult, data: string[]) {
    if (data.length > 2) {
      const positionData = data.slice(1);
      positionData[0] = positionData[0].substring(6); // strip time from position field
      this.processPosition(decodeResult, positionData);
    }
    let time = DateTimeUtils.convertDateTimeToEpoch(
      data[0],
      data[1].substring(0, 6),
    );

    if (Number.isNaN(time)) {
      // convert DDMMYY to MMDDYY - TODO figure out a better way to determine
      const date =
        data[1].substring(2, 4) +
        data[1].substring(0, 2) +
        data[1].substring(4, 6);
      time = DateTimeUtils.convertDateTimeToEpoch(data[0], date);
    }
    decodeResult.raw.message_timestamp = time;
  }
}

function processETA(
  data: string,
  decodeResult: DecodeResult,
  fields: string[],
  i: number,
) {
  if (data.length === 5) {
    // 1 digit day
    ResultFormatter.day(decodeResult, Number(data.substring(0, 1)));
    ResultFormatter.eta(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(data.substring(1)),
    );
  } else if (data.length === 6) {
    // 2 digit day
    ResultFormatter.day(decodeResult, Number(data.substring(0, 2)));
    ResultFormatter.eta(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(data.substring(2)),
    );
  } else {
    ResultFormatter.unknown(decodeResult, fields[i], '/');
  }
}

function processAirField(decodeResult: DecodeResult, data: string[]) {
  if (data.length === 2) {
    ResultFormatter.departureAirport(decodeResult, data[0]);
    ResultFormatter.arrivalAirport(decodeResult, data[1]);
  } else {
    ResultFormatter.unknown(decodeResult, data.join(','), 'AF/');
  }
}
function processTimeOfDeparture(decodeResult: DecodeResult, data: string[]) {
  if (data.length === 2) {
    decodeResult.raw.plannedDepartureTime = data[0]; //DDHHMM
    decodeResult.formatted.items.push({
      type: 'ptd',
      code: 'ptd',
      label: 'Planned Departure Time',
      value: `YYYY-MM-${data[0].substring(0, 2)}T${data[0].substring(2, 4)}:${data[0].substring(4)}:00Z`,
    });

    decodeResult.raw.plannedDepartureTime = data[1]; //HHMM
    decodeResult.formatted.items.push({
      type: 'etd',
      code: 'etd',
      label: 'Estimated Departure Time',
      value: `${data[1].substring(0, 2)}:${data[1].substring(2)}`,
    });
  } else {
    ResultFormatter.unknown(decodeResult, data.join(','), '/TD');
  }
}

function processIdentification(decodeResult: DecodeResult, data: string[]) {
  ResultFormatter.tail(decodeResult, data[0]);
  if (data.length > 1) {
    ResultFormatter.flightNumber(decodeResult, data[1]);
  }
  if (data.length > 2) {
    //TODO: figure out what this is
    decodeResult.raw.mission_number = data[2];
  }
}

function processDT(decodeResult: DecodeResult, data: string[]) {
  if (!decodeResult.raw.arrival_icao) {
    ResultFormatter.arrivalAirport(decodeResult, data[0]);
  } else if (decodeResult.raw.arrival_icao != data[0]) {
    ResultFormatter.unknownArr(decodeResult, data);
  } // else duplicate - don't do anything

  if (data.length > 1) {
    ResultFormatter.arrivalRunway(decodeResult, data[1]);
  }
  if (data.length > 2) {
    ResultFormatter.currentFuel(decodeResult, Number(data[2]));
  }
  if (data.length > 3) {
    ResultFormatter.eta(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(data[3]),
    );
  }
  if (data.length > 4) {
    ResultFormatter.remainingFuel(decodeResult, Number(data[4]));
  }
  if (data.length > 5) {
    //TODO: figure out what this is
    ResultFormatter.unknownArr(decodeResult, data);
  }
}

function processLandingReport(decodeResult: DecodeResult, data: string[]) {
  if (data.length === 19) {
    ResultFormatter.unknown(decodeResult, data[1]);
    ResultFormatter.flightNumber(decodeResult, data[2]);
    ResultFormatter.departureAirport(decodeResult, data[3]);
    ResultFormatter.arrivalAirport(decodeResult, data[4]);
    ResultFormatter.arrivalRunway(decodeResult, data[5]);
    ResultFormatter.unknown(decodeResult, data.slice(6, 19).join(','));
  } else {
    ResultFormatter.unknown(decodeResult, data.join(','));
  }
}

function processCenterOfGravity(decodeResult: DecodeResult, data: string[]) {
  if (data.length === 1) {
    if (data[0] !== undefined && data[0] !== '') {
      ResultFormatter.cg(decodeResult, parseInt(data[0], 10) / 10);
    }
  } else if (data.length === 3) {
    if (data[0] !== undefined && data[0] !== '') {
      ResultFormatter.cg(decodeResult, parseInt(data[0], 10) / 10, 'center');
    }
    if (data[1] !== undefined && data[1] !== '') {
      ResultFormatter.cg(decodeResult, parseInt(data[1], 10) / 10, 'lower');
    }
    if (data[2] !== undefined && data[2] !== '') {
      ResultFormatter.cg(decodeResult, parseInt(data[2], 10) / 10, 'upper');
    }
  } else {
    ResultFormatter.unknown(decodeResult, data.join(','));
  }
}

function parseMessageType(
  decodeResult: DecodeResult,
  messagePart: string,
): boolean {
  const messageType = messagePart.split(',')[0];
  if (messageType.startsWith('POS')) {
    H1Helper.processPosition(decodeResult, messagePart.substring(3).split(','));
    return processMessageType(decodeResult, 'POS');
  } else if (messageType.length === 6) {
    const part1 = processMessageType(decodeResult, messageType.substring(0, 3));
    const description = decodeResult.formatted.description;
    const part2 = processMessageType(decodeResult, messageType.substring(3, 6));
    decodeResult.formatted.description =
      description + ' for ' + decodeResult.formatted.description;
    return part1 && part2;
  }
  return processMessageType(decodeResult, messageType);
}

function processMessageType(decodeResult: DecodeResult, type: string): boolean {
  if (type === 'FPN') {
    decodeResult.formatted.description = 'Flight Plan';
  } else if (type === 'FTX') {
    decodeResult.formatted.description = 'Free Text';
  } else if (type === 'INI') {
    decodeResult.formatted.description = 'Flight Plan Initial Report';
  } else if (type === 'PER') {
    decodeResult.formatted.description = 'Performance Report';
  } else if (type === 'POS') {
    decodeResult.formatted.description = 'Position Report';
  } else if (type === 'PRG') {
    decodeResult.formatted.description = 'Progress Report';
  } else if (type === 'PWI') {
    decodeResult.formatted.description = 'Pilot Weather Information';
  } else if (type === 'REJ') {
    decodeResult.formatted.description = 'Reject';
  } else if (type === 'REQ') {
    decodeResult.formatted.description = 'Request';
  } else if (type === 'RES') {
    decodeResult.formatted.description = 'Response';
  } else {
    decodeResult.formatted.description = 'Unknown H1 Message';
    return false;
  }
  return true;
}

function processDateCode(decodeResult: DecodeResult, data: string[]) {
  decodeResult.raw.message_date = data[0]; // DDMMYYYY;

  if (data.length === 1) {
    // noop?
  } else if (data.length === 2) {
    // convert DDMMYY to MMDDYY - TODO figure out a better way to determine
    const date =
      data[0].substring(2, 4) +
      data[0].substring(0, 2) +
      data[0].substring(4, 6);
    const time = DateTimeUtils.convertDateTimeToEpoch(data[1], data[0]); // HHMMSS

    decodeResult.raw.message_timestamp = time;
  }
}

function processRoute(
  decodeResult: DecodeResult,
  last: string,
  time: string,
  next: string,
  eta: string,
  then?: string,
  date?: string,
) {
  const lastTime = date
    ? DateTimeUtils.convertDateTimeToEpoch(time, date)
    : DateTimeUtils.convertHHMMSSToTod(time);
  const nextTime = date
    ? DateTimeUtils.convertDateTimeToEpoch(eta, date)
    : DateTimeUtils.convertHHMMSSToTod(eta);
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

function processWindData(decodeResult: DecodeResult, message: string) {
  const wind = [] as Wind[];

  const flightLevel = Number(message.slice(0, 3));
  const fields = message.slice(4).split('.'); // strip off altitude and comma
  fields.forEach((field) => {
    const data = field.split(',');
    const waypoint = { name: data[0] };
    const windData = data[1];
    const windDirection = Number(windData.slice(0, 3));
    const windSpeed = Number(windData.slice(3));

    if (data.length === 3) {
      const tempData = data[2];
      const tempFlightLevel = Number(tempData.slice(0, 3));
      const tempString = tempData.slice(3);
      const tempDegrees =
        Number(tempString.substring(1)) *
        (tempString.charAt(0) === 'M' ? -1 : 1);
      wind.push({
        waypoint: waypoint,
        flightLevel: flightLevel,
        windDirection: windDirection,
        windSpeed: windSpeed,
        temperature: {
          flightLevel: tempFlightLevel,
          degreesC: tempDegrees,
        },
      });
    } else {
      wind.push({
        waypoint: waypoint,
        flightLevel: flightLevel,
        windDirection: windDirection,
        windSpeed: windSpeed,
      });
    }
  });

  ResultFormatter.windData(decodeResult, wind);
}

// CRC-16/IBM-SDLC but nibbles are reversed
function calculateChecksum(data: string): string {
  let crc = 0xffff;
  const bytes = Buffer.from(data, 'ascii');

  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >>> 1) ^ 0x8408;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  crc = (crc ^ 0xffff) & 0xffff;

  const nibble1 = (crc >> 12) & 0xf;
  const nibble2 = (crc >> 8) & 0xf;
  const nibble3 = (crc >> 4) & 0xf;
  const nibble4 = crc & 0xf;

  return `${nibble4.toString(16)}${nibble3.toString(16)}${nibble2.toString(16)}${nibble1.toString(16)}`.toUpperCase();
}
