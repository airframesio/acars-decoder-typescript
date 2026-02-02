import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4A_DIS extends DecoderPlugin {
  name = 'label-4a-dis';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['4A'],
      preambles: ['DIS'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Latest New Format';

    decodeResult.decoded = true;
    const fields = message.text.split(",");
    ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[1].substring(2) + "00"));
    ResultFormatter.callsign(decodeResult, fields[2]);
    ResultFormatter.freetext(decodeResult, fields.slice(3).join(""));

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
