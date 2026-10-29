import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/** Weights and fuel are sent in thousands of pounds. */
function pounds(value: string): number {
  return Math.round(Number(value) * 1000);
}

/** `22/` is runway 22; anything after the slash is part of the runway's name, as on the card. */
function runway(value: string): string {
  const [rwy, suffix = ''] = value.trim().split('/');
  return suffix.trim() === '' ? rwy.trim() : `${rwy.trim()}/${suffix.trim()}`;
}

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

    ResultFormatter.raw(
      decodeResult,
      'software_version',
      'SWVER',
      'Software Version',
      parts[3],
    );
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
    ResultFormatter.currentFuel(decodeResult, pounds(parts[8]));
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

    // airport weather, when the crew enters it: wind, gust, temperature, dew point, altimeter
    const [windDir, windSpeed, gust, temp, dew, altimeter] = parts.slice(
      17,
      23,
    );
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

    // zero fuel weight + landing fuel = landing weight
    const weights: [string, string, string, string][] = [
      ['zero_fuel_weight', 'ZFW', 'Zero Fuel Weight', parts[28]],
      ['landing_fuel', 'LFUEL', 'Landing Fuel', parts[29]],
      ['landing_weight', 'LDW', 'Landing Weight', parts[30]],
    ];
    for (const [key, code, label, value] of weights) {
      ResultFormatter.raw(
        decodeResult,
        key,
        code,
        label,
        `${pounds(value)} pounds`,
        pounds(value),
      );
    }

    ResultFormatter.unknownArr(decodeResult, [
      ...parts.slice(1, 3),
      parts[4],
      ...parts.slice(15, 17),
      ...parts.slice(23, 28),
      ...parts.slice(31),
    ]);

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}
