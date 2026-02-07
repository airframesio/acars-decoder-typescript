import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_HX extends DecoderPlugin {
  name = 'label-hx';

  qualifiers() {
    return {
      labels: ['HX'],
      preambles: ['RA FMT LOCATION', 'RA FMT 43'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Undelivered Uplink Report';

    const parts = message.text.split(' ');

    decodeResult.decoded = true;
    if (parts[2] === 'LOCATION') {
      let latdir = parts[3].substring(0, 1);
      let latdeg = Number(parts[3].substring(1, 3));
      let latmin = Number(parts[3].substring(3, 7));
      let londir = parts[4].substring(0, 1);
      let londeg = Number(parts[4].substring(1, 4));
      let lonmin = Number(parts[4].substring(4, 8));
      let pos = {
        latitude: (latdeg + latmin / 60) * (latdir === 'N' ? 1 : -1),
        longitude: (londeg + lonmin / 60) * (londir === 'E' ? 1 : -1),
      };
      ResultFormatter.unknownArr(decodeResult, parts.slice(5), ' ');
      ResultFormatter.position(decodeResult, pos);
    } else if (parts[2] === '43') {
      ResultFormatter.departureAirport(decodeResult, parts[3]);
      ResultFormatter.unknownArr(decodeResult, parts.slice(4), ' ');
    } else {
      decodeResult.decoded = false;
    }

    if (decodeResult.decoded) {
      if (!decodeResult.remaining.text)
        decodeResult.decoder.decodeLevel = 'full';
      else decodeResult.decoder.decodeLevel = 'partial';
    } else {
      decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}
