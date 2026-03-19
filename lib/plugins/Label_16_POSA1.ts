import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_16_POSA1 extends DecoderPlugin {
  name = 'label-16-posa1';

  qualifiers() {
    return {
      labels: ['16'],
      preambles: ['POSA1'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');

    const fields = message.text.split(',');
    if (fields.length !== 11 || !fields[0].startsWith('POSA1')) {
      return this.failUnknown(decodeResult, message.text, options);
    }

    ResultFormatter.position(
      decodeResult,
      CoordinateUtils.decodeStringCoordinates(fields[0].substring(5)),
    ); // strip 'POSA1'
    const waypoint = fields[1].trim();
    const time = DateTimeUtils.convertHHMMSSToTod(fields[2]);
    ResultFormatter.altitude(decodeResult, Number(fields[3]) * 100);
    const nextWaypoint = fields[4].trim();
    const nextTime = DateTimeUtils.convertHHMMSSToTod(fields[5]);
    ResultFormatter.unknownArr(decodeResult, fields.slice(6), ',');
    ResultFormatter.route(decodeResult, {
      waypoints: [
        { name: waypoint, time: time },
        { name: nextWaypoint, time: nextTime },
      ],
    });
    this.setDecodeLevel(decodeResult, true, 'partial');

    return decodeResult;
  }
}
