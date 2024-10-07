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

    decodeResult.raw.departure_icao=header.substring(5,9);
    decodeResult.raw.arrival_icao=header.substring(9,13);

    const stringCoords = header.substring(13)
    // Don't use decodeStringCoordinates here, because of different pos format

    const firstChar = stringCoords.substring(0, 1);
    const middleChar= stringCoords.substring(7, 8);
    decodeResult.raw.position = {};

    if ((firstChar === 'N' || firstChar === 'S') && (middleChar === 'W' || middleChar === 'E')) {
      decodeResult.raw.position.latitude = (Number(stringCoords.substring(1, 7)) / 10000) * (firstChar === 'S' ? -1 : 1);
      decodeResult.raw.position.longitude = (Number(stringCoords.substring(8, 15)) / 10000) * (middleChar === 'W' ? -1 : 1);
      decodeResult.raw.altitude = Number(stringCoords.substring(15)) * 100;
    } else {
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    decodeResult.formatted.items.push({
      type: 'aircraft_position',
      code: 'POS',
      label: 'Aircraft Position',
      value: CoordinateUtils.coordinateString(decodeResult.raw.position)
    });

    ResultFormatter.altitude(decodeResult, decodeResult.raw.altitude);
    ResultFormatter.departureAirport(decodeResult, decodeResult.raw.departure_icao);
    ResultFormatter.arrivalAirport(decodeResult, decodeResult.raw.arrival_icao);
    decodeResult.remaining.text = parts.slice(1).join(' ');

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
