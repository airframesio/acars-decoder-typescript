import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import {
  decodeSwaLabel37,
  isSwaType,
  SWA_UNREAD,
} from '../utils/swa_compressed';
import {
  SWA_LAYOUTS,
  SWA_PREFIX_LAYOUTS,
  SwaFieldWriter,
  swaFields,
  swaMatchesLayout,
} from '../utils/swa_fields';

const DESCRIPTIONS: Record<string, string> = {
  OUT03: 'Out Report',
  TXI02: 'Taxi Report',
  OFF02: 'Off Report',
  ONN02: 'On Report',
  INN03: 'In Report',
  FLI01: 'Flight Initialization',
  CLB02: 'Climb Report',
  POS01: 'Position Report',
  HGD03: 'HowGozit Report',
  ETA03: 'ETA Report',
  INR04: 'In Range Report',
  GAM02: 'Gate Assignment Request',
  MXR03: 'Maintenance Report',
  FTD02: 'Free Text to Dispatch',
  TRB02: 'Turbulence Report',
  HLD01: 'Holding Report',
  DVC01: 'Divert Plan (Crew Copy)',
  FCR03: 'Runway Condition Report',
  VXR02: 'Voice Call Request',
  RTG04: 'Return to Gate Report',
  RTG05: 'Return to Gate Report',
  TDM01: 'Door Report',
  FCM01: 'Engine and Fuel State',
  RRR01: 'Reroute Report',
  ADV01: 'Ride Conditions Report',
  FHD04: 'Frequency Handoff Report',
  PFR03: 'Post Flight Report',
};

const DOORS: Record<string, string> = {
  L1: 'L1 (forward entry)',
  L2: 'L2 (aft entry)',
  CR: 'Cargo',
  SV: 'Service',
};

const MXR_CODES: Record<string, string> = {
  '0': 'Nothing to report',
  '1': 'Status option',
  '2': 'Category and text',
  '3': 'Free text',
};

/**
 * Southwest Airlines label 37 downlinks: a two-digit table code, the type name in that table on
 * the first line, then the body in the same table. See utils/swa_compressed.ts.
 */
export class Label_37_SWA extends DecoderPlugin {
  name = 'label-37-swa';

