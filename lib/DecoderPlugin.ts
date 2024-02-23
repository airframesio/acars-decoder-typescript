import { DecodeResult, DecoderPluginInterface, Message, Options } from './DecoderPluginInterface';

export abstract class DecoderPlugin implements DecoderPluginInterface {
  decoder!: any;

  name: string = 'unknown';

  defaultResult: DecodeResult = {
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

  options: Object;

  constructor(decoder : any, options : Options = {}) {
    this.decoder = decoder;
    this.options = options;
  }

  id() : string { // eslint-disable-line class-methods-use-this
    console.log('DecoderPlugin subclass has not overriden id() to provide a unique ID for this plugin!');
    return 'abstract_decoder_plugin';
  }

  meetsStateRequirements() : boolean { // eslint-disable-line class-methods-use-this
    return true;
  }

  // onRegister(store: Store<any>) {
  //   this.store = store;
  // }

  qualifiers() : any { // eslint-disable-line class-methods-use-this
    const labels : Array<string> = [];

    return {
      labels,
    };
  }

  decode(message: Message) : DecodeResult { // eslint-disable-line class-methods-use-this
    const decodeResult: any = this.defaultResult;
    decodeResult.remaining.text = message.text;
    return decodeResult;
  }
}

export default {};
