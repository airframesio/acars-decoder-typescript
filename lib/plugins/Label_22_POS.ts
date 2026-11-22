import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// Position Report
export class Label_22_POS extends DecoderPlugin {
  name = 'label-22-pos';

  qualifiers() {
    return {
      labels: ['22'],
      preambles: ['N', 'S'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');

    const fields = message.text.split(',');

    if (fields.length !== 11) {
      this.debug(
        options,
        `Unknown variation. Field count: ${fields.length}, content: ${fields.join(',')}`,
      );
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // The position is DDMMSS (degrees, minutes, seconds), e.g. 394138 is
    // 39°41'38", not the decimal fraction 39.4138.
    ResultFormatter.position(
      decodeResult,
      CoordinateUtils.decodeStringCoordinatesDMS(fields[0]),
    );

    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(fields[2]),
    );
    ResultFormatter.altitude(decodeResult, Number(fields[3]));

    ResultFormatter.unknownArr(decodeResult, [fields[1], ...fields.slice(4)]);

    this.setDecodeLevel(decodeResult, true, 'partial');
    return decodeResult;
  }
}
