import { DateTimeUtils } from '../DateTimeUtils';
import { DecodeResult, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { Label_44_Base } from './Label_44_Base';

// Off Runway Report
export class Label_44_OFF extends Label_44_Base {
  name = 'label-44-off';
  get description() {
    return 'Off Runway Report';
  }
  get minFields() {
    return 8;
  }

  qualifiers() {
    return {
      labels: ['44'],
      preambles: ['00OFF01', '00OFF02', '00OFF03', 'OFF01', 'OFF02', 'OFF03'],
    };
  }

  decodeEventFields(
    result: DecodeResult,
    data: string[],
    _options: Options,
  ): void {
    ResultFormatter.off(result, DateTimeUtils.convertHHMMSSToTod(data[5]));
    ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(data[6]));
    this.parseFuel(result, data[7]);
    this.addRemainingFields(result, data, 8);
  }
}
