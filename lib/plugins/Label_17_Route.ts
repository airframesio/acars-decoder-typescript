import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 17 — Route / Status Report (compact two-line variant)
 *
 * Delta-style downlink carrying a report timestamp, departure ICAO, and
 * arrival ICAO on the first line. The second line (`SWL`-style prefix +
 * numeric blocks) is undocumented "wild-guess" territory and is
 * intentionally not parsed here — per analyst guidance, only the first
 * three confirmed/interpreted fields are surfaced.
 *
 * Two wire formats observed:
 *
 *   Form A — Delta-style space-separated, HHMMSS timestamp:
 *     200817 EGLL KATL 6
 *     |      |    |    |
 *     |      |    |    └ (trailing single digit — not surfaced)
 *     |      |    └────── Arrival airport ICAO (4 chars)
 *     |      └─────────── Departure airport ICAO (4 chars)
 *     └────────────────── Report timestamp, HHMMSS UTC
 *
 *   Form B — Spirit/NK-style comma-separated, compact 4+4+4 block:
 *     0,KIAHKEWR0001
 *     | ||    |    |
 *     | ||    |    └── Estimated arrival time, HHMM UTC (00:01 UTC)
 *     | ||    └─────── Arrival airport ICAO (4 chars)
 *     | |└──────────── Departure airport ICAO (4 chars)
 *     | └──────────── (compound block start)
 *     └─────────────── Flag / sequence prefix (undocumented — not surfaced)
 */
export class Label_17_Route extends DecoderPlugin {
  name = 'label-17-route';

  qualifiers() {
    return {
      labels: ['17'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Route / Status Report (Label 17)',
    );

    const text = (message.text || '').replace(/\r/g, '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Only the first line carries the decodable fields.
    const firstLine = text.split(/\n/)[0].trim();

    // ── Form B: Spirit/NK-style comma-separated 4+4+4 block ──
    //   <flag>,<ORIG><DEST><HHMM>
    const mB = firstLine.match(
      /^\d+,(?<origin>[A-Z]{4})(?<dest>[A-Z]{4})(?<time>\d{4})$/,
    );
    if (mB?.groups) {
      const { origin, dest, time } = mB.groups;
      const hh = Number(time.substring(0, 2));
      const mm = Number(time.substring(2, 4));
      if (hh > 23 || mm > 59) {
        this.setDecodeLevel(decodeResult, false);
        return decodeResult;
      }
      ResultFormatter.departureAirport(decodeResult, origin);
      ResultFormatter.arrivalAirport(decodeResult, dest);

      decodeResult.formatted.items.unshift({
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Route / Arrival Report (Label 17)',
      });
      this.setDecodeLevel(decodeResult, true, 'full');
      return decodeResult;
    }

    // ── Form A: Delta-style <HHMMSS> <ICAO4> <ICAO4>[trailing] ──
    const m = firstLine.match(
      /^(?<time>\d{6})\s+(?<origin>[A-Z]{4})\s+(?<dest>[A-Z]{4})(?:\d|\s|$)/,
    );
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { time, origin, dest } = m.groups;
    const hh = Number(time.substring(0, 2));
    const mm = Number(time.substring(2, 4));
    const ss = Number(time.substring(4, 6));
    if (hh > 23 || mm > 59 || ss > 59) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(time),
    );
    ResultFormatter.departureAirport(decodeResult, origin);
    ResultFormatter.arrivalAirport(decodeResult, dest);

    decodeResult.formatted.items.unshift({
      type: 'message_type',
      code: 'MSGTYP',
      label: 'Message Type',
      value: 'Route / Status Report (Label 17)',
    });
    decodeResult.formatted.items.push({
      type: 'time',
      code: 'TIME',
      label: 'Report Time (UTC)',
      value: `${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}`,
    });

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
