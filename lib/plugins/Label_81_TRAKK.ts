import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Waypoint report: current waypoint, time, flight level and fuel, the next
// waypoints, then the ETA and the estimated fuel at destination.
// 'TRAKK 0627 FL370 FOB18.3\r\nAVERE 0645/HAR 0702\r\nETA 0754 EFOB 12.3\r\n'
const FIRST_REGEX = /^([A-Z0-9]{2,5}) (\d{4}) FL(\d{3}) FOB(\d+(?:\.\d+)?)$/;
const ETA_REGEX = /^ETA (\d{4}) EFOB ?(\d+(?:\.\d+)?)$/;
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_81_TRAKK extends DecoderPlugin {
  name = 'label-81-trakk';

  qualifiers() {
    return {
      labels: ['81'],
      preambles: ['TRAKK '],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Waypoint Report');
    const lines = message.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l);
    const first = FIRST_REGEX.exec(lines[0] ?? '');
    const eta = lines.map((l) => ETA_REGEX.exec(l)).find((m) => m);
    if (!first || !eta || !CLOCK_REGEX.test(eta[1])) {
      if (options.debug) {
        console.log(`Decoder: Unknown 81 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    ResultFormatter.unknown(decodeResult, `${first[1]} ${first[2]}`, ' ');
    ResultFormatter.altitude(decodeResult, Number(first[3]) * 100);
    ResultFormatter.currentFuel(decodeResult, Number(first[4]));
    for (const line of lines.slice(1)) {
      if (ETA_REGEX.test(line)) continue;
      ResultFormatter.unknown(decodeResult, line, ' ');
    }
    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(eta[1]));
    ResultFormatter.remainingFuel(decodeResult, Number(eta[2]));
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
