import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// General Aviation Position Report
export class Label_12_POS extends DecoderPlugin {
  name = 'label-12-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['12'],
      preambles: ['POS'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const data = message.text.substring(3).split(',');
    if (!message.text.startsWith('POS') || data.length !== 12) {
      if (options.debug) {
        console.log(`Decoder: Unknown 12 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const lat = data[0].substring(0, 8);
    const lon = data[0].substring(8);
    ResultFormatter.position(decodeResult, {
      latitude: CoordinateUtils.getDirection(lat[0]) * CoordinateUtils.dmsToDecimalDegrees(Number(lat.substring(1, 4)), Number(lat.substring(4, 6)), Number(lat.substring(6, 8))),
      longitude: CoordinateUtils.getDirection(lon[0]) * CoordinateUtils.dmsToDecimalDegrees(Number(lon.substring(1, 4)), Number(lon.substring(4, 6)), Number(lon.substring(6, 8))),
    });
    ResultFormatter.unknown(decodeResult, data[1]);
    ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(data[2]));
    ResultFormatter.altitude(decodeResult, 10 * Number(data[3]));
    ResultFormatter.unknownArr(decodeResult, data.slice(4, 7));
    ResultFormatter.currentFuel(decodeResult, Number(data[7].substring(3).trim())); // strip FOB
    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(data[8].substring(3).trim())); // strip ETA
    ResultFormatter.departureAirport(decodeResult, data[9]);
    ResultFormatter.arrivalAirport(decodeResult, data[10]);
    ResultFormatter.unknown(decodeResult, data[11]);

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
