import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4A_01 extends DecoderPlugin {
  name = 'label-4a-01';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['4A'],
      preambles: ['01'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Latest New Format';

    decodeResult.decoded = true;
    let rgx = message.text.match(/^01([A-Z]{2})([A-Z]{2})\s*(\w+)\/(\d{6})([A-Z]{4})([A-Z]{4})\r\n([+-]\s*\d+)(\d{3}\.\d)([+-]\s*\d+\.\d)/);
    if (rgx) {
        ResultFormatter.state_change(decodeResult, rgx[1], rgx[2]);
        ResultFormatter.callsign(decodeResult, rgx[3]);
        ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(rgx[4] + "00"));
        ResultFormatter.departureAirport(decodeResult, rgx[5]);
        ResultFormatter.arrivalAirport(decodeResult, rgx[6]);
        ResultFormatter.altitude(decodeResult, Number(rgx[7].replace(/ /g, "")));
        ResultFormatter.unknown(decodeResult, rgx[8]);
        ResultFormatter.temperature(decodeResult, rgx[9].replace(/ /g, ""));
    } else {
        decodeResult.decoded = false;
        ResultFormatter.unknown(decodeResult, message.text);
    }

    if (decodeResult.decoded) {
        if(!decodeResult.remaining.text)
            decodeResult.decoder.decodeLevel = 'full';
        else
            decodeResult.decoder.decodeLevel = 'partial';
    } else {
        decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}
