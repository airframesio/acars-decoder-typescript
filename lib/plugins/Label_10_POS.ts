import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_10_POS extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-10-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['10'],
      preambles: ['POS'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const parts = message.text.split(',');
    if (parts.length !== 12) {
      if (options?.debug) {
        console.log(`Decoder: Unknown 10 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    //const time = parts[0].substring(3); //DDHHMM
    const lat = parts[1].trim();
    const lon = parts[2].trim();
    const position = {
      latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1).trim())/100,
      longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1).trim())/100,
    }
    ResultFormatter.position(decodeResult, position);
    ResultFormatter.altitude(decodeResult, Number(parts[7]));
    decodeResult.remaining.text = [parts[0], ...parts.slice(3,7), ...parts.slice(8)].join(',');

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};