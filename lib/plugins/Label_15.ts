import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// General Aviation Position Report
export class Label_15 extends DecoderPlugin {
  name = 'label-15';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['15'],
      preambles: ['(2'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    if (message.text.startsWith('(2') && message.text.endsWith('(Z')) {
      const between = message.text.substring(2, message.text.length - 2);
      ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinatesDecimalMinutes(between.substring(0, 13)));
      if (between.length === 25) { // short variant
        ResultFormatter.unknown(decodeResult, between.substring(13, 19));
        const alt = between.substring(19, 22);
        if (alt != '---') {
          ResultFormatter.altitude(decodeResult, 100 * Number(alt));
        }
        ResultFormatter.temperature(decodeResult, between.substring(22).replaceAll(" ", "0"));
      } else if(between.substring(13,16) === 'OFF') { // off variant
        const ddmmyy = between.substring(16, 22);
        const hhmm = between.substring(22, 26);
        if(ddmmyy != '------') {
          const mmddyy = ddmmyy.substring(2, 4) + ddmmyy.substring(0, 2) + ddmmyy.substring(4);
          console.log(`Decoder: mmddyy: ${mmddyy}, hhmm: ${hhmm}`);
          ResultFormatter.off(decodeResult, DateTimeUtils.convertDateTimeToEpoch(hhmm+'00', mmddyy), 'epoch');
        } else {
          ResultFormatter.off(decodeResult, DateTimeUtils.convertHHMMSSToTod(hhmm), 'tod');
        }
        ResultFormatter.unknown(decodeResult, between.substring(26));
      } else {
        ResultFormatter.unknown(decodeResult, between.substring(26));
      }
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 15 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
