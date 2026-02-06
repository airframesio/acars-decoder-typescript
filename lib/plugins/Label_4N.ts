import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4N extends DecoderPlugin {
  name = 'label-4n';

  qualifiers() {
    return {
      labels: ['4N'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Airline Defined';

    // Inmarsat C-band seems to prefix normal messages with a message number and flight number
    let text = message.text;
    if (text.match(/^M\d{2}A\w{6}/)) {
      ResultFormatter.flightNumber(
        decodeResult,
        message.text.substring(4, 10).replace(/^([A-Z]+)0*/g, '$1'),
      );
      text = text.substring(10);
    }

    decodeResult.decoded = true;
    const fields = text.split(',');
    if (text.length === 51) {
      // variant 1
      decodeResult.raw.day = text.substring(0, 2);
      ResultFormatter.departureAirport(decodeResult, text.substring(8, 11));
      ResultFormatter.arrivalAirport(decodeResult, text.substring(13, 16));
      ResultFormatter.position(
        decodeResult,
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
          text.substring(30, 45).replace(/^(.)0/, '$1'),
        ),
      );
      ResultFormatter.altitude(
        decodeResult,
        Number(text.substring(48, 51)) * 100,
      );
      ResultFormatter.unknownArr(
        decodeResult,
        [text.substring(2, 4), text.substring(19, 29)],
        ' ',
      );
    } else if (fields.length === 33) {
      // variant 2
      decodeResult.raw.date = fields[3];
      if (fields[1] === 'B') {
        ResultFormatter.position(decodeResult, {
          latitude: Number(fields[4]),
          longitude: Number(fields[5]),
        });
        ResultFormatter.altitude(decodeResult, Number(fields[6]));
      }
      ResultFormatter.departureAirport(decodeResult, fields[8]);
      ResultFormatter.arrivalAirport(decodeResult, fields[9]);
      ResultFormatter.alternateAirport(decodeResult, fields[10]);
      ResultFormatter.arrivalRunway(decodeResult, fields[11].split('/')[0]);
      if (fields[12].length > 1) {
        ResultFormatter.alternateRunway(decodeResult, fields[12].split('/')[0]);
      }
      ResultFormatter.checksum(decodeResult, fields[32]);
      ResultFormatter.unknownArr(
        decodeResult,
        [...fields.slice(1, 3), fields[7], ...fields.slice(13, 32)].filter(
          (f) => f != '',
        ),
      );
    } else {
      decodeResult.decoded = false;
      ResultFormatter.unknown(decodeResult, text);
    }

    if (decodeResult.decoded) {
      if (!decodeResult.remaining.text)
        decodeResult.decoder.decodeLevel = 'full';
      else decodeResult.decoder.decodeLevel = 'partial';
    } else {
      decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}
