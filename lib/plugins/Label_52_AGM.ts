import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

/**
 * Label 52 — AGM (Ground UTC Request)
 *
 * Ground-to-air uplink asking the aircraft's ACARS Management Unit (MU)
 * to report / synchronise its UTC clock. Paired with label 51 (Ground
 * GMT Request response).
 *
 * Wire format (only the first three fields — the calendar date in
 * YYMMDD — are decoded here; the remaining characters carry an
 * anomalous time portion and a trailing byte that are not formally
 * documented and are intentionally left unparsed per analyst guidance):
 *
 *   26 04 20 1091039
 *   |  |  |  |
 *   |  |  |  └ (ignored — undocumented time / status portion)
 *   |  |  └─── Day of month (DD)
 *   |  └────── Month (MM)
 *   └───────── Year (YY, 20YY)
 */
export class Label_52_AGM extends DecoderPlugin {
  name = 'label-52-agm';

  qualifiers() {
    return {
      labels: ['52'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'AGM — Ground UTC Request',
    );

    const text = (message.text || '').trim();
    if (!text || text.length < 6) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // First 6 chars must be YYMMDD digits.
    const m = text.match(/^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})/);
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { yy, mm, dd } = m.groups;
    const monthN = Number(mm);
    const dayN = Number(dd);
    if (monthN < 1 || monthN > 12 || dayN < 1 || dayN > 31) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const isoDate = `20${yy}-${mm}-${dd}`;
    const monthNames = [
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
    const monthName = monthNames[monthN - 1];

    // ── raw ──
    decodeResult.raw.year = Number(`20${yy}`);
    decodeResult.raw.month = monthN;
    decodeResult.raw.day = dayN;
    decodeResult.raw.date = isoDate;

    // ── formatted ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'AGM — Ground UTC Request',
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: 'Uplink (ground → aircraft)',
      },
    );
    decodeResult.formatted.items.push(
      {
        type: 'year',
        code: 'YEAR',
        label: 'Year',
        value: `20${yy}`,
      },
      {
        type: 'month',
        code: 'MONTH',
        label: 'Month',
        value: `${mm} (${monthName})`,
      },
      {
        type: 'day',
        code: 'DAY',
        label: 'Day',
        value: dd,
      },
    );

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
