import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// FedEx in range report: flight (after two digits), destination, ETA, fuel,
// then the APU and upload lines.
// '216023/INRANG/DS PANC/ETA 0538/FOB  24300\r\n/APU AVAIL/UPL NO'
const INRANG_REGEX =
  /^(\d{2})(\d{1,4})\/INRANG\/DS ([A-Z0-9]{4})\/ETA (\d{4})(?:\/FOB +(\d+))?(.*)$/s;
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_11_INRANG extends DecoderPlugin {
  name = 'label-11-inrang';

  qualifiers() {
    return {
      labels: ['11'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'In Range Report');
    const m = INRANG_REGEX.exec(message.text);
    if (!m || !CLOCK_REGEX.test(m[4])) {
      if (options.debug) {
        console.log(`Decoder: Unknown 11 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    ResultFormatter.unknown(decodeResult, m[1]);
    ResultFormatter.flightNumber(decodeResult, m[2]);
    ResultFormatter.arrivalAirport(decodeResult, m[3]);
    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(m[4]));
    if (m[5]) {
      ResultFormatter.currentFuel(decodeResult, Number(m[5]));
    }
    const rest = m[6].replace(/[\r\n]+/g, '').trim();
    if (rest) {
      ResultFormatter.unknown(decodeResult, rest, '/');
    }
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
