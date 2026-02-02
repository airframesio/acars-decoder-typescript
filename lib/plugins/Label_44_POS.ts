import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

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
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    // Style: POS02,N38338W121179,GRD,KMHR,KPDX,0807,0003,0112,005.1
    // Match: POS02,coords,flight_level_or_ground,departure_icao,arrival_icao,current_date,current_time,eta_time,unknown
    const regex = /^.*,(?<unsplit_coords>.*),(?<flight_level_or_ground>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<eta_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results?.groups) {
      if (options.debug) {
        console.log(`Label 44 Position Report: groups`);
        console.log(results.groups);
      }

      ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinatesDecimalMinutes(results.groups.unsplit_coords));
      const flight_level = results.groups.flight_level_or_ground == 'GRD' || results.groups.flight_level_or_ground == '***' ? 0 : Number(results.groups.flight_level_or_ground);


      ResultFormatter.month(decodeResult, Number(results.groups.current_date.substring(0, 2)));
      ResultFormatter.day(decodeResult, Number(results.groups.current_date.substring(2, 4)));
      ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(results.groups.current_time + '00'));

      // TODO: ETA month and Day
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(results.groups.eta_time + '00'));

      if (results.groups.fuel_in_tons != '***' && results.groups.fuel_in_tons != '****') {
        decodeResult.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
      }

      ResultFormatter.departureAirport(decodeResult, results.groups.departure_icao);
      ResultFormatter.arrivalAirport(decodeResult, results.groups.arrival_icao);
      ResultFormatter.altitude(decodeResult, flight_level * 100);
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}
