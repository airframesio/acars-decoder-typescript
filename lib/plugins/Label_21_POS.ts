import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Position Report
export class Label_21_POS extends DecoderPlugin {
  name = 'label-21-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['21'],
      preambles: ['POS'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    decodeResult.raw.preamble = message.text.substring(0, 3);

    const content = message.text.substring(3);
    const fields = content.split(',');

    if (fields.length == 9) {
      // POSN 37.550W 76.436,  98,110800,23961,25820,  65,-23,114212,KRDU
      processPosition(decodeResult, fields[0].trim());
      ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[2]));
      ResultFormatter.altitude( decodeResult, Number(fields[3]));
      ResultFormatter.temperature(decodeResult, fields[6].replace(/ /g, ""));
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[7]));
      ResultFormatter.arrivalAirport(decodeResult, fields[8]);

      decodeResult.remaining.text = [
        fields[1],
        fields[4],
        fields[5],
    ].join(',');

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    } else {
      // Unknown!
      if(options.debug) {
        console.log(`DEBUG: ${this.name}: Unknown variation. Field count: ${fields.length}, content: ${content}`);
      }
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
    return decodeResult;
  }
}
function processPosition(decodeResult: DecodeResult, value: string) {
  // N 39.841W 75.790
  if(value.length !== 16 && value[0] !== 'N' && value[0] !== 'S' && value[8] !== 'W' && value[8] !== 'E') {
    return;
  }
  const latDir = value[0] === 'N' ? 1 : -1;
  const lonDir = value[8] === 'E' ? 1 : -1;
  const position ={
    latitude: latDir * Number(value.substring(1, 7)),
    longitude: lonDir * Number(value.substring(9, 15)),
  };
  
  ResultFormatter.position(decodeResult, position);
}

export default {};

