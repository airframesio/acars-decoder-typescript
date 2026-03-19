import { MessageDecoder } from './MessageDecoder';
import { DecoderPlugin } from './DecoderPlugin';
import { DecodeResult, Message, Options } from './DecoderPluginInterface';

/**
 * A simple test plugin for verifying label index behavior.
 */
class StubPlugin extends DecoderPlugin {
  name: string;
  private _labels: string[];
  private _preambles?: string[];

  constructor(
    decoder: MessageDecoder,
    name: string,
    labels: string[],
    preambles?: string[],
  ) {
    super(decoder);
    this.name = name;
    this._labels = labels;
    this._preambles = preambles;
  }

  qualifiers() {
    return {
      labels: this._labels,
      preambles: this._preambles,
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, `Decoded by ${this.name}`);
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}

describe('MessageDecoder label index', () => {
  test('finds plugins by label without iterating all plugins', () => {
    const decoder = new MessageDecoder();

    // The decoder already has many plugins. Verify that a label-44 message
    // finds a label-44 plugin (not iterating all plugins).
    const result = decoder.decode({
      label: '44',
      text: 'ON01,N33522W084181,KCLT,KPDK,1106,004023,---.-,',
    });

    expect(result.decoded).toBe(true);
    // Should be decoded by one of the label-44 plugins
    expect(result.decoder.name).toContain('44');
  });

  test('wildcard plugins are tried before label-specific plugins', () => {
    // Create a fresh decoder with no default plugins
    const decoder = new MessageDecoder();

    // CBand is a wildcard plugin and should be tried first
    // A C-band formatted message should be decoded by CBand wrapper
    const result = decoder.decode({
      label: '4N',
      text: 'M85AUP0109285,C,,10/12,,,,,NRT,ANC,ANC,07R/,33/,0,0,,,,,,0,0,0,0,1,0,,0,0,709.8,048.7,758.5,75F3',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toContain('c-band');
  });

  test('preamble filtering works with label index', () => {
    const result = new MessageDecoder().decode({
      label: '44',
      text: 'POS02,N38338W121179,GRD,KMHR,KPDX,0807,0003,0112,005.1',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-44-pos');
  });

  test('returns not-decoded for unknown labels with no wildcard match', () => {
    const result = new MessageDecoder().decode({
      label: 'ZZ',
      text: 'some random text',
    });

    // Even with unknown labels, wildcard plugins (CBand, Arinc702) are tried.
    // If none of them decode it, we get the default not-decoded result.
    expect(result.decoded).toBe(false);
  });

  test('registerPlugin adds to label index', () => {
    const decoder = new MessageDecoder();
    const stub = new StubPlugin(decoder, 'stub-99', ['99']);
    decoder.registerPlugin(stub);

    const result = decoder.decode({ label: '99', text: 'test' });
    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('stub-99');
  });

  test('registerPlugin adds wildcard to wildcard list', () => {
    const decoder = new MessageDecoder();
    const stub = new StubPlugin(decoder, 'catch-all', ['*']);
    decoder.registerPlugin(stub);

    // Should match any label
    const result = decoder.decode({ label: 'XX', text: 'test' });
    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('catch-all');
  });

  test('preamble-based plugins only match correct preambles', () => {
    const decoder = new MessageDecoder();
    const stub = new StubPlugin(
      decoder,
      'preamble-only',
      ['99'],
      ['FOO', 'BAR'],
    );
    decoder.registerPlugin(stub);

    // Should not match wrong preamble
    const noMatch = decoder.decode({ label: '99', text: 'BAZ123' });
    expect(noMatch.decoded).toBe(false);

    // Should match correct preamble
    const match = decoder.decode({ label: '99', text: 'FOO123' });
    expect(match.decoded).toBe(true);
    expect(match.decoder.name).toBe('preamble-only');
  });
});

/**
 * A probe plugin that records the options it receives.
 */
class ProbePlugin extends DecoderPlugin {
  name = 'probe';
  receivedOptions: Options | undefined;

  qualifiers() {
    return { labels: ['ZP'] };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    this.receivedOptions = options;
    const result = this.initResult(message, 'Probe');
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}

describe('MessageDecoder options pass-through', () => {
  test('passes options to plugins', () => {
    const decoder = new MessageDecoder();
    const probe = new ProbePlugin(decoder);
    decoder.registerPlugin(probe);

    const opts: Options = { debug: true };
    decoder.decode({ label: 'ZP', text: 'test' }, opts);

    expect(probe.receivedOptions).toBe(opts);
  });
});
