import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4A_DOOR extends DecoderPlugin {
  name = 'label-4a-door';

  qualifiers() {
    return {
      labels: ['4A'],
      preambles: ['DOOR'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Latest New Format');

    decodeResult.decoded = true;
    const fields = message.text.split(' ');
    if (fields.length === 3) {
      ResultFormatter.door_event(
        decodeResult,
        fields[0].split('/')[1],
        fields[1],
      );
      ResultFormatter.timestamp(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(fields[2] + '00'),
      );
    } else {
      decodeResult.decoded = false;
      ResultFormatter.unknown(decodeResult, message.text);
    }
    this.setDecodeLevel(decodeResult, decodeResult.decoded);

    return decodeResult;
  }
}
