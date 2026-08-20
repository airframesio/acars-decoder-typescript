import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 26 — Compact ETA / Arrival Report
 *
 * Terse two-line aircraft-downlink variant seen on some Air France traffic.
 * Carries a report timestamp + origin + flight ID + day on line 1, and an
 * ETA + destination + expected landing runway on line 2.
 *
 * Wire format:
 *
 *   Line 1:  0831 KIAD AF053M / 20
 *            |    |    |       | |
 *            |    |    |       | └── Day of month (DD)
 *            |    |    |       └──── Field delimiter
 *            |    |    └──────────── Flight ID (+ optional trailing qualifier letter)
 *            |    └───────────────── Origin ICAO (4 chars)
 *            └────────────────────── Report timestamp HHMM UTC
 *                                    (likely waypoint / generation time, not
 *                                     wheels-up departure — see analyst note)
 *
 *   Line 2:  0916 LFPG 08R
 *            |    |    |
 *            |    |    └── Expected landing runway
 *            |    └─────── Destination ICAO (4 chars)
 *            └──────────── ETA, HHMM UTC
 *
 * This plugin matches only the exact two-line shape; other Label-26
 * variants (`ETA01…` / position reports) are handled elsewhere.
 */
export class Label_26_ETA extends DecoderPlugin {
  name = 'label-26-eta-compact';

  qualifiers() {
    return {
      labels: ['26'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Compact ETA / Arrival Report',
    );

    const text = (message.text || '').replace(/\r/g, '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const lines = text.split(/\n+/).map((l) => l.trim()).filter((l) => l);
    if (lines.length < 2) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Line 1: HHMM + ICAO(4) + FLIGHT + / + DD
    const l1 = lines[0].match(
      /^(?<time>\d{4})(?<icao>[A-Z]{4})(?<flight>[A-Z]{2,3}\d{1,5}[A-Z]?)\/(?<day>\d{1,2})$/,
    );
    if (!l1?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Line 2: HHMM + ICAO(4) + RWY
    const l2 = lines[1].match(
      /^(?<eta>\d{4})(?<icao>[A-Z]{4})(?<rwy>\d{1,2}[LRC]?)$/,
    );
    if (!l2?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const reportTime = l1.groups.time;
    const origin = l1.groups.icao;
    const flight = l1.groups.flight;
    const day = l1.groups.day;
    const eta = l2.groups.eta;
    const dest = l2.groups.icao;
    const rwy = l2.groups.rwy;

    // Sanity-check HHMM ranges to avoid misfiring on random 2-line texts.
    const validHHMM = (s: string) =>
      Number(s.substring(0, 2)) <= 23 && Number(s.substring(2, 4)) <= 59;
    if (!validHHMM(reportTime) || !validHHMM(eta)) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── raw + standard formatters ──
    ResultFormatter.flightNumber(decodeResult, flight);
    ResultFormatter.departureAirport(decodeResult, origin);
    ResultFormatter.arrivalAirport(decodeResult, dest);
    decodeResult.raw.day = Number(day);
    decodeResult.raw.report_time = `${reportTime.substring(0, 2)}:${reportTime.substring(2, 4)}`;
    decodeResult.raw.eta = `${eta.substring(0, 2)}:${eta.substring(2, 4)}`;
    decodeResult.raw.arrival_runway = rwy;
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(reportTime + '00'),
    );
    ResultFormatter.eta(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(eta + '00'),
    );

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift({
      type: 'message_type',
      code: 'MSGTYP',
      label: 'Message Type',
      value: 'Compact ETA / Arrival Report',
    });

    decodeResult.formatted.items.push(
      {
        type: 'report_time',
        code: 'RPTTIME',
        label: 'Report Time (UTC, HHMM)',
        value: `${reportTime.substring(0, 2)}:${reportTime.substring(2, 4)}`,
      },
      {
        type: 'day',
        code: 'DAY',
        label: 'Day of Month',
        value: day,
      },
      {
        type: 'eta_time',
        code: 'ETATIME',
        label: 'ETA (UTC, HHMM)',
        value: `${eta.substring(0, 2)}:${eta.substring(2, 4)}`,
      },
      {
        type: 'arrival_runway',
        code: 'ARRRWY',
        label: 'Expected Landing Runway',
        value: rwy,
      },
    );

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
