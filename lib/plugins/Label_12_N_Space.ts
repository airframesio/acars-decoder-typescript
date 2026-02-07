import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_12_N_Space extends DecoderPlugin {
  name = 'label-12-n-space';

  qualifiers() {
    return {
      labels: ['12'],
      preambles: ['N ', 'S '],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const variant1Regex =
      /^(?<lat>[NS])\s(?<lat_coord>.*),(?<long>[EW])\s*(?<long_coord>.*),(?<alt>.*),(?<unkwn1>.*),\s*(?<unkwn2>.*),.(?<airframe>.*),(?<unkwn3>.*)$/;

    let results = message.text.match(variant1Regex);
    if (results?.groups) {
      if (options.debug) {
        console.log('Label 12 N : results');
        console.log(results);
      }

      ResultFormatter.position(decodeResult, {
        latitude:
          Number(results.groups.lat_coord) *
          (results.groups.lat == 'N' ? 1 : -1),
        longitude:
          Number(results.groups.long_coord) *
          (results.groups.long == 'E' ? 1 : -1),
      });

      const altitude =
        results.groups.alt == 'GRD' || results.groups.alt == '***'
          ? 0
          : Number(results.groups.alt);
      ResultFormatter.altitude(decodeResult, altitude);

      ResultFormatter.unknownArr(decodeResult, [
        results.groups.unkwn1,
        results.groups.unkwn2,
        results.groups.unkwn3,
      ]);
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
      return decodeResult;
    }

    // Unknown
    if (options.debug) {
      console.log(`Decoder: Unknown 12 message: ${message.text}`);
    }
    ResultFormatter.unknown(decodeResult, message.text);
    decodeResult.decoded = false;
    decodeResult.decoder.decodeLevel = 'none';

    return decodeResult;
  }
}
