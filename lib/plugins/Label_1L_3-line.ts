import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_1L_3Line extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-1l-3-line';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['1L'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const lines = message.text.split('\r\n');
    if (lines.length !== 3) {
      if (options.debug) {
        console.log(`Decoder: Unknown 1L message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }
    const parts = message.text.replaceAll('\r\n', '/').split('/');
    const data = new Map<string, string>();
    data.set('', parts[0]);
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].split(' ');
      data.set(part[0], part.slice(1).join(' '));
    }

    const dep = data.get('DEP');
    if (dep) {
      ResultFormatter.departureAirport(decodeResult, dep);
      data.delete('DEP');
    }
    const des = data.get('DES');
    if (des) {
      ResultFormatter.arrivalAirport(decodeResult, des);
      data.delete('DES');
    }
    const eta = data.get('ETA');
    if (eta) {
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(eta + '00'));
      data.delete('ETA');
    }
    const alt = data.get('ALT');
    if (alt) {
      ResultFormatter.altitude(decodeResult, Number(alt));
      data.delete('ALT');
    }
    const fn = data.get('FN');
    if (fn) {
      ResultFormatter.flightNumber(decodeResult, fn);
      data.delete('FN');
    }
    const day = data.get('DAY');
    const utc = data.get('UTC');
    if (day && utc) {
      decodeResult.raw.message_timestamp = (Date.parse(day) / 1000) + DateTimeUtils.convertHHMMSSToTod(utc);
      data.delete('DAY');
      data.delete('UTC');
    }

    const lat = data.get('LAT');
    const lon = data.get('LON');
    if (lat && lon) {
      const position = {
        latitude: CoordinateUtils.getDirection(lat[0]) * Number(lat.substring(1)),
        longitude: CoordinateUtils.getDirection(lon[0]) * Number(lon.substring(1)),
      }
      if(!isNaN(position.latitude) && !isNaN(position.longitude)) {
        ResultFormatter.position(decodeResult, position);
      }
      data.delete('LAT');
      data.delete('LON');
    }

    let remaining = '';
    for (const [key, value] of data.entries()) {
      if (key === '') {
        remaining += value;
      } else {
        remaining += `/${key} ${value}`;
      }
    }
    decodeResult.remaining.text = remaining;

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};