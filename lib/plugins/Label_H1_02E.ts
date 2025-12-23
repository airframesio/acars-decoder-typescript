import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Wind } from '../types/wind';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_H1_02E extends DecoderPlugin {
  name = 'label-h1-02e';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['02E'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Weather Report';
    decodeResult.message = message;

    const parts = message.text.split(' ');

    if(parts[parts.length-1] !== 'Q') {
      // not a valid message
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const windData: Wind[] = [];
    decodeResult.remaining.text = '';

    const header = parts[0];
    // header.substring(0,3) is '02E'
    ResultFormatter.day(decodeResult, parseInt(header.substring(3,5)));
    ResultFormatter.departureAirport(decodeResult, header.substring(5,9));
    ResultFormatter.arrivalAirport(decodeResult, header.substring(9,13));
    const firstWind = this.parseWeatherReport(header.substring(13));
    if(firstWind) {
      windData.push(firstWind);
    } else {
      decodeResult.remaining.text += (decodeResult.remaining.text ? ' ' : '') + header.substring(13);
    }

    for(let i=1; i<parts.length-1; i++) {
      const part = parts[i];
      if(part[0] !== 'Q') {
        decodeResult.remaining.text += (decodeResult.remaining.text ? ' ' : '') + part;
        continue;
      }
      const wind = this.parseWeatherReport(part.substring(1));
      if(wind) {
        windData.push(wind);
      } else {
        decodeResult.remaining.text += (decodeResult.remaining.text ? ' ' : '') + part;
      }
    }



    ResultFormatter.windData(decodeResult, windData);
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = decodeResult.remaining.text.length === 0 ? 'full' : 'partial';
    return decodeResult;
  }

 private parseWeatherReport(text: string): Wind | null {
  const posString = text.substring(0,13);
  const pos = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(posString);
  if (text.length !== 32 || !pos) {
    return null;
  }
  const tod = DateTimeUtils.convertHHMMSSToTod(text.substring(13,17));
  const flightLevel = parseInt(text.substring(17,20), 10);
  // const altitude = parseInt(text.substring(17,21), 10) * 10; // use FL instead
  const tempSign = text[21] === 'M' ? -1 : 1;
  const tempDegreesRaw = parseInt(text.substring(22,25), 10);
  const tempDegrees = tempSign * (tempDegreesRaw / 10);
  const windDirection = parseInt(text.substring(25,28), 10);
  const windSpeed = parseInt(text.substring(28,31), 10);
  // G?
  if(text[31] !== 'G') {
    return null;
  }
  return {
    waypoint: {
      name: posString,
      latitude: pos.latitude,
      longitude: pos.longitude,
      time: tod,
      timeFormat: 'tod',
    },
    flightLevel: flightLevel,
    windDirection: windDirection,
    windSpeed: windSpeed,
    temperature: {
      flightLevel: flightLevel,
      degreesC: tempDegrees,
    },
  };
}
}
export default {};
