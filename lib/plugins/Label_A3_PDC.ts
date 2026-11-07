import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label A3 — Pre-Departure Clearance (PDC)
 *
 * ATC-issued departure clearance delivered via D-ATIS / datalink, confirming
 * routing, runway, squawk, frequencies, and ATIS code to the flight crew
 * before pushback.
 *
 * Wire format (single concatenated text with embedded newlines or spaces):
 *
 *   RIOCGYA.DC1.CLD 2227 260419 SBGR PDC 692
 *   IBE0272 CLRD TO LEMD OFF 10L VIA AMVUL6A
 *   AMVUL6A/NUXEL/F350/NUXEL UZ23 OGSOO DCT EVTOR ...
 *   ... Z409 TLD
 *   SQUAWK 4447 ADT 2220 NEXT FREQ 126.900 ATIS Z
 *   APP 120.454 D02
 *
 * Header tokens:
 *   FACILITY  — originating ATC datalink facility (e.g. RIOCGYA = Rio/Galeão)
 *   DC<n>     — Departure Clearance message subtype (DC1, DC2, ...)
 *   CLD       — Clearance message type
 *   HHMM      — UTC time of clearance
 *   DDMMYY    — date of clearance
 *   ICAO      — departure airport
 *   PDC       — message format keyword
 *   SEQ       — facility-local PDC sequence number
 *
 * Body:
 *   CALLSIGN CLRD TO <ICAO> OFF <RWY> VIA <SID>
 *   <route line(s)>
 *
 * Trailer (any order):
 *   SQUAWK <NNNN>
 *   ADT    <HHMM>           — target/actual departure time (interpreted)
 *   NEXT FREQ <NNN.NNN>     — next ATC sector frequency
 *   ATIS   <letter>         — required ATIS information code
 *   APP <NNN.NNN> D<NN>     — undocumented trailing field, raw only
 *
 * Per the analyst's "ignore wild-guesses" guidance, the trailing
 * `APP ... D02` token is exposed verbatim as a raw string with no
 * interpretation.
 */
export class Label_A3_PDC extends DecoderPlugin {
  name = 'label-a3-pdc';

