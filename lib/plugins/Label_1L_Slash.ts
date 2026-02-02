import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_1L_Slash extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-1l-1-line';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['1L'],
      preambles: ['+', '-'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const parts = message.text.split('/');

    if (parts.length !== 7) {
      if (options.debug) {
        console.log(`Decoder: Unknown 1L message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const data = new Map<string, string>();
    data.set('LAT', parts[0].replaceAll(' ', ''));
    data.set('LON', parts[1].replaceAll(' ', ''));
    for (let i = 2; i < parts.length; i++) {
      const part = parts[i].split(' ');
      data.set(part[0], part.slice(1).join(' '));
    }

    const position = {
      latitude: Number(data.get('LAT')),
      longitude: Number(data.get('LON')),
    }
    data.delete('LAT');
    data.delete('LON');

    ResultFormatter.position(decodeResult, position);
    const utc = data.get('UTC');
    if (utc) {
      ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(utc));
      data.delete('UTC');
    }
    const alt = data.get('ALT');
    if (alt) {
      ResultFormatter.altitude(decodeResult, Number(alt));
      data.delete('ALT');
    }
    const fob = data.get('FOB');
    if (fob) {
      ResultFormatter.currentFuel(decodeResult, Number(fob));
      data.delete('FOB');
    }
    const eta = data.get('ETA');
    if (eta) {
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(eta));
      data.delete('ETA');
    }

    let remaining = '';
    for (const [key, value] of data.entries()) {
      remaining += `/${key} ${value}`;
    }
    decodeResult.remaining.text = remaining;

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}
