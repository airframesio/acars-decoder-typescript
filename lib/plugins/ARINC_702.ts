import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Arinc702Helper } from '../utils/arinc_702_helper';
import { ResultFormatter } from '../utils/result_formatter';

// TODO: come up with a better name as this decodes multiple labels
export class Arinc702 extends DecoderPlugin {
  name = 'arinc-702';
  qualifiers() {
    return {
      labels: ['*'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    const msg = message.text.replace(/\n|\r/g, '');

    // try to decode the entire message
    let decoded = false;
    decoded = Arinc702Helper.decodeH1Message(decodeResult, msg);
    if (decoded) {
      return this.processDecodeResult(decodeResult, decoded, options, message);
    }

    // try to handle messages like `/HDQDLUA.POS<rest of message>`
    if (msg.startsWith('/')) {
      const headerData = msg.split('.');
      decoded = Arinc702Helper.decodeH1Message(
        decodeResult,
        headerData.slice(1).join('.'),
      );

      if (decoded) {
        decodeResult.remaining.text =
          headerData[0] + '.' + decodeResult.remaining.text;
        return this.processDecodeResult(
          decodeResult,
          decoded,
          options,
          message,
        );
      }
    }

    // try to handle messages like `F37AMCLL93#M1BPOS<rest of message>`
    const hashParts = msg.split('#');
    if (hashParts.length == 2) {
      // need a better way to figure this out
      const offset =
        hashParts[0] === '- ' || isNaN(parseInt(hashParts[1][1])) ? 3 : 4;
      decoded = Arinc702Helper.decodeH1Message(
        decodeResult,
        msg.slice(hashParts[0].length + offset),
      );
      if (decoded && hashParts[0].length > 0) {
        // ResultFormatter.unknown(decodeResult, hashParts[0].substring(0, 4));
        ResultFormatter.flightNumber(decodeResult, hashParts[0].substring(4));
        //ResultFormatter.unknown(decodeResult, hashParts[1].length == 5 ? hashParts[1].substring(0, 2) : hashParts[1].substring(0, 3), '#');
        // hack of the highest degree as we've parsed the rest of the message already but we want the remaining text to be in order
        decodeResult.remaining.text =
          hashParts[0].substring(0, 4) +
          '#' +
          hashParts[1].substring(0, offset - 1) +
          '/' +
          decodeResult.remaining.text;
      }
      if (decoded) {
        return this.processDecodeResult(
          decodeResult,
          decoded,
          options,
          message,
        );
      }
    }

    // try to handle messages like `M74AMC4086FTX<rest of message>`
    const slashParts = msg.split('/');
    if (slashParts[0].length > 3) {
      decoded = Arinc702Helper.decodeH1Message(
        decodeResult,
        msg.slice(slashParts[0].length - 3),
      );
      // flight number is already decoded in other fields
      decodeResult.remaining.text =
        slashParts[0].slice(0, 3) + '/' + decodeResult.remaining.text;
    }

    return this.processDecodeResult(decodeResult, decoded, options, message);
  }

  private processDecodeResult(
    decodeResult: DecodeResult,
    decoded: boolean,
    options: Options,
    message: Message,
  ) {
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
