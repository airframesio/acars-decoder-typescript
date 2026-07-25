// Escape-hatch port of lib/plugins/Label_1L_3-line.ts
// Called from generated plugin lib/plugins/generated/Label_1L_3Line.ts.

import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

export function label_1l_3line_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const lines = message.text.split('\r\n');
  if (lines.length !== 3) {
    if (options.debug) {
      console.log(`Decoder: Unknown 1L message: ${message.text}`);
    }
    result.remaining.text = message.text;
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }
  const parts = message.text.replaceAll('\r\n', '/').split('/');
  const data = new Map<string, string>();
  data.set('', parts[0]);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].split(' ');
    data.set(part[0], part.slice(1).join(' '));
  }

  const dep = data.get('DEP');
  if (dep) {
    ResultFormatter.departureAirport(result, dep);
    data.delete('DEP');
  }
  const des = data.get('DES');
  if (des) {
    ResultFormatter.arrivalAirport(result, des);
    data.delete('DES');
  }
  const eta = data.get('ETA');
  if (eta) {
    ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(eta));
    data.delete('ETA');
  }
  const alt = data.get('ALT');
  if (alt) {
    ResultFormatter.altitude(result, Number(alt));
    data.delete('ALT');
  }
  const fn = data.get('FN');
  if (fn) {
    ResultFormatter.flightNumber(result, fn);
    data.delete('FN');
  }
  const day = data.get('DAY');
  const utc = data.get('UTC');
  if (day && utc) {
    result.raw.message_timestamp =
      Date.parse(day + ' GMT+0000') / 1000 +
      DateTimeUtils.convertHHMMSSToTod(utc);
    data.delete('DAY');
    data.delete('UTC');
  }

  const lat = data.get('LAT');
  const lon = data.get('LON');
  if (lat && lon) {
    ResultFormatter.position(result, {
      latitude:
        CoordinateUtils.getDirection(lat[0]) * Number(lat.substring(1)),
      longitude:
        CoordinateUtils.getDirection(lon[0]) * Number(lon.substring(1)),
    });
    data.delete('LAT');
    data.delete('LON');
  }

  let remaining = '';
  for (const [key, value] of data.entries()) {
    if (key === '') {
      remaining += value;
    } else {
      remaining += `/${key} ${value}`;
    }
  }
  result.remaining.text = remaining;

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  void plugin;
  return result;
}

export function label_1l_3line_format(_result: DecodeResult): void {
  // No-op.
}
