import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { swaRequestHeader } from '../utils/swa_request';

/** Weights and fuel are sent in thousands of pounds. */
function pounds(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const thousands = Number(value);
  return Number.isFinite(thousands) ? Math.round(thousands * 1000) : undefined;
}

/** `22/` is runway 22; anything after the slash is part of the runway's name, as on the card. */
function runway(value: string): string {
  const [rwy, suffix = ''] = value.trim().split('/');
  return suffix.trim() === '' ? rwy.trim() : `${rwy.trim()}/${suffix.trim()}`;
}

// Fields below were matched against the landing card answering each request (113 pairs,
// latest request before each card) unless noted.

// runway condition code, sent as 6 less the code: 113 of 113 pairs
const RUNWAY_CONDITION: Record<number, string> = {
  6: 'dry',
  5: 'good',
  4: 'good to medium',
  3: 'medium',
  2: 'medium to poor',
  1: 'poor',
  0: 'nil',
};

// 0 and 1 in 53 of 54 pairs; 2 in 6 of 6 cards that say FLAPS 15
const FLAPS: Record<string, number> = { '0': 30, '1': 40, '2': 15 };

/**
 * Southwest Airlines landing data request (LDR01), answered by the label 11 landing data card.
 */
export class Label_10_LDR extends DecoderPlugin {
  name = 'label-10-ldr';

