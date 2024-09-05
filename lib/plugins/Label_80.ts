import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';

// Airline Defined
// 3N01 POSRPT
export class Label_80 extends DecoderPlugin {
  name = 'label-80';

  descriptions: any = {
    ALT: 'Altitude',
    DWND: 'Wind Direction',
    ETA: 'Estimated Time of Arrival',
    FOB: 'Fuel on Board',
    FL: 'Flight Level',
    HDG: 'Heading',
    MCH: 'Aircraft Speed',
    NWYP: 'Next Waypoint',
    POS: 'Aircraft Position',
    SAT: 'Static Air Temperature',
    SWND: 'Wind Speed',
    TAS: 'True Airspeed',
    WYP: 'Waypoint',
  }

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['80'],
      preambles: ['3N01 POSRPT'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;

    decodeResult.formatted.description = 'Airline Defined Position Report';

    const parts = message.text.split('\n');

    let posRptRegex = /^3N01 POSRPT \d\d\d\d\/\d\d (?<orig>\w+)\/(?<dest>\w+) \.(?<tail>[\w-]+)(\/(?<agate>.+) (?<sta>\w+:\w+))*/; // eslint-disable-line max-len
    let results = parts[0].match(posRptRegex);
    if (results && results.length > 0) {
      decodeResult.raw.origin = results.groups.orig;
      decodeResult.formatted.items.push({
        type: 'origin',
        code: 'ORG',
        label: 'Origin',
        value: `${results.groups.orig}`,
      });

      decodeResult.raw.destination = results.groups.dest;
      decodeResult.formatted.items.push({
        type: 'destination',
        code: 'DST',
        label: 'Destination',
        value: `${results.groups.dest}`,
      });

      decodeResult.raw.tail = results.groups.tail;
      decodeResult.formatted.items.push({
        type: 'tail',
        label: 'Tail',
        value: `${results.groups.tail}`,
      });

      if (results.groups.agate) {
        decodeResult.raw.arrival_gate = results.groups.agate;
        decodeResult.formatted.items.push({
          type: 'arrival_gate',
          code: 'ARG',
          label: 'Arrival Gate',
          value: `${results.groups.agate}`,
        });

        decodeResult.raw.scheduled_time_of_arrival = results.groups.sta
        decodeResult.formatted.items.push({
          type: 'scheduled_time_of_arrival',
          code: 'STA',
          label: 'Scheduled Time of Arrival',
          value: `${results.groups.sta}`,
        });
      }

      posRptRegex = /\/(?<field>\w+)\s(?<value>[\w\+\-:\.]+)\s*/gi; // eslint-disable-line no-useless-escape
      // console.log('Regex:', posRptRegex);
      const remainingParts = parts.slice(1);
      // console.log("Remaining Parts:", remainingParts);

      for (const part of remainingParts) { // eslint-disable-line no-restricted-syntax
        // console.log('Part:', part);
        const matches = part.matchAll(posRptRegex);
        // console.log('Matches:', matches);
        for (const match of matches) { // eslint-disable-line no-restricted-syntax
          // console.log('Match:', match);
          switch (match.groups.field) {
            case 'ALT': {
              decodeResult.raw.altitude = match.groups.value;
              decodeResult.formatted.items.push({
                type: 'altitude',
                code: 'ALT',
                label: this.descriptions[match.groups.field],
                value: `${decodeResult.raw.altitude} feet`,
              });
              break;
            }
            case 'DWND': {
              decodeResult.raw.wind_direction = Number(match.groups.value);
              decodeResult.formatted.items.push({
                type: 'wind_direction',
                code: 'DWND',
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.wind_direction,
              });
              break;
            }
            case 'FL': {
              decodeResult.raw.flight_level = match.groups.value;
              decodeResult.formatted.items.push({
                type: 'flight_level',
                code: 'FL',
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.flight_level,
              });
              break;
            }
            case 'FOB': {
              decodeResult.raw.fuel_on_board = match.groups.value;
              decodeResult.formatted.items.push({
                type: 'fuel_on_board',
                code: 'FOB',
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.fuel_on_board,
              });
              break;
            }
            case 'HDG': {
              decodeResult.raw.heading = Number(match.groups.value);
              decodeResult.formatted.items.push({
                type: 'heading',
                code: 'HDG',
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.heading,
              });
              break;
            }
            case 'MCH': {
              decodeResult.raw.mach = match.groups.value / 1000;
              decodeResult.formatted.items.push({
                type: 'mach',
                code: 'MCH',
                label: this.descriptions[match.groups.field],
                value: `${decodeResult.raw.mach} Mach`,
              });
              break;
            }
            case 'NWYP': {
              decodeResult.raw.next_waypoint = match.groups.value;
              decodeResult.formatted.items.push({
                type: 'next_waypoint',
                code: 'NWYP',
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.next_waypoint,
              });
              break;
            }
            case 'POS': {
	      // don't use decodeStringCoordinates because of different position format
	      const posRegex = /^(?<latd>[NS])(?<lat>.+)(?<lngd>[EW])(?<lng>.+)/;
              const posResult = match.groups.value.match(posRegex);
              const lat = Number(posResult.groups.lat) * (posResult.groups.lngd === 'S' ? -1 : 1);
              const lon = Number(posResult.groups.lng) * (posResult.groups.lngd === 'W' ? -1 : 1);
              const latitude = Number.isInteger(lat) ? lat/1000 : lat/100;
              const longitude = Number.isInteger(lon) ? lon/1000 : lon/100;
              decodeResult.raw.position = {
                latitude: latitude,
                longitude: longitude,
              };
              decodeResult.formatted.items.push({
               type: 'position',
               code: 'POS' ,
               label: 'Position',
               value: CoordinateUtils.coordinateString(decodeResult.raw.position),
              });
              break;
            }
            case 'SWND': {
              decodeResult.raw.wind_speed = Number(match.groups.value);
              decodeResult.formatted.items.push({
                type: 'wind_speed',
                code: 'SWND',
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.wind_speed,
              });
              break;
            }
            default: {
              if (match.groups.field != undefined) {
                const description = this.descriptions[match.groups.field] ? this.descriptions[match.groups.field] : 'Unknown';
                decodeResult.formatted.items.push({
                  type: match.groups.field,
                  code: match.groups.field,
                  label: description || `Unknown (${match.groups.field})`,
                  value: `${match.groups.value}`,
                });
              }
            }
          }
        }
      }

      decodeResult.decoded = true;
      decodeResult.decodeLevel = 'partial';
    }

    return decodeResult;
  }
}

export default {};
