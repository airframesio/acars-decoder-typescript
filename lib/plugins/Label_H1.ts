import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { H1Helper } from '../utils/h1_helper';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_H1 extends DecoderPlugin {
  name = 'label-h1';
  qualifiers() {
    return {
      labels: ['H1'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    const msg = message.text.replace(/\n|\r/g, '');
    const parts = msg.split('#');
    let decoded = false;
    if (msg.startsWith('/')) {
      const headerData = msg.split('.');
      const decoded = H1Helper.decodeH1Message(
        decodeResult,
        headerData.slice(1).join('.'),
      ); // skip up to # and then a little more
      if (decoded) {
        decodeResult.remaining.text =
          headerData[0] + '.' + decodeResult.remaining.text;
        decodeResult.decoded = decoded;
        decodeResult.decoder.decodeLevel = 'partial';
      }

      return decodeResult;
    } else if (parts.length === 1) {
      decoded = H1Helper.decodeH1Message(decodeResult, msg);
    } else if (parts.length == 2) {
      // need a better way to figure this out
      const offset = parts[0] === '- ' || isNaN(parseInt(parts[1][1])) ? 3 : 4;
      decoded = H1Helper.decodeH1Message(
        decodeResult,
        msg.slice(parts[0].length + offset),
      ); // skip up to # and then a little more
      if (decoded && parts[0].length > 0) {
        // ResultFormatter.unknown(decodeResult, parts[0].substring(0, 4));
        ResultFormatter.flightNumber(decodeResult, parts[0].substring(4));
        //ResultFormatter.unknown(decodeResult, parts[1].length == 5 ? parts[1].substring(0, 2) : parts[1].substring(0, 3), '#');
        // hack of the highest degree as we've parsed the rest of the message already but we want the remaining text to be in order
        decodeResult.remaining.text =
          parts[0].substring(0, 4) +
          '#' +
          parts[1].substring(0, offset - 1) +
          '/' +
          decodeResult.remaining.text;
      }
    }
    decodeResult.decoded = decoded;

    decodeResult.decoder.decodeLevel = !decodeResult.remaining.text
      ? 'full'
      : 'partial';
    if (decodeResult.formatted.items.length === 0) {
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
    return decodeResult;
  }
}
