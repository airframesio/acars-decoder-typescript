import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label 21 — Periodic Position Report (POSN)
 *
 * Automatic in-flight position report transmitted by the FMS/ACARS unit at
 * regular intervals. Carries location, ground track, time, altitude, speed,
 * wind, OAT, ETA, and destination.
 *
 * Wire format (after the `POS` preamble — note that the trailing `N` of
 * `POSN` becomes the first character of the body):
 *
 *   N 34.398W 80.393,  85,230818,35019,24306,  92,-54,235606,KBWI
 *   | |       |         |  |      |     |       |   |   |      |
 *   | |       |         |  |      |     |       |   |   |      └ Destination ICAO
 *   | |       |         |  |      |     |       |   |   └─────── ETA, HHMMSS UTC
 *   | |       |         |  |      |     |       |   └─────────── OAT (°C, may be negative)
 *   | |       |         |  |      |     |       └─────────────── Wind speed (kt)
 *   | |       |         |  |      |     └─────────────────────── Groundspeed × 100
 *   | |       |         |  |      |                              (raw integer; 24306 → 243.06 kt)
 *   | |       |         |  |      └───────────────────────────── Altitude (ft MSL)
 *   | |       |         |  └──────────────────────────────────── Time of position, HHMMSS UTC
 *   | |       |         └─────────────────────────────────────── Ground track (degrees true)
 *   | |       └─────────────────────────────────────────────── Longitude (deg, sign from hemisphere)
 *   | └─────────────────────────────────────────────────────── Longitude hemisphere (E/W)
 *   └───────────────────────────────────────────────────────── Latitude (deg) — leading hemisphere
 *                                                              char (N/S) supplied by the trailing
 *                                                              `N` of `POSN`; observed examples are
 *                                                              all northern.
 *
 * Variants seen in the wild (longitude width 6 or 7 chars, optional space):
 *   N 34.398W 80.393,  ...      (lon < 100)
 *   N 37.761W121.680, ...       (lon ≥ 100, no space)
 *
 * Per the analyst's "wild-guess → ignore" guidance, latitude is parsed as
 * implicitly North when the hemisphere letter is the trailing `N` of `POSN`;
 * a leading `S` would be honoured but is undocumented.
 */
export class Label_21_POS extends DecoderPlugin {
  name = 'label-21-pos';

  qualifiers() {
    return {
      labels: ['21'],
      preambles: ['POS'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');

    decodeResult.raw.preamble = message.text.substring(0, 3);

    const content = message.text.substring(3);
    const fields = content.split(',');

    if (fields.length === 9) {
      // ── Position (field 0) ──
      processPosition(decodeResult, fields[0].trim());

      // ── Field 1: ground track (degrees true) ──
      const trackRaw = fields[1].trim();
      if (/^\d{1,3}$/.test(trackRaw)) {
        const track = Number(trackRaw);
        decodeResult.raw.track = track;
        decodeResult.formatted.items.push({
          type: 'track',
          code: 'TRK',
          label: 'Ground Track',
          value: `${track}°`,
        });
      }

      // ── Field 2: time of position, HHMMSS ──
      ResultFormatter.timestamp(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(fields[2]),
      );

      // ── Field 3: altitude (ft MSL) ──
      ResultFormatter.altitude(decodeResult, Number(fields[3]));

      // ── Field 4: groundspeed × 100 (raw) ──
      const gsRaw = fields[4].trim();
      if (/^\d{3,6}$/.test(gsRaw)) {
        const gsKts = Number(gsRaw) / 100;
        decodeResult.raw.ground_speed = gsKts;
        decodeResult.formatted.items.push({
          type: 'ground_speed',
          code: 'GS',
          label: 'Ground Speed',
          value: `${gsKts.toFixed(2)} kt`,
        });
      }

      // ── Field 5: wind speed (kt) ──
      const windRaw = fields[5].trim();
      if (/^-?\d{1,3}$/.test(windRaw)) {
        const wind = Number(windRaw);
        decodeResult.raw.wind_speed = wind;
        decodeResult.formatted.items.push({
          type: 'wind_speed',
          code: 'WIND',
          label: 'Wind Speed',
          value: `${wind} kt`,
        });
      }

      // ── Field 6: OAT (°C) ──
      ResultFormatter.temperature(decodeResult, fields[6].replace(/ /g, ''));

      // ── Field 7: ETA, HHMMSS ──
      ResultFormatter.eta(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(fields[7]),
      );

      // ── Field 8: destination ICAO ──
      ResultFormatter.arrivalAirport(decodeResult, fields[8]);

      this.setDecodeLevel(decodeResult, true, 'full');
    } else {
      this.debug(
        options,
        `Unknown variation. Field count: ${fields.length}, content: ${content}`,
      );
      this.setDecodeLevel(decodeResult, false);
    }
    return decodeResult;
  }
}

/**
 * Parse the position field. Accepts both spaced and unspaced forms:
 *   "N 34.398W 80.393"
 *   "N 37.761W121.680"
 *   "S 33.940E151.180"   (hypothetical southern/eastern; not observed)
 */
function processPosition(decodeResult: DecodeResult, value: string) {
  const m = value.match(
    /^([NS])\s*(\d+(?:\.\d+)?)\s*([EW])\s*(\d+(?:\.\d+)?)$/,
  );
  if (!m) return;

  const latDir = m[1] === 'N' ? 1 : -1;
  const lonDir = m[3] === 'E' ? 1 : -1;
  const position = {
    latitude: latDir * Number(m[2]),
    longitude: lonDir * Number(m[4]),
  };
  ResultFormatter.position(decodeResult, position);
}