  qualifiers() {
    return {
      labels: ['37'],
      preambles: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    const d = decodeSwaLabel37(message.text);
    if (!d || !isSwaType(d.type)) {
      if (options.debug) {
        console.log(`Decoder: Unknown 37 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.formatted.description = 'Unknown';
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.formatted.description =
      DESCRIPTIONS[d.type] ?? 'Southwest Message';
    decodeResult.raw.preamble = d.type;

    const fields = swaFields(d.text);
    const layouts = SWA_LAYOUTS[d.type];
    const prefix = SWA_PREFIX_LAYOUTS[d.type];
    const clean = !d.text.includes(SWA_UNREAD);
    if (clean && layouts && swaMatchesLayout(fields, layouts)) {
      const rest = this.writeFields(decodeResult, d.type, fields);
      decodeResult.decoder.decodeLevel = rest === 0 ? 'full' : 'partial';
      return decodeResult;
    }
    if (
      clean &&
      prefix &&
      swaMatchesLayout(fields.slice(0, prefix.length), [prefix])
    ) {
      const rest = this.writeMaintenance(decodeResult, d.text, fields);
      decodeResult.decoder.decodeLevel = rest === 0 ? 'full' : 'partial';
      return decodeResult;
    }

    if (clean && !layouts && !prefix) {
      // Free text and the report types whose fields are not read: the text in full.
      const lines = d.text.split('|');
      const route = lines[0].match(/^([A-Z]{4}),([A-Z]{4})$/);
      if (route && d.type === 'FTD02') {
        ResultFormatter.departureAirport(decodeResult, route[1]);
        ResultFormatter.arrivalAirport(decodeResult, route[2]);
        lines.shift();
      }
      ResultFormatter.text(decodeResult, lines.join('\n'));
      decodeResult.decoder.decodeLevel = 'full';
      return decodeResult;
    }

    // An unread character or a field that breaks the type's layout: show the text only.
    ResultFormatter.text(decodeResult, d.text.split('|').join('\n'));
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }

  /** Writes a laid-out type's fields; returns how many went to `remaining`. */
  private writeFields(
    decodeResult: DecodeResult,
    type: string,
    fields: string[],
  ): number {
    const w = new SwaFieldWriter(decodeResult, fields);
    switch (type) {
      case 'POS01':
      case 'HGD03':
      case 'FHD04': {
        // from, to, lat, lon, alt, IAS, TAS, Mach, FOB, ETA, track, wind dir, wind kt, SAT, gross wt
        w.departure(0);
        w.arrival(1);
        w.position(2, 3);
        w.altitude(4);
        const ias = w.int(5);
        if (ias !== undefined) {
          w.item(
            5,
            'indicated_airspeed',
            'IAS',
            'Indicated Airspeed',
            `${ias} knots`,
          );
        }
        const tas = w.int(6);
        if (tas !== undefined) ResultFormatter.airspeed(decodeResult, tas);
        ResultFormatter.mach(decodeResult, Number(w.use(7)));
        w.fuel(8);
        w.eta(9);
        const track = w.int(10);
        if (track !== undefined) {
          w.item(10, 'track', 'TRK', 'Track', `${track} degrees`);
        }
        const windDir = w.int(11);
        const windSpeed = w.int(12);
        if (windDir !== undefined && windSpeed !== undefined) {
          w.item(
            11,
            'wind',
            'WIND',
            'Wind',
            `${windDir} degrees at ${windSpeed} knots`,
          );
        } else if (windDir !== undefined) {
          w.item(
            11,
            'wind_direction',
            'WDIR',
            'Wind Direction',
            `${windDir} degrees`,
          );
        } else if (windSpeed !== undefined) {
          w.item(12, 'wind_speed', 'WSPD', 'Wind Speed', `${windSpeed} knots`);
        }
        const sat = w.int(13);
        if (sat !== undefined)
          ResultFormatter.temperature(decodeResult, `${sat}`);
        // FHD04 has the first 14 fields, then event, X, gross wt, digit, snapshot HHMMSS,
        // frequency in use, 00000.
        const gwIndex = type === 'FHD04' ? 16 : 14;
        const gw = w.int(gwIndex);
        if (gw !== undefined) {
          w.item(
            gwIndex,
            'gross_weight',
            'GWT',
            'Gross Weight',
            `${gw} pounds`,
          );
        }
        if (type === 'FHD04') {
          w.item(14, 'event', 'EVT', 'Event', fields[14]);
          w.use(15);
          const freq = w.use(19);
          if (/^1\d{5}$/.test(freq)) {
            w.item(
              19,
              'frequency',
              'FREQ',
              'ACARS Frequency',
              `${freq.substring(0, 3)}.${freq.substring(3)} MHz`,
            );
          }
        }
        break;
      }
      case 'GAM02':
        w.departure(0);
        w.arrival(1);
        w.eta(2);
        w.position(3, 4);
        break;
      case 'CLB02':
        w.departure(0);
        w.arrival(1);
        w.position(2, 4);
        w.fuel(5);
        w.eta(6);
        break;
      case 'ETA03':
        w.departure(0);
        w.arrival(1);
        w.eta(2);
        w.fuel(3);
        w.position(4, 5);
        break;
      case 'INR04':
        w.departure(0);
        w.arrival(1);
        w.fuel(4);
        w.position(5, 6);
        break;
      case 'FLI01':
        w.departure(0);
        w.arrival(1);
        w.fuel(3);
        w.position(4, 5);
        break;
      case 'OUT03':
      case 'TXI02':
        w.departure(0);
        w.arrival(1);
        w.fuel(3);
        break;
      case 'INN03':
        w.departure(0);
        w.arrival(1);
        w.fuel(4);
        break;
      case 'RTG04':
      case 'RTG05':
        w.departure(0);
        w.arrival(1);
        w.fuel(5);
        break;
      case 'TDM01':
        w.departure(0);
        w.arrival(1);
        w.position(2, 3);
        ResultFormatter.door_event(
          decodeResult,
          DOORS[w.use(4)],
          w.use(5) === 'O' ? 'open' : 'closed',
        );
        break;
      case 'FCM01': {
        // L, R (engines), A (APU), each 1 running / 0 off; fuel in hundreds of pounds
        const names: Record<string, string> = {
          L: 'Left Engine',
          R: 'Right Engine',
          A: 'APU',
        };
        for (let i = 0; i < 3; i++) {
          const v = fields[i];
          if (v[1] === '0' || v[1] === '1') {
            w.item(
              i,
              `${names[v[0]].toLowerCase().replace(' ', '_')}`,
              v[0],
              names[v[0]],
              v[1] === '1' ? 'running' : 'off',
            );
          }
        }
        ResultFormatter.currentFuel(decodeResult, Number(w.use(4)) * 100);
        break;
      }
      case 'VXR02':
        w.item(0, 'station_iata', 'STN', 'Station', fields[0]);
        break;
    }
    return w.finish();
  }

  /** MXR03: destination, ETA, code, then the category and text; returns how many header
   * fields went to `remaining`. */
  private writeMaintenance(
    decodeResult: DecodeResult,
    text: string,
    fields: string[],
  ): number {
    const w = new SwaFieldWriter(decodeResult, fields.slice(0, 3));
    w.arrival(0);
    w.eta(1);
    w.item(
      2,
      'maintenance_code',
      'MXCODE',
      'Report Code',
      `${fields[2]} (${MXR_CODES[fields[2]]})`,
    );
    // Skip the three header fields (the separators may be ',' or a line break).
    const header = text.match(/^[^,|]*[,|][^,|]*[,|][^,|]*[,|]?/);
    const body = text.substring(header ? header[0].length : 0);
    if (body.trim() !== '') {
      ResultFormatter.text(decodeResult, body.split('|').join('\n'));
    }
    return w.finish();
  }
}
