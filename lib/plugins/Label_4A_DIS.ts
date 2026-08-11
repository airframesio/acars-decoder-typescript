import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4A_DIS extends DecoderPlugin {
  name = 'label-4a-dis';

  qualifiers() {
    return {
      labels: ['4A'],
      preambles: ['DIS'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Latest New Format');

    const fields = message.text.split(',');
    if (fields.length < 3 || !fields[1] || fields[1].length < 3 || !fields[2]) {
      decodeResult.decoded = false;
      this.setDecodeLevel(decodeResult, decodeResult.decoded);
      return decodeResult;
    }

    decodeResult.decoded = true;
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(fields[1].substring(2) + '00'),
    );
    ResultFormatter.callsign(decodeResult, fields[2]);
    ResultFormatter.text(decodeResult, fields.slice(3).join(''));

    this.setDecodeLevel(decodeResult, decodeResult.decoded);

    return decodeResult;
  }
}
