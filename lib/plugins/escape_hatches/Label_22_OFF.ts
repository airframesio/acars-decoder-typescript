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

/**
 * Whole-plugin parse hatch for Label_22_OFF (OFF preamble — Takeoff Report).
 *
 * Ported from lib/plugins/Label_22_OFF.ts. Behavior:
 *   - Three variants dispatched on "OFF01" / "OFF02\r\n" / "OFF02" prefixes.
 *   - Variant 1 (OFF01): slash-split + fixed-substring layout for flight
 *     number, departure/arrival days, timestamp, dep/arr airports, OFF time.
 *   - Variant 2 (OFF02): slash-split + fixed-substring layout including a
 *     decimal-minutes position and an ETA field.
 *   - Variant 3 (OFF02\r\n): comma-split into [dep, arr, off-time, unknown].
 *   - All variants set decodeLevel='partial' on success, 'none' otherwise.
 */
export function label_22_off_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  if (message.text.startsWith('OFF01')) {
    // variant 1
    const fields = message.text.substring(5).split('/');

    if (fields.length != 2) {
      plugin.setDecodeLevel(result, false);
      return result;
    }

    ResultFormatter.flightNumber(result, fields[0]);
    ResultFormatter.departureDay(result, Number(fields[1].substring(0, 2))); // departure day
    ResultFormatter.arrivalDay(result, Number(fields[1].substring(2, 4))); // arrival day
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[1].substring(4, 8)),
    );
    ResultFormatter.departureAirport(result, fields[1].substring(8, 12));
    ResultFormatter.arrivalAirport(result, fields[1].substring(12, 16));
    ResultFormatter.off(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[1].substring(16, 22)),
    );
    ResultFormatter.unknown(result, fields[1].substring(22));

    plugin.setDecodeLevel(result, true, 'partial');
  } else if (message.text.startsWith('OFF02\r\n')) {
    // varaint 3
    const fields = message.text.substring(7).split(',');
    if (fields.length != 4) {
      plugin.setDecodeLevel(result, false);
      return result;
    }

    ResultFormatter.departureAirport(result, fields[0]);
    ResultFormatter.arrivalAirport(result, fields[1]);
    ResultFormatter.off(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[2]),
    );
    ResultFormatter.unknown(result, fields[3]);

    plugin.setDecodeLevel(result, true, 'partial');
  } else if (message.text.startsWith('OFF02')) {
    // varaint 2
    const fields = message.text.substring(5).split('/');
    if (fields.length != 2) {
      plugin.setDecodeLevel(result, false);
      return result;
    }

    ResultFormatter.flightNumber(result, fields[0]);
    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
      fields[1].substring(0, 14),
    );
    if (position) {
      ResultFormatter.position(result, position);
    }
    ResultFormatter.day(result, Number(fields[1].substring(14, 16)));
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[1].substring(16, 20)),
    );
    ResultFormatter.departureAirport(result, fields[1].substring(20, 24));
    ResultFormatter.arrivalAirport(result, fields[1].substring(24, 28));
    ResultFormatter.off(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[1].substring(28, 32)),
    );
    ResultFormatter.unknown(result, fields[1].substring(32, 36));
    ResultFormatter.eta(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[1].substring(36, 40)),
    );
    plugin.setDecodeLevel(result, true, 'partial');
  } else {
    plugin.debug(options, 'Unknown variation.');
    plugin.setDecodeLevel(result, false);
  }
  return result;
}
