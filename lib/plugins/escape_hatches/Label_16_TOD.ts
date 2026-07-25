// Escape-hatch port of lib/plugins/Label_16_TOD.ts
// Called from generated plugin lib/plugins/generated/Label_16_TOD.ts.

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

export function label_16_tod_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const fields = message.text.split(',');
  const time = DateTimeUtils.convertHHMMSSToTod(fields[0]);
  if (fields.length !== 5 || Number.isNaN(time)) {
    if (options.debug) {
      console.log(`Decoder: Unknown 16 message: ${message.text}`);
    }
    result.remaining.text = message.text;
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  ResultFormatter.timestamp(result, time);
  if (fields[1] !== '') {
    ResultFormatter.altitude(result, Number(fields[1]));
  }
  ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(fields[2]));
  ResultFormatter.unknown(result, fields[3]);
  const temp = fields[4].split('/');
  const posFields = temp[0].split(' ');
  if (posFields.length === 4) {
    ResultFormatter.position(result, {
      latitude:
        CoordinateUtils.getDirection(posFields[0]) * Number(posFields[1]),
      longitude:
        CoordinateUtils.getDirection(posFields[2]) * Number(posFields[3]),
    });
  } else if (posFields.length === 2) {
    ResultFormatter.position(result, {
      latitude:
        (CoordinateUtils.getDirection(posFields[0][0]) *
          Number(posFields[0].slice(1))) /
        100,
      longitude:
        (CoordinateUtils.getDirection(posFields[1][0]) *
          Number(posFields[1].slice(1))) /
        100,
    });
  } else {
    // Redacted
    //ResultFormatter.unknown(result, fields[4]);
  }

  if (temp.length > 1) {
    ResultFormatter.flightNumber(result, temp[1]);
  }
  result.decoded = true;
  result.decoder.decodeLevel = 'partial';

  void plugin;
  return result;
}

export function label_16_tod_format(_result: DecodeResult): void {
  // No-op.
}
