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

// By type. The two digits are the type's version and are kept: versions differ in layout
// (POS01 15 or 16 fields, POS02 16).
const DESCRIPTIONS: Record<string, string> = {
  ADV01: 'Ride Conditions Report',
  CLB02: 'Climb Report',
  DVC01: 'Divert Plan (Crew Copy)',
  ETA03: 'ETA Report',
  FCM01: 'Engine and Fuel State',
  FCR03: 'Runway Condition Report',
  FHD04: 'Frequency Handoff Report',
  FLI01: 'Flight Initialization',
  FTD02: 'Free Text to Dispatch',
  GAM02: 'Gate Assignment Request',
  HGD03: 'HowGozit Report',
  HLD01: 'Holding Report',
  INN03: 'In Report',
  INR04: 'In Range Report',
  MXR03: 'Maintenance Report',
  OFF02: 'Off Report',
  ONN02: 'On Report',
  OUT03: 'Out Report',
  PFR03: 'Post Flight Report',
  POS01: 'Position Report',
  POS02: 'Position Report',
  RRR01: 'Reroute Report',
  RTG04: 'Return to Gate Report',
  RTG05: 'Return to Gate Report',
  TDM01: 'Door Report',
  TRB02: 'Turbulence Report',
  TXI02: 'Taxi Report',
  VXR02: 'Voice Call Request',
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
    if (!d || !isSwaType(d.type, '37')) {
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

    const text = d.text;
    const fields = swaFields(text);
    const layouts = SWA_LAYOUTS[d.type];
    const prefix = SWA_PREFIX_LAYOUTS[d.type];
    const clean = !text.includes(SWA_UNREAD);
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
      const rest = this.writeMaintenance(decodeResult, text, fields);
      decodeResult.decoder.decodeLevel = rest === 0 ? 'full' : 'partial';
      return decodeResult;
    }

    if (clean && !layouts && !prefix) {
      // Free text and the report types whose fields are not read: the text in full.
      const lines = text.split('|');
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
    ResultFormatter.text(decodeResult, text.split('|').join('\n'));
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
      case 'POS02':
      case 'HGD03':
      case 'FHD04': {
        // from, to, lat, lon, alt, IAS, TAS, Mach, FOB, ETA, track, wind dir, wind kt, SAT, gross wt
        w.departure(0);
        w.arrival(1);
        w.position(2, 3);
        w.altitude(4);
        const ias = w.int(5);
        if (ias !== undefined)
          ResultFormatter.indicatedAirspeed(decodeResult, ias);
        const tas = w.int(6);
        if (tas !== undefined) ResultFormatter.airspeed(decodeResult, tas);
        ResultFormatter.mach(decodeResult, Number(w.use(7)));
        w.fuel(8);
        w.eta(9);
        const track = w.int(10);
        if (track !== undefined) ResultFormatter.track(decodeResult, track);
        ResultFormatter.wind(decodeResult, w.int(11), w.int(12));
        const sat = w.int(13);
        if (sat !== undefined)
          ResultFormatter.temperature(decodeResult, `${sat}`);
        // FHD04 has the first 14 fields, then event, X, gross wt, digit, snapshot HHMMSS,
        // frequency in use, 00000.
        const gwIndex = type === 'FHD04' ? 16 : 14;
        const gw = w.int(gwIndex);
        if (gw !== undefined) ResultFormatter.grossWeight(decodeResult, gw);
        // The 16-field POS01 and POS02 end with the send time, HHMMSS.
        if (type !== 'FHD04' && fields.length === 16) {
          w.time(15, (r, t) => ResultFormatter.timestamp(r, t));
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
        // ETA (11-19 min after the report time in every one of 34,851), then the report time.
        w.departure(0);
        w.arrival(1);
        w.eta(2);
        w.time(3, (r, t) => ResultFormatter.timestamp(r, t));
        w.fuel(4);
        w.position(5, 6);
        break;
      case 'FLI01':
        w.departure(0);
        w.arrival(1);
        w.time(2, (r, t) => ResultFormatter.timestamp(r, t));
        w.fuel(3);
        w.position(4, 5);
        break;
      case 'OUT03':
        // Out time, FOB, a second fuel figure (not established), front door (L1) closed.
        w.departure(0);
        w.arrival(1);
        w.time(2, (r, t) => ResultFormatter.out(r, t));
        w.fuel(3);
        w.timeItem(5, 'front_door_closed_time', 'L1CLS', 'Front Door Closed');
        break;
      case 'TXI02':
        w.departure(0);
        w.arrival(1);
        w.timeItem(2, 'taxi_start_time', 'TAXI', 'Taxi Start Time');
        w.fuel(3);
        break;
      case 'INN03':
        w.departure(0);
        w.arrival(1);
        // In time, then front door (L1) opened; the four door flags are not established.
        w.time(2, (r, t) => ResultFormatter.in(r, t));
        w.timeItem(3, 'front_door_open_time', 'L1OPN', 'Front Door Opened');
        w.fuel(4);
        break;
      case 'RTG04':
      case 'RTG05':
        // Out, in, report time; the four door flags are not established.
        w.departure(0);
        w.arrival(1);
        w.time(2, (r, t) => ResultFormatter.out(r, t));
        w.time(3, (r, t) => ResultFormatter.in(r, t));
        w.time(4, (r, t) => ResultFormatter.timestamp(r, t));
        w.fuel(5);
        break;
      case 'TDM01': {
        w.departure(0);
        w.arrival(1);
        w.position(2, 3);
        ResultFormatter.door_event(
          decodeResult,
          DOORS[w.use(4)],
          w.use(5) === 'O' ? 'open' : 'closed',
        );
        // Date (MMDD) and time (HHMMSS) of the door event.
        const md = fields[6];
        if (/^(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])$/.test(md)) {
          w.use(6);
          ResultFormatter.month(decodeResult, Number(md.substring(0, 2)));
          ResultFormatter.day(decodeResult, Number(md.substring(2)));
        } else if (!/^\d+$/.test(md)) {
          w.use(6);
        }
        w.time(7, (r, t) => ResultFormatter.timestamp(r, t));
        break;
      }
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
        w.time(5, (r, t) => ResultFormatter.timestamp(r, t));
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
