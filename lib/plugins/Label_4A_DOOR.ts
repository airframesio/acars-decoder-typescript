import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4A_DOOR extends DecoderPlugin {
  name = 'label-4a-door';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['4A'],
      preambles: ['DOOR'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Latest New Format';

    decodeResult.decoded = true;
    const fields = message.text.split(" ");
    if (fields.length === 3) {
        ResultFormatter.door_event(decodeResult, fields[0].split("/")[1], fields[1]);
        ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[2] + "00"));
    } else {
        decodeResult.decoded = false;
        ResultFormatter.unknown(decodeResult, message.text);
    }
    if (decodeResult.decoded) {
        if(!decodeResult.remaining.text)
            decodeResult.decoder.decodeLevel = 'full';
        else
            decodeResult.decoder.decodeLevel = 'partial';
    } else {
        decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}

export default {};
