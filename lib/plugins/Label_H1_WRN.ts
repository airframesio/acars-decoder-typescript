import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_H1_WRN extends DecoderPlugin {
  name = 'label-h1-wrn';

  qualifiers() {
    return {
      labels: ['H1'],
      preambles: ['WRN', '#CFBWRN'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Warning Message');

    const parts = message.text.split('/WN');

    if (parts.length > 1) {
      //decode header
      // can go away, here because i want to decode it
      const fields = parts[0].split('/');
      // 0 is the msg type
      ResultFormatter.unknownArr(decodeResult, fields.slice(1), '/');

      const data = parts[1].substring(0, 20);
      const msg = parts[1].substring(20);
      const datetime = data.substring(0, 12); // YYMMDDHHMMSS (SS might be next 2 chars)
      const date =
        datetime.substring(4, 6) +
        datetime.substring(2, 4) +
        datetime.substring(0, 2);

      ResultFormatter.unknown(decodeResult, data.substring(12), '/');
      decodeResult.raw.message_timestamp = DateTimeUtils.convertDateTimeToEpoch(
        datetime.substring(6),
        date,
      );
      // TODO: decode further
      decodeResult.raw.warning_message = msg;
      decodeResult.formatted.items.push({
        type: 'warning',
        code: 'WRN',
        label: 'Warning Message',
        value: decodeResult.raw.warning_message,
      });
      this.setDecodeLevel(decodeResult, true, 'partial');
    } else {
      // Unknown
      return this.failUnknown(decodeResult, message.text, options);
    }

    return decodeResult;
  }
}
