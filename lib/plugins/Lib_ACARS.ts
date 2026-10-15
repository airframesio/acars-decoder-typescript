import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Decoder plugin for handling messages processed by libacars
 *
 * Specifically L-band or C-band messages
 * using clients like `jaero` and `iridium-toolkit`
 */
export class LibAcars extends DecoderPlugin {
  name = 'libacars';
  qualifiers() {
    return {
      labels: ['*'],
      preambles: ['- '],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const text = message.text;

    const prefix = message.text.slice(0, 5); // TODO extract meaning. ignoring for now

    const decoded = this.decoder.decode(
      {
        label: message.label,
        sublabel: message.sublabel,
        text: text.replaceAll(prefix, ''), // Remove the prefix before decoding
      },
      options,
    );

    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    if (decoded.decoded) {
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = decoded.decoder.decodeLevel;
      decodeResult.decoder.name = this.name + '-' + decoded.decoder.name;
      decodeResult.raw = { ...decodeResult.raw, ...decoded.raw };
      decodeResult.formatted.description = decoded.formatted.description;
      decodeResult.formatted.items.push(...decoded.formatted.items);
      decodeResult.remaining = decoded.remaining;
    }
    return decodeResult;
  }
}
