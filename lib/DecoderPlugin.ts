import {
  DecodeResult,
  DecoderPluginInterface,
  Message,
  Options,
  Qualifiers,
} from './DecoderPluginInterface';
import { ResultFormatter } from './utils/result_formatter';
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

  /**
   * Creates a DecodeResult pre-populated with the plugin name, description, and message.
   * Replaces the common boilerplate at the start of every decode() method.
   */
  protected initResult(message: Message, description: string): DecodeResult {
    const result = this.defaultResult();
    result.decoder.name = this.name;
    result.formatted.description = description;
    result.message = message;
    return result;
  }

  /**
   * Sets the decoded flag and decodeLevel on a result.
   * If decoded is true and no explicit level is given, infers 'full' or 'partial'
   * based on whether remaining.text is set.
   */
  protected setDecodeLevel(
    result: DecodeResult,
    decoded: boolean,
    level?: 'full' | 'partial',
  ): void {
    result.decoded = decoded;
    if (decoded) {
      result.decoder.decodeLevel =
        level ?? (result.remaining.text ? 'partial' : 'full');
    } else {
      result.decoder.decodeLevel = 'none';
    }
  }

  /**
   * Logs a debug message prefixed with the plugin name, only if options.debug is true.
   */
  protected debug(options: Options, ...args: unknown[]): void {
    if (options.debug) {
      console.log(`[${this.name}]`, ...args);
    }
  }

  /**
   * Marks a result as a failed decode with 'none' level, sets the remaining text
   * as unknown, and logs a debug message. Returns the result for convenient early return.
   */
  protected failUnknown(
    result: DecodeResult,
    text: string,
    options: Options = {},
  ): DecodeResult {
    this.debug(options, `Unknown message: ${text}`);
    ResultFormatter.unknown(result, text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
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

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.remaining.text = message.text;
    return decodeResult;
  }
}
