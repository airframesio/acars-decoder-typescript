import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

const WS_REGEX = /\s+/;
const ALL_WS_REGEX = /\s/g;
const ALL_DOTS_REGEX = /\./g;

export class Label_83 extends DecoderPlugin {
  name = 'label-83';

  qualifiers() {
    return {
      labels: ['83'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Airline Defined';

    decodeResult.decoded = true;
    const text = message.text;
    if (text.startsWith('4DH3 ETAT2')) {
      // variant 2
      const fields = text.split(WS_REGEX);
      if (fields[2].length > 5) {
        decodeResult.raw.day = fields[2].substring(5);
      }
      ResultFormatter.unknown(decodeResult, fields[2].substring(0, 4));
      const subfields = fields[3].split('/');
      ResultFormatter.departureAirport(decodeResult, subfields[0]);
      ResultFormatter.arrivalAirport(decodeResult, subfields[1]);
      ResultFormatter.tail(decodeResult, fields[4].replace(ALL_DOTS_REGEX, ''));
      ResultFormatter.eta(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(fields[6] + '00'),
      );
    } else if (text.startsWith('001PR')) {
      // variant 3
      decodeResult.raw.day = text.substring(5, 7);
      const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
        text.substring(13, 28).replace(ALL_DOTS_REGEX, ''),
      );
      if (position) {
        ResultFormatter.position(decodeResult, position);
      }
      ResultFormatter.altitude(decodeResult, Number(text.substring(28, 33)));
      ResultFormatter.unknown(decodeResult, text.substring(33));
    } else {
      const fields = text.replace(ALL_WS_REGEX, '').split(',');
      if (fields.length === 9) {
        // variant 1
        ResultFormatter.departureAirport(decodeResult, fields[0]);
        ResultFormatter.arrivalAirport(decodeResult, fields[1]);
        decodeResult.raw.day = fields[2].substring(0, 2);
        decodeResult.raw.time = fields[2].substring(2);
        // text was already whitespace-stripped above so the per-field
        // .replace(/\s/g, '') is redundant.
        ResultFormatter.position(decodeResult, {
          latitude: Number(fields[3]),
          longitude: Number(fields[4]),
        });
        ResultFormatter.altitude(decodeResult, Number(fields[5]));
        ResultFormatter.groundspeed(decodeResult, Number(fields[6]));
        ResultFormatter.heading(decodeResult, Number(fields[7]));
        ResultFormatter.unknown(decodeResult, fields[8]);
      } else {
        decodeResult.decoded = false;
        ResultFormatter.unknown(decodeResult, text);
      }
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
