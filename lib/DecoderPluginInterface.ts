/**
 * Representation of a Message
 */
export interface Message {
  label: string,
  sublabel?: string,
  text: string,
}

/**
 * Decoder Options
 */
export interface Options {
  debug?:boolean,
}

/**
 * Results from decoding a message
 */
export interface DecodeResult {
  decoded: boolean;
  decoder: {
      name: string,
      type:  'pattern-match' | 'none',
      decodeLevel: 'none' | 'partial' | 'full',
  },
  error?: string,
  formatted: {
      description: string,
      items: {
          type: string,
          code: string,
          label: string,
          value: string,
      }[]
  },
  message?: Message,
  raw: any,
  remaining: {
      text?: string
  }
}

export interface DecoderPluginInterface {
  decode(message: Message) : DecodeResult;
  meetsStateRequirements() : boolean;
  // onRegister(store: Store<any>) : void;
  qualifiers() : {labels: string[], preambles?: string[]};
}
