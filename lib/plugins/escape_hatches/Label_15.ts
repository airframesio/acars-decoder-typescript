// Escape-hatch port of lib/plugins/Label_15.ts
// Called from generated plugin lib/plugins/generated/Label_15.ts.

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

export function label_15_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  if (message.text.startsWith('(2') && message.text.endsWith('(Z')) {
    const between = message.text.substring(2, message.text.length - 2);
    ResultFormatter.position(
      result,
      CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
        between.substring(0, 13),
      ),
    );
    if (between.length === 25) {
      // short variant
      ResultFormatter.unknown(result, between.substring(13, 19));
      const alt = between.substring(19, 22);
      if (alt != '---') {
        ResultFormatter.altitude(result, 100 * Number(alt));
      }
      ResultFormatter.temperature(
        result,
        between.substring(22).replaceAll(' ', '0'),
      );
    } else if (between.substring(13, 16) === 'OFF') {
      // off variant
      const ddmmyy = between.substring(16, 22);
      const hhmm = between.substring(22, 26);
      if (ddmmyy != '------') {
        ResultFormatter.off(
          result,
          DateTimeUtils.convertDateTimeToEpoch(hhmm + '00', ddmmyy),
        );
      } else {
        ResultFormatter.off(result, DateTimeUtils.convertHHMMSSToTod(hhmm));
      }
      ResultFormatter.unknown(result, between.substring(26));
    } else {
      ResultFormatter.unknown(result, between.substring(26));
    }
  } else {
    if (options.debug) {
      console.log(`[${plugin.name}] Unknown message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';
  return result;
}

export function label_15_format(_result: DecodeResult): void {
  // No-op.
}
