import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { H1Helper } from '../utils/h1_helper';
import { ResultFormatter } from '../utils/result_formatter';
import { RouteUtils } from '../utils/route_utils';

export class Label_H1_Slash extends DecoderPlugin {
  name = 'label-h1-slash';
  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
      preambles: ['/']
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;
    
    const checksum = message.text.slice(-4);
    const data = message.text.slice(0, message.text.length - 4);

    const fields = data.split('/');

    if(fields[0] !== '') {
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const headerData = fields[1].split('.');
    ResultFormatter.unknown(decodeResult, headerData[0]);
    if(headerData[1] === 'POS' && fields[2].startsWith('TS') && fields[2].length > 15) {
      // variant 3 hack
      // rip out the timestamp and process the rest
      H1Helper.processPosition(decodeResult, fields[2].substring(15).split(','));
    } else if(headerData[1] === 'POS') {
      // do nothing
    } else if(headerData[1].startsWith('POS')) {
      H1Helper.processPosition(decodeResult, headerData[1].substring(3).split(','));
    } else {
      ResultFormatter.unknown(decodeResult, headerData[1], '.');
    }

    for(let i=2; i<fields.length; i++) {
      const field = fields[i];
      if(field.startsWith('TS')) {
        H1Helper.processTimeStamp(decodeResult, field.substring(2,15).split(','));
      } else if(field.startsWith('PS')) {
        H1Helper.processPS(decodeResult, field.substring(2).split(','));
      } else {
        ResultFormatter.unknown(decodeResult, field, '/');
      }
    }

    if (decodeResult.formatted.items.length === 0) {
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    ResultFormatter.checksum(decodeResult, checksum);
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = !decodeResult.remaining.text ? 'full' : 'partial';
    return decodeResult;
  }
}

export default {};