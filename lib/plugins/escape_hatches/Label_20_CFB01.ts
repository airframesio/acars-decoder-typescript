import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_20_CFB01 (#CFB.01 — Crew Flight Bag).
 *
 * Ported from lib/plugins/Label_20_CFB.01.ts. Behavior:
 *   - Named-group regex over IN02,coords,dep,arr,date,time,fuel_in_tons.
 *   - Position via CoordinateUtils.decodeStringCoordinates.
 *   - current_time computed via Date.parse with new Date().getFullYear() —
 *     preserves byte-for-byte behavior (varies with the year the test runs).
 *   - fuel_in_tons only emitted when not "***"/"****".
 *   - Always reports decoded=true, decodeLevel='full' (matches TS source even
 *     when regex misses).
 */
export function label_20_cfb01_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  // Style: IN02,N38338W121179,KMHR,KPDX,0806,2355,005.1
  const regex =
    /^IN02,(?<unsplit_coords>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<fuel_in_tons>.*)$/;
  const results = message.text.match(regex);
  if (results?.groups) {
    if (options.debug) {
      console.log('Label 44 ETA Report: groups');
      console.log(results.groups);
    }

    ResultFormatter.position(
      result,
      CoordinateUtils.decodeStringCoordinates(results.groups.unsplit_coords),
    );
    ResultFormatter.departureAirport(result, results.groups.departure_icao);
    ResultFormatter.arrivalAirport(result, results.groups.arrival_icao);

    result.raw.current_time = Date.parse(
      new Date().getFullYear() +
        '-' +
        results.groups.current_date.substr(0, 2) +
        '-' +
        results.groups.current_date.substr(2, 2) +
        'T' +
        results.groups.current_time.substr(0, 2) +
        ':' +
        results.groups.current_time.substr(2, 2) +
        ':00Z',
    );

    if (
      results.groups.fuel_in_tons != '***' &&
      results.groups.fuel_in_tons != '****'
    ) {
      result.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
    }
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'full';

  return result;
}
