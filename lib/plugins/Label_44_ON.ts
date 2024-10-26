import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

// On Runway Report
export class Label_44_ON extends DecoderPlugin {
  name = 'label-44-on';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['44'],
      preambles: ['00ON01', '00ON02', '00ON03', 'ON01', 'ON02', 'ON03'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'On Runway Report';
    decodeResult.message = message;

    // Style: ON02,N38333W121178,KRNO,KMHR,0806,2350,005.2
    // Match: ON02,coords,departure_icao,arrival_icao,current_date,current_time,fuel_in_tons
    const regex = /^.*,(?<unsplit_coords>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 44 On Runway Report: groups`);
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
        ResultFormatter.remainingFuel(decodeResult, Number(results.groups.fuel_in_tons));
      }

    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}

export default {};
