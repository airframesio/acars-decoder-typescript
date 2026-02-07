import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_2P_FM5 extends DecoderPlugin {
  name = 'label-2p-fm5';

  qualifiers() {
    return {
      labels: ['2P'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Flight Report';
    decodeResult.message = message;

    const parts = message.text.split(',');

    if (parts.length === 12) {
      const header = parts[0].split('FM5 ');
      if (header.length == 0) {
        // can't use preambles, as there can be info before `FM4`
        // so let's check if we want to decode it here
        ResultFormatter.unknown(decodeResult, message.text);
        decodeResult.decoded = false;
        decodeResult.decoder.decodeLevel = 'none';
        return decodeResult;
      }

      ResultFormatter.departureAirport(decodeResult, header[1]);
      ResultFormatter.arrivalAirport(decodeResult, parts[1]);
      ResultFormatter.time_of_day(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(parts[2]),
      );
      ResultFormatter.eta(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(parts[3]),
      );
      ResultFormatter.position(decodeResult, {
        latitude: Number(parts[4].replaceAll(' ', '')),
        longitude: Number(parts[5].replaceAll(' ', '')),
      });
      ResultFormatter.altitude(decodeResult, Number(parts[6]));
      // TODO: decode further
      ResultFormatter.unknown(decodeResult, parts[7]);
      ResultFormatter.unknown(decodeResult, parts[8]);
      ResultFormatter.unknown(decodeResult, parts[9]);
      ResultFormatter.flightNumber(decodeResult, parts[10].trim());
      ResultFormatter.unknown(decodeResult, parts[11]);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    } else {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}
