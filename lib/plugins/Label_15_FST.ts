import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';

// Position Report
export class Label_15_FST extends DecoderPlugin {
  name = 'label-15-fst';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['15'],
      preambles: ['FST01'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    // FST01KMCOEGKKN505552W00118021

    decodeResult.raw.departure_icao=message.text.substring(5,9);
    decodeResult.raw.arrival_icao=message.text.substring(9,13);

    const stringCoords = message.text.substring(13);
    // Don't use decodeStringCoordinates here, because of different pos format

    const firstChar = stringCoords.substring(0, 1);
    const middleChar= stringCoords.substring(7, 8);
    decodeResult.raw.position = {};

    if ((firstChar === 'N' || firstChar === 'S') && (middleChar === 'W' || middleChar === 'E')) {
      decodeResult.raw.position.latitude = (Number(stringCoords.substring(1, 7)) / 10000) * (firstChar === 'S' ? -1 : 1);
      decodeResult.raw.position.longitude = (Number(stringCoords.substring(8, 26)) / 100000) * (middleChar === 'W' ? -1 : 1);
     } else {
    	decodeResult.decoded = false;
    	decodeResult.decoder.decodeLevel = 'none';
        return decodeResult;
     }

      decodeResult.formatted.items.push({
        type: 'position',
        label: 'Position',
        value: CoordinateUtils.coordinateString(decodeResult.raw.position)
      });

      decodeResult.formatted.items.push({
        type: 'origin',
        code: 'ORG',
        label: 'Origin',
        value: decodeResult.raw.departure_icao
      });

      decodeResult.formatted.items.push({
        type: 'destination',
        code: 'DST',
        label: 'Destination',
        value: decodeResult.raw.arrival_icao
      });

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'full';
    return decodeResult;
  }
}

export default {};
