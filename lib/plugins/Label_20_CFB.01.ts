import { DecoderPlugin } from '../DecoderPlugin';

// In Air Report
export class Label_20_CFB01 extends DecoderPlugin {
  name = 'label-20-cfb01';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['20'],
      preambles: ['#CFB.01'],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Crew Flight Bag Message';
    decodeResult.message = message;

    // Style: IN02,N38338W121179,KMHR,KPDX,0806,2355,005.1
    // Match: IN02,coords,departure_icao,arrival_icao,current_date,current_time,fuel_in_tons
    const regex = /^IN02,(?<unsplit_coords>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 44 ETA Report: groups`);
        console.log(results.groups);
      }

      decodeResult.raw.position = this.decodeStringCoordinates(results.groups.unsplit_coords);

      decodeResult.raw.departure_icao = results.groups.departure_icao;
      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
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

      if(decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: 'position',
          code: 'POS' ,
          label: 'Position',
          value: this.coordinateString(decodeResult.raw.position),
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

    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}

export default {};