  qualifiers() {
    return {
      labels: ['10'],
      preambles: ['LDR'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Landing Data Request';
    decodeResult.message = message;

    const parts = message.text.split(',');
    if (parts.length < 31) {
      return this.failUnknown(decodeResult, message.text, options);
    }

    swaRequestHeader(decodeResult, parts[1], parts[2], parts[3]);
    const lat = parts[5];
    const lon = parts[6];
    const position = {
      latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1).trim()),
      longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1).trim()),
    };
    ResultFormatter.position(decodeResult, position);
    if (parts[7].trim() !== '') {
      ResultFormatter.altitude(decodeResult, Number(parts[7]));
    }
    const fuel = pounds(parts[8]);
    if (fuel !== undefined) ResultFormatter.currentFuel(decodeResult, fuel);
    ResultFormatter.departureAirport(decodeResult, parts[9]);
    ResultFormatter.arrivalAirport(decodeResult, parts[10]);
    // the airport the card is for: the destination, or the airport of a divert
    ResultFormatter.landingAirport(decodeResult, parts[11]);
    ResultFormatter.arrivalRunway(decodeResult, runway(parts[12]));
    const altRwy = [runway(parts[13]), runway(parts[14])]
      .filter((r) => r != '')
      .join(',');
    if (altRwy != '') {
      ResultFormatter.alternateRunway(decodeResult, altRwy);
    }

    // always 0
    const unknown = [parts[4]];
    const condition = parts[15].trim();
    if (/^[1-6]$/.test(condition)) {
      const code = 6 - Number(condition);
      ResultFormatter.raw(
        decodeResult,
        'runway_condition_code',
        'RCC',
        'Runway Condition Code',
        `${code} (${RUNWAY_CONDITION[code]})`,
        code,
      );
    } else if (condition !== '0') {
      unknown.push(parts[15]);
    }
    const flaps = FLAPS[parts[16].trim()];
    if (flaps !== undefined) {
      ResultFormatter.raw(
        decodeResult,
        'landing_flaps',
        'FLAPS',
        'Landing Flaps',
        `${flaps}`,
        flaps,
      );
    } else {
      unknown.push(parts[16]);
    }

    // airport weather, when the crew enters it: wind, gust, temperature, dew point, altimeter
    const [windDir, windSpeed, gust, temp, dew, altimeter] = parts
      .slice(17, 23)
      .map((field) => field.trim());
    if (windDir !== '' || windSpeed !== '') {
      ResultFormatter.wind(
        decodeResult,
        windDir === '' ? undefined : Number(windDir),
        windSpeed === '' ? undefined : Number(windSpeed),
      );
    }
    if (gust !== '') {
      ResultFormatter.raw(
        decodeResult,
        'wind_gust',
        'GUST',
        'Wind Gust',
        `${Number(gust)} knots`,
        Number(gust),
      );
    }
    ResultFormatter.temperature(
      decodeResult,
      temp === '' ? '' : `${Number(temp)}`,
    );
    if (dew !== '') {
      ResultFormatter.raw(
        decodeResult,
        'dew_point',
        'DEWPT',
        'Dew Point (C)',
        `${Number(dew)} degrees`,
        Number(dew),
      );
    }
    if (altimeter !== '') {
      const inHg = Number(altimeter) / 100;
      ResultFormatter.raw(
        decodeResult,
        'altimeter',
        'ALTIM',
        'Altimeter',
        `${inHg.toFixed(2)} inHg`,
        inHg,
      );
    }

    // 1 = engine anti-ice, 113 of 113 pairs (the card says ENGINE ANTI-ICE ON); 2 is in only
    // three requests, so it is shown as sent
    const antiIce = parts[23].trim();
    if (/^[1-9]$/.test(antiIce)) {
      ResultFormatter.raw(
        decodeResult,
        'anti_ice',
        'ANTIICE',
        'Anti-Ice',
        antiIce === '1' ? 'engine' : antiIce,
        Number(antiIce),
      );
    } else if (antiIce !== '0') {
      unknown.push(parts[23]);
    }
    // en route icing: two requests that differ from another only here, and only their cards
    // say ENROUTE ICING CONDITIONS (none of 59 cards for a 0 do); 20 requests
    const flags: [string, string, string, string][] = [
      [parts[24], 'enroute_icing', 'ICING', 'En Route Icing'],
      // the card says HGS AIII: 113 of 113 pairs, 32 requests
      [parts[25], 'hgs_approach', 'HGS', 'HGS Approach'],
    ];
    for (const [value, key, code, label] of flags) {
      if (value.trim() === '1') {
        ResultFormatter.raw(decodeResult, key, code, label, 'yes', true);
      } else if (value.trim() !== '0') {
        unknown.push(value);
      }
    }
    // a non-normal configuration chosen from a list on the aircraft; 7 requests in 2737, too
    // few to name the codes, so the code is shown as sent
    const nonNormal = parts[26].trim();
    if (/^\d+$/.test(nonNormal) && Number(nonNormal) !== 0) {
      ResultFormatter.raw(
        decodeResult,
        'non_normal_configuration',
        'NNC',
        'Non-Normal Configuration',
        `${Number(nonNormal)}`,
        Number(nonNormal),
      );
    } else if (!/^0+$/.test(nonNormal)) {
      unknown.push(parts[26]);
    }
    if (parts[27].trim() !== '') unknown.push(parts[27]);

    // zero fuel weight + landing fuel = landing weight
    const weights: [string, string, string, string][] = [
      ['zero_fuel_weight', 'ZFW', 'Zero Fuel Weight', parts[28]],
      ['landing_fuel', 'LFUEL', 'Landing Fuel', parts[29]],
      ['landing_weight', 'LDW', 'Landing Weight', parts[30]],
    ];
    for (const [key, code, label, value] of weights) {
      const amount = pounds(value);
      if (amount === undefined) continue;
      ResultFormatter.raw(
        decodeResult,
        key,
        code,
        label,
        `${amount} pounds`,
        amount,
      );
    }

    // the missed approach climb gradient (feet per nautical mile) and the altitude it is
    // needed to, as the approach chart gives them: 33 requests, matched to the FAA charts for
    // KBUR runway 8 and KRNO runway 17R; ----. is none
    const gradient = (parts[31] ?? '').trim();
    if (/^\d+$/.test(gradient)) {
      ResultFormatter.raw(
        decodeResult,
        'missed_approach_gradient',
        'MAGRAD',
        'Missed Approach Climb Gradient',
        `${Number(gradient)} feet per nautical mile`,
        Number(gradient),
      );
    } else if (gradient !== '' && gradient !== '----.') {
      unknown.push(parts[31]);
    }
    const missedAltitude = (parts[32] ?? '').trim();
    if (/^\d+$/.test(missedAltitude)) {
      ResultFormatter.raw(
        decodeResult,
        'missed_approach_altitude',
        'MAALT',
        'Missed Approach Altitude',
        `${Number(missedAltitude)} feet`,
        Number(missedAltitude),
      );
    } else if (missedAltitude !== '') {
      unknown.push(parts[32]);
    }
    unknown.push(...parts.slice(33).filter((field) => field.trim() !== ''));

    ResultFormatter.unknownArr(decodeResult, unknown);

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}
