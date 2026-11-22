import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Present position report (Sichuan Airlines):
// 'PRESENT POSITION REPORT\r\nDMY 211126,UTC 052937,LAT N41.561,LON W1.427,
// CAS 271,WD -102,WS 106,ALT 350,FOB 15135,ETA 0600'
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d([0-5]\d)?$/;
const COORD_REGEX = /^([NSEW])(\d+(?:\.\d+)?)$/;

export class Label_14_PPR extends DecoderPlugin {
  name = 'label-14-ppr';

  qualifiers() {
    return {
      labels: ['14'],
      preambles: ['PRESENT POSITION REPORT'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');
    const lines = message.text.split(/\r?\n/);
    if (lines[0].trim() !== 'PRESENT POSITION REPORT' || lines.length < 2) {
      if (options.debug) {
        console.log(`Decoder: Unknown 14 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    let lat: number | undefined;
    let lon: number | undefined;
    for (const field of lines.slice(1).join(',').split(',')) {
      const [tag, ...rest] = field.trim().split(' ');
      const val = rest.join(' ');
      const coord = COORD_REGEX.exec(val);
      switch (tag) {
        case 'DMY':
          if (/^\d{6}$/.test(val)) {
            ResultFormatter.day(decodeResult, Number(val.substring(0, 2)));
            ResultFormatter.month(decodeResult, Number(val.substring(2, 4)));
            ResultFormatter.unknown(decodeResult, val.substring(4), ',');
          } else ResultFormatter.unknown(decodeResult, field, ',');
          break;
        case 'UTC':
          if (CLOCK_REGEX.test(val)) {
            ResultFormatter.timestamp(
              decodeResult,
              DateTimeUtils.convertHHMMSSToTod(val),
            );
          } else ResultFormatter.unknown(decodeResult, field, ',');
          break;
        case 'LAT':
          if (coord) lat = (coord[1] === 'S' ? -1 : 1) * Number(coord[2]);
          else ResultFormatter.unknown(decodeResult, field, ',');
          break;
        case 'LON':
          if (coord) lon = (coord[1] === 'W' ? -1 : 1) * Number(coord[2]);
          else ResultFormatter.unknown(decodeResult, field, ',');
          break;
        case 'CAS':
          ResultFormatter.indicatedAirspeed(decodeResult, Number(val));
          break;
        case 'ALT':
          // flight level
          ResultFormatter.altitude(decodeResult, Number(val) * 100);
          break;
        case 'FOB':
          ResultFormatter.currentFuel(decodeResult, Number(val));
          break;
        case 'ETA':
          if (CLOCK_REGEX.test(val)) {
            ResultFormatter.eta(
              decodeResult,
              DateTimeUtils.convertHHMMSSToTod(val),
            );
          } else ResultFormatter.unknown(decodeResult, field, ',');
          break;
        default:
          // WD/WS: wind
          if (field.trim())
            ResultFormatter.unknown(decodeResult, field.trim(), ',');
      }
    }
    if (lat !== undefined && lon !== undefined) {
      ResultFormatter.position(decodeResult, { latitude: lat, longitude: lon });
    }
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
