import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  DateTimeUtils,
  FlightPlanUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_44_Slash (" /FB" preamble — Flight Briefing).
 *
 * Ported from lib/plugins/Label_44_Slash.ts. Behavior:
 *   - Splits on '/'; requires exactly 4 outer fields.
 *   - First two outer fields (space + briefing id) emitted as unknownArr.
 *   - fields[3] is split on ',' (>= 6 inner fields required).
 *   - Position char-prefix decoded (S => -1 lat, W => -1 lon).
 *   - Flight number, status (unknown), arrival airport, ETA from inner [2..5].
 *   - If inner length is exactly 18, additionally emits remainingFuel,
 *     arrivalRunway, and an arrival procedure via FlightPlanUtils.addProcedure,
 *     interleaved with unknownArr emissions.
 *   - On any failure: ResultFormatter.unknown + decoded=false / 'none'.
 */
export function label_44_slash_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const fields = message.text.split('/');
  if (fields.length !== 4) {
    if (options.debug) {
      console.log(`Decoder: Unknown 44 message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }
  ResultFormatter.unknownArr(result, fields.slice(0, 2), '/'); // 0 is a space
  // 1 is the briefing id
  // 2 is arrival airport, but repeated later
  const data = fields[3].split(',');
  if (data.length >= 6) {
    if (options.debug) {
      console.log('Label 44 Slash: groups');
      console.log(data);
    }

    ResultFormatter.position(result, {
      latitude:
        (data[0].charAt(0) === 'S' ? -1 : 1) *
        parseFloat(data[0].slice(1).trim()),
      longitude:
        (data[1].charAt(0) === 'W' ? -1 : 1) *
        parseFloat(data[1].slice(1).trim()),
    });
    ResultFormatter.flightNumber(result, data[2]);
    ResultFormatter.unknown(result, data[3]); // Status - need more info to decode
    ResultFormatter.arrivalAirport(result, data[4]);
    ResultFormatter.eta(
      result,
      DateTimeUtils.convertHHMMSSToTod(data[5]),
    );
    if (data.length === 18) {
      ResultFormatter.unknownArr(result, data.slice(6, 8), ','); // 6 is repeated arrival airport
      ResultFormatter.remainingFuel(result, parseFloat(data[8]));
      ResultFormatter.unknownArr(result, data.slice(9, 11), ',');
      ResultFormatter.arrivalRunway(result, data[11]);
      FlightPlanUtils.addProcedure(result, data[12], 'arrival');
      ResultFormatter.unknownArr(result, data.slice(13, 18), ',');
    }
  } else {
    if (options.debug) {
      console.log(`Decoder: Unknown 44 message: ${message.text}`);
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
