// Escape-hatch port of lib/plugins/Label_4N.ts decode().
// Two variants dispatched by raw text length (51) vs CSV field count (33).

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { ResultFormatter, CoordinateUtils } from '@airframes/ads-runtime-ts';

export function label_4n_decode(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.decoded = true;
  const text = message.text;
  const fields = text.split(',');

  if (text.length === 51) {
    // variant 1
    result.raw.day = text.substring(0, 2);
    ResultFormatter.departureAirport(result, text.substring(8, 11));
    ResultFormatter.arrivalAirport(result, text.substring(13, 16));
    ResultFormatter.position(
      result,
      CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
        text.substring(30, 45).replace(/^(.)0/, '$1'),
      ),
    );
    ResultFormatter.altitude(result, Number(text.substring(48, 51)) * 100);
    ResultFormatter.unknownArr(
      result,
      [text.substring(2, 4), text.substring(19, 29)],
      ' ',
    );
  } else if (fields.length === 33) {
    // variant 2
    result.raw.date = fields[3];
    if (fields[1] === 'B') {
      ResultFormatter.position(result, {
        latitude: Number(fields[4]),
        longitude: Number(fields[5]),
      });
      ResultFormatter.altitude(result, Number(fields[6]));
    }
    ResultFormatter.departureAirport(result, fields[8]);
    ResultFormatter.arrivalAirport(result, fields[9]);
    ResultFormatter.alternateAirport(result, fields[10]);
    ResultFormatter.arrivalRunway(result, fields[11].split('/')[0]);
    if (fields[12].length > 1) {
      ResultFormatter.alternateRunway(result, fields[12].split('/')[0]);
    }
    ResultFormatter.checksum(result, parseInt(fields[32], 16));
    ResultFormatter.unknownArr(
      result,
      [...fields.slice(1, 3), fields[7], ...fields.slice(13, 32)].filter(
        (f) => f != '',
      ),
    );
  } else {
    result.decoded = false;
    ResultFormatter.unknown(result, text);
  }

  if (result.decoded) {
    if (!result.remaining.text) result.decoder.decodeLevel = 'full';
    else result.decoder.decodeLevel = 'partial';
  } else {
    result.decoder.decodeLevel = 'none';
  }

  return result;
}
