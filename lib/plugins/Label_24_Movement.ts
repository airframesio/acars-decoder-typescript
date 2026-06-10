import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 24 — Flight Movement Notification (compact variant)
 *
 * Downlink carrying a gate/movement (departure or arrival) notification
 * with a packed `DDHHMM` timestamp, origin and destination airports, and
 * a trailing status digit. Seen on Delta and other operators.
 *
 * Wire format:
 *
 *   201524 KSRQ KLGA 6
 *   |  |    |    |    |
 *   |  |    |    |    └ Trailing status / sequence digit (undocumented — not surfaced)
 *   |  |    |    └──── Destination airport ICAO (4 chars)
 *   |  |    └───────── Origin airport ICAO (4 chars)
 *   |  └────────────── Time, HHMM UTC
 *   └───────────────── Day of month (DD)
 *
 * Airports may also be IATA 3-letter codes (e.g. `OAJ ATL`) — both 3-
 * and 4-character forms are accepted. Per analyst guidance, the trailing
 * single digit is wild-guess territory and is not surfaced as a labelled
 * field.
 */
export class Label_24_Movement extends DecoderPlugin {
  name = 'label-24-movement';

  qualifiers() {
    return {
      labels: ['24'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Flight Movement Notification (Label 24)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Defer slash-prefixed bodies to the sibling Label_24_Slash plugin.
    if (text.startsWith('/')) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // <DD><HHMM> <ORIG> <DEST>[trailing digit]
    const m = text.match(
      /^(?<day>\d{2})(?<time>\d{4})\s+(?<origin>[A-Z]{3,4})\s+(?<dest>[A-Z]{3,4})(?<suffix>\d)?\s*$/,
    );
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { day, time, origin, dest } = m.groups;
    const dayN = Number(day);
    const hh = Number(time.substring(0, 2));
    const mm = Number(time.substring(2, 4));
    if (dayN < 1 || dayN > 31 || hh > 23 || mm > 59) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Auto-detect IATA vs ICAO per token (3 chars = IATA, 4 chars = ICAO)
    const origType = origin.length === 4 ? 'ICAO' : 'IATA';
    const destType = dest.length === 4 ? 'ICAO' : 'IATA';

    decodeResult.raw.day = dayN;
    decodeResult.raw.time_hhmm = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(time + '00'),
    );
    ResultFormatter.departureAirport(decodeResult, origin, origType);
    ResultFormatter.arrivalAirport(decodeResult, dest, destType);

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Flight Movement Notification (Label 24)',
      },
      {
        type: 'day',
        code: 'DAY',
        label: 'Day of Month',
        value: day,
      },
    );
    decodeResult.formatted.items.push({
      type: 'time',
      code: 'TIME',
      label: 'Time (UTC, HHMM)',
      value: `${time.substring(0, 2)}:${time.substring(2, 4)}`,
    });

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
