import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 36 — Periodic Position / Performance Report
 *
 * Comma-delimited downlink carrying current position, flight level, wind,
 * temperature, fuel, speeds, and a trailing serial/CRC token. Likely a
 * Frequent Position Report (FPR) or equivalent ACMS periodic report.
 *
 * Wire format (20 comma-separated fields):
 *
 *   71,M,0319,5,3,KBOS,38.78,-75.70,38.78,-75.69,15,255067,-14,74.8,6837,45,10,309,375,598147E
 *   |  |  |   | |  |    |     |     |     |      |  |      |   |    |    |  |  |   |   |
 *   |  |  |   | |  |    |     |     |     |      |  |      |   |    |    |  |  |   |   └ Trailing serial + CRC token
 *   |  |  |   | |  |    |     |     |     |      |  |      |   |    |    |  |  |   └───── Ground speed (kt)
 *   |  |  |   | |  |    |     |     |     |      |  |      |   |    |    |  |  └───────── True airspeed (kt)
 *   |  |  |   | |  |    |     |     |     |      |  |      |   |    |    |  └ (wild guess — not surfaced)
 *   |  |  |   | |  |    |     |     |     |      |  |      |   |    |    └─── (wild guess — not surfaced)
 *   |  |  |   | |  |    |     |     |     |      |  |      |   |    └──────── (wild guess — not surfaced)
 *   |  |  |   | |  |    |     |     |     |      |  |      |   └──────────── Fuel (units ≈ ×100 lbs)
 *   |  |  |   | |  |    |     |     |     |      |  |      └──────────────── OAT (°C, signed)
 *   |  |  |   | |  |    |     |     |     |      |  └─────────────────────── Wind, packed DDDSSS (255° @ 067 kt)
 *   |  |  |   | |  |    |     |     |     |      └────────────────────────── Flight level (FL × 100 ft)
 *   |  |  |   | |  |    |     |     |     └───────────────────────────────── Previous / smoothed longitude
 *   |  |  |   | |  |    |     |     └─────────────────────────────────────── Previous / smoothed latitude
 *   |  |  |   | |  |    |     └───────────────────────────────────────────── Current longitude
 *   |  |  |   | |  |    └───────────────────────────────────────────────── Current latitude
 *   |  |  |   | |  └──────────────────────────────────────────────────────── Destination / reference ICAO
 *   |  |  |   | └─────────────────────────────────────────────────────────── Sub-sequence / leg index
 *   |  |  |   └───────────────────────────────────────────────────────────── Report sequence / interval counter
 *   |  |  └───────────────────────────────────────────────────────────────── Time of report, HHMM UTC
 *   |  └──────────────────────────────────────────────────────────────────── Mode / source qualifier
 *   └─────────────────────────────────────────────────────────────────────── Flight / tail identifier code
 *
 * Fields 14, 15, 16 (e.g. `6837, 45, 10`) are undocumented wild-guess
 * territory and are intentionally NOT surfaced per analyst guidance.
 * The trailing serial/CRC token (e.g. `598147E`) is exposed raw with no
 * semantic interpretation.
 */
export class Label_36_PosReport extends DecoderPlugin {
  name = 'label-36-pos-report';

