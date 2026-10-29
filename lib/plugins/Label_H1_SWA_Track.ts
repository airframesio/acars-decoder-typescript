import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Flight phase codes. The MAX (86501) sends ER where the 737-700 and -800 send CR, and never CR.
const PHASES: Record<string, string> = {
  TO: 'Takeoff',
  IC: 'Initial Climb',
  CL: 'Climb',
  CR: 'Cruise',
  ER: 'En Route',
  DC: 'Descent',
  AP: 'Approach',
  RO: 'Rollout',
};

// lat ddmm.m, lon dddmm.m, DDHHMM, altitude (feet), outside air temperature (C),
// wind direction, wind speed (knots), phase, water vapor (ppmv, 00000 for no reading), and 1
// when the aircraft has a humidity sensor. Water vapor is only ever sent with a 1 (142,434
// points with 0, none with a reading), and gives relative humidity of 105% or less in 96.6%
// of 84,461 points.
const POINT =
  /^([NS]\d{4})\.(\d),([EW]\d{5})\.(\d),(\d{2})(\d{2})(\d{2}),\s?(-?\d+),\s?(-?\d+\.\d),(\d{3}),(\d{3}),([A-Z]{2}),(\d{5}),([01]),$/;

/**
 * Southwest Airlines H1 track report: report 76502 (737-700/800) or 86501 (737 MAX), sent in
 * clear. A header, the number of points, one line per point, then `:`.
 */
export class Label_H1_SWA_Track extends DecoderPlugin {
  name = 'label-h1-swa-track';

  qualifiers() {
    return {
      labels: ['H1'],
      preambles: ['++76502,', '++86501,', '#DFB++76502,', '#DFB++86501,'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Track Report');

    const nl = message.text.includes('\r\n') ? '\r\n' : '\n';
    // '#DFB' starts the message and, where blocks were joined, each later block
    const lines = message.text.replace(/#DFB/g, '').split(/\r?\n/);
    // report, ship number or tail, aircraft type, YYMMDD, flight, origin, destination, leg
    // counter, software version
    const header = lines[0].replace(/^\+\+/, '').split(',');
    if (header.length !== 9 || !/^\d{6}$/.test(header[3])) {
      return this.failUnknown(decodeResult, message.text, options);
    }

    const unknown: string[] = [];
    if (/^N\w+$/.test(header[1])) {
      ResultFormatter.tail(decodeResult, header[1]);
    } else if (/^\d{1,4}$/.test(header[1])) {
      // the fleet number: N204WN sends 204 (16,889 of 16,889 reports from N###WN tails)
      ResultFormatter.raw(
        decodeResult,
        'ship_number',
        'SHIP',
        'Ship Number',
        header[1],
      );
    } else if (header[1] !== 'XXX') {
      // XXX is sent by aircraft without a ship number
      unknown.push(header[1]);
    }
    ResultFormatter.raw(
      decodeResult,
      'aircraft_type',
      'ACTYPE',
      'Aircraft Type',
      header[2],
    );
    const d = header[3];
    ResultFormatter.raw(
      decodeResult,
      'report_date',
      'DATE',
      'Report Date',
      `20${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 6)}`,
    );
    ResultFormatter.flightNumber(decodeResult, header[4]);
    ResultFormatter.departureAirport(decodeResult, header[5]);
    ResultFormatter.arrivalAirport(decodeResult, header[6]);
    // one more each leg, the same in every report of a leg (8,634 of 8,634 legs); it starts
    // again when the ACMS software is reloaded, so it is not the aircraft's lifetime cycles
    if (/^\d+$/.test(header[7])) {
      ResultFormatter.raw(
        decodeResult,
        'leg_counter',
        'LEGS',
        'Leg Counter',
        `${Number(header[7])}`,
        Number(header[7]),
      );
    } else {
      unknown.push(header[7]);
    }
    ResultFormatter.raw(
      decodeResult,
      'software_version',
      'SWVER',
      'Software Version',
      header[8],
    );
    if (unknown.length > 0) ResultFormatter.unknownArr(decodeResult, unknown);

    // lines[1] is the number of points
    for (const line of lines.slice(2)) {
      if (line === '' || line === ':') continue;
      const m = line.match(POINT);
      // day 01-31, hour 00-23, minute 00-59
      if (
        !m ||
        !(Number(m[5]) >= 1 && Number(m[5]) <= 31) ||
        Number(m[6]) > 23 ||
        Number(m[7]) > 59
      ) {
        ResultFormatter.unknown(decodeResult, line, nl);
        continue;
      }
      const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
        `${m[1]}${m[2]}${m[3]}${m[4]}`,
      );
      if (!position) {
        ResultFormatter.unknown(decodeResult, line, nl);
        continue;
      }
      ResultFormatter.trackPoint(decodeResult, {
        ...position,
        day: Number(m[5]),
        time: Number(m[6]) * 3600 + Number(m[7]) * 60,
        altitude: Number(m[8]),
        // -00.0 is sent; keep it as 0
        temperature: Number(m[9]) || 0,
        windDirection: Number(m[10]),
        windSpeed: Number(m[11]),
        phase: PHASES[m[12]] ?? m[12],
        humiditySensor: m[14] === '1',
        ...(Number(m[13]) > 0 ? { waterVapor: Number(m[13]) } : {}),
      });
    }

    const points = decodeResult.raw.track_points ?? [];
    const last = points[points.length - 1];
    if (last) {
      ResultFormatter.position(decodeResult, {
        latitude: last.latitude,
        longitude: last.longitude,
      });
      ResultFormatter.altitude(decodeResult, last.altitude);
      ResultFormatter.timestamp(decodeResult, last.time);
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
