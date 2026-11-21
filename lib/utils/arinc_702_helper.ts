import type { WeatherReport } from '../types/weather_report';
import { DateTimeUtils } from '../DateTimeUtils';
import { DecodeResult } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { Wind } from '../types/wind';
import { CoordinateUtils } from './coordinate_utils';
import { FlightPlanUtils } from './flight_plan_utils';
import { MissionNumberUtils } from './mission_number';
import { ResultFormatter } from './result_formatter';
import { RouteUtils } from './route_utils';

// One byte per ASCII char — replaces the Buffer.from(data, 'ascii') idiom so
// the CRC helpers run in browser / Deno / Bun / edge runtimes without Node
// polyfills. Matches the broader Web APIs migration in c78b720.
function asciiStringToBytes(data: string): Uint8Array {
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i) & 0xff;
  return bytes;
}

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
        case 'LL':
          processLatLon(decodeResult, data);
          break;
        case 'LR':
          processLandingReport(decodeResult, data.split(','));
          break;
        case 'MR':
          processMessageReference(decodeResult, data.split(','));
          break;
        case 'MT':
          // the report is free text that can itself contain '/' (1/2SM, 07/02, R09/...),
          // so it runs to the end of the message
          processWeatherReport(
            decodeResult,
            fields.slice(i).join('/').substring(2),
          );
          i = fields.length;
          break;
        case 'OF':
          processOffEvent(decodeResult, data);
          break;
        case 'OT':
          processOutEvent(decodeResult, data.split(','));
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
        case 'TR':
          processTR(decodeResult, data.split(','));
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
      processWindAndSpeed(decodeResult, data[7], data[8]);
    }
    if (data.length === 14) {
      // variant 2
      ResultFormatter.altitude(decodeResult, Number(data[3]) * 100);
      processRoute(decodeResult, data[1], data[2], data[4], data[5], data[6]);
      ResultFormatter.temperature(decodeResult, data[7]);
      ResultFormatter.unknownArr(decodeResult, data.slice(8));
    }
  }

  /**
   * Decodes the fields of a POS report after the IMI: the position, then by field count the
   * Southwest layout (21 fields), the short variant (10 or more) or the long one (14 or more).
   *
   * @param decodeResult - object to store decoded results in
   * @param data - the report's comma-separated fields
   */
  public static processPosition(decodeResult: DecodeResult, data: string[]) {
    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
      data[0],
    );
    if (position) {
      ResultFormatter.position(decodeResult, position);
    }
    if (data.length === SOUTHWEST_POSITION_FIELDS) {
      processSouthwestPosition(decodeResult, data);
      return;
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
    decodeResult.raw.mission_number = data[2];
    const mission = MissionNumberUtils.parse(data[2]);
    if (mission) {
      ResultFormatter.missionNumber(decodeResult, mission);
    }
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

// trajectory? track?
// ?,?,?,?,?,off-HHMMSS,?,?,?,?,?,dep,arr,dep_rw,?,?,flight_number,?,?,?,?
function processTR(decodeResult: DecodeResult, data: string[]) {
  if (data.length !== 21) {
    ResultFormatter.unknownArr(decodeResult, data, ',');
    return;
  }
  ResultFormatter.unknownArr(decodeResult, data.slice(0, 5), ',');
  ResultFormatter.off(decodeResult, DateTimeUtils.convertHHMMSSToTod(data[5]));
  ResultFormatter.unknownArr(decodeResult, data.slice(6, 11), ',');
  ResultFormatter.departureAirport(decodeResult, data[11]);
  ResultFormatter.arrivalAirport(decodeResult, data[12]);
  ResultFormatter.departureRunway(decodeResult, data[13]);
  ResultFormatter.unknownArr(decodeResult, data.slice(14, 16), ',');
  ResultFormatter.flightNumber(decodeResult, data[16]);
  ResultFormatter.unknownArr(decodeResult, data.slice(17), ',');
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
  if (type === 'DIS') {
    // military (AMC) report carrying a lat/lon (/LL), /DR and fuel. What DIS stands for is
    // not publicly documented, so the name is left generic. Not the same message as the
    // label 4A DIS report (Label_4A_DIS).
    decodeResult.formatted.description = 'DIS Report';
  } else if (type === 'FPN') {
    decodeResult.formatted.description = 'Flight Plan';
  } else if (type === 'FTX') {
    decodeResult.formatted.description = 'Free Text';
  } else if (type === 'INI') {
    decodeResult.formatted.description = 'Initial Report';
  } else if (type === 'INR') {
    decodeResult.formatted.description = 'In-Range Report';
  } else if (type === 'LDI') {
    decodeResult.formatted.description = 'Load Distribution Information';
  } else if (type === 'OOI') {
    decodeResult.formatted.description = 'OOOI Event Report';
  } else if (type === 'PER') {
    decodeResult.formatted.description = 'Performance Report';
  } else if (type === 'PRF') {
    decodeResult.formatted.description = 'Profile Report';
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

/**
 * /PR, performance data. The fields mean the same in every layout on disk (6,201 reports with
 * /PR from WN, AS, AA, B6, BA and AC; 12, 18 and 19 fields), so shorter and longer ones just
 * carry fewer or more of them:
 * - 0 gross weight (hundreds of pounds);
 * - 2 cruise altitude (hundreds of feet): one value for the whole flight on 85-100% of each
 *   airline's flights, and present in a flight plan sent before departure (FPN TNCA-TNCB: 110);
 * - 3 fuel on board (hundreds of pounds);
 * - 8 temperature at cruise altitude: M7 with the 110 above, ISA at 11,000 feet, while the
 *   aircraft was on the ground;
 * - 9 transition altitude (hundreds of feet) of the departure: 180 from US airports, 185 from
 *   Mexico, 60 from London, 50 from Berlin, 30 from Amsterdam.
 * The rest is unknown. Fields 0 and 3 are the same as the Southwest position report's gross
 * weight and fuel on board on 3,449 of 3,450 reports, so a value the report already gave is not
 * shown again. Field 3 is otherwise left in the remaining text, since /DT also shows a figure as
 * fuel on board and the two would clash.
 */
function processPerformanceData(decodeResult: DecodeResult, data: string[]) {
  if (data.length < 3) {
    ResultFormatter.unknownArr(decodeResult, data, ',');
    return;
  }
  const remaining = data.filter(
    (value, i) => !decodePerformanceField(decodeResult, i, value),
  );
  if (remaining.some((r) => r !== '')) {
    ResultFormatter.unknown(decodeResult, remaining.join(','), '/PR');
  }
}

/** Decodes one /PR field; false leaves it in the remaining text. */
function decodePerformanceField(
  decodeResult: DecodeResult,
  i: number,
  value: string,
): boolean {
  const hundreds = /^\d+$/.test(value) ? Number(value) * 100 : undefined;
  switch (i) {
    case 0:
      if (hundreds === undefined) {
        return false;
      }
      if (decodeResult.raw.gross_weight === undefined) {
        ResultFormatter.grossWeight(decodeResult, hundreds);
        return true;
      }
      return decodeResult.raw.gross_weight === hundreds;
    case 2:
      if (!hundreds) {
        return false;
      }
      ResultFormatter.raw(
        decodeResult,
        'cruise_altitude',
        'CRZ_ALT',
        'Cruise Altitude',
        `${hundreds} feet`,
        hundreds,
      );
      return true;
    case 3:
      return (
        hundreds !== undefined && decodeResult.raw.fuel_on_board === hundreds
      );
    case 8: {
      if (!/^[MP]\d+$/.test(value)) {
        return false;
      }
      const temperature = Number(value.replace('M', '-').replace('P', '+'));
      ResultFormatter.raw(
        decodeResult,
        'cruise_temperature',
        'CRZ_TEMP',
        'Cruise Temperature (C)',
        `${temperature} degrees`,
        temperature,
      );
      return true;
    }
    case 9:
      if (hundreds === undefined) {
        return false;
      }
      ResultFormatter.raw(
        decodeResult,
        'transition_altitude',
        'TRANS_ALT',
        'Transition Altitude',
        `${hundreds} feet`,
        hundreds,
      );
      return true;
    default:
      return false;
  }
}

/**
 * Southwest 737 position report: 21 fields, tested on 3,520 reports (2025-11 to 2026-10). No
 * other airline's POS report on disk has 21 fields.
 *
 * 0 position, 1 last waypoint, 2 time over it, 3 altitude (hundreds of feet), 4 next waypoint,
 * 5 distance to it (nm), 6 ETA there, 7 the waypoint after, 8 outside air temperature, 9 wind
 * (DDDSSS), 10 true airspeed, 11 indicated airspeed, 12 gross weight and 13 fuel on board
 * (hundreds of pounds), 14 origin, 15 destination, 16 destination runway, 17 fuel at
 * destination (hundreds of pounds), 18 ETA at destination, 19 distance to destination (nm),
 * 20 unknown (always 73).
 */
const SOUTHWEST_POSITION_FIELDS = 21;
const SOUTHWEST_TIME = /^([01]\d|2[0-3])[0-5]\d[0-5]\d$/;

/** Matches a field; a blank field is skipped and one that does not match is unknown. */
function southwestField(value: string, pattern: RegExp, unknown: string[]) {
  if (value === '') {
    return undefined;
  }
  const m = value.match(pattern);
  if (!m) {
    unknown.push(value);
    return undefined;
  }
  return m;
}

/**
 * Decodes the 21 fields of the Southwest position report (layout above). A blank field is
 * skipped; a field that does not fit its layout, and field 20, go to the remaining text.
 */
function processSouthwestPosition(decodeResult: DecodeResult, data: string[]) {
  const unknown: string[] = [];
  const field = (i: number, pattern: RegExp) =>
    southwestField(data[i], pattern, unknown);

  const altitude = field(3, /^\d+$/);
  if (altitude) {
    ResultFormatter.altitude(decodeResult, Number(altitude[0]) * 100);
  }
  // distance and ETA are blank on a vectors leg
  processRoute(
    decodeResult,
    data[1],
    field(2, SOUTHWEST_TIME)?.[0] ?? '',
    data[4],
    field(6, SOUTHWEST_TIME)?.[0] ?? '',
    data[7],
  );
  // nm; time to the next waypoint x true airspeed agrees on 97.1% of 3,433 reports
  const next = field(5, /^\d+$/);
  if (next) {
    ResultFormatter.raw(
      decodeResult,
      'next_waypoint_distance',
      'NEXT_DIST',
      'Distance to Next Waypoint',
      `${Number(next[0])} nm`,
      Number(next[0]),
    );
  }
  if (field(8, /^[MP]\d+$/)) {
    ResultFormatter.temperature(decodeResult, data[8]);
  }
  const wind = field(9, /^([0-2]\d\d|3[0-5]\d|360)(\d{3})$/);
  if (wind) {
    ResultFormatter.wind(decodeResult, Number(wind[1]), Number(wind[2]));
  }
  // the true airspeed worked out from field 11, the altitude and the temperature is within
  // 5 kt of field 10 on 95.1% of 3,448 reports
  const tas = field(10, /^(\d+)K$/);
  if (tas) {
    ResultFormatter.airspeed(decodeResult, Number(tas[1]));
  }
  const ias = field(11, /^(\d+)K$/);
  if (ias) {
    ResultFormatter.indicatedAirspeed(decodeResult, Number(ias[1]));
  }
  // gross weight less fuel on board stays under each 737 type's maximum zero fuel weight
  const weight = field(12, /^\d+$/);
  if (weight) {
    ResultFormatter.grossWeight(decodeResult, Number(weight[0]) * 100);
  }
  const fuel = field(13, /^\d+$/);
  if (fuel) {
    ResultFormatter.currentFuel(decodeResult, Number(fuel[0]) * 100);
  }
  if (field(14, /^[A-Z]{4}$/)) {
    ResultFormatter.departureAirport(decodeResult, data[14]);
  }
  if (field(15, /^[A-Z]{4}$/)) {
    ResultFormatter.arrivalAirport(decodeResult, data[15]);
  }
  // blank until a runway is entered; then the same as the route's (1,170 of 1,170)
  if (field(16, /^\d{1,2}[A-Z]?$/)) {
    ResultFormatter.arrivalRunway(decodeResult, data[16]);
  }
  // fuel on board less this, over the distance to go, is 10.5 to 12.1 lb a nm (median by type)
  const destinationFuel = field(17, /^\d+$/);
  if (destinationFuel) {
    ResultFormatter.raw(
      decodeResult,
      'destination_fuel',
      'DEST_FUEL',
      'Fuel at Destination',
      `${Number(destinationFuel[0]) * 100}`,
      Number(destinationFuel[0]) * 100,
    );
  }
  const eta = field(18, SOUTHWEST_TIME);
  if (eta) {
    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(eta[0]));
  }
  const distance = field(19, /^\d+$/);
  if (distance) {
    ResultFormatter.raw(
      decodeResult,
      'destination_distance',
      'DEST_DIST',
      'Distance to Destination',
      `${Number(distance[0])} nm`,
      Number(distance[0]),
    );
  }
  if (data[20] !== '') {
    unknown.push(data[20]);
  }
  if (unknown.length > 0) {
    ResultFormatter.unknownArr(decodeResult, unknown);
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

/**
 * Processes /RW
 * data comes in split by `:`
 * data[0] is dparture runways and data[1] is airport info
 * runways are split by `.` each element is a potential takeoff runway
 * each runway has information split by `,`
 * currently only the first runway is processed as the takeoff runway
 *
 * @param decodeResult
 * @param data
 */
function processRunway(decodeResult: DecodeResult, data: string[]) {
  const parts = data[0].split('.');
  const more = parts[0].split(',');

  ResultFormatter.departureRunway(decodeResult, more[0]);
  ResultFormatter.unknownArr(decodeResult, more.slice(1), ',');
  ResultFormatter.unknownArr(decodeResult, parts.slice(1), '.');
  if (data[1]) {
    ResultFormatter.departureAirport(decodeResult, data[1].split(',')[0]);
    ResultFormatter.unknownArr(decodeResult, data[1].split(',').slice(1), ',');
  }
  //ResultFormatter.unknownArr(decodeResult, data.slice(2), ':');
}
function processSummary(decodeResult: DecodeResult, data: string[]) {
  if (data.length !== 11) {
    return ResultFormatter.unknown(decodeResult, data.join(','), 'SM/');
  }

  ResultFormatter.engineStart(
    decodeResult,
    DateTimeUtils.convertDayTimeToTod(data[0]),
  );
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
  const bytes = asciiStringToBytes(data);

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

  const bytes = asciiStringToBytes(data);

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

/**
 * Wind and speed fields at the end of a 9-field /PS position (military AMC reports):
 * - wind as `ddds`, `dddss` or `dddsss` (direction in degrees, speed in knots), e.g. `208018`;
 * - speed as `T<tas>`, `MT<tas>` or `M<mach * 1000>T<tas>`, e.g. `T302`, `MT250` or `M800T460`
 *   (`M` with no digits is the `MT<tas>` form, which carries no Mach number).
 * Anything else stays in the remaining text.
 */
function processWindAndSpeed(
  decodeResult: DecodeResult,
  wind: string,
  speed: string,
) {
  const windMatch = /^([0-2]\d\d|3[0-5]\d|360)(\d{1,3})$/.exec(wind);
  if (windMatch) {
    ResultFormatter.wind(
      decodeResult,
      Number(windMatch[1]),
      Number(windMatch[2]),
    );
  } else if (wind !== '') {
    ResultFormatter.unknown(decodeResult, wind);
  }
  const speedMatch = /^(?:M(\d{3})?)?T(\d{3})$/.exec(speed);
  if (speedMatch) {
    if (speedMatch[1]) {
      ResultFormatter.mach(decodeResult, Number(speedMatch[1]) / 1000);
    }
    ResultFormatter.airspeed(decodeResult, Number(speedMatch[2]));
  } else if (speed !== '') {
    ResultFormatter.unknown(decodeResult, speed);
  }
}

/** /LL, a position as N12345E123456 (degrees and decimal minutes) */
function processLatLon(decodeResult: DecodeResult, data: string) {
  const position = /^[NS]\d{5}[EW]\d{6}$/.test(data)
    ? CoordinateUtils.decodeStringCoordinatesDecimalMinutes(data)
    : undefined;
  if (
    position &&
    Number.isFinite(position.latitude) &&
    Number.isFinite(position.longitude)
  ) {
    ResultFormatter.position(decodeResult, position);
  } else {
    ResultFormatter.unknown(decodeResult, 'LL' + data, '/');
  }
}

/** DDHHMM to a day of the month and a time of day in seconds */
function parseDayTime(value: string): { day: number; tod: number } | undefined {
  if (!/^\d{6}$/.test(value)) {
    return undefined;
  }
  const day = Number(value.substring(0, 2));
  const hour = Number(value.substring(2, 4));
  const minute = Number(value.substring(4, 6));
  if (day < 1 || day > 31 || hour > 23 || minute > 59) {
    return undefined;
  }
  return {
    day,
    tod: DateTimeUtils.convertHHMMSSToTod(value.substring(2) + '00'),
  };
}

/** /OF<DDHHMM>, the takeoff (wheels off) time */
function processOffEvent(decodeResult: DecodeResult, data: string) {
  const off = parseDayTime(data);
  if (!off) {
    ResultFormatter.unknown(decodeResult, 'OF' + data, '/');
    return;
  }
  ResultFormatter.day(decodeResult, off.day);
  ResultFormatter.off(decodeResult, off.tod);
}

/**
 * /OT<DDHHMM>,<DDHHMM>,<fuel>, the out-of-gate time and the fuel on board then. The second
 * time is earlier than the first by a few minutes in the samples seen and is not decoded.
 */
function processOutEvent(decodeResult: DecodeResult, data: string[]) {
  const out = parseDayTime(data[0]);
  if (!out) {
    ResultFormatter.unknown(decodeResult, 'OT' + data.join(','), '/');
    return;
  }
  ResultFormatter.day(decodeResult, out.day);
  ResultFormatter.out(decodeResult, out.tod);
  // everything after the out time that is not decoded stays in the remaining text
  const rest: string[] = [];
  if (data.length > 1 && data[1] !== '') {
    rest.push(data[1]);
  }
  if (data.length > 2) {
    if (/^\d+$/.test(data[2])) {
      ResultFormatter.outFuel(decodeResult, Number(data[2]));
    } else if (data[2] !== '') {
      rest.push(data[2]);
    }
  }
  rest.push(...data.slice(3).filter((v) => v !== ''));
  if (rest.length > 0) {
    ResultFormatter.unknown(decodeResult, 'OT' + rest.join(','), '/');
  }
}

/**
 * /MT<station>,<HHMM>,<report>, weather text sent in answer to a weather request (WXR),
 * e.g. `MTKADW,0357,TAF KADW 210357Z VRB06KT 9999 FEW250 ...`. The text is usually a METAR
 * or TAF; anything else is kept with type `UNKNOWN`.
 */
function processWeatherReport(decodeResult: DecodeResult, data: string) {
  const match = /^([A-Z0-9]{4}),(\d{4}),(.*)$/s.exec(data);
  if (!match) {
    ResultFormatter.unknown(decodeResult, 'MT' + data, '/');
    return;
  }
  const [, station, time, text] = match;
  const report = text.trim();
  let type: WeatherReport['type'] = 'UNKNOWN';
  if (/^TAF\b/.test(report)) {
    type = 'TAF';
  } else if (
    /^(?:(?:METAR|SPECI)\s+)?[A-Z][A-Z0-9]{3}\s+\d{6}Z\b/.test(report)
  ) {
    type = 'METAR';
  }
  const labels: Record<WeatherReport['type'], string> = {
    TAF: 'Terminal Aerodrome Forecast',
    METAR: 'Weather Observation',
    UNKNOWN: 'Weather Text',
  };
  const weather: WeatherReport = { station, time, type, report };
  ResultFormatter.raw(
    decodeResult,
    'weather_station',
    'WX_STN',
    'Weather Station',
    station,
  );
  ResultFormatter.raw(
    decodeResult,
    'weather_report',
    'WX',
    labels[type],
    report,
    weather,
  );
}
