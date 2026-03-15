import { DateTimeUtils } from '../DateTimeUtils';
import { DecodeResult } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { Wind } from '../types/wind';
import { CoordinateUtils } from './coordinate_utils';
import { FlightPlanUtils } from './flight_plan_utils';
import { ResultFormatter } from './result_formatter';
import { RouteUtils } from './route_utils';

/**
 * Helper class for decoding ARINC 702 messages
 * contains core logic for decoding different types of ARINC 702 messages,
 * as well as utility functions for processing common fields
 *
 * Core format:
 *  IMI/IEIdata/IEIdata/...checksum
 */
export class Arinc702Helper {
  /**
   * Decodes an  ARINC 702 message
   *
   * Steps:
   * 1. Check against known checksum algorithms to determine if message is valid
   * 2. Parse the Imbedded Message Identifier (IMI) to determine the type of message
   * 3. Iterate through the Information Elements (IEI) and decode known fields, while storing unknown fields for further analysis
   *
   * @param decodeResult - object to store decoded results in
   * @param message - message to decode
   * @returns boolean indicating if the message was successfully decoded
   */
  public static decodeH1Message(decodeResult: DecodeResult, message: string) {
    decodeResult.remaining.text = '';
    const checksum = parseInt(message.slice(-4), 16);
    const data = message.slice(0, message.length - 4);
    let checksumAlgorithmUsed = '';
    if (crc16IbmSdlcRev(data) === checksum) {
      // ACARS/VDL2/HFDL/Iridium
      checksumAlgorithmUsed = 'IBM-SDLC reversed';
    } else if (crc16Genibus(data) === checksum) {
      // inmarsat
      checksumAlgorithmUsed = 'GENIBUS';
    } else {
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
      const iei = fields[i].substring(0, 2);
      const data = fields[i].substring(2);
      switch (iei) {
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
          ResultFormatter.desiredAltitude(
            decodeResult,
            parseInt(data, 10) * 100,
          );
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
          ResultFormatter.text(decodeResult, data);
          break;
        case 'GA':
          ResultFormatter.groundAddress(decodeResult, data);
          break;
        case 'ID':
          processIdentification(decodeResult, data.split(','));
          break;
        case 'LR':
          processLandingReport(decodeResult, data.split(','));
          break;
        case 'MR':
          processMessageReference(decodeResult, data.split(','));
          break;
        case 'PR':
          processPerformanceData(decodeResult, data.split(','));
          break;
        //case 'PR':
        // TODO: decode /PR fields
        // ResultFormatter.unknown(decodeResult, fields[i], '/');
        // break;
        case 'PS': // Position
          Arinc702Helper.processPS(decodeResult, data.split(','));
          break;
        case 'RF':
        case 'RI':
        case 'RM':
        case 'RP':
        case 'RS':
          // TODO - use key/data instead of whole message
          FlightPlanUtils.processFlightPlan(decodeResult, fields[i].split(':'));
          break;
        case 'RN':
          ResultFormatter.routeNumber(decodeResult, data);
          break;
        case 'RW':
          processRunway(decodeResult, data.split(':'));
          break;
        case 'SM':
          processSummary(decodeResult, data.split(','));
          break;
        case 'SN':
          decodeResult.raw.serial_number = data;
          break;
        case 'SP':
          ResultFormatter.startPoint(decodeResult, data);
          break;
        case 'TD':
          processTimeOfDeparture(decodeResult, data.split(','));
          break;
        case 'TS':
          Arinc702Helper.processTimeStamp(decodeResult, data.split(','));
          break;
        case 'VR':
          ResultFormatter.version(decodeResult, parseInt(data, 10) / 10);
          break;
        case 'WD':
          processWindData(decodeResult, data);
          break;
        case 'WQ':
          processWeatherQuery(decodeResult, data.split(':'));
          break;
        default:
          console.log(`Unknown IEI ${iei} in H1 message, data: ${data}`);
          console.log(`Remaing text: ${decodeResult.remaining.text}`);
          ResultFormatter.unknown(decodeResult, fields[i], '/');
      }
    }

    ResultFormatter.checksumAlgorithm(decodeResult, checksumAlgorithmUsed);
    ResultFormatter.checksum(decodeResult, checksum);

    return true;
  }

