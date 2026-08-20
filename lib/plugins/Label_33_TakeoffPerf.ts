import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label 33 — Takeoff / Departure Performance Report
 *
 * Downlink from the FMS / EFB carrying runway, weights, speeds, and
 * configuration parameters for a departure.
 *
 * Comma-delimited wire format (documented fields only — wild-guess and
 * flag-soup fields are intentionally ignored per analyst guidance):
 *
 *   3,D,KMSP,CYYZ,24L,,+02,3005,330,12,57000, ... ,A95B
 *   | |  |    |    |   |   |    |               |
 *   | |  |    |    |   |   |    |               └ (trailing fields + 4-char CRC — ignored)
 *   | |  |    |    |   |   |    └ Wind, packed DDDSS (300° at 05 kt)
 *   | |  |    |    |   |   └──── OAT, signed °C (+02 = +2°C)
 *   | |  |    |    |   └──────── Secondary runway / intersection (optional, may be empty)
 *   | |  |    |    └──────────── Departure runway
 *   | |  |    └───────────────── Destination ICAO
 *   | |  └────────────────────── Origin ICAO
 *   | └───────────────────────── Phase: D = Departure, F = Flight (cruise), others observed
 *   └─────────────────────────── Message subtype / sequence counter
 *
 * Field 9 (flaps) and Field 10 (takeoff weight, lbs) follow the wind
 * field after an optional gap. Beyond that, the spec is not publicly
 * documented — the remaining numeric/flag fields and the trailing
 * 4-char hex checksum are left unparsed.
 */
export class Label_33_TakeoffPerf extends DecoderPlugin {
  name = 'label-33-takeoff-perf';

  private readonly phaseDescriptions: Record<string, string> = {
    D: 'Departure',
    F: 'Flight (cruise)',
    C: 'Cruise / En-route',
  };

