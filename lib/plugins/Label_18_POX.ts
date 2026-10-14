import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 18 — POX Positional / In-Flight Progress Report
 *
 * Downlinked aircraft progress report (China Southern and other operators).
 * Comma-delimited with a `POX` preamble, carrying flight ID, date, time,
 * origin, destination, and a long tail of position / performance fields.
 *
 * Wire format (only the confirmed fields are decoded — everything past the
 * destination ICAO is format-variant territory and is ignored per the
 * analyst's "ignore interpreted and wild-guess fields" instruction):
 *
 *   POX,CSN6850,20APR26,033248,ZSHC,ZGSZ, ...ignored...
 *   |    |       |        |      |    |
 *   |    |       |        |      |    └ Destination ICAO
 *   |    |       |        |      └────── Origin ICAO
 *   |    |       |        └───────────── Time of report, HHMMSS UTC
 *   |    |       └────────────────────── Date, DDMMMYY (e.g. 20APR26)
 *   |    └────────────────────────────── Flight ID (ICAO callsign)
 *   └─────────────────────────────────── POX message-type preamble
 *
 * All subsequent fields (position, altitude, Mach, fuel, wind, ETA, etc.)
 * use an airline-specific encoding that does not match the documented
 * decimal-degree reference and are therefore left unparsed.
 */
export class Label_18_POX extends DecoderPlugin {
  name = 'label-18-pox';

  qualifiers() {
    return {
      labels: ['18'],
      preambles: ['POX'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'POX Positional / In-Flight Progress Report',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const fields = text.split(',');
    if (fields.length < 6 || fields[0].trim() !== 'POX') {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const flight = fields[1].trim();
    const dateRaw = fields[2].trim();
    const timeRaw = fields[3].trim();
    const origin = fields[4].trim();
    const dest = fields[5].trim();

    // Sanity checks — shape must match the documented examples
    if (
      !/^[A-Z]{2,3}\d{1,5}$/.test(flight) ||
      !/^\d{2}[A-Z]{3}\d{2}$/.test(dateRaw) ||
      !/^\d{6}$/.test(timeRaw) ||
      !/^[A-Z]{3,4}$/.test(origin) ||
      !/^[A-Z]{3,4}$/.test(dest)
    ) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Parse the DDMMMYY date into an ISO-friendly form.
    const months: Record<string, string> = {
      JAN: '01',
      FEB: '02',
      MAR: '03',
      APR: '04',
      MAY: '05',
      JUN: '06',
      JUL: '07',
      AUG: '08',
      SEP: '09',
      OCT: '10',
      NOV: '11',
      DEC: '12',
    };
    const dd = dateRaw.substring(0, 2);
    const monStr = dateRaw.substring(2, 5);
    const yy = dateRaw.substring(5, 7);
    const mon = months[monStr];
    const isoDate = mon ? `20${yy}-${mon}-${dd}` : dateRaw;

    // ── raw ──
    decodeResult.raw.flight = flight;
    ResultFormatter.flightNumber(decodeResult, flight);
    decodeResult.raw.date = isoDate;
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(timeRaw),
    );
    ResultFormatter.departureAirport(decodeResult, origin);
    ResultFormatter.arrivalAirport(decodeResult, dest);

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'POX Positional / In-Flight Progress Report',
      },
      {
        type: 'preamble',
        code: 'PRE',
        label: 'Preamble',
        value: 'POX',
      },
    );
    decodeResult.formatted.items.push(
      {
        type: 'date',
        code: 'DATE',
        label: 'Date',
        value: mon ? `${isoDate} (${dateRaw})` : dateRaw,
      },
      {
        type: 'time',
        code: 'TIME',
        label: 'Time (UTC)',
        value: `${timeRaw.substring(0, 2)}:${timeRaw.substring(2, 4)}:${timeRaw.substring(4, 6)}`,
      },
    );

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
