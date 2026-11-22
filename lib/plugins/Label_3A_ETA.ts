import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Position report with the ETA first (Middle East Airlines, PIA):
// '/ETA 0905/LAT N 49.194/LON E 14.547/ALT 29999/FB 70'
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;
const COORD_REGEX = /^([NSEW]) ?(\d+\.\d+)$/;

export class Label_3A_ETA extends DecoderPlugin {
  name = 'label-3a-eta';

  qualifiers() {
    return {
      labels: ['3A'],
      preambles: ['/ETA '],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');
    const fields = message.text.split('/').slice(1);
    const eta = fields[0]?.substring(4).trim() ?? '';
    if (!message.text.startsWith('/ETA ') || !CLOCK_REGEX.test(eta)) {
      if (options.debug) {
        console.log(`Decoder: Unknown 3A message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(eta));
    let lat: number | undefined;
    let lon: number | undefined;
    for (const field of fields.slice(1)) {
      const tag = field.substring(0, field.indexOf(' '));
      const val = field.substring(field.indexOf(' ') + 1).trim();
      const coord = COORD_REGEX.exec(val);
      if (tag === 'LAT' && coord) {
        lat = (coord[1] === 'S' ? -1 : 1) * Number(coord[2]);
      } else if (tag === 'LON' && coord) {
        lon = (coord[1] === 'W' ? -1 : 1) * Number(coord[2]);
      } else if (tag === 'ALT' && /^\d+$/.test(val)) {
        ResultFormatter.altitude(decodeResult, Number(val));
      } else if (tag === 'FB' && /^\d+$/.test(val)) {
        ResultFormatter.currentFuel(decodeResult, Number(val));
      } else if (tag === 'LAT' || tag === 'LON' || tag === 'FB') {
        // '----.---' or blank: not reported
      } else {
        ResultFormatter.unknown(decodeResult, field, '/');
      }
    }
    if (lat !== undefined && lon !== undefined) {
      ResultFormatter.position(decodeResult, { latitude: lat, longitude: lon });
    }
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
