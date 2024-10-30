import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// In Air Report
export class Label_20_CFB01 extends DecoderPlugin {
  name = 'label-20-cfb01';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['20'],
      preambles: ['#CFB.01'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Crew Flight Bag Message';
    decodeResult.message = message;

    // Style: IN02,N38338W121179,KMHR,KPDX,0806,2355,005.1
    // Match: IN02,coords,departure_icao,arrival_icao,current_date,current_time,fuel_in_tons
    const regex = /^IN02,(?<unsplit_coords>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results?.groups) {
      if (options.debug) {
        console.log(`Label 44 ETA Report: groups`);
        console.log(results.groups);
      }

      ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinates(results.groups.unsplit_coords));
      ResultFormatter.departureAirport(decodeResult, results.groups.departure_icao);
      ResultFormatter.arrivalAirport(decodeResult, results.groups.arrival_icao);

      decodeResult.raw.current_time = Date.parse(
        new Date().getFullYear() + "-" +
        results.groups.current_date.substr(0, 2) + "-" +
        results.groups.current_date.substr(2, 2) + "T" +
        results.groups.current_time.substr(0, 2) + ":" +
        results.groups.current_time.substr(2, 2) + ":00Z"
      );

      if (results.groups.fuel_in_tons != '***' && results.groups.fuel_in_tons != '****') {
        decodeResult.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
      }

    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}

export default {};
