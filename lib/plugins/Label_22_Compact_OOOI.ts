import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 22 — Compact OOOI-style Event Report
 *
 * A terse 13-character aircraft-downlink variant seen on some Virgin
 * Atlantic traffic. Most likely an OFF (wheels-off / takeoff) event report
 * per the analyst's interpretation — but the compact form carries no
 * explicit OFF/ON/IN/OUT prefix, so this plugin surfaces the airport,
 * date, and time without claiming a specific OOOI event.
 *
 * Wire format:
 *
 *   EGLL 0824 1432 0
 *   |    |    |    |
 *   |    |    |    └ Trailing flag / status byte (raw, undocumented)
 *   |    |    └───── Time HHMM UTC (14:32 UTC)
 *   |    └────────── Date MMDD (08 = August, 24 = day)
 *   └─────────────── ICAO airport code (4 chars)
 *
 * This plugin matches only the exact 13-character shape `<ICAO:4><MMDD:4>
 * <HHMM:4><flag:1>` — other Label-22 sub-formats (OFF-prefixed variants,
 * POS position reports) are handled by sibling plugins.
 */
export class Label_22_Compact_OOOI extends DecoderPlugin {
  name = 'label-22-compact-oooi';

  qualifiers() {
    return {
      labels: ['22'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Compact OOOI-style Event Report',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const m = text.match(
      /^(?<icao>[A-Z]{4})(?<mm>\d{2})(?<dd>\d{2})(?<hh>\d{2})(?<min>\d{2})(?<flag>\d)$/,
    );
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { icao, mm, dd, hh, min, flag } = m.groups;
    const monthN = Number(mm);
    const dayN = Number(dd);
    const hourN = Number(hh);
    const minN = Number(min);

    // Validate ranges before committing — a valid MMDD+HHMM avoids false
    // positives on arbitrary 13-digit strings.
    if (
      monthN < 1 ||
      monthN > 12 ||
      dayN < 1 ||
      dayN > 31 ||
      hourN > 23 ||
      minN > 59
    ) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthName = months[monthN - 1];

    // ── raw ──
    ResultFormatter.departureAirport(decodeResult, icao);
    decodeResult.raw.month = monthN;
    decodeResult.raw.day = dayN;
    decodeResult.raw.time_hhmm = `${hh}:${min}`;
    decodeResult.raw.trailing_flag = flag;
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(`${hh}${min}00`),
    );

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value:
          'Compact OOOI-style Event Report (likely OFF / wheels-off)',
      },
      {
        type: 'airport',
        code: 'APT',
        label: 'Airport',
        value: icao,
      },
    );
    decodeResult.formatted.items.push(
      {
        type: 'date',
        code: 'DATE',
        label: 'Date (MMDD)',
        value: `${monthName} ${dayN} (${mm}/${dd})`,
      },
      {
        type: 'time',
        code: 'TIME',
        label: 'Time (UTC, HHMM)',
        value: `${hh}:${min}`,
      },
      {
        type: 'trailing_flag',
        code: 'FLAG',
        label: 'Trailing Flag',
        value: flag,
      },
    );

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
