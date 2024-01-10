import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';

export class Label_H1_POS extends DecoderPlugin {
  name = 'label-h1-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['POS'],
    };
  }

  decode(message: any, options: any = {}) : any {
    let decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const checksum = message.text.substring(-4);
    const data = message.text.substring(0, message.text.length-4);
    const fields = data.split(',');
    // idx - value
    //   0 - position
    //   1 - waypoint 1
    //   2 - waypoint 1 valid at HHMMSS
    //   3 - baro alititude
    //   4 - waypoint 2
    //   5 - waypoint 2 eta
    //   6 - waypoint 3
    //   7 - temp
    //   8 - ?
    //   9 - ? or variant 1 ? + /TS + valid at HHMMSS
    //  10 - ? or variant 1 date MMDDYY (opt)
    //  11 - ? or variant 2 gspd (opt) 
    //  12 - ? (opt)
    //  13 - ? (opt)

    if(fields.length>9) {
      this.decodePositionRoute(decodeResult, options, fields);

      decodeResult.remaining.text = `${fields[2]},${fields[5]},${fields[8]}`;

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';

      // variant 2
      if (fields.length==14) {
        decodeResult.raw.groundspeed = Number(fields[10]);

        decodeResult.formatted.items.push({
          type: 'aircraft_groundspeed',
          code: 'GSPD',
          label: 'Aircraft Groundspeed',
          value: `${decodeResult.raw.groundspeed}`
        });

        decodeResult.remaining.text += `,${fields[9]},${fields[11]},${fields[12]},${fields[13]}`;
      } else {
        for(let i=9; i<fields.length; ++i) {
          decodeResult.remaining.text += `,${fields[i]}`;
        }
      }
    decodeResult.remaining.text += checksum;
    } else {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

	  return decodeResult;
  }

  private decodePositionRoute(decodeResult: any, options: any,  fields: string[]) {
    if (options.debug) {
      console.log(`Label 16 N : results`);
      console.log(fields);
    }
    
    const header = fields[0];

    decodeResult.raw.latitude_direction = header.charAt(3);
    decodeResult.raw.latitude = Number(header.substring(4,9))/1000;
    decodeResult.raw.longitude_direction = header.charAt(9);
    decodeResult.raw.longitude = Number(header.substring(10,16))/1000;

    decodeResult.raw.position = {
      latitudeDirection: decodeResult.raw.latitude_direction,
      latitude: decodeResult.raw.latitude * (decodeResult.raw.latitude_direction === 'S' ? -1 : 1),
      longitudeDirection: decodeResult.raw.longitude_direction,
      longitude: decodeResult.raw.longitude * (decodeResult.raw.longitude_direction === 'W' ? -1 : 1),
    };

    decodeResult.raw.route = [fields[1] || '?', fields[4] || '?', fields[6] || '?'];

    decodeResult.raw.outside_air_temperature = Number(fields[7].substring(1)) * (fields[7].charAt(0) === 'M' ? -1 : 1);

    decodeResult.formatted.items.push({
      type: 'aircraft_position',
      code: 'POS',
      label: 'Aircraft Position',
      value: `${decodeResult.raw.latitude} ${decodeResult.raw.latitude_direction}, ${decodeResult.raw.longitude} ${decodeResult.raw.longitude_direction}`,
    });

    decodeResult.raw.altitude = Number(fields[3])*100;
    decodeResult.formatted.items.push({
      type: 'altitude',
      code: 'ALT',
      label: 'Altitude',
      value: `${decodeResult.raw.altitude} feet`,
    });

    decodeResult.formatted.items.push({
      type: 'aircraft_route',
      code: 'ROUTE',
      label: 'Aircraft Route',
      value: `${decodeResult.raw.route.join(' > ')}`,
    });

    decodeResult.formatted.items.push({
      type: 'outside_air_temperature',
      code: 'OATEMP',
      label: 'Outside Air Temperature (C)',
      value: `${decodeResult.raw.outside_air_temperature}`,
    });

    return decodeResult;
  }
}

export default {};