  qualifiers() {
    return {
      labels: ['33'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Takeoff / Departure Performance Report',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const fields = text.split(',');
    if (fields.length < 11) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Two variants share label 33:
    //  Variant A — takeoff perf report:
    //    <sub>,<phase>,<ORG>,<DEST>,<RWY>,,<temp>,<wind>,…,<CRC>
    //  Variant B — in-flight performance report with lat/lon + altitude:
    //    <sub>,<phase>,<lat>,<lon>,<alt>,<null|gs>,<ORG>,<DEST>,<RWY>,<cfg>,…,<weight>,…
    // Detect by checking whether field[2] looks like a decimal number
    // (variant B) or a 3-4 letter ICAO code (variant A).
    const isVariantB = /^-?\d+(?:\.\d+)?$/.test(fields[2].trim());
    if (isVariantB) {
      return this.decodeVariantB(message, fields, decodeResult);
    }

    const subtype = fields[0].trim();
    const phase = fields[1].trim();
    const origin = fields[2].trim();
    const dest = fields[3].trim();
    const runway = fields[4].trim();
    const secondaryRunway = fields[5].trim();
    const tempRaw = fields[6].trim();
    const windRaw = fields[7].trim();
    // fields[8] — wild guess, ignored
    const flapsRaw = fields[9].trim();
    const towRaw = fields[10].trim();

    // Phase / Subtype must look plausible (single letter, short numeric)
    if (!/^\d{1,3}$/.test(subtype) || !/^[A-Z]$/.test(phase)) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    // Origin + Dest must be 3–4 letter ICAO-ish tokens
    if (!/^[A-Z]{3,4}$/.test(origin) || !/^[A-Z]{3,4}$/.test(dest)) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.raw.subtype = subtype;
    decodeResult.raw.phase = phase;
    ResultFormatter.departureAirport(decodeResult, origin);
    ResultFormatter.arrivalAirport(decodeResult, dest);
    if (runway) decodeResult.raw.departure_runway = runway;
    if (secondaryRunway) decodeResult.raw.secondary_runway = secondaryRunway;

    // Temperature: signed °C (e.g. "+02", "-05")
    let tempC: number | null = null;
    if (/^[+-]?\d{1,3}$/.test(tempRaw)) {
      tempC = Number(tempRaw);
      decodeResult.raw.temperature_c = tempC;
    }

    // Wind encoding:
    //   5 digits DDDSS  — direction in degrees (000–360) + speed in kt
    //   4 digits DDSS   — direction in *tens of degrees* (00–36) + speed in kt
    // Example: `3005` → 300°/05 kt (per analyst report); `27010` → 270°/10 kt.
    let windDir: number | null = null;
    let windSpeed: number | null = null;
    if (/^\d{5}$/.test(windRaw)) {
      windSpeed = Number(windRaw.slice(-2));
      windDir = Number(windRaw.slice(0, 3));
      decodeResult.raw.wind_direction = windDir;
      decodeResult.raw.wind_speed = windSpeed;
    } else if (/^\d{4}$/.test(windRaw)) {
      windSpeed = Number(windRaw.slice(-2));
      windDir = Number(windRaw.slice(0, 2)) * 10;
      decodeResult.raw.wind_direction = windDir;
      decodeResult.raw.wind_speed = windSpeed;
    }

    // Flaps: small integer (e.g. "12")
    let flaps: number | null = null;
    if (/^\d{1,3}$/.test(flapsRaw)) {
      flaps = Number(flapsRaw);
      decodeResult.raw.flaps = flaps;
    }

    // Takeoff gross weight (lbs): 4–6 digits
    let tow: number | null = null;
    if (/^\d{4,6}$/.test(towRaw)) {
      tow = Number(towRaw);
      decodeResult.raw.takeoff_weight_lbs = tow;
    }

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Takeoff / Departure Performance Report',
      },
      {
        type: 'subtype',
        code: 'SUBTYPE',
        label: 'Subtype / Sequence',
        value: subtype,
      },
      {
        type: 'phase',
        code: 'PHASE',
        label: 'Phase',
        value: this.phaseDescriptions[phase]
          ? `${phase} (${this.phaseDescriptions[phase]})`
          : phase,
      },
    );

    if (runway) {
      decodeResult.formatted.items.push({
        type: 'runway',
        code: 'RWY',
        label: 'Departure Runway',
        value: runway,
      });
    }
    if (secondaryRunway) {
      decodeResult.formatted.items.push({
        type: 'secondary_runway',
        code: 'RWY2',
        label: 'Secondary Runway / Intersection',
        value: secondaryRunway,
      });
    }
    if (tempC !== null) {
      decodeResult.formatted.items.push({
        type: 'temperature',
        code: 'OAT',
        label: 'Outside Air Temperature',
        value: `${tempC >= 0 ? '+' : ''}${tempC}°C`,
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
    if (flaps !== null) {
      decodeResult.formatted.items.push({
        type: 'flaps',
        code: 'FLAPS',
        label: 'Flaps',
        value: String(flaps),
      });
    }
    if (tow !== null) {
      decodeResult.formatted.items.push({
        type: 'takeoff_weight',
        code: 'TOW',
        label: 'Takeoff Weight',
        value: `${tow.toLocaleString()} lbs`,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }

  /**
   * Variant B — in-flight performance report with lat/lon and altitude.
   *
   *   96, C, 38.026, -77.605, 14233, *****, KILM, KIAD, 19L, 9, 0, 0, ,,,, 41.8, 0, 0, 0, ,
   *   |   |   |       |       |      |      |     |     |    |  |  |       |
   *   |   |   |       |       |      |      |     |     |    |  |  |       └ Performance value (weight × 1000 lb or CG %)
   *   |   |   |       |       |      |      |     |     |    └──└──└───── Flags (wild guess — ignored)
   *   |   |   |       |       |      |      |     |     └────────────── Runway (arrival)
   *   |   |   |       |       |      |      |     └──────────────────── Destination ICAO
   *   |   |   |       |       |      |      └────────────────────────── Origin ICAO
   *   |   |   |       |       |      └───────────────────────────────── Optional numeric (masked as `*****`)
   *   |   |   |       |       └──────────────────────────────────────── Altitude (ft)
   *   |   |   |       └──────────────────────────────────────────────── Longitude (decimal degrees)
   *   |   |   └──────────────────────────────────────────────────────── Latitude (decimal degrees)
   *   |   └──────────────────────────────────────────────────────────── Phase flag (C, D, F, …)
   *   └──────────────────────────────────────────────────────────────── Subtype / variant code
   */
  private decodeVariantB(
    message: Message,
    fields: string[],
    decodeResult: DecodeResult,
  ): DecodeResult {
    if (fields.length < 17) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const subtype = fields[0].trim();
    const phase = fields[1].trim();
    const latRaw = fields[2].trim();
    const lonRaw = fields[3].trim();
    const altRaw = fields[4].trim();
    const maskedField = fields[5].trim();
    const origin = fields[6].trim();
    const dest = fields[7].trim();
    const runway = fields[8].trim();
    // fields[9] — configuration code (wild guess, ignored)
    // fields[10..15] — flags / optional reserved (ignored per analyst guidance)
    const weightRaw = fields[16].trim();
    // fields[17..] — flags (ignored)

    if (
      !/^-?\d+(?:\.\d+)?$/.test(latRaw) ||
      !/^-?\d+(?:\.\d+)?$/.test(lonRaw) ||
      !/^[A-Z]{3,4}$/.test(origin) ||
      !/^[A-Z]{3,4}$/.test(dest)
    ) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.raw.subtype = subtype;
    decodeResult.raw.phase = phase;

    ResultFormatter.position(decodeResult, {
      latitude: Number(latRaw),
      longitude: Number(lonRaw),
    });
    if (/^-?\d+$/.test(altRaw)) {
      ResultFormatter.altitude(decodeResult, Number(altRaw));
    }
    ResultFormatter.departureAirport(decodeResult, origin);
    ResultFormatter.arrivalAirport(decodeResult, dest);
    if (runway) decodeResult.raw.arrival_runway = runway;
    if (maskedField && !/^\*+$/.test(maskedField)) {
      decodeResult.raw.field6 = maskedField;
    }

    let weight: number | null = null;
    if (/^-?\d+(?:\.\d+)?$/.test(weightRaw)) {
      weight = Number(weightRaw);
      decodeResult.raw.performance_value = weight;
    }

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value:
          'In-Flight Performance Report (Label 33 — Variant B)',
      },
      {
        type: 'subtype',
        code: 'SUBTYPE',
        label: 'Subtype / Variant',
        value: subtype,
      },
      {
        type: 'phase',
        code: 'PHASE',
        label: 'Phase',
        value: this.phaseDescriptions[phase]
          ? `${phase} (${this.phaseDescriptions[phase]})`
          : phase,
      },
    );

    if (runway) {
      decodeResult.formatted.items.push({
        type: 'runway',
        code: 'RWY',
        label: 'Runway (arrival)',
        value: runway,
      });
    }
    if (weight !== null) {
      decodeResult.formatted.items.push({
        type: 'performance_value',
        code: 'PERF',
        label: 'Performance Value (weight × 1000 lb or CG %)',
        value: String(weight),
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
