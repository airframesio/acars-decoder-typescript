import {
  DecodeResult,
  DecoderPluginInterface,
  Message,
  Options,
  Qualifiers,
} from './DecoderPluginInterface';
import { MessageDecoder } from './MessageDecoder';

export abstract class DecoderPlugin implements DecoderPluginInterface {
  decoder!: MessageDecoder;

  name: string = 'unknown';

  defaultResult(): DecodeResult {
    return {
      decoded: false,
      decoder: {
        name: 'unknown',
        type: 'pattern-match',
        decodeLevel: 'none',
      },
      formatted: {
        description: 'Unknown',
        items: [],
      },
      raw: {},
      remaining: {},
    };
  }

  options: object;

  constructor(decoder: MessageDecoder, options: Options = {}) {
    this.decoder = decoder;
    this.options = options;
  }

  id(): string {
    console.log(
      'DecoderPlugin subclass has not overriden id() to provide a unique ID for this plugin!',
    );
    return 'abstract_decoder_plugin';
  }

  meetsStateRequirements(): boolean {
    return true;
  }

  // onRegister(store: Store<any>) {
  //   this.store = store;
  // }

  qualifiers(): Qualifiers {
    const labels: Array<string> = [];

    return {
      labels,
    };
  }

  decode(message: Message): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.remaining.text = message.text;
    return decodeResult;
  }
}
