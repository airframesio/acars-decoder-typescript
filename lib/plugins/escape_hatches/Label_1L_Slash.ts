// Escape-hatch port of lib/plugins/Label_1L_Slash.ts
// Called from generated plugin lib/plugins/generated/Label_1L_Slash.ts.

import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_1l_slash_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split('/');

  if (parts.length !== 7) {
    if (options.debug) {
      console.log(`Decoder: Unknown 1L message: ${message.text}`);
    }
    result.remaining.text = message.text;
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const data = new Map<string, string>();
  data.set('LAT', parts[0].replaceAll(' ', ''));
  data.set('LON', parts[1].replaceAll(' ', ''));
  for (let i = 2; i < parts.length; i++) {
    const part = parts[i].split(' ');
    data.set(part[0], part.slice(1).join(' '));
  }

  const position = {
    latitude: Number(data.get('LAT')),
    longitude: Number(data.get('LON')),
  };
  data.delete('LAT');
  data.delete('LON');

  ResultFormatter.position(result, position);
  const utc = data.get('UTC');
  if (utc) {
    ResultFormatter.timestamp(result, DateTimeUtils.convertHHMMSSToTod(utc));
    data.delete('UTC');
  }
  const alt = data.get('ALT');
  if (alt) {
    ResultFormatter.altitude(result, Number(alt));
    data.delete('ALT');
  }
  const fob = data.get('FOB');
  if (fob) {
    ResultFormatter.currentFuel(result, Number(fob));
    data.delete('FOB');
  }
  const eta = data.get('ETA');
  if (eta) {
    ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(eta));
    data.delete('ETA');
  }

  let remaining = '';
  for (const [key, value] of data.entries()) {
    remaining += `/${key} ${value}`;
  }
  result.remaining.text = remaining;

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  void plugin;
  return result;
}

export function label_1l_slash_format(_result: DecodeResult): void {
  // No-op.
}
