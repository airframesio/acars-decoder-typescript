import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label B2 — Oceanic Clearance Acknowledgement (OCRA / CLA)
 *
 * Downlink confirming that an oceanic clearance uplink (CLX) has been
 * received and acknowledged by the aircraft. Carries the time, date,
 * oceanic FIR, clearance number, callsign, destination, cleared route
 * (random-route or named NAT track) with coordinate waypoints, entry-
 * fix time, cleared flight level, and cleared Mach.
 *
 * Wire format:
 *
 *   /PIKCLYA.OC1/CLA 1911 260420 EGGX CLRNCE 296 AFR012 CLRD TO KJFK VIA
 *   DINIM RANDOM ROUTE DINIM 5130N020W 5230N030W 5130N040W 4930N050W IBERG
 *   FM DINIM/2039 MNTN F400 M085 END OF MESSAGE 694F
 *
 * Date field: 6 digits in YYMMDD order (e.g. `260420` = 2026-04-20).
 * (An earlier analyst report read this as DDMMYY; that interpretation
 * is inconsistent with the real message date — corrected here.)
 */
export class Label_B2_OCRA extends DecoderPlugin {
  name = 'label-b2-ocra';

  qualifiers() {
    return {
      labels: ['B2'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Oceanic Clearance Acknowledgement (OCRA / CLA)',
    );

    const text = (message.text || '').replace(/\r/g, ' ').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── Envelope: /<station>/CLA HHMM YYMMDD FIR CLRNCE <num> <cs> CLRD TO <dest> VIA <...> ──
    const envelope = text.match(
      /^\/(?<station>[A-Z0-9]+)\.(?<channel>[A-Z0-9]+)\/(?<rest>.+)$/,
    );
    let station = '';
    let channel = '';
    let body = text;
    if (envelope?.groups) {
      station = envelope.groups.station;
      channel = envelope.groups.channel;
      body = envelope.groups.rest;
    }

    // ── Header ──
    const headerRe =
      /\bCLA\s+(?<time>\d{4})\s+(?<date>\d{6})\s+(?<fir>[A-Z]{4})\s+CLRNCE\s+(?<clrnum>\d+)\s+(?<callsign>[A-Z0-9]{3,7})\s+CLRD\s+TO\s+(?<dest>[A-Z]{3,4})(?:\s+VIA\s+(?<route>.*?))?(?:\s+END\s+OF\s+MESSAGE\s+(?<crc>[0-9A-F]{4,}))?\s*$/;
    const h = body.match(headerRe);
    if (!h?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { time, date, fir, clrnum, callsign, dest, route, crc } = h.groups;
    const hh = Number(time.substring(0, 2));
    const mm = Number(time.substring(2, 4));
    if (hh > 23 || mm > 59) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Date YYMMDD → ISO YYYY-MM-DD
    const yy = date.substring(0, 2);
    const mo = date.substring(2, 4);
    const dd = date.substring(4, 6);
    const monthN = Number(mo);
    const dayN = Number(dd);
    if (monthN < 1 || monthN > 12 || dayN < 1 || dayN > 31) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    const isoDate = `20${yy}-${mo}-${dd}`;

    // ── Extract route-block fields ──
    let entryFix = '';
    let entryTime = '';
    let maintainFL = '';
    let machNumber = '';
    let routeType = '';
    const waypoints: string[] = [];
    const routeText = route || '';
    const routeClean = routeText.replace(/\s+/g, ' ').trim();

    const fmM = routeClean.match(/\bFM\s+([A-Z0-9]+)\/(\d{4})\b/);
    if (fmM) {
      entryFix = fmM[1];
      entryTime = fmM[2];
    }
    const mntnM = routeClean.match(/\bMNTN\s+(F\d{3})\b/);
    if (mntnM) maintainFL = mntnM[1];
    const machM = routeClean.match(/\bM(\d{3})\b/);
    if (machM) machNumber = `0.${machM[1]}`.replace('0.0', '0.');
    const rrM = routeClean.match(/\bRANDOM\s+ROUTE\b/i);
    if (rrM) routeType = 'Random Route';
    else {
      const natM = routeClean.match(/\bTRACK\s+([A-Z])\b/i);
      if (natM) routeType = `NAT Track ${natM[1]}`;
    }

    // Waypoints between RANDOM ROUTE (or VIA) and `FM`
    const wpSection = routeClean
      .replace(/\bRANDOM\s+ROUTE\b/i, '')
      .replace(/\bFM\b[\s\S]*$/, '')
      .trim();
    for (const tok of wpSection.split(/\s+/)) {
      if (!tok) continue;
      if (/^[A-Z]{3,5}$/.test(tok) || /^\d{4}N\d{3}W$/.test(tok) || /^\d{4}N\d{3}E$/.test(tok)) {
        waypoints.push(tok);
      }
    }

    // ── raw ──
    if (station) decodeResult.raw.station = station;
    if (channel) decodeResult.raw.channel = channel;
    decodeResult.raw.message_type = 'CLA';
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(time + '00'),
    );
    decodeResult.raw.report_date = isoDate;
    decodeResult.raw.oceanic_fir = fir;
    decodeResult.raw.clearance_number = clrnum;
    ResultFormatter.flightNumber(decodeResult, callsign);
    ResultFormatter.arrivalAirport(decodeResult, dest);
    if (routeType) decodeResult.raw.route_type = routeType;
    if (waypoints.length) decodeResult.raw.waypoints = waypoints;
    if (entryFix) decodeResult.raw.entry_fix = entryFix;
    if (entryTime) decodeResult.raw.entry_time = `${entryTime.substring(0, 2)}:${entryTime.substring(2, 4)}`;
    if (maintainFL) decodeResult.raw.cleared_flight_level = maintainFL;
    if (machNumber) decodeResult.raw.cleared_mach = machNumber;
    if (crc) decodeResult.raw.crc = crc;

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift({
      type: 'message_type',
      code: 'MSGTYP',
      label: 'Message Type',
      value: 'Oceanic Clearance Acknowledgement (CLA)',
    });
    if (station) {
      decodeResult.formatted.items.push({
        type: 'station',
        code: 'STATION',
        label: 'Ground Station',
        value: `${station}.${channel}`,
      });
    }
    decodeResult.formatted.items.push(
      {
        type: 'time',
        code: 'TIME',
        label: 'Time (UTC)',
        value: `${time.substring(0, 2)}:${time.substring(2, 4)}`,
      },
      {
        type: 'date',
        code: 'DATE',
        label: 'Date',
        value: isoDate,
      },
      {
        type: 'oceanic_fir',
        code: 'FIR',
        label: 'Oceanic FIR',
        value: fir,
      },
      {
        type: 'clearance_number',
        code: 'CLRNUM',
        label: 'Clearance Number',
        value: clrnum,
      },
      {
        type: 'callsign',
        code: 'CALLSIGN',
        label: 'Callsign',
        value: callsign,
      },
    );
    if (routeType) {
      decodeResult.formatted.items.push({
        type: 'route_type',
        code: 'ROUTE',
        label: 'Route Type',
        value: routeType,
      });
    }
    if (waypoints.length) {
      decodeResult.formatted.items.push({
        type: 'waypoints',
        code: 'WPTS',
        label: 'Waypoints',
        value: waypoints.join(' → '),
      });
    }
    if (entryFix) {
      decodeResult.formatted.items.push({
        type: 'entry_fix',
        code: 'ENTRY',
        label: 'Oceanic Entry Fix',
        value: entryTime
          ? `${entryFix} @ ${entryTime.substring(0, 2)}:${entryTime.substring(2, 4)} UTC`
          : entryFix,
      });
    }
    if (maintainFL) {
      decodeResult.formatted.items.push({
        type: 'maintain_fl',
        code: 'MNTN',
        label: 'Cleared Flight Level',
        value: `${maintainFL} (FL${maintainFL.substring(1)})`,
      });
    }
    if (machNumber) {
      decodeResult.formatted.items.push({
        type: 'cleared_mach',
        code: 'MACH',
        label: 'Cleared Mach',
        value: `M${machNumber}`,
      });
    }
    if (crc) {
      decodeResult.formatted.items.push({
        type: 'crc',
        code: 'CRC',
        label: 'CRC',
        value: crc,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
