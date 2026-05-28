import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
  Wind,
} from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_H2_02E.
 *
 * Space-split message must end with a 'Q' sentinel. The 45-char header
 * encodes day (chars 3..5), departure ICAO (5..9), arrival ICAO (9..13),
 * and a first weather record (13..). Each subsequent space-separated
 * chunk must start with 'Q' followed by a 32-char weather record. Any
 * chunk that doesn't parse cleanly is appended (space-joined) to
 * remaining.text, downgrading the decode level from 'full' to 'partial'.
 */
export function label_h2_02e_dispatch(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  const parts = message.text.split(' ');

  if (parts[parts.length - 1] !== 'Q') {
    result.remaining.text = message.text;
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const windData: Wind[] = [];
  result.remaining.text = '';

  const header = parts[0];
  if (header.length === 45) {
    ResultFormatter.day(result, parseInt(header.substring(3, 5), 10));
    ResultFormatter.departureAirport(result, header.substring(5, 9));
    ResultFormatter.arrivalAirport(result, header.substring(9, 13));
    const firstWind = parseWeatherReport(header.substring(13));
    if (firstWind) {
      windData.push(firstWind);
    } else {
      result.remaining.text +=
        (result.remaining.text ? ' ' : '') + header.substring(13);
    }
  }

  for (let i = 1; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part[0] !== 'Q') {
      result.remaining.text +=
        (result.remaining.text ? ' ' : '') + part;
      continue;
    }
    const wind = parseWeatherReport(part.substring(1));
    if (wind) {
      windData.push(wind);
    } else {
      result.remaining.text +=
        (result.remaining.text ? ' ' : '') + part;
    }
  }

  ResultFormatter.windData(result, windData);
  result.decoded = true;
  result.decoder.decodeLevel =
    result.remaining.text.length === 0 ? 'full' : 'partial';
  return result;
}

function parseWeatherReport(text: string): Wind | null {
  const posString = text.substring(0, 13);
  const pos =
    CoordinateUtils.decodeStringCoordinatesDecimalMinutes(posString);
  if (text.length !== 32 || !pos) {
    return null;
  }
  const tod = DateTimeUtils.convertHHMMSSToTod(text.substring(13, 17));
  const flightLevel = parseInt(text.substring(17, 20), 10);
  const tempSign = text[21] === 'M' ? -1 : 1;
  const tempDegreesRaw = parseInt(text.substring(22, 25), 10);
  const tempDegrees = tempSign * (tempDegreesRaw / 10);
  const windDirection = parseInt(text.substring(25, 28), 10);
  const windSpeed = parseInt(text.substring(28, 31), 10);
  if (text[31] !== 'G') {
    return null;
  }
  return {
    waypoint: {
      name: posString,
      latitude: pos.latitude,
      longitude: pos.longitude,
      time: tod,
    },
    flightLevel,
    windDirection,
    windSpeed,
    temperature: {
      flightLevel,
      degreesC: tempDegrees,
    },
  };
}
