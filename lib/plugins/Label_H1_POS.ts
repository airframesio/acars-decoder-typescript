import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { RouteUtils } from '../utils/route_utils';

export class Label_H1_POS extends DecoderPlugin {
  name = 'label-h1-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['POS'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const checksum = message.text.slice(-4);
    //strip POS and checksum
    const data = message.text.substring(3, message.text.length-4);
    const fields = data.split(',');
    
    if(fields.length==1 && data.startsWith('/RF')) {
      decodeResult.raw.route = {waypoints: data.substring(3,data.length).split('.').map((leg: string) => RouteUtils.getWaypoint(leg))};
      decodeResult.formatted.items.push({
        type: 'aircraft_route',
        code: 'ROUTE',
        label: 'Aircraft Route',
        value: RouteUtils.routeToString(decodeResult.raw.route),
      });

      decodeResult.raw.checksum = Number("0x"+checksum);
      decodeResult.formatted.items.push({
        type: 'message_checksum',
        code: 'CHECKSUM',
        label: 'Message Checksum',
        value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
      });    
      
      decodeResult.decoded = true;
      // Once we know what RF stands for, I feel comfortable marking this full
      decodeResult.decoder.decodeLevel = 'partial';
      decodeResult.remaining.text += 'RF'
    } else if(fields.length>9) {
      // idx - value
      //   0 - position in millidegrees
      //   1 - waypoint 1
      //   2 - waypoint 1 valid at HHMMSS
      //   3 - baro alititude
      //   4 - waypoint 2
      //   5 - waypoint 2 eta HHMMSS
      //   6 - waypoint 3
      //   7 - temp
      //   8 - ?
      //   9 - ? or variant 1 ? + /TS + valid at HHMMSS
      //  10 - ? or variant 1 date MMDDYY or variant 2 gspd (opt)
      //  11 - ? (opt) 
      //  12 - ? (opt)
      //  13 - ? (opt)
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

      decodeResult.raw.checksum = Number("0x"+checksum);
      decodeResult.formatted.items.push({
        type: 'message_checksum',
        code: 'CHECKSUM',
        label: 'Message Checksum',
        value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
      });    
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
    
    //N12345W012345
    const position = fields[0];

    decodeResult.raw.latitude_direction = position.charAt(0);
    decodeResult.raw.latitude = Number(position.substring(1,6))/1000;
    decodeResult.raw.longitude_direction = position.charAt(6);
    decodeResult.raw.longitude = Number(position.substring(7))/1000;

    decodeResult.raw.position = {
      latitudeDirection: decodeResult.raw.latitude_direction,
      latitude: decodeResult.raw.latitude * (decodeResult.raw.latitude_direction === 'S' ? -1 : 1),
      longitudeDirection: decodeResult.raw.longitude_direction,
      longitude: decodeResult.raw.longitude * (decodeResult.raw.longitude_direction === 'W' ? -1 : 1),
    };

    let waypoints : Waypoint[];
    if(fields.length == 11) {//variant 1
      waypoints = [{name: fields[1] || '?,', time: DateTimeUtils.convertDateTimeToEpoch(fields[2], fields[10]), timeFormat: 'epoch'}, 
                   {name: fields[4] || '?', time: DateTimeUtils.convertDateTimeToEpoch(fields[5], fields[10]), timeFormat: 'epoch'}, 
                   {name: fields[6] || '?'}]
    } else {
      waypoints = [{name: fields[1] || '?,', time: DateTimeUtils.convertHHMMSSToTod(fields[2]), timeFormat: 'tod'}, 
                   {name: fields[4] || '?', time: DateTimeUtils.convertHHMMSSToTod(fields[5]), timeFormat: 'tod'}, 
                   {name: fields[6] || '?'}];
    }
    decodeResult.raw.route = {waypoints: waypoints};
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
      value: RouteUtils.routeToString(decodeResult.raw.route),
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
