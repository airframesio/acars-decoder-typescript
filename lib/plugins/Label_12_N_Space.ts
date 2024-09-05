import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';

export class Label_12_N_Space extends DecoderPlugin {
  name = 'label-12-n-space';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["12"],
      preambles: ['N '],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const variant1Regex = /^(?<lat>[NS])\s(?<lat_coord>.*),(?<long>[EW])\s*(?<long_coord>.*),(?<alt>.*),(?<unkwn1>.*),\s*(?<unkwn2>.*),.(?<airframe>.*),(?<unkwn3>.*)$/;

        let results;
    if (results = message.text.match(variant1Regex)) {
      if (options.debug) {
        console.log(`Label 12 N : results`);
        console.log(results);
      }

      decodeResult.raw.position = {
        latitude: Number(results.groups.lat_coord) * (results.groups.lat == 'N' ? 1 : -1),
        longitude:  Number(results.groups.long_coord) * (results.groups.long == 'E' ? 1 : -1)
      };
      decodeResult.raw.flight_level = results.groups.alt == 'GRD' || results.groups.alt == '***' ? '0' : Number(results.groups.alt);

      decodeResult.formatted.items.push({
        type: 'aircraft_position',
        code: 'POS',
        label: 'Aircraft Position',
        value: CoordinateUtils.coordinateString(decodeResult.raw.position),
      });

      decodeResult.formatted.items.push({
        type: 'flight_level',
        code: 'FL',
        label: 'Flight Level',
        value: decodeResult.raw.flight_level,
      });

      decodeResult.remaining.text = `,${results.groups.unkwn1} ,${results.groups.unkwn2}, ${results.groups.unkwn3}`;
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';

    } else {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown 12 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}

export default {};