  public static processPS(decodeResult: DecodeResult, data: string[]) {
    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
      data[0],
    );
    if (position) {
      ResultFormatter.position(decodeResult, position);
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
    decodeResult.raw.planned_departure_time = data[0]; //DDHHMM - TODO: make int
    decodeResult.formatted.items.push({
      type: 'ptd',
      code: 'ptd',
      label: 'Planned Departure Time',
      value: `YYYY-MM-${data[0].substring(0, 2)}T${data[0].substring(2, 4)}:${data[0].substring(4)}:00Z`,
    });

    decodeResult.raw.estimated_departure_time = data[1]; //HHMM - TODO: make int
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
  if (data.length === 9) {
    ResultFormatter.unknown(decodeResult, data[0]);
    if (!decodeResult.raw.arrival_icao) {
      ResultFormatter.arrivalAirport(decodeResult, data[1]);
    }
    ResultFormatter.arrivalRunway(decodeResult, data[2]);
    ResultFormatter.currentFuel(decodeResult, parseInt(data[3], 10));
    ResultFormatter.eta(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(data[4]),
    );
    ResultFormatter.unknown(decodeResult, data[5]);
    ResultFormatter.position(
      decodeResult,
      CoordinateUtils.decodeStringCoordinates(data[6]),
    );
    ResultFormatter.unknown(decodeResult, data[7]);
    ResultFormatter.unknown(decodeResult, data[8]);
    return;
  }
  if (data.length === 4 || data.length === 5) {
    if (!decodeResult.raw.arrival_icao) {
      ResultFormatter.arrivalAirport(decodeResult, data[0]);
    }
    ResultFormatter.arrivalRunway(decodeResult, data[1]);
    ResultFormatter.currentFuel(decodeResult, parseInt(data[2], 10));
    ResultFormatter.eta(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(data[3]),
    );
    if (data.length > 4) {
      ResultFormatter.remainingFuel(decodeResult, Number(data[4]));
    }
    return;
  }
  ResultFormatter.unknownArr(decodeResult, data, ',');
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
  const messageParts = messagePart.split(',');
  const messageType = messageParts[0];
  if (messageType.startsWith('POS')) {
    Arinc702Helper.processPosition(
      decodeResult,
      messagePart.substring(3).split(','),
    );
    return processIMI(decodeResult, 'POS');
  } else if (messageType.length === 6) {
    const part1 = processIMI(decodeResult, messageType.substring(0, 3));
    const description = decodeResult.formatted.description;
    const part2 = processIMI(decodeResult, messageType.substring(3, 6));
    decodeResult.formatted.description =
      description + ' for ' + decodeResult.formatted.description;
    if (messageParts.length > 1) {
      // TODO handle REJPWI/REJPOS
      ResultFormatter.unknown(
        decodeResult,
        messageParts.slice(1).join(','),
        '/',
      );
    }
    return part1 && part2;
  }

  if (messageParts.length > 1) {
    // TODO handle
    ResultFormatter.unknown(decodeResult, messageParts.slice(1).join(','), '/');
  }

  return processIMI(decodeResult, messageType);
}

/**
 * Processes the Imbedded Message Identifier (IMI)
 * which indicates the type of message and is used to determine what the message type is
 * @param decodeResult
 * @param type
 * @returns
 */
function processIMI(decodeResult: DecodeResult, type: string): boolean {
  if (type === 'FPN') {
    decodeResult.formatted.description = 'Flight Plan';
  } else if (type === 'FTX') {
    decodeResult.formatted.description = 'Free Text';
  } else if (type === 'INI') {
    decodeResult.formatted.description = 'Initial Report';
  } else if (type === 'INR') {
    decodeResult.formatted.description = 'In-Range Report';
  } else if (type === 'LDI') {
    decodeResult.formatted.description = 'Load Distribution Information';
  } else if (type === 'PER') {
    decodeResult.formatted.description = 'Performance Report';
  } else if (type === 'POS') {
    decodeResult.formatted.description = 'Position Report';
  } else if (type === 'PRG') {
    decodeResult.formatted.description = 'Progress Report';
  } else if (type === 'PWI') {
    decodeResult.formatted.description = 'Pilot Weather Information';
  } else if (type === 'WXR') {
    decodeResult.formatted.description = 'Weather Report';
  } else if (type === 'REJ') {
    decodeResult.formatted.description = 'Reject';
  } else if (type === 'REQ') {
    decodeResult.formatted.description = 'Request';
  } else if (type === 'RES') {
    decodeResult.formatted.description = 'Response';
  } else if (type === 'SUM') {
    decodeResult.formatted.description = 'Summary Report';
  } else {
    decodeResult.formatted.description = 'Unknown H1 Message';
    return false;
  }
  return true;
}

function processPerformanceData(decodeResult: DecodeResult, data: string[]) {
  // /PR fields contain performance data
  // Known field positions (12-field short variant and 18-field long variant):
  // [0]: ground speed (knots * 10 or similar)
  // [1]: indicated airspeed or mach-related
  // [2]: altitude in hundreds of feet
  // [3]: fuel-related value
  // [4]: unknown (often empty)
  // [5]: fuel flow or consumption
  // [6]: fuel-related
  // [7]: wind data (DDDSSSS format) or empty
  // [8]: temperature (M=minus, P=plus)
  // [9]: heading or unknown

  if (data.length < 3) {
    ResultFormatter.unknownArr(decodeResult, data, ',');
    return;
  }

  // Field 2: altitude in hundreds
  if (data[2] !== undefined && data[2] !== '') {
    const alt = Number(data[2]) * 100;
    if (!isNaN(alt) && alt > 0) {
      ResultFormatter.altitude(decodeResult, alt);
    }
  }

  // Field 8: temperature (if present)
  if (data.length > 8 && data[8] !== undefined && data[8] !== '') {
    ResultFormatter.temperature(decodeResult, data[8]);
  }

  // Collect remaining undecoded fields
  const remaining: string[] = [];
  for (let i = 0; i < data.length; i++) {
    if (
      i === 2 &&
      data[i] !== '' &&
      !isNaN(Number(data[i])) &&
      Number(data[i]) * 100 > 0
    ) {
      continue; // altitude - already decoded
    }
    if (
      i === 8 &&
      data[i] !== '' &&
      (data[i].startsWith('M') ||
        data[i].startsWith('P') ||
        !isNaN(Number(data[i])))
    ) {
      continue; // temperature - already decoded
    }
    remaining.push(data[i]);
  }
  if (remaining.length > 0 && remaining.some((r) => r !== '')) {
    ResultFormatter.unknown(decodeResult, remaining.join(','), '/PR');
  }
}

function processDateCode(decodeResult: DecodeResult, data: string[]) {
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

function processWeatherQuery(decodeResult: DecodeResult, data: string[]) {
  if (data.length !== 2) {
    ResultFormatter.unknown(decodeResult, data.join(':'), 'WQ/');
    return;
  }

  const alts = data[0].split('.');
  const route = data[1].split('.');

  ResultFormatter.requestedAltitudes(
    decodeResult,
    alts.map((a) => parseInt(a, 10) * 100),
  );

  const waypoints = route.map((wp) => {
    return { name: wp };
  });
  ResultFormatter.route(decodeResult, { waypoints: waypoints });
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

  const lastWaypoint = RouteUtils.getWaypoint(last);
  lastWaypoint.time = lastTime;

  const nextWaypoint = RouteUtils.getWaypoint(next);
  nextWaypoint.time = nextTime;

  const thenWaypoint = RouteUtils.getWaypoint(then || '?');

  const waypoints: Waypoint[] = [lastWaypoint, nextWaypoint, thenWaypoint];
  ResultFormatter.route(decodeResult, { waypoints: waypoints });
}

function processWindData(decodeResult: DecodeResult, message: string) {
  const wind = [] as Wind[];

  const flightLevel = Number(message.slice(0, 3));
  const fields = message.slice(4).split('.'); // strip off altitude and comma
  fields.forEach((field) => {
    if (field.length < 4) {
      // probably need a more robust check to determine to skip
      return;
    }
    const data = field.split(',');
    const waypoint = { name: data[0] };
    const windData = data[1];
    const windDirection = parseInt(windData.slice(0, 3), 10);
    const windSpeed = parseInt(windData.slice(3), 10);

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

function processRunway(decodeResult: DecodeResult, data: string[]) {
  //FIXME - figure out names
  const parts = data[0].split('.');
  const more = parts[0].split(',');

  ResultFormatter.departureRunway(decodeResult, more[0]);
  ResultFormatter.unknownArr(decodeResult, more.slice(1), ',');
  ResultFormatter.unknownArr(decodeResult, parts.slice(1), '.');
  ResultFormatter.departureAirport(decodeResult, data[1].split(',')[0]);
  ResultFormatter.unknownArr(decodeResult, data[1].split(',').slice(1), ',');
  //ResultFormatter.unknownArr(decodeResult, data.slice(2), ':');
}
function processSummary(decodeResult: DecodeResult, data: string[]) {
  if (data.length !== 11) {
    return ResultFormatter.unknown(decodeResult, data.join(','), 'SM/');
  }

  ResultFormatter.engineStart(
    decodeResult,
    DateTimeUtils.convertDayTimeToTod(data[0]),
  ); // strip off day if present
  ResultFormatter.startFuel(decodeResult, 100 * parseInt(data[1], 10));
  ResultFormatter.engineStop(
    decodeResult,
    DateTimeUtils.convertDayTimeToTod(data[2]),
  );
  ResultFormatter.out(decodeResult, DateTimeUtils.convertDayTimeToTod(data[3]));
  ResultFormatter.outFuel(decodeResult, 100 * parseInt(data[4], 10));
  ResultFormatter.off(decodeResult, DateTimeUtils.convertDayTimeToTod(data[5]));
  ResultFormatter.offFuel(decodeResult, 100 * parseInt(data[6], 10));
  ResultFormatter.on(decodeResult, DateTimeUtils.convertDayTimeToTod(data[7]));
  ResultFormatter.onFuel(decodeResult, 100 * parseInt(data[8], 10));
  ResultFormatter.in(decodeResult, DateTimeUtils.convertDayTimeToTod(data[9]));
  ResultFormatter.inFuel(decodeResult, 100 * parseInt(data[10], 10));
}

// CRC-16/IBM-SDLC but nibbles are reversed
function crc16IbmSdlcRev(data: string): number {
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

  return (nibble4 << 12) | (nibble3 << 8) | (nibble2 << 4) | nibble1;
}

/**
 * Calculates the CRC-16/GENIBUS checksum for a given Uint8Array.
 * @param data The input data as a byte array.
 * @returns The 16-bit checksum as a number.
 */
function crc16Genibus(data: string): number {
  let crc = 0xffff;
  const polynomial = 0x1021;

  const bytes = Buffer.from(data, 'ascii');

  for (const byte of bytes) {
    crc ^= byte << 8;

    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return (crc ^ 0xffff) & 0xffff;
}
function processMessageReference(decodeResult: DecodeResult, data: string[]) {
  if (data.length !== 2) {
    ResultFormatter.unknown(decodeResult, data.join(','), '/MR');
    return;
  }

  ResultFormatter.sequenceNumber(decodeResult, parseInt(data[0], 10));
  if (data[1] !== '') {
    ResultFormatter.sequenceResponse(decodeResult, parseInt(data[1], 10));
  }
}
