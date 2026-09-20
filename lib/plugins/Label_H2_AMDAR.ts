import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label H2 — AMDAR / Meteorological Waypoint Report
 *
 * A downlink carrying Aircraft Meteorological Data Relay observations —
 * a stream of position-stamped weather records (altitude, temperature,
 * wind direction, wind speed) sampled at intervals along the flight
 * path.
 *
 * Record format (28 chars):
 *
 *   N 60230 E 008174 3528 M 552 125 021 G
 *   | |     | |      |    | |   |   |   |
 *   | |     | |      |    | |   |   |   └ `G` record terminator
 *   | |     | |      |    | |   |   └───── Wind speed (kt, 3 digits)
 *   | |     | |      |    | |   └───────── Wind direction (° true, 3 digits)
 *   | |     | |      |    | └───────────── Temperature in tenths of °C (3 digits; `552` = 55.2°C)
 *   | |     | |      |    └─────────────── Sign: P = +°C, M = −°C
 *   | |     | |      └──────────────────── Altitude in tens of feet (4 digits; `3528` = 35,280 ft)
 *   | |     | └─────────────────────────── Longitude DDDMMT (degrees, minutes, tenths of a minute)
 *   | |     └───────────────────────────── Longitude hemisphere (E/W)
 *   | └─────────────────────────────────── Latitude  DDMMT
 *   └───────────────────────────────────── Latitude hemisphere (N/S)
 *
 * Multi-part transmissions may begin mid-record — typically with the
 * final digit of the preceding record's wind-speed field followed by a
 * `G` terminator. The parser preserves that as a leading fragment note.
 */
export class Label_H2_AMDAR extends DecoderPlugin {
  name = 'label-h2-amdar';

  qualifiers() {
    return {
      labels: ['H2'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'AMDAR Meteorological Waypoint Report',
    );

    const text = (message.text || '').replace(/\s+/g, '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Detect a leading fragment (e.g. `0G`) ahead of the first N/S hemi char.
    let fragment = '';
    let body = text;
    const firstRec = text.search(/[NS]\d{5}[EW]\d{6}\d{4}[PM]\d{3}\d{3}\d{3}G/);
    if (firstRec > 0) {
      fragment = text.substring(0, firstRec);
      body = text.substring(firstRec);
    } else if (firstRec < 0) {
      // No full records found — bail.
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const recordRe =
      /([NS])(\d{2})(\d{2})(\d)([EW])(\d{3})(\d{2})(\d)(\d{4})([PM])(\d{3})(\d{3})(\d{3})G/g;
    const records: Array<{
      latitude: number;
      latitudeText: string;
      longitude: number;
      longitudeText: string;
      altitudeFeet: number;
      temperatureC: number;
      windDirection: number;
      windSpeedKt: number;
    }> = [];
    let m: RegExpExecArray | null;
    while ((m = recordRe.exec(body)) !== null) {
      const [
        ,
        latHemi,
        latDeg,
        latMin,
        latTen,
        lonHemi,
        lonDeg,
        lonMin,
        lonTen,
        altRaw,
        tempSign,
        tempRaw,
        windDirRaw,
        windSpdRaw,
      ] = m;

      const lat =
        (Number(latDeg) + (Number(latMin) + Number(latTen) / 10) / 60) *
        (latHemi === 'S' ? -1 : 1);
      const lon =
        (Number(lonDeg) + (Number(lonMin) + Number(lonTen) / 10) / 60) *
        (lonHemi === 'W' ? -1 : 1);
      const altFt = Number(altRaw) * 10;
      const tempC =
        (Number(tempRaw) / 10) * (tempSign === 'M' ? -1 : 1);
      const windDir = Number(windDirRaw);
      const windSpd = Number(windSpdRaw);

      records.push({
        latitude: Math.round(lat * 1e5) / 1e5,
        latitudeText: `${latHemi} ${latDeg}°${latMin}.${latTen}′`,
        longitude: Math.round(lon * 1e5) / 1e5,
        longitudeText: `${lonHemi} ${lonDeg}°${lonMin}.${lonTen}′`,
        altitudeFeet: altFt,
        temperatureC: Math.round(tempC * 10) / 10,
        windDirection: windDir,
        windSpeedKt: windSpd,
      });
    }

    if (records.length === 0) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.raw.leading_fragment = fragment || undefined;
    decodeResult.raw.waypoint_records = records;
    decodeResult.raw.record_count = records.length;

    // Anchor the timestamp-style fields on the first record so the message
    // list shows useful headline data.
    const first = records[0];
    ResultFormatter.position(decodeResult, {
      latitude: first.latitude,
      longitude: first.longitude,
    });
    ResultFormatter.altitude(decodeResult, first.altitudeFeet);
    ResultFormatter.temperature(decodeResult, String(first.temperatureC));

    // ── formatted output ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'AMDAR Meteorological Waypoint Report',
      },
      {
        type: 'record_count',
        code: 'RECS',
        label: 'Waypoint Records',
        value: String(records.length),
      },
    );
    if (fragment) {
      decodeResult.formatted.items.push({
        type: 'leading_fragment',
        code: 'FRAG',
        label: 'Leading Fragment',
        value: `${fragment} (tail of previous multi-part record)`,
      });
    }
    records.forEach((rec, i) => {
      const idx = i + 1;
      decodeResult.formatted.items.push({
        type: `record_${idx}`,
        code: `REC${idx}`,
        label: `Record ${idx}`,
        value: `${rec.latitudeText} ${rec.longitudeText} · ${rec.altitudeFeet.toLocaleString()} ft · ${rec.temperatureC >= 0 ? '+' : ''}${rec.temperatureC}°C · wind ${String(rec.windDirection).padStart(3, '0')}°/${rec.windSpeedKt} kt`,
      });
    });

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
