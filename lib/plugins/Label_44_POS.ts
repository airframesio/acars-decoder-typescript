import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';

// General Aviation Position Report
export class Label_44_POS extends DecoderPlugin {
  name = 'label-44-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['44'],
      preambles: ['00POS01', '00POS02', '00POS03', 'POS01', 'POS02', 'POS03'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    // Style: POS02,N38338W121179,GRD,KMHR,KPDX,0807,0003,0112,005.1
    // Match: POS02,coords,flight_level_or_ground,departure_icao,arrival_icao,current_date,current_time,eta_time,unknown
    const regex = /^.*,(?<unsplit_coords>.*),(?<flight_level_or_ground>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<eta_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 44 Position Report: groups`);
        console.log(results.groups);
      }

      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(results.groups.unsplit_coords);
      decodeResult.raw.flight_level = results.groups.flight_level_or_ground == 'GRD' || results.groups.flight_level_or_ground == '***' ? '0' : Number(results.groups.flight_level_or_ground);
      decodeResult.raw.departure_icao = results.groups.departure_icao;
      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
      decodeResult.raw.current_time = Date.parse(
        new Date().getFullYear() + "-" +
        results.groups.current_date.substr(0, 2) + "-" +
        results.groups.current_date.substr(2, 2) + "T" +
        results.groups.current_time.substr(0, 2) + ":" +
        results.groups.current_time.substr(2, 2) + ":00Z"
      );
      decodeResult.raw.eta_time = Date.parse(
        new Date().getFullYear() + "-" +
        results.groups.current_date.substr(0, 2) + "-" +
        results.groups.current_date.substr(2, 2) + "T" +
        results.groups.eta_time.substr(0, 2) + ":" +
        results.groups.eta_time.substr(2, 2) + ":00Z"
      );

      if (results.groups.fuel_in_tons != '***' && results.groups.fuel_in_tons != '****') {
        decodeResult.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
      }

      if(decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: 'position',
          code: 'POS' ,
          label: 'Position',
          value: CoordinateUtils.coordinateString(decodeResult.raw.position),
        });
      }

      decodeResult.formatted.items.push({
        type: 'origin',
        code: 'ORG',
        label: 'Origin',
        value: decodeResult.raw.departure_icao,
      });

      decodeResult.formatted.items.push({
        type: 'destination',
        code: 'DST',
        label: 'Destination',
        value: decodeResult.raw.arrival_icao,
      });

      decodeResult.formatted.items.push({
        type: 'flight_level',
        code: 'FL',
        label: 'Flight Level',
        value: decodeResult.raw.flight_level,
      });

    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}

export default {};
