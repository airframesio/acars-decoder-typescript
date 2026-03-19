import { DateTimeUtils } from '../DateTimeUtils';
import { DecodeResult, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { Label_44_Base } from './Label_44_Base';

// In Gate Report
export class Label_44_IN extends Label_44_Base {
  name = 'label-44-in';
  get description() {
    return 'In Air Report';
  }
  get minFields() {
    return 7;
  }

  qualifiers() {
    return {
      labels: ['44'],
      preambles: ['00IN01', '00IN02', '00IN03', 'IN01', 'IN02', 'IN03'],
    };
  }

  decodeEventFields(
    result: DecodeResult,
    data: string[],
    _options: Options,
  ): void {
    ResultFormatter.in(result, DateTimeUtils.convertHHMMSSToTod(data[5]));
    this.parseFuel(result, data[6]);
    this.addRemainingFields(result, data, 7);
  }
}
