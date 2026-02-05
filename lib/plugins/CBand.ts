import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { MIAMCoreUtils } from '../utils/miam';
import { ResultFormatter } from '../utils/result_formatter';

export class CBand extends DecoderPlugin {
  name = 'c-band';
  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['*'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    // C-Band puts a 10 char header in front of some message types
    // First 4 chars are some kind of message number
    // Last 6 chars are the flight number
    let cband = message.text.match(/^(?<msgno>[A-Z]\d{2}[A-Z])(?<airline>[A-Z0-9]{2})(?<number>[0-9]{4})/);
    if (cband?.groups) {
        const messageText = message.text.substring(10);
        const decoded = this.decoder.decode({
          label: message.label,
          sublabel: message.sublabel,
          text: messageText,
        }, options);
        if(decoded.decoded) {
          ResultFormatter.flightNumber(decodeResult, cband.groups.airline + Number(cband.groups.number));
          decodeResult.decoded = true;
          decodeResult.decoder.decodeLevel = decoded.decoder.decodeLevel;
          decodeResult.decoder.name = this.name + '-' + decoded.decoder.name;
          decodeResult.raw = {...decodeResult.raw, ...decoded.raw };
          decodeResult.formatted.description = decoded.formatted.description;
          decodeResult.formatted.items.push(...decoded.formatted.items);
          decodeResult.remaining = decoded.remaining;
        }
    }
    return decodeResult;
  }
}
