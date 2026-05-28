import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_H1_Paren.
 *
 * Ports the original regex-driven position report parse. The match groups
 * are deg-min lat/lon (NSDM / EWDM), HHMMSS time-of-day, FLxxx altitude
 * (multiplied by 100), decimal fuel (in metric tons via parseFloat), and
 * decimal mach. A literal 'RMK' is appended as an unknown marker for
 * parity. Non-matching input yields `decoded: false` with no remaining
 * text emitted (mirrors the legacy plugin).
 */
export function label_h1_paren_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  if (!message.text || !message.text.startsWith('(')) {
    result.decoded = false;
    return result;
  }

  const regex =
    /^\(POS-(?<flight>\w+)\s+(?<lat>-?\d{4,5}[NS])(?<lon>\d{5}[EW])\/(?<timestamp>\d{6})\s+F(?<alt>\d{3})\r?\nRMK\/FUEL\s+(?<fuel>\d{2,3}\.\d)\s+M(?<mach>\d\.\d{2})\)/;

  const match = message.text.match(regex);
  if (match && match.groups) {
    result.decoded = true;
    result.decoder.decodeLevel = 'partial';
    result.formatted.description = 'Position Report';

    ResultFormatter.flightNumber(result, match.groups.flight);
    ResultFormatter.position(result, {
      latitude: parseLat(match.groups.lat),
      longitude: parseLon(match.groups.lon),
    });
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(match.groups.timestamp),
    );
    ResultFormatter.altitude(result, parseInt(match.groups.alt, 10) * 100);
    ResultFormatter.currentFuel(result, parseFloat(match.groups.fuel));
    ResultFormatter.mach(result, parseFloat(match.groups.mach));
    ResultFormatter.unknown(result, 'RMK');
  }
  return result;
}

function parseLat(latStr: string): number {
  const match = latStr.match(/(-?)(\d{2})(\d{2})([NS])/);
  if (!match) return NaN;
  const deg = parseInt(match[2]);
  const min = parseInt(match[3]);
  const sign = match[4] === 'S' ? -1 : 1;
  return sign * (deg + min / 60);
}

function parseLon(lonStr: string): number {
  const match = lonStr.match(/(\d{3})(\d{2})([EW])/);
  if (!match) return NaN;
  const deg = parseInt(match[1]);
  const min = parseInt(match[2]);
  const sign = match[3] === 'W' ? -1 : 1;
  return sign * (deg + min / 60);
}
