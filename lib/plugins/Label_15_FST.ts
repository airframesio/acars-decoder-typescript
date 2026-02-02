import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Position Report
export class Label_15_FST extends DecoderPlugin {
  name = 'label-15-fst';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['15'],
      preambles: ['FST01'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const parts = message.text.split(' ');
    // FST01KMCOEGKKN505552W00118021
    const header = parts[0];

    const stringCoords = header.substring(13)
    // Don't use decodeStringCoordinates here, because of different pos format

    const firstChar = stringCoords.substring(0, 1);
    const middleChar= stringCoords.substring(7, 8);
    decodeResult.raw.position = {};

    if ((firstChar === 'N' || firstChar === 'S') && (middleChar === 'W' || middleChar === 'E')) {
      const lat = (Number(stringCoords.substring(1, 7)) / 10000) * (firstChar === 'S' ? -1 : 1);
      const lon = (Number(stringCoords.substring(8, 15)) / 10000) * (middleChar === 'W' ? -1 : 1);
      ResultFormatter.position(decodeResult, {latitude: lat, longitude: lon});
      ResultFormatter.altitude(decodeResult, Number(stringCoords.substring(15)) * 100);
    } else {
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    ResultFormatter.departureAirport(decodeResult, header.substring(5,9));
    ResultFormatter.arrivalAirport(decodeResult, header.substring(9,13));

    ResultFormatter.unknownArr(decodeResult, parts.slice(1), ' ');

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}
