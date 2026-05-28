import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
  Waypoint,
} from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_4A. Mirrors lib/plugins/Label_4A.ts:
 * three variants selected by field count + first-char inspection, each
 * doing inline ResultFormatter.* calls.
 *
 * The spec at vendor/airframes-decoder/spec/labels/4A.yaml was switched
 * from a declarative variants+field-customs shape to a whole-plugin
 * parse-custom hatch because the field-level customs lacked a clean
 * contract for who owns the formatted.items list. The whole-plugin shape
 * is what other complex plugins (CBand, ARINC_702, MIAM, …) use.
 */
export function label_4a_dispatch(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.decoded = true;
  const fields = message.text.split(',');

  if (fields.length === 11) {
    // Variant 1
    ResultFormatter.timestamp(result, DateTimeUtils.convertHHMMSSToTod(fields[0]));
    ResultFormatter.tail(result, fields[2].replace('.', ''));
    if (fields[3]) ResultFormatter.callsign(result, fields[3]);
    ResultFormatter.departureAirport(result, fields[4]);
    ResultFormatter.arrivalAirport(result, fields[5]);
    ResultFormatter.unknownArr(result, fields.slice(8));
  } else if (fields.length === 6) {
    if (fields[0].match(/^[NS]/)) {
      // Variant 2: position + waypoints
      ResultFormatter.position(
        result,
        CoordinateUtils.decodeStringCoordinates(fields[0].substring(0, 13)),
      );
      const wp1: Waypoint = {
        name: fields[0].substring(13).trim(),
        time: DateTimeUtils.convertHHMMSSToTod(fields[1].substring(0, 6)),
      };
      ResultFormatter.altitude(result, Number(fields[1].substring(6, 9)) * 100);
      const wp2: Waypoint = {
        name: fields[1].substring(9).trim(),
        time: DateTimeUtils.convertHHMMSSToTod(fields[2]),
      };
      ResultFormatter.route(result, { waypoints: [wp1, wp2] });
      ResultFormatter.temperature(result, fields[3]);
      ResultFormatter.unknownArr(result, fields.slice(4));
    } else {
      // Variant 3: timestamp + eta + altitude + position
      ResultFormatter.timestamp(result, DateTimeUtils.convertHHMMSSToTod(fields[0]));
      ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(fields[1]));
      ResultFormatter.unknown(result, fields[2]);
      ResultFormatter.altitude(result, Number(fields[3]));
      ResultFormatter.position(
        result,
        CoordinateUtils.decodeStringCoordinates(
          (fields[4] + fields[5]).replace(/[ \.]/g, ''),
        ),
      );
    }
  } else {
    result.decoded = false;
    ResultFormatter.unknown(result, message.text);
  }

  plugin.setDecodeLevel(result, result.decoded);
  return result;
}

// Format hatch declared in the spec; unused because parse is also custom and
// the generated wrapper returns directly from the parse hatch. Kept as a
// no-op to satisfy the codegen-emitted import.
export function label_4a_format(_result: DecodeResult): void {}
