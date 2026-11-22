import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

import { splitAgmHeader } from '../utils/agm_header';

// American Airlines flight progress report, on label 40 and as a C1 uplink.
// Stations are IATA; the scheduled and planned arrivals are local times.
// 'FPR\r\n. FLT 1407 PHX-DFW SKD ARR 2355L\r\n                 A PLUS 14 0009L\r\n
//                    PLN     0051L\r\n  OUT  0421             0219  TOT / CTR\r\n
//   OFF  0434             0215      /\r\nWETAL  0439     123/    0197      /'
const FLT_REGEX = /^\. FLT (\d{1,4}) +([A-Z]{3})-([A-Z]{3}) (SKD ARR \d{4}L)$/;
const TIME_REGEX = /^ {2}(OUT|OFF|ON|IN) {2}(\d{4})\b(.*)$/;
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_FPR extends DecoderPlugin {
  name = 'label-fpr';

  qualifiers() {
    return {
      labels: ['40', 'C1'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Flight Progress Report');
    const lines =
      message.label === 'C1'
        ? splitAgmHeader(message.text, decodeResult)
        : message.text.split(/\r?\n/);
    const flt =
      lines && lines[0]?.trim() === 'FPR'
        ? FLT_REGEX.exec(lines[1] ?? '')
        : null;
    if (!lines || !flt) {
      if (options.debug) {
        console.log(`Decoder: Unknown FPR message: ${message.text}`);
      }
      decodeResult.formatted.items = [];
      decodeResult.raw = {};
      decodeResult.remaining = {};
      ResultFormatter.unknown(decodeResult, message.text);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    if (decodeResult.raw.flight_number === undefined) {
      ResultFormatter.flightNumber(decodeResult, flt[1]);
    } else {
      // the C1 header already named the flight ('FI AA0006')
      ResultFormatter.unknown(decodeResult, flt[1], '\n');
    }
    ResultFormatter.departureAirport(decodeResult, flt[2], 'IATA');
    ResultFormatter.arrivalAirport(decodeResult, flt[3], 'IATA');
    ResultFormatter.unknown(decodeResult, flt[4], '\n');
    for (const line of lines.slice(2)) {
      const t = TIME_REGEX.exec(line);
      if (t && CLOCK_REGEX.test(t[2])) {
        const tod = DateTimeUtils.convertHHMMSSToTod(t[2]);
        if (t[1] === 'OUT') ResultFormatter.out(decodeResult, tod);
        else if (t[1] === 'OFF') ResultFormatter.off(decodeResult, tod);
        else if (t[1] === 'ON') ResultFormatter.on(decodeResult, tod);
        else ResultFormatter.in(decodeResult, tod);
        if (t[3].trim()) {
          ResultFormatter.unknown(decodeResult, t[3].trim(), '\n');
        }
      } else if (line.trim()) {
        // waypoints: name, time, wind, fuel
        ResultFormatter.unknown(decodeResult, line.trim(), '\n');
      }
    }
    this.setDecodeLevel(decodeResult, true, 'partial');
    return decodeResult;
  }
}
