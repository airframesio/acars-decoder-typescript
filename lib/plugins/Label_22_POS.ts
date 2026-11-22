import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

/** DDMMSS digits (394138 = 39°41'38") to decimal degrees. */
const ddmmssToDegrees = (value: number): number =>
  Math.floor(value / 10000) +
  (Math.floor(value / 100) % 100) / 60 +
  (value % 100) / 3600;

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

    const latStr = fields[0].substring(1, 8);
    const lonStr = fields[0].substring(9);
    // The position is DDMMSS (degrees, minutes, seconds), e.g. 394138 is
    // 39°41'38", not the decimal fraction 39.4138.
    const lat = ddmmssToDegrees(Number(latStr));
    const lon = ddmmssToDegrees(Number(lonStr));
    ResultFormatter.position(decodeResult, {
      latitude: CoordinateUtils.getDirection(fields[0][0]) * lat,
      longitude: CoordinateUtils.getDirection(fields[0][8]) * lon,
    });

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
