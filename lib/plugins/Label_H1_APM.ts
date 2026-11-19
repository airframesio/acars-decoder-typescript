import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label H1 — APM (Aircraft Performance Monitoring / ACMF Snapshot)
 *
 * Downlink carrying an ACMF (Airplane Condition Monitoring Function)
 * cruise performance snapshot. Transmitted via the CFB (Crew Flight Bag)
 * H1 channel — matches the `#CFBAPM_REPORT` pattern seen in the label
 * documentation.
 *
 * Wire format:
 *
 *   APM 6 HL8573 KAL075 RKSI CYVR 200426221336
 *   ,ACMF0021,.837,,,285.2,,,-28.81,,,35001,,,432443,,,5681,5697,,,
 *    84.72, 84.72,,,  5.495,535.0,,,
 *    66.7, 66.7, 95.5, 95.5,,,0,0,1,,,,,, 53.6454,,,
 *   -1
 *
 * Header tokens:
 *   APM      — message type (Aircraft Performance Monitoring)
 *   <seq>    — numeric sub-type / record count (undocumented, wild-guess — ignored)
 *   <tail>   — aircraft registration
 *   <flight> — ICAO callsign
 *   <origin> <destination> — ICAO airport codes
 *   <ts>     — YYMMDDHHMMSS UTC timestamp
 *
 * Comma-delimited body carries the ACMF snapshot. Per the analyst's
 * confidence classification, only the physically-verifiable cruise
 * parameters are surfaced (Mach, OAT, altitude, N1, N2, EGT). The
 * wild-guess fields (sequence number, fuel flows, gross weight, boolean
 * flags, undocumented numerics) are intentionally NOT decoded.
 */
export class Label_H1_APM extends DecoderPlugin {
  name = 'label-h1-apm';

