import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

import { splitAgmHeader } from '../utils/agm_header';

// United crew duty uplink, sent at pushback with the actual departure
// (the OUT time) or before it with the estimated departure:
// '.NDCULUA 220440\r\nAGM\r\nAN N496UA\r\n-  FLT# 2464-21    KSFO     04:40\r\n
// PART 117        RLS 1   ACT DEP 0439\r\nCCO TIME(ZULU)\r\n...'
const FLT_REGEX =
  /^FLT# (\d{1,4})-(0[1-9]|[12]\d|3[01]) +([A-Z0-9]{4}) +(\d{2}:\d{2})$/;
const DEP_REGEX = /^PART 117 +(RLS \d+) +(ACT|EST) DEP (\d{4})$/;
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_C1_Part117 extends DecoderPlugin {
  name = 'label-c1-part117';

  qualifiers() {
    return {
      labels: ['C1'],
      preambles: ['.'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Crew Duty Report');
    const lines = splitAgmHeader(message.text, decodeResult);
    const flt = lines ? FLT_REGEX.exec(lines[0].trim()) : null;
    const dep = lines ? DEP_REGEX.exec((lines[1] ?? '').trim()) : null;
    if (!lines || !flt || !dep || !CLOCK_REGEX.test(dep[3])) {
      if (options.debug) {
        console.log(`Decoder: Unknown C1 message: ${message.text}`);
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
      // the header already named the flight ('FI UA2464')
      ResultFormatter.unknown(decodeResult, flt[1], ' ');
    }
    ResultFormatter.departureDay(decodeResult, Number(flt[2]));
    ResultFormatter.departureAirport(decodeResult, flt[3]);
    ResultFormatter.unknown(decodeResult, flt[4], ' ');
    ResultFormatter.unknown(decodeResult, dep[1], ' ');
    const tod = DateTimeUtils.convertHHMMSSToTod(dep[3]);
    if (dep[2] === 'ACT') ResultFormatter.out(decodeResult, tod);
    else ResultFormatter.etd(decodeResult, tod);
    const rest = lines
      .slice(2)
      .map((l) => l.trim())
      .filter((l) => l);
    if (rest.length) {
      ResultFormatter.unknown(decodeResult, rest.join('\n'), '\n');
    }
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