  qualifiers() {
    return {
      labels: ['36'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Periodic Position / Performance Report',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const fields = text.split(',');
    if (fields.length < 20) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const flightTag = fields[0].trim();
    const modeQual = fields[1].trim();
    const timeHHMM = fields[2].trim();
    const seq = fields[3].trim();
    const subseq = fields[4].trim();
    const refIcao = fields[5].trim();
    const lat1 = fields[6].trim();
    const lon1 = fields[7].trim();
    const lat2 = fields[8].trim();
    const lon2 = fields[9].trim();
    const flRaw = fields[10].trim();
    const windRaw = fields[11].trim();
    const oatRaw = fields[12].trim();
    const fuelRaw = fields[13].trim();
    // fields[14..16] — wild guess, not surfaced
    const tasRaw = fields[17].trim();
    const gsRaw = fields[18].trim();
    const serial = fields[19].trim();

    // Sanity-check the anchor fields to confirm this really is the 20-field
    // periodic report and not some other label-36 variant.
    if (
      !/^\d{1,4}$/.test(flightTag) ||
      !/^[A-Z]$/.test(modeQual) ||
      !/^\d{4}$/.test(timeHHMM) ||
      !/^[A-Z]{3,4}$/.test(refIcao)
    ) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── raw ──
    decodeResult.raw.flight_tag = flightTag;
    decodeResult.raw.mode_qualifier = modeQual;
    decodeResult.raw.report_sequence = seq;
    decodeResult.raw.leg_index = subseq;
    decodeResult.raw.message_serial = serial;

    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(timeHHMM + '00'),
    );
    ResultFormatter.arrivalAirport(decodeResult, refIcao);

    // Current position
    if (isFinite(Number(lat1)) && isFinite(Number(lon1))) {
      ResultFormatter.position(decodeResult, {
        latitude: Number(lat1),
        longitude: Number(lon1),
      });
      decodeResult.raw.latitude = Number(lat1);
      decodeResult.raw.longitude = Number(lon1);
    }
    // Previous / smoothed position (exposed as raw + chip row)
    if (isFinite(Number(lat2)) && isFinite(Number(lon2))) {
      decodeResult.raw.previous_latitude = Number(lat2);
      decodeResult.raw.previous_longitude = Number(lon2);
    }

    // Altitude encoded as FL / 10 (e.g. raw `15` = FL150 = 15,000 ft;
    // raw `35` = FL350 = 35,000 ft).
    let altFt: number | null = null;
    if (/^\d{1,3}$/.test(flRaw)) {
      const fl = Number(flRaw) * 10;
      altFt = fl * 100;
      ResultFormatter.altitude(decodeResult, altFt);
      decodeResult.raw.flight_level = fl;
    }

    // Wind packed DDDSSS
    let windDir: number | null = null;
    let windSpeed: number | null = null;
    if (/^\d{6}$/.test(windRaw)) {
      windDir = Number(windRaw.substring(0, 3));
      windSpeed = Number(windRaw.substring(3, 6));
      decodeResult.raw.wind_direction = windDir;
      decodeResult.raw.wind_speed = windSpeed;
    }

    // OAT (°C, signed)
    if (/^-?\d{1,3}$/.test(oatRaw)) {
      ResultFormatter.temperature(decodeResult, oatRaw);
    }

    // Fuel (units ≈ ×100 lbs — scaling not formally documented)
    let fuel: number | null = null;
    if (/^-?\d+(?:\.\d+)?$/.test(fuelRaw)) {
      fuel = Number(fuelRaw);
      decodeResult.raw.fuel = fuel;
    }

    // TAS / GS
    let tas: number | null = null;
    if (/^\d{1,4}$/.test(tasRaw)) {
      tas = Number(tasRaw);
      decodeResult.raw.true_airspeed = tas;
    }
    let gs: number | null = null;
    if (/^\d{1,4}$/.test(gsRaw)) {
      gs = Number(gsRaw);
      decodeResult.raw.ground_speed = gs;
    }

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Periodic Position / Performance Report',
      },
      {
        type: 'flight_tag',
        code: 'FLTAG',
        label: 'Flight Tag',
        value: flightTag,
      },
      {
        type: 'mode_qualifier',
        code: 'MODE',
        label: 'Mode Qualifier',
        value: modeQual,
      },
    );

    decodeResult.formatted.items.push(
      {
        type: 'time',
        code: 'TIME',
        label: 'Report Time (UTC, HHMM)',
        value: `${timeHHMM.substring(0, 2)}:${timeHHMM.substring(2, 4)}`,
      },
      {
        type: 'report_sequence',
        code: 'SEQ',
        label: 'Report Sequence',
        value: seq,
      },
      {
        type: 'leg_index',
        code: 'LEG',
        label: 'Leg Index',
        value: subseq,
      },
    );

    if (
      decodeResult.raw.previous_latitude !== undefined &&
      decodeResult.raw.previous_longitude !== undefined
    ) {
      decodeResult.formatted.items.push({
        type: 'previous_position',
        code: 'PREVPOS',
        label: 'Previous Position',
        value: `${decodeResult.raw.previous_latitude}, ${decodeResult.raw.previous_longitude}`,
      });
    }

    if (windDir !== null && windSpeed !== null) {
      decodeResult.formatted.items.push({
        type: 'wind',
        code: 'WIND',
        label: 'Wind',
        value: `${windDir}° @ ${windSpeed} kt`,
      });
    }

    if (fuel !== null) {
      decodeResult.formatted.items.push({
        type: 'fuel',
        code: 'FUEL',
        label: 'Fuel',
        value: String(fuel),
      });
    }
    if (tas !== null) {
      decodeResult.formatted.items.push({
        type: 'true_airspeed',
        code: 'TAS',
        label: 'True Airspeed',
        value: `${tas} kt`,
      });
    }
    if (gs !== null) {
      decodeResult.formatted.items.push({
        type: 'ground_speed',
        code: 'GS',
        label: 'Ground Speed',
        value: `${gs} kt`,
      });
    }

    if (serial) {
      decodeResult.formatted.items.push({
        type: 'message_serial',
        code: 'SERIAL',
        label: 'Serial / CRC Token',
        value: serial,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
