import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

export class Label_H1_M_POS extends DecoderPlugin {
  name = 'label-h1-m-pos';

  qualifiers() {
    return {
      labels: ['H1'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'M-Series Periodic Position Report';
    decodeResult.message = message;

    // Match M[2-digit seq]A[airline 2-char][flight 4-digit][origin],[dest],[DDHHMM],[lat],[lon],[alt],[hdg],...
    const headerRegex = /^M(\d{2})A([A-Z]{2})(\d{4})/;
    const headerMatch = message.text.match(headerRegex);

    if (!headerMatch) {
      if (options.debug) {
        console.log(`Decoder: Unknown H1 M-POS message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const airline = headerMatch[2];
    const flightNum = headerMatch[3];
    const afterHeader = message.text.substring(headerMatch[0].length);
    const fields = afterHeader.split(',');

    // We expect at least: origin, dest, DDHHMM, lat, lon, alt, hdg
    if (fields.length < 7) {
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    ResultFormatter.flightNumber(decodeResult, `${airline}${flightNum}`);
    ResultFormatter.departureAirport(decodeResult, fields[0]);
    ResultFormatter.arrivalAirport(decodeResult, fields[1]);

    // DDHHMM timestamp
    const timestamp = fields[2].trim();
    if (timestamp.length === 6) {
      const day = Number(timestamp.substring(0, 2));
      const tod = DateTimeUtils.convertHHMMSSToTod(timestamp.substring(2) + '00');
      ResultFormatter.day(decodeResult, day);
      ResultFormatter.time_of_day(decodeResult, tod);
    }

    // Latitude and longitude (trim spaces, e.g. "- 4.9985")
    const lat = parseFloat(fields[3].replace(/\s/g, ''));
    const lon = parseFloat(fields[4].replace(/\s/g, ''));
    ResultFormatter.position(decodeResult, { latitude: lat, longitude: lon });

    // Altitude
    const alt = Number(fields[5]);
    ResultFormatter.altitude(decodeResult, alt);

    // Heading
    const hdg = Number(fields[6]);
    ResultFormatter.heading(decodeResult, hdg);

    // Remaining fields as unknown
    if (fields.length > 7) {
      ResultFormatter.unknownArr(decodeResult, fields.slice(7));
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = fields.length > 7 ? 'partial' : 'full';

    return decodeResult;
  }
}
