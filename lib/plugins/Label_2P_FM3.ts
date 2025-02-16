import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_2P_FM3 extends DecoderPlugin {
  name = 'label-2p-fm3';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["2P"],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Flight Report';
    decodeResult.message = message;

    const parts = message.text.split(',');

    if(parts.length === 7){

      const header = parts[0].split('FM3 ');
      if(header.length == 0) {
        // can't use preambles, as there can be info before `FM4`
        // so let's check if we want to decode it here
        ResultFormatter.unknown(decodeResult, message.text);
        decodeResult.decoded = false;
        decodeResult.decoder.decodeLevel = 'none';
        return decodeResult;
      }

      if(header[0].length > 0) {
        ResultFormatter.unknown(decodeResult, header[0].substring(0,4));
        ResultFormatter.flightNumber(decodeResult, header[0].substring(4));
      }
      console.log(header[1]);
      if(header[1].length === 4) {
        ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(header[1]+'00'));
      } else {
        ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(header[1]));
      }
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(parts[1]+'00'));
      const lat = parts[2].replaceAll(' ','');
      const lon = parts[3].replaceAll(' ','');
      if(lat[0] === 'N' || lat[0] === 'S') {
      ResultFormatter.position(decodeResult, {
        latitude: CoordinateUtils.getDirection(lat[0]) * Number(lat.substring(1)),
        longitude: CoordinateUtils.getDirection(lon[0]) * Number(lon.substring(1)),
      });
    } else {
      ResultFormatter.position(decodeResult, {latitude: Number(lat), longitude: Number(lon)});
    }
      ResultFormatter.altitude(decodeResult, Number(parts[4]));
      // TODO: decode further
      ResultFormatter.unknown(decodeResult, parts[5]);
      ResultFormatter.unknown(decodeResult, parts[6]);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
     } else {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

      return decodeResult;
  }
}

export default {};
