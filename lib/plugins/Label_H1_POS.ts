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

    // Style: POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40
    let variant1Regex = /^POS(?<lat>[NS])(?<lat_coord>[0-9]+)(?<long>[EW])(?<long_coord>[0-9]+),(?<waypoint1>[a-zA-Z0-9]*),(?<unknown1>[0-9]*),(?<unknown2>[0-9]*),(?<waypoint2>[a-zA-Z0-9]*),(?<unknown3>[0-9]*),(?<waypoint3>[a-zA-Z0-9]*).(?<unknown4>M[a-zA-Z0-9]*),(?<unknown5>[0-9]*),(?<unknown6>[0-9]*)\/TS(?<timestamp>[0-9][0-9][0-9][0-9][0-9][0-9]),(?<date>[0-9][0-9][0-9][0-9][0-9][0-9])(?<unknown7>.*)$/;

    // Style: POSN45209W122550,PEGTY,220309,134,MINNE,220424,HISKU,M6,060013,269,366,355K,292K,730A5B
    let variant2Regex = /^POS(?<lat>[NS])(?<lat_coord>[0-9]+)(?<long>[EW])(?<long_coord>[0-9]+),(?<waypoint1>[a-zA-Z0-9]*),(?<unknown1>[0-9]*),(?<unknown2>[0-9]*),(?<waypoint2>[a-zA-Z0-9]*),(?<unknown3>[0-9]*),(?<waypoint3>[a-zA-Z0-9]*).(?<unknown4>M[a-zA-Z0-9]*),(?<unknown5>[0-9]*),(?<unknown6>[0-9]*),(?<unknown7>[0-9]*),(?<unknown8>[a-zA-Z0-9]*),(?<unknown9>[a-zA-Z0-9]*),(?<unknown10>[a-zA-Z0-9]*)$/;

    // Style: POSN33225W079428,SCOOB,232933,340,ENEME,235712,FETAL,M42,003051,15857F6
    let variant4Regex = /^POS(?<lat>[NS])(?<lat_coord>[0-9]+)(?<long>[EW])(?<long_coord>[0-9]+),(?<waypoint1>[a-zA-Z0-9]*),(?<unknown1>[0-9]*),(?<unknown2>[0-9]*),(?<waypoint2>[a-zA-Z0-9]*),(?<unknown3>[0-9]*),(?<waypoint3>[a-zA-Z0-9]*).(?<unknown4>M[a-zA-Z0-9]*),(?<unknown5>[0-9]*),(?<unknown6>[a-zfA-Z0-9]*)$/;

    let results;
    if (results = message.text.match(variant1Regex)) {

      decodeResult = this.decodePositionRoute(decodeResult, results, options);

      decodeResult.formatted.items.push({
        type: 'aircraft_timestamp',
        code: 'TIMESTAMP',
        label: 'Aircraft Timestamp',
        value: DateTimeUtils.UTCDateTimeToString(results.groups.date, results.groups.timestamp),
      });

      decodeResult.remaining.text = `${results.groups.unknown1},${results.groups.unknown2},${results.groups.unknown3},${results.groups.unknown4},${results.groups.unknown5},${results.groups.unknown6},${results.groups.unknown7}`;

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';

    } else if (results = message.text.match(variant2Regex)) {

      decodeResult = this.decodePositionRoute(decodeResult, results, options);

      decodeResult.remaining.text = `${results.groups.unknown1},${results.groups.unknown2},${results.groups.unknown3},${results.groups.unknown4},${results.groups.unknown5},${results.groups.unknown6},${results.groups.unknown7},${results.groups.unknown8},${results.groups.unknown9},${results.groups.unknown10}`;

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';

    } else if (results = message.text.match(variant4Regex)) {

      decodeResult = this.decodePositionRoute(decodeResult, results, options);

      decodeResult.remaining.text = `${results.groups.unknown1},${results.groups.unknown2},${results.groups.unknown3},${results.groups.unknown4},${results.groups.unknown5},${results.groups.unknown6}`;

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';

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

  private decodePositionRoute(decodeResult: any, results: any, options: any) {
    if (options.debug) {
      console.log(`Label 16 N : results`);
      console.log(results);
    }

    decodeResult.raw.latitude_direction = results.groups.lat;
    decodeResult.raw.latitude = Number(results.groups.lat_coord)/1000;
    decodeResult.raw.longitude_direction = results.groups.long;
    decodeResult.raw.longitude = Number(results.groups.long_coord)/1000;

    decodeResult.raw.position = {
      latitudeDirection: decodeResult.raw.latitude_direction,
      latitude: decodeResult.raw.latitude * (decodeResult.raw.latitude_direction === 'S' ? -1 : 1),
      longitudeDirection: decodeResult.raw.longitude_direction,
      longitude: decodeResult.raw.longitude * (decodeResult.raw.longitude_direction === 'W' ? -1 : 1),
    };

    decodeResult.raw.route = [results.groups.waypoint1 || '?', results.groups.waypoint2 || '?', results.groups.waypoint3 || '?'];

    decodeResult.formatted.items.push({
      type: 'aircraft_position',
      code: 'POS',
      label: 'Aircraft Position',
      value: `${decodeResult.raw.latitude} ${decodeResult.raw.latitude_direction}, ${decodeResult.raw.longitude} ${decodeResult.raw.longitude_direction}`,
    });

    decodeResult.formatted.items.push({
      type: 'aircraft_route',
      code: 'ROUTE',
      label: 'Aircraft Route',
      value: `${decodeResult.raw.route.join(' > ')}`,
    });

    return decodeResult;
  }
}

export default {};
