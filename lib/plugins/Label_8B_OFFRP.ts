import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// SAS takeoff report: departure, arrival, day, OFF time and ETA.
// 'V09CA032/OFFRP/ESSA/EKCH/22/0505/ETA0602/'
const OFFRP_REGEX =
  /^(V\d{2}CA\d{3})\/OFFRP\/([A-Z0-9]{4})\/([A-Z0-9]{4})\/(0[1-9]|[12]\d|3[01])\/(\d{4})\/(?:ETA(\d{4})(?:\/|$))?(.*)$/s;
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_8B_OFFRP extends DecoderPlugin {
  name = 'label-8b-offrp';

  qualifiers() {
    return {
      labels: ['8B'],
      preambles: ['V'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Takeoff Report');
    const m = OFFRP_REGEX.exec(message.text);
    if (!m || !CLOCK_REGEX.test(m[5])) {
      if (options.debug) {
        console.log(`Decoder: Unknown 8B message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    ResultFormatter.unknown(decodeResult, m[1], '/');
    ResultFormatter.departureAirport(decodeResult, m[2]);
    ResultFormatter.arrivalAirport(decodeResult, m[3]);
    ResultFormatter.day(decodeResult, Number(m[4]));
    ResultFormatter.off(decodeResult, DateTimeUtils.convertHHMMSSToTod(m[5]));
    if (m[6]) {
      if (CLOCK_REGEX.test(m[6])) {
        ResultFormatter.eta(
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(m[6]),
        );
      } else {
        ResultFormatter.unknown(decodeResult, `ETA${m[6]}`, '/');
      }
    }
    if (m[7].trim()) {
      ResultFormatter.unknown(decodeResult, m[7].trim(), '/');
    }
    this.setDecodeLevel(decodeResult, true, 'partial');
    return decodeResult;
  }
}
