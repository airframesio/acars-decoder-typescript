import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_HX extends DecoderPlugin {
  name = 'label-hx';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['HX'],
      preambles: ['RA FMT LOCATION', 'RA FMT 43'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;

    const parts = message.text.split(' ');

    if (parts[2] === "LOCATION") {
        decodeResult.raw.position.latitude = parts[3];
        decodeResult.raw.position.longitude = parts[4];
        decodeResult.remaining.text = parts.slice(5).join(' ');
    } else if (parts[2] === "43") {
        ResultFormatter.departureAirport(decodeResult, parts[3]);
        decodeResult.remaining.text = parts.slice(4).join(' ');
    }

    decodeResult.formatted.description = 'Undelivered Uplink Report';

    if (decodeResult.raw.position.latitude) {
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(decodeResult.raw.position),
        });
    }

    decodeResult.decoded = true;
    if(decodeResult.remaining.text === "") 
	decodeResult.decoder.decodeLevel = 'full';
    else
	decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
