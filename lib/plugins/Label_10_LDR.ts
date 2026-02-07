import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_10_LDR extends DecoderPlugin {
  name = 'label-10-ldr';

  qualifiers() {
    return {
      labels: ['10'],
      preambles: ['LDR'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const parts = message.text.split(',');
    if (parts.length < 17) {
      if (options.debug) {
        console.log(`Decoder: Unknown 10 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const lat = parts[5];
    const lon = parts[6];
    const position = {
      latitude: (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1).trim()),
      longitude: (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1).trim()),
    };
    ResultFormatter.position(decodeResult, position);
    ResultFormatter.altitude(decodeResult, Number(parts[7]));
    ResultFormatter.departureAirport(decodeResult, parts[9]);
    ResultFormatter.arrivalAirport(decodeResult, parts[10]);
    ResultFormatter.alternateAirport(decodeResult, parts[11]);
    ResultFormatter.arrivalRunway(decodeResult, parts[12].split('/')[0]); // TODO: find out if anything comes after `/` sometimes
    const altRwy = [parts[13].split('/')[0], parts[14].split('/')[0]]
      .filter((r) => r != '')
      .join(',');
    if (altRwy != '') {
      ResultFormatter.alternateRunway(decodeResult, altRwy); // TODO: find out if anything comes after `/` sometimes
    }
    ResultFormatter.unknownArr(decodeResult, [
      ...parts.slice(0, 5),
      ...parts.slice(15),
    ]);

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}
