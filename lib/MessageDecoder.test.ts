import { DecoderPlugin } from './DecoderPlugin';
import { MessageDecoder } from './MessageDecoder';
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

/**
 * A simple fake plugin for testing purposes.
 */
class FakePlugin extends DecoderPlugin {
  name = 'fake-plugin';

  constructor(labels: string[], decoder?: MessageDecoder) {
    super(decoder ?? ({} as MessageDecoder));
    this.testLabels = labels;
  }

  testLabels: string[];

  callCount = 0;

  qualifiers() {
    return {
      labels: this.testLabels,
    };
  }

  decode(message: Message): DecodeResult {
    this.callCount += 1;
    const result = this.defaultResult();
    result.decoder.name = this.name;
    result.message = message;
    result.formatted.description = 'fake';
    result.formatted.items.push({
      type: 'fake',
      code: 'FAKE',
      label: 'Fake',
      value: 'x',
    });
    return result;
  }
}

/**
 * Tests for the MessageDecoder class.
 */
describe('MessageDecoder', () => {
  let decoder: MessageDecoder;

  beforeEach(() => {
    decoder = new MessageDecoder();
  });

  test('MIAM core seamless decode', () => {
    const message = {
      label: 'MA',
      text: "T02!<<,:/k.E`;FOV@!'s.16q6R+p(RK,|D2ujNJhRah?_qrNftWiI-V,@*RQs,tn,FYN$/V1!gNIc6CO;$D,1:.4?dF952;>XP$\"B\"Ok-Fr'0^k?rP]3&UGoPX;\\<F`1mQ_(5_Z\\J01]+t9T9eu6ecjOlC7.H):6MAR4XuqGajJRp&=T3T7j1ipU;'tGF-f0nNn,XY\\/!!G&F*18E3l:kWakhBW\"b31<%oM6)jcY9:;p2\\5E'k3Yr1,d",
    };

    const decodeResult = decoder.decode(message);

    expect(decodeResult.decoded).toBe(true);
    if (!decodeResult.message) {
      expect(decodeResult.message).toBeDefined();
      return;
    }
    expect(decodeResult.message.label).toBe('MA');
    expect(decodeResult.message.sublabel).toBeUndefined();
    expect(decodeResult.message.text).toContain('T02!<<,');
    expect(decodeResult.raw.text).toContain('A350,000354');
  });

  test('C-band core seamless decode', () => {
    const message = {
      label: '4N',
      text: 'M85AUP0109285,C,,10/12,,,,,NRT,ANC,ANC,07R/,33/,0,0,,,,,,0,0,0,0,1,0,,0,0,709.8,048.7,758.5,75F3',
    };

    const decodeResult = decoder.decode(message);

    expect(decodeResult.decoded).toBe(true);
    if (!decodeResult.message) {
      expect(decodeResult.message).toBeDefined();
      return;
    }
    expect(decodeResult.message.label).toBe('4N');
    expect(decodeResult.message.sublabel).toBeUndefined();
    expect(decodeResult.message.text).toContain('M85AUP0109285');
    expect(decodeResult.formatted.items.length).toBe(7);
  });

  test('Handles Multiple decodes', () => {
    const message = {
      label: 'H1',
      text: 'POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40',
    };

    decoder.decode(message);

    const decodeResult = decoder.decode(message);
    if (!decodeResult.message) {
      expect(decodeResult.message).toBeDefined();
      return;
    }
    expect(decodeResult.message.label).toBe('H1');
    expect(decodeResult.formatted.items.length).toBe(5);
  });

  test('preserves default fallback result when no plugin decodes', () => {
    const message = {
      label: '44',
      text: 'GARBAGE TEXT THAT SHOULD NOT MATCH',
    };

    const decodeResult = decoder.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.error).toBe('No known decoder plugin for this message');
    expect(decodeResult.decoder).toEqual({
      name: 'none',
      type: 'none',
      decodeLevel: 'none',
    });
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.remaining).toEqual({
      text: message.text,
    });
    expect(decodeResult.raw).toEqual({});
    expect(decodeResult.formatted).toEqual({
      description: 'Not Decoded',
      items: [],
    });
  });

  describe('deduplication', () => {
    describe('#537 — registerPlugin double-registers a specific-then-wildcard plugin', () => {
      it('registers a plugin listing a specific label before * exactly once', () => {
        const decoder = new MessageDecoder();
        const plugin = new FakePlugin(['LABEL_X', '*']);
        decoder.registerPlugin(plugin);
        const message = { label: 'LABEL_X', text: 'anything' };
        decoder.decode(message);
        expect(plugin.callCount).toBe(1);
      });

      it('registers a plugin listing * before a specific label exactly once', () => {
        const decoder = new MessageDecoder();
        const plugin = new FakePlugin(['*', 'LABEL_X']);
        decoder.registerPlugin(plugin);
        const message = { label: 'LABEL_X', text: 'anything' };
        decoder.decode(message);
        expect(plugin.callCount).toBe(1);
      });

      it('holds the entry once in the LABEL_X bucket', () => {
        const decoder = new MessageDecoder();
        const plugin = new FakePlugin(['LABEL_X', '*']);
        decoder.registerPlugin(plugin);
        const bucket = (
          decoder as unknown as {
            candidatesByLabel: Map<string, { plugin: unknown }[]>;
          }
        ).candidatesByLabel.get('LABEL_X');
        expect(bucket?.filter((e) => e.plugin === plugin)).toHaveLength(1);
      });

      it('still matches the wildcard for messages of other labels', () => {
        const decoder = new MessageDecoder();
        const plugin = new FakePlugin(['LABEL_X', '*']);
        decoder.registerPlugin(plugin);
        decoder.decode({ label: 'LABEL_Y', text: 'anything' });
        expect(plugin.callCount).toBe(1);
      });
    });
  });

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

    test('wildcard registration order is preserved across existing label buckets', () => {
      // Regression test: when a wildcard plugin is registered AFTER a label
      // bucket has already been created, it must be inserted at the end of
      // the wildcard section, not at the front. Otherwise later-registered
      // wildcards would incorrectly take precedence over earlier ones for
      // labels that already had buckets, and wildcard order would diverge
      // from buckets created later (which seed from wildcardEntries.slice()).
      const decoder = new MessageDecoder();

      // 1. Register a label-specific plugin for '99' — this creates a
      //    bucket with no wildcards yet (existing wildcards from the
      //    constructor are in, but that's fine; we only care about the
      //    relative order of stubs registered here).
      const labelSpecific = new StubPlugin(decoder, 'label-99-specific', [
        '99',
      ]);
      decoder.registerPlugin(labelSpecific);

      // 2. Register two new wildcard stubs in order.
      const firstWildcard = new StubPlugin(decoder, 'wild-first', ['*']);
      decoder.registerPlugin(firstWildcard);
      const secondWildcard = new StubPlugin(decoder, 'wild-second', ['*']);
      decoder.registerPlugin(secondWildcard);

      // 3. For a label-99 message, the first-registered wildcard must run
      //    before the second-registered wildcard. Since both succeed, the
      //    decoder.name tells us which one won the race.
      const result = decoder.decode({ label: '99', text: 'anything' });
      expect(result.decoded).toBe(true);
      expect(result.decoder.name).toBe('wild-first');

      // 4. The same ordering must hold for a brand-new label that didn't
      //    have a bucket yet (it gets seeded from wildcardEntries.slice()).
      const newLabel = decoder.decode({ label: 'ZZ', text: 'anything' });
      expect(newLabel.decoder.name).toBe('wild-first');
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

  describe('options pass-through', () => {
    test('passes options to plugins', () => {
      const decoder = new MessageDecoder();
      const probe = new ProbePlugin(decoder);
      decoder.registerPlugin(probe);

      const opts: Options = { debug: true };
      decoder.decode({ label: 'ZP', text: 'test' }, opts);

      expect(probe.receivedOptions).toBe(opts);
    });
  });
});
