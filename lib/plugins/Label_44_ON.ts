import { DateTimeUtils } from '../DateTimeUtils';
import { DecodeResult, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { Label_44_Base } from './Label_44_Base';

// On Runway Report
export class Label_44_ON extends Label_44_Base {
  name = 'label-44-on';
  get description() {
    return 'On Runway Report';
  }
  get minFields() {
    return 7;
  }

  qualifiers() {
    return {
      labels: ['44'],
      preambles: ['00ON01', '00ON02', '00ON03', 'ON01', 'ON02', 'ON03'],
    };
  }

  decodeEventFields(
    result: DecodeResult,
    data: string[],
    _options: Options,
  ): void {
    ResultFormatter.on(result, DateTimeUtils.convertHHMMSSToTod(data[5]));
    this.parseFuel(result, data[6]);
    this.addRemainingFields(result, data, 7);
  }
}
