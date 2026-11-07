import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 2F — Compact Periodic Position Report
 *
 * Automatic in-flight position downlink. Packed into a single token with
 * implicit decimal coordinates and a trailing numeric field (exact
 * meaning undocumented).
 *
 * Wire format:
 *
 *   0142 + 4144 - 7180 / 2782
 *   |     |      |      |
 *   |     |      |      └ Trailing numeric (undocumented — surfaced raw as "unknown")
 *   |     |      └──────── Longitude: sign + 4 digits (DD.DD, signed E+/W−)
 *   |     └──────────────── Latitude:  sign + 4 digits (DD.DD, signed N+/S−)
 *   └────────────────────── Time HHMM UTC
 *
 * Coordinate decoding assumes the 4-digit component is DD.DD (degrees
 * and hundredths of a degree — e.g. `4144` = 41.44°). Other documented
 * label-2F bodies share this shape.
 */
export class Label_2F_Position extends DecoderPlugin {
  name = 'label-2f-position';

  qualifiers() {
    return {
      labels: ['2F'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Compact Periodic Position Report (Label 2F)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Lat/lon are 2–4 digits and scale to decimal degrees by dividing by 100
    // (leading zero suppressed for small longitudes, e.g. `-363` = 3.63°W).
    // Altitude / trailing numeric is variable-length.
    const m = text.match(
      /^(?<time>\d{4})(?<latSign>[+-])(?<lat>\d{2,4})(?<lonSign>[+-])(?<lon>\d{1,4})\/(?<unknown>\d+)\s*$/,
    );
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { time, latSign, lat, lonSign, lon, unknown } = m.groups;
    const hh = Number(time.substring(0, 2));
    const mm = Number(time.substring(2, 4));
    if (hh > 23 || mm > 59) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Coordinates: raw / 100 → DD.DD decimal degrees
    const latitude = (Number(lat) / 100) * (latSign === '-' ? -1 : 1);
    const longitude = (Number(lon) / 100) * (lonSign === '-' ? -1 : 1);

    // ── raw ──
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(time + '00'),
    );
    ResultFormatter.position(decodeResult, { latitude, longitude });
    decodeResult.raw.time_hhmm = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    // Trailing numeric is most often altitude in feet (5-digit values like
    // 36162, 41391 are typical). Shorter values (e.g. `2782`) are anomalous
    // per the analyst reports — still surfaced as altitude here.
    const altFt = Number(unknown);
    if (Number.isFinite(altFt)) {
      ResultFormatter.altitude(decodeResult, altFt);
      decodeResult.raw.altitude_feet = altFt;
    }

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift({
      type: 'message_type',
      code: 'MSGTYP',
      label: 'Message Type',
      value: 'Compact Periodic Position Report (Label 2F)',
    });
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
