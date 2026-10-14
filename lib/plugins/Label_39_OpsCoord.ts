import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 39 — Operational coordination message (regional carrier format)
 *
 * Carries flight-pair operational coordination: day-of-month + time,
 * origin and destination IATA airport codes, a sequence/block counter,
 * an estimated time, and an opaque service/count code.
 *
 * Three-line wire format observed in the wild (e.g. Endeavor Air):
 *
 *   Line 1:  19 2139   RDU   JFK 3
 *            |  |      |     |   |
 *            |  |      |     |   └── Sequence / message counter
 *            |  |      |     └────── Destination IATA (3-letter, padded)
 *            |  |      └──────────── Origin IATA (3-letter, padded)
 *            |  └─────────────────── Time, HHMM (UTC)
 *            └────────────────────── Day of month
 *
 *   Line 2:  2215 [status flag — meaning undocumented, ignored]
 *            ETD/ETA in HHMM (UTC)
 *
 *   Line 3:  01 [opaque counter on the right — ignored, undocumented]
 *            First service/count code
 *
 * Per the analyst's report, the second line's status letter and the
 * second numeric on line 3 carry "wild guess" semantics — those tokens
 * exist in the body but are not surfaced as labelled fields here.
 */
export class Label_39_OpsCoord extends DecoderPlugin {
  name = 'label-39-ops-coord';

  qualifiers() {
    return {
      labels: ['39'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Operational Coordination Message',
    );

    const text = (message.text || '').replace(/\r/g, '');
    if (!text.trim()) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const lines = text.split(/\n+/);

    // ── Line 1: DDHHMM <ORIG-padded-3> <DEST-3> <SEQ-digit> ──
    // Tolerate any number of spaces between tokens.
    const line1 = lines[0] || '';
    const m1 = line1.match(
      /^(?<day>\d{2})(?<time>\d{4})\s+(?<orig>[A-Z]{3,4})\s+(?<dest>[A-Z]{3,4})(?<seq>\d+)\s*$/,
    );
    if (!m1?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    const { day, time, orig, dest, seq } = m1.groups;

    decodeResult.raw.day = Number(day);
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(time + '00'),
    );
    // Auto-detect IATA (3 char) vs ICAO (4 char) per token
    const origType = orig.length === 4 ? 'ICAO' : 'IATA';
    const destType = dest.length === 4 ? 'ICAO' : 'IATA';
    ResultFormatter.departureAirport(decodeResult, orig, origType);
    ResultFormatter.arrivalAirport(decodeResult, dest, destType);
    decodeResult.raw.message_sequence = seq;

    // ── Line 2: ETD/ETA in HHMM, optional status letter (ignored) ──
    let etdEta = '';
    if (lines[1]) {
      const m2 = lines[1].match(/^\s*(?<eta>\d{4})(?:\s+[A-Z])?\s*$/);
      if (m2?.groups?.eta) {
        etdEta = m2.groups.eta;
        decodeResult.raw.estimated_time = `${etdEta.substring(0, 2)}:${etdEta.substring(2, 4)}`;
      }
    }

    // ── Line 3: first service/count code, ignore any trailing column ──
    let serviceCode = '';
    if (lines[2]) {
      const m3 = lines[2].match(/^\s*(\d{1,3})/);
      if (m3) serviceCode = m3[1];
      if (serviceCode) decodeResult.raw.service_code = serviceCode;
    }

    // ── Formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Operational Coordination (Label 39)',
      },
      {
        type: 'day',
        code: 'DAY',
        label: 'Day of Month',
        value: day,
      },
    );
    decodeResult.formatted.items.push({
      type: 'sequence',
      code: 'SEQ',
      label: 'Message Sequence',
      value: seq,
    });
    if (etdEta) {
      decodeResult.formatted.items.push({
        type: 'estimated_time',
        code: 'ETA',
        label: 'Estimated Time (UTC, HHMM)',
        value: `${etdEta.substring(0, 2)}:${etdEta.substring(2, 4)}`,
      });
    }
    if (serviceCode) {
      decodeResult.formatted.items.push({
        type: 'service_code',
        code: 'SVCCODE',
        label: 'Service Code',
        value: serviceCode,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
