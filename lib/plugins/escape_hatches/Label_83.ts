// Escape-hatch port of lib/plugins/Label_83.ts decode().
// Three discriminated variants keyed on message prefix.

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

export function label_83_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.decoded = true;
  const text = message.text;

  if (text.substring(0, 10) === '4DH3 ETAT2') {
    // variant 2
    const fields = text.split(/\s+/);
    if (fields[2].length > 5) {
      result.raw.day = fields[2].substring(5);
    }
    ResultFormatter.unknown(result, fields[2].substring(0, 4));
    const subfields = fields[3].split('/');
    ResultFormatter.departureAirport(result, subfields[0]);
    ResultFormatter.arrivalAirport(result, subfields[1]);
    ResultFormatter.tail(result, fields[4].replace(/\./g, ''));
    ResultFormatter.eta(
      result,
      DateTimeUtils.convertHHMMSSToTod(fields[6] + '00'),
    );
  } else if (text.substring(0, 5) === '001PR') {
    // variant 3
    result.raw.day = text.substring(5, 7);
    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
      text.substring(13, 28).replace(/\./g, ''),
    );
    if (position) {
      ResultFormatter.position(result, position);
    }
    ResultFormatter.altitude(result, Number(text.substring(28, 33)));
    ResultFormatter.unknown(result, text.substring(33));
  } else {
    const fields = text.replace(/\s/g, '').split(',');
    if (fields.length === 9) {
      // variant 1
      ResultFormatter.departureAirport(result, fields[0]);
      ResultFormatter.arrivalAirport(result, fields[1]);
      result.raw.day = fields[2].substring(0, 2);
      result.raw.time = fields[2].substring(2);
      ResultFormatter.position(result, {
        latitude: Number(fields[3].replace(/\s/g, '')),
        longitude: Number(fields[4].replace(/\s/g, '')),
      });
      ResultFormatter.altitude(result, Number(fields[5]));
      ResultFormatter.groundspeed(result, Number(fields[6]));
      ResultFormatter.heading(result, Number(fields[7]));
      ResultFormatter.unknown(result, fields[8]);
    } else {
      result.decoded = false;
      ResultFormatter.unknown(result, text);
    }
  }

  if (result.decoded) {
    if (!result.remaining.text) result.decoder.decodeLevel = 'full';
    else result.decoder.decodeLevel = 'partial';
  } else {
    result.decoder.decodeLevel = 'none';
  }

  return result;
}