  qualifiers() {
    return {
      labels: ['H1'],
      preambles: ['APM', '#CFBAPM'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Aircraft Performance Monitoring (APM / ACMF Snapshot)',
    );

    const text = (message.text || '').replace(/\r/g, '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── Header: APM <seq> <tail> <flight> <origin> <dest> <YYMMDDHHMMSS> ──
    // Tolerate a leading `#CFB` or similar prefix before `APM`.
    const headerRe =
      /(?:^|\b)APM\s+(?<seq>\d+)\s+(?<tail>[A-Z0-9-]{3,10})\s+(?<flight>[A-Z]{2,3}\d{1,5}[A-Z]?)\s+(?<origin>[A-Z]{3,4})\s+(?<dest>[A-Z]{3,4})\s+(?<ts>\d{12})/;
    const h = text.match(headerRe);
    if (!h?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    const { tail, flight, origin, dest, ts } = h.groups;

    // Parse timestamp YYMMDDHHMMSS
    const yy = ts.substring(0, 2);
    const mo = ts.substring(2, 4);
    const dd = ts.substring(4, 6);
    const hh = ts.substring(6, 8);
    const mm = ts.substring(8, 10);
    const ss = ts.substring(10, 12);
    const isoDate = `20${yy}-${mo}-${dd}`;
    const timeStr = `${hh}:${mm}:${ss}`;

    ResultFormatter.tail(decodeResult, tail);
    ResultFormatter.flightNumber(decodeResult, flight);
    ResultFormatter.departureAirport(decodeResult, origin);
    ResultFormatter.arrivalAirport(decodeResult, dest);
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(hh + mm + ss),
    );
    decodeResult.raw.report_date = isoDate;
    decodeResult.raw.report_time = timeStr;

    // ── Body: flatten the comma-delimited data block after the header ──
    const bodyText = text.slice((h.index ?? 0) + h[0].length);
    const fields = bodyText.split(',').map((s) => s.trim());

    // Decode only the confirmed / interpreted fields per the analyst's
    // confidence table. Indices are offsets from the leading comma of the
    // body block (field[0] is the empty string before `ACMF0021`).
    //   [1]  ACMF version  (e.g. "ACMF0021")
    //   [2]  Mach number   (.837)
    //   [8]  OAT °C        (-28.81)
    //   [11] Altitude ft   (35001)
    //   [21] Engine 1 N1 % (84.72)
    //   [22] Engine 2 N1 % (84.72)
    //   [26] EGT °C        (535.0)
    //   [29] Engine 1 N2 % (66.7)
    //   [30] Engine 2 N2 % (66.7)
    const get = (i: number) =>
      fields[i] !== undefined ? fields[i].trim() : '';
    const acmfVer = get(1);
    const mach = get(2);
    const oat = get(8);
    const alt = get(11);
    const n1e1 = get(21);
    const n1e2 = get(22);
    const egt = get(26);
    const n2e1 = get(29);
    const n2e2 = get(30);

    if (acmfVer) decodeResult.raw.acmf_version = acmfVer;
    if (/^\.\d+$|^\d\.\d+$/.test(mach))
      decodeResult.raw.mach = Number(mach);
    if (/^-?\d+(?:\.\d+)?$/.test(oat))
      ResultFormatter.temperature(decodeResult, oat);
    if (/^\d+$/.test(alt))
      ResultFormatter.altitude(decodeResult, Number(alt));
    if (/^\d+(?:\.\d+)?$/.test(n1e1)) decodeResult.raw.n1_engine_1 = Number(n1e1);
    if (/^\d+(?:\.\d+)?$/.test(n1e2)) decodeResult.raw.n1_engine_2 = Number(n1e2);
    if (/^\d+(?:\.\d+)?$/.test(egt)) decodeResult.raw.egt_c = Number(egt);
    if (/^\d+(?:\.\d+)?$/.test(n2e1)) decodeResult.raw.n2_engine_1 = Number(n2e1);
    if (/^\d+(?:\.\d+)?$/.test(n2e2)) decodeResult.raw.n2_engine_2 = Number(n2e2);

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'APM — Aircraft Performance Monitoring (ACMF Snapshot)',
      },
    );

    decodeResult.formatted.items.push(
      {
        type: 'report_date',
        code: 'DATE',
        label: 'Report Date',
        value: isoDate,
      },
      {
        type: 'report_time',
        code: 'TIME',
        label: 'Report Time (UTC)',
        value: timeStr,
      },
    );
    if (acmfVer) {
      decodeResult.formatted.items.push({
        type: 'acmf_version',
        code: 'ACMFVER',
        label: 'ACMF Version',
        value: acmfVer,
      });
    }
    if (decodeResult.raw.mach !== undefined) {
      decodeResult.formatted.items.push({
        type: 'mach',
        code: 'MACH',
        label: 'Mach Number',
        value: `M${decodeResult.raw.mach}`,
      });
    }
    if (decodeResult.raw.n1_engine_1 !== undefined) {
      decodeResult.formatted.items.push({
        type: 'n1',
        code: 'N1',
        label: 'N1 (% — Engine 1 / Engine 2)',
        value:
          decodeResult.raw.n1_engine_2 !== undefined
            ? `${decodeResult.raw.n1_engine_1}% / ${decodeResult.raw.n1_engine_2}%`
            : `${decodeResult.raw.n1_engine_1}%`,
      });
    }
    if (decodeResult.raw.n2_engine_1 !== undefined) {
      decodeResult.formatted.items.push({
        type: 'n2',
        code: 'N2',
        label: 'N2 (% — Engine 1 / Engine 2)',
        value:
          decodeResult.raw.n2_engine_2 !== undefined
            ? `${decodeResult.raw.n2_engine_1}% / ${decodeResult.raw.n2_engine_2}%`
            : `${decodeResult.raw.n2_engine_1}%`,
      });
    }
    if (decodeResult.raw.egt_c !== undefined) {
      decodeResult.formatted.items.push({
        type: 'egt',
        code: 'EGT',
        label: 'Exhaust Gas Temperature',
        value: `${decodeResult.raw.egt_c}°C`,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
