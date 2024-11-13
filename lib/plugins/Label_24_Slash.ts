import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Position Report
export class Label_24_Slash extends DecoderPlugin {
  name = 'label-24-slash';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['24'],
      preambles: ['/'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const fields = message.text.split('/');

    if (fields.length == 10 && fields[0] == '' && fields[9] == '') { // begin and ends with `/`
      const mmddyy = fields[1].substring(4,6) + fields[1].substring(2,4) + fields[1].substring(0,2); // YYDDMM
      const hhmmss = fields[2] + '00';
      decodeResult.raw.message_timestamp = DateTimeUtils.convertDateTimeToEpoch(hhmmss,mmddyy);
      ResultFormatter.flightNumber(decodeResult, fields[3]);
      ResultFormatter.altitude(decodeResult, Number(fields[4]));
      const lat = fields[5];
      const lon = fields[6];
      const position = {
        latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1)),
        longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1)),
      };
      ResultFormatter.position(decodeResult, position);
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[8]));
      ResultFormatter.unknown(decodeResult, fields[7]);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    } else {
      // Unknown!
      if(options.debug) {
        console.log(`DEBUG: ${this.name}: Unknown variation. Field count: ${fields.length}. Message: ${message.text}`);
      }
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
    return decodeResult;
  }
}

export default {};