  qualifiers() {
    return {
      labels: ['A3'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Pre-Departure Clearance (PDC)',
    );

    const text = (message.text || '').replace(/\r/g, '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── Header: FACILITY.DC<n>[./]CLD HHMM YYMMDD ICAO PDC SEQ ──
    // Separator between SUBTYPE and MSGTYPE is either `.` (e.g. SBGR form)
    // or `/` (e.g. EDDF/Frankfurt form). A leading `/` in front of the
    // facility is optional.
    const headerRe =
      /\/?(?<facility>[A-Z0-9]+)\.(?<subtype>DC\d+)[./](?<msgtype>[A-Z]{2,4})\s+(?<time>\d{4})\s+(?<date>\d{6})\s+(?<dep>[A-Z]{3,4})\s+(?<format>PDC)\s+(?<seq>\d+)/;
    const h = text.match(headerRe);
    if (!h?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { facility, subtype, msgtype, time, date, dep, format, seq } =
      h.groups;
    const headerEnd = (h.index ?? 0) + h[0].length;
    let body = text.slice(headerEnd).trim();

    // ── Callsign + clearance line: CALLSIGN CLRD TO <ICAO> OFF <RWY> VIA <SID> ──
    let callsign = '';
    let destination = '';
    let runway = '';
    let sid = '';
    const clrRe =
      /(?<callsign>[A-Z]{2,3}\d{1,5}|[A-Z][A-Z0-9]{2,7})\s+CLRD\s+TO\s+(?<dest>[A-Z]{3,4})(?:\s+OFF\s+(?<rwy>\d{1,2}[LRC]?))?(?:\s+VIA\s+(?<sid>[A-Z0-9]+))?/;
    const c = body.match(clrRe);
    if (c?.groups) {
      callsign = c.groups.callsign;
      destination = c.groups.dest;
      runway = c.groups.rwy || '';
      sid = c.groups.sid || '';
      body = body.slice((c.index ?? 0) + c[0].length).trim();
    }

    // ── Trailer fields (any order, anywhere in body) ──
    let squawk = '';
    let adt = '';
    let nextFreq = '';
    let atis = '';
    let appRaw = '';

    const sqM = body.match(/\bSQUAWK\s+(\d{4})\b/);
    if (sqM) squawk = sqM[1];

    // ADT is usually HHMM (digits), but some implementations emit a
    // short alphanumeric flow-control token (e.g. "ADT MDI"). Accept both.
    const adtM = body.match(/\bADT\s+([A-Z0-9]{2,6})\b/);
    if (adtM) adt = adtM[1];

    const nfM = body.match(/\bNEXT\s+FREQ\s+(\d{3}\.\d{1,3})\b/);
    if (nfM) nextFreq = nfM[1];

    const atisM = body.match(/\bATIS\s+([A-Z])\b/);
    if (atisM) atis = atisM[1];

    const appM = body.match(/\bAPP\s+(\d{3}\.\d{1,3})(?:\s+(D\d{1,3}))?/);
    if (appM) appRaw = appM[2] ? `${appM[1]} ${appM[2]}` : appM[1];

    // ── Startup / TSAT block (Frankfurt / CFMU-style PDCs) ──
    //   "STARTUP APPROVED ACCORDING TSAT <token>"
    //   "STARTUP APPROVED" (no TSAT token)
    let startup = '';
    let tsat = '';
    const startupM = body.match(
      /\bSTARTUP\s+APPROVED(?:\s+ACCORDING\s+TSAT\s+(?<tsat>[A-Z0-9]+))?/,
    );
    if (startupM) {
      startup = startupM[0].replace(/\s+/g, ' ').trim();
      tsat = startupM.groups?.tsat || '';
    }

    // ── Route: everything between SID line and SQUAWK/ADT/NEXT FREQ/ATIS/APP/STARTUP ──
    const trailerStart = ['SQUAWK', 'ADT', 'NEXT FREQ', 'ATIS ', 'APP ', 'STARTUP']
      .map((t) => body.indexOf(t))
      .filter((i) => i >= 0)
      .reduce((a, b) => Math.min(a, b), body.length);
    const route = body
      .slice(0, trailerStart)
      .replace(/\s+/g, ' ')
      .trim();

    // ── Date YYMMDD → ISO YYYY-MM-DD (assume 20YY).
    // Note: the analyst report labels this "DDMMYY" but the wire value
    // matches YYMMDD against today's date (260419 = 2026-04-19).
    const yy = date.substring(0, 2);
    const mo = date.substring(2, 4);
    const dd = date.substring(4, 6);
    const isoDate = `20${yy}-${mo}-${dd}`;

    // ── raw[] ──
    decodeResult.raw.facility = facility;
    decodeResult.raw.subtype = subtype;
    decodeResult.raw.message_type = msgtype;
    decodeResult.raw.format = format;
    decodeResult.raw.pdc_sequence = seq;
    decodeResult.raw.date = isoDate;
    if (callsign) {
      decodeResult.raw.callsign = callsign;
      ResultFormatter.flightNumber(decodeResult, callsign);
    }
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(time + '00'),
    );
    ResultFormatter.departureAirport(decodeResult, dep);
    if (destination) ResultFormatter.arrivalAirport(decodeResult, destination);
    if (runway) decodeResult.raw.departure_runway = runway;
    if (sid) decodeResult.raw.sid = sid;
    if (route) decodeResult.raw.route = route;
    if (squawk) decodeResult.raw.squawk = squawk;
    if (adt) {
      decodeResult.raw.adt = /^\d{4}$/.test(adt)
        ? `${adt.substring(0, 2)}:${adt.substring(2, 4)}`
        : adt;
    }
    if (nextFreq) decodeResult.raw.next_frequency = nextFreq;
    if (atis) decodeResult.raw.atis_code = atis;
    if (appRaw) decodeResult.raw.app_trailing = appRaw;
    if (startup) decodeResult.raw.startup_approval = startup;
    if (tsat) decodeResult.raw.tsat_token = tsat;

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Pre-Departure Clearance (PDC)',
      },
      {
        type: 'facility',
        code: 'FACILITY',
        label: 'ATC Facility',
        value: facility,
      },
      {
        type: 'subtype',
        code: 'SUBTYPE',
        label: 'Subtype',
        value: subtype,
      },
    );

    decodeResult.formatted.items.push(
      {
        type: 'time',
        code: 'TIME',
        label: 'Clearance Time (UTC)',
        value: `${time.substring(0, 2)}:${time.substring(2, 4)}`,
      },
      {
        type: 'date',
        code: 'DATE',
        label: 'Date',
        value: isoDate,
      },
      {
        type: 'pdc_sequence',
        code: 'PDCSEQ',
        label: 'PDC Sequence',
        value: seq,
      },
    );
    if (callsign) {
      decodeResult.formatted.items.push({
        type: 'callsign',
        code: 'CALLSIGN',
        label: 'Callsign',
        value: callsign,
      });
    }
    if (runway) {
      decodeResult.formatted.items.push({
        type: 'runway',
        code: 'RWY',
        label: 'Departure Runway',
        value: runway,
      });
    }
    if (sid) {
      decodeResult.formatted.items.push({
        type: 'sid',
        code: 'SID',
        label: 'SID',
        value: sid,
      });
    }
    if (route) {
      decodeResult.formatted.items.push({
        type: 'route',
        code: 'ROUTE',
        label: 'Route',
        value: route,
      });
    }
    if (squawk) {
      decodeResult.formatted.items.push({
        type: 'squawk',
        code: 'SQK',
        label: 'Squawk',
        value: squawk,
      });
    }
    if (adt) {
      const adtDisplay = /^\d{4}$/.test(adt)
        ? `${adt.substring(0, 2)}:${adt.substring(2, 4)}`
        : adt;
      decodeResult.formatted.items.push({
        type: 'adt',
        code: 'ADT',
        label: 'ADT (UTC / flow token)',
        value: adtDisplay,
      });
    }
    if (nextFreq) {
      decodeResult.formatted.items.push({
        type: 'next_frequency',
        code: 'NEXTFRQ',
        label: 'Next Frequency',
        value: `${nextFreq} MHz`,
      });
    }
    if (atis) {
      decodeResult.formatted.items.push({
        type: 'atis_code',
        code: 'ATIS',
        label: 'ATIS Code',
        value: atis,
      });
    }
    if (appRaw) {
      decodeResult.formatted.items.push({
        type: 'app_trailing',
        code: 'APPRAW',
        label: 'Trailing APP Field (raw)',
        value: appRaw,
      });
    }
    if (startup) {
      decodeResult.formatted.items.push({
        type: 'startup_approval',
        code: 'STARTUP',
        label: 'Startup Approval',
        value: startup,
      });
    }
    if (tsat) {
      decodeResult.formatted.items.push({
        type: 'tsat_token',
        code: 'TSAT',
        label: 'TSAT / Slot Token',
        value: tsat,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
