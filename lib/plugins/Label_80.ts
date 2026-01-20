import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Wind } from '../types/wind';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Airline Defined
// 3N01 POSRPT
export class Label_80 extends DecoderPlugin {
  name = 'label-80';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['80'],
      preambles: [],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;

    decodeResult.formatted.description = 'Airline Defined Position Report';

    const lines = message.text.split(/\r?\n/);
    const header = lines[0];
    this.parseHeader(header.trim(), decodeResult);

    for(let i=1; i<lines.length; i++) {
      const line = lines[i];
      const parts = line.split('/');
      for (const part of parts) {
        this.parseTags(part.trim(), decodeResult);
      }
    }

    if (decodeResult.formatted.items.length > 0) {
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = decodeResult.remaining.text === undefined ? 'full' : 'partial';
    }

    return decodeResult;
  }

  private parseHeader(header: string, results: any) {
    //3N01 POSRPT 0581/27 KIAD/MSLP .N962AV/04H 11:02
    const fields = header.split('/');
    if(fields.length < 3) {
      ResultFormatter.unknown(results, header);
      return;
    }
    const msgInfo = fields[0].split(/\s+/);
    if(msgInfo.length === 3) {
      ResultFormatter.unknownArr(results, msgInfo.slice(0,1), ' ');
      ResultFormatter.flightNumber(results, msgInfo[2]);
    } else {
      ResultFormatter.unknown(results, header);
      return;
    }

    const otherInfo1 = fields[1].split(/\s+/);
    if(otherInfo1.length === 2) {
      ResultFormatter.day(results, parseInt(otherInfo1[0], 10));
      ResultFormatter.departureAirport(results, otherInfo1[1]);
    } else {
      ResultFormatter.unknownArr(results, otherInfo1, ' ');
    }

    const otherInfo2 = fields[2].split(/\s+/);
    if(otherInfo2.length === 2) {
      ResultFormatter.arrivalAirport(results, otherInfo2[0]);
      ResultFormatter.tail(results, otherInfo2[1].replace('.', ''));
    } else {
      ResultFormatter.unknownArr(results, otherInfo2, ' ');
    }

    if(fields.length > 3) {
      ResultFormatter.unknownArr(results, fields.slice(3), '/');
    }
  }

  private parseTags(part: string, results: DecodeResult) {
    const kvPair = part.split(/\s+/)
    if(kvPair.length !== 2) {
      ResultFormatter.unknown(results, part);
      return;
    }
    const tag = kvPair[0];
    const val = kvPair[1];
    let wind_direction: number | undefined;
    let wind_speed: number | undefined;

    switch (tag) {
      case 'POS':
      // don't use decodeStringCoordinates because of different position format
        const posRegex = /^(?<latd>[NS])(?<lat>.+)(?<lngd>[EW])(?<lng>.+)/;
        const posResult = val.match(posRegex);
        const lat = Number(posResult?.groups?.lat) * (posResult?.groups?.lngd === 'S' ? -1 : 1);
        const lon = Number(posResult?.groups?.lng) * (posResult?.groups?.lngd === 'W' ? -1 : 1);
        const position = {
          latitude: Number.isInteger(lat) ? lat / 1000 : lat / 100,
          longitude: Number.isInteger(lon) ? lon / 1000 : lon / 100,
        };
        ResultFormatter.position(results, position);
        break;
      case 'ALT':
        ResultFormatter.altitude(results, parseInt(val.replace('+', ''), 10));
        break;
      case 'FL': // Handle "FL 360"
        ResultFormatter.altitude(results, parseInt(val, 10) * 100);
        break;
      case 'MCH':
        ResultFormatter.mach(results, parseInt(val, 10) / 1000);
        break;
      case 'SPD':
        ResultFormatter.groundspeed(results, parseInt(val, 10));
      case 'TAS':
        ResultFormatter.airspeed(results, parseInt(val, 10));
        break;
      case 'SAT':
        ResultFormatter.temperature(results, val);
        break;
      case 'FB':
        // ignoring, assuming FOB and avoiding duplicates.
        break;
      case 'FOB':
        // Strip non-numeric like 'N' in 'N009414'
        ResultFormatter.currentFuel(results, parseInt(val.replace(/\D/g, ''), 10));
        break;
      case 'UTC':
        ResultFormatter.time_of_day(results, DateTimeUtils.convertHHMMSSToTod(val));
        break;
      case 'ETA':
        const hhmm = val.split('.')[0].replace(':', '');
        ResultFormatter.eta(results, DateTimeUtils.convertHHMMSSToTod(hhmm));
        break;
      case 'HDG':
        ResultFormatter.heading(results, parseInt(val, 10));
        break;
      case 'NWYP':
        results.raw.next_waypoint = val;
        break;
      case 'SWN':
        wind_speed = parseInt(val, 10);
        break;
      case 'DWN':
        wind_direction = parseInt(val, 10);
        break;

        default:
          ResultFormatter.unknown(results, part);
    }
    if (wind_speed !== undefined && wind_direction !== undefined) {
      const wind : Wind = {
        waypoint: results.raw.waypoint || { name: 'Current Position', latitude: results.raw.latitude, longitude: results.raw.longitude },
        flightLevel: results.raw.altitude ? Math.round(results.raw.altitude / 100) : 0,
        windDirection: wind_direction,
        windSpeed: wind_speed
      };
      ResultFormatter.windData(results, [wind]);
    }
  }
}