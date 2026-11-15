import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_33 extends DecoderPlugin {
  name = 'label-33';

  qualifiers() {
    return {
      labels: ['33'],
      preambles: [''],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Airline Defined Report';
    decodeResult.message = message;

    const parts = message.text.split(',');
    const type = parts[0];
    if (type === '4' && parts.length == 18) {
      ResultFormatter.unknown(decodeResult, parts[1]);
      ResultFormatter.unknown(decodeResult, parts[2]);
      ResultFormatter.departureAirport(decodeResult, parts[3], 'IATA');
      ResultFormatter.arrivalAirport(decodeResult, parts[4], 'IATA');
      ResultFormatter.arrivalRunway(decodeResult, parts[5]);
      ResultFormatter.unknownArr(decodeResult, parts.slice(6));
    } else if (type === '33' && parts.length == 20) {
      ResultFormatter.unknown(decodeResult, parts[1]);
      ResultFormatter.departureAirport(decodeResult, parts[2], 'IATA');
      ResultFormatter.arrivalAirport(decodeResult, parts[3], 'IATA');
      ResultFormatter.arrivalRunway(decodeResult, parts[4]);
      ResultFormatter.unknownArr(decodeResult, parts.slice(5));
    } else if (type === '96' && parts.length == 23) {
      ResultFormatter.unknown(decodeResult, parts[1]);
      ResultFormatter.position(decodeResult, {
        latitude: parseFloat(parts[2]),
        longitude: parseFloat(parts[3]),
      });
      ResultFormatter.altitude(decodeResult, parseInt(parts[4]));
      ResultFormatter.unknown(decodeResult, parts[5]);
      ResultFormatter.departureAirport(decodeResult, parts[6]);
      ResultFormatter.arrivalAirport(decodeResult, parts[7]);
      ResultFormatter.arrivalRunway(decodeResult, parts[8]);
      ResultFormatter.alternateRunway(decodeResult, parts[9]); // backup arrival runway
      ResultFormatter.unknownArr(decodeResult, parts.slice(10));
    } else if (type === '182' && parts.length == 20) {
      ResultFormatter.unknown(decodeResult, parts[1]);
      ResultFormatter.departureAirport(decodeResult, parts[2]);
      ResultFormatter.arrivalAirport(decodeResult, parts[3]);
      ResultFormatter.alternateAirport(decodeResult, parts[4]);
      const rwy = parts[5].split('/');
      ResultFormatter.arrivalRunway(decodeResult, rwy[0]);
      if (rwy[1]) {
        ResultFormatter.unknown(decodeResult, rwy[1], '/');
      }
      const alt = parts[6].split('/');
      ResultFormatter.alternateRunway(decodeResult, alt[0]);
      if (alt[1]) {
        ResultFormatter.unknown(decodeResult, alt[1], '/');
      }
      ResultFormatter.unknownArr(decodeResult, parts.slice(7));
    } else if (type === 'LDR01' && parts.length == 28) {
      ResultFormatter.departureAirport(decodeResult, parts[4]);
      ResultFormatter.arrivalAirport(decodeResult, parts[5]);
      const rwy = parts[6].split('/');
      ResultFormatter.arrivalRunway(decodeResult, rwy[0]);
      if (rwy[1]) {
        ResultFormatter.unknown(decodeResult, rwy[1], '/');
      }
      const alt = parts[7].split('/');
      ResultFormatter.alternateRunway(decodeResult, alt[0]);
      if (alt[1]) {
        ResultFormatter.unknown(decodeResult, alt[1], '/');
      }
      ResultFormatter.unknownArr(decodeResult, parts.slice(8));
    } else if (type === 'P' && parts.length == 29) {
      ResultFormatter.unknown(decodeResult, parts[1]);
      ResultFormatter.timestamp(decodeResult, Date.parse(parts[2]) / 1000);
      ResultFormatter.unknown(decodeResult, parts[3]);
      ResultFormatter.unknown(decodeResult, parts[4]);
      ResultFormatter.unknown(decodeResult, parts[5]);

      ResultFormatter.departureAirport(decodeResult, parts[6]);
      ResultFormatter.arrivalAirport(decodeResult, parts[7]);
      ResultFormatter.unknownArr(decodeResult, parts.slice(8));
    } else {
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}
