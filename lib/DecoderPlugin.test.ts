import { DecoderPlugin } from './DecoderPlugin';
import { DecodeResult, Message, Options } from './DecoderPluginInterface';
import { MessageDecoder } from './MessageDecoder';

/**
 * Concrete test subclass to exercise protected helpers.
 */
class TestPlugin extends DecoderPlugin {
  name = 'test-plugin';

  qualifiers() {
    return { labels: ['99'] };
  }

  // Expose protected helpers for testing
  public testInitResult(message: Message, description: string): DecodeResult {
    return this.initResult(message, description);
  }

  public testSetDecodeLevel(
    result: DecodeResult,
    decoded: boolean,
    level?: 'full' | 'partial',
  ): void {
    this.setDecodeLevel(result, decoded, level);
  }

  public testDebug(options: Options, ...args: unknown[]): void {
    this.debug(options, ...args);
  }

  public testFailUnknown(
    result: DecodeResult,
    text: string,
    options?: Options,
  ): DecodeResult {
    return this.failUnknown(result, text, options);
  }
}

describe('DecoderPlugin base class helpers', () => {
  let plugin: TestPlugin;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new TestPlugin(decoder);
  });

  describe('initResult', () => {
    test('populates decoder name, description, and message', () => {
      const message: Message = { label: '99', text: 'hello world' };
      const result = plugin.testInitResult(message, 'Test Description');

      expect(result.decoder.name).toBe('test-plugin');
      expect(result.formatted.description).toBe('Test Description');
      expect(result.message).toBe(message);
      expect(result.decoded).toBe(false);
      expect(result.decoder.type).toBe('pattern-match');
      expect(result.decoder.decodeLevel).toBe('none');
      expect(result.formatted.items).toEqual([]);
      expect(result.raw).toEqual({});
      expect(result.remaining).toEqual({});
    });
  });

  describe('setDecodeLevel', () => {
    test('sets decoded true with explicit full level', () => {
      const result = plugin.testInitResult({ label: '99', text: '' }, 'Test');
      plugin.testSetDecodeLevel(result, true, 'full');

      expect(result.decoded).toBe(true);
      expect(result.decoder.decodeLevel).toBe('full');
    });

    test('sets decoded true with explicit partial level', () => {
      const result = plugin.testInitResult({ label: '99', text: '' }, 'Test');
      plugin.testSetDecodeLevel(result, true, 'partial');

      expect(result.decoded).toBe(true);
      expect(result.decoder.decodeLevel).toBe('partial');
    });

    test('infers full when no remaining text and no explicit level', () => {
      const result = plugin.testInitResult({ label: '99', text: '' }, 'Test');
      // No remaining.text set
      plugin.testSetDecodeLevel(result, true);

      expect(result.decoded).toBe(true);
      expect(result.decoder.decodeLevel).toBe('full');
    });

    test('infers partial when remaining text exists and no explicit level', () => {
      const result = plugin.testInitResult({ label: '99', text: '' }, 'Test');
      result.remaining.text = 'some unparsed data';
      plugin.testSetDecodeLevel(result, true);

      expect(result.decoded).toBe(true);
      expect(result.decoder.decodeLevel).toBe('partial');
    });

    test('sets none when decoded is false', () => {
      const result = plugin.testInitResult({ label: '99', text: '' }, 'Test');
      plugin.testSetDecodeLevel(result, false);

      expect(result.decoded).toBe(false);
      expect(result.decoder.decodeLevel).toBe('none');
    });

    test('sets none when decoded is false even with explicit level', () => {
      const result = plugin.testInitResult({ label: '99', text: '' }, 'Test');
      // The level argument is ignored when decoded is false
      plugin.testSetDecodeLevel(result, false, 'full');

      expect(result.decoded).toBe(false);
      expect(result.decoder.decodeLevel).toBe('none');
    });
  });

  describe('debug', () => {
    test('logs when options.debug is true', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      plugin.testDebug({ debug: true }, 'test message', 42);

      expect(spy).toHaveBeenCalledWith('[test-plugin]', 'test message', 42);
      spy.mockRestore();
    });

    test('does not log when options.debug is false', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      plugin.testDebug({ debug: false }, 'test message');

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test('does not log when options.debug is undefined', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      plugin.testDebug({}, 'test message');

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('failUnknown', () => {
    test('marks result as failed and sets remaining text', () => {
      const result = plugin.testInitResult(
        { label: '99', text: 'bad data' },
        'Test',
      );
      const returned = plugin.testFailUnknown(result, 'bad data');

      expect(returned).toBe(result);
      expect(returned.decoded).toBe(false);
      expect(returned.decoder.decodeLevel).toBe('none');
      expect(returned.remaining.text).toBe('bad data');
    });

    test('logs debug message when options.debug is true', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const result = plugin.testInitResult(
        { label: '99', text: 'bad' },
        'Test',
      );
      plugin.testFailUnknown(result, 'bad', { debug: true });

      expect(spy).toHaveBeenCalledWith('[test-plugin]', 'Unknown message: bad');
      spy.mockRestore();
    });

    test('does not log when options.debug is false', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const result = plugin.testInitResult(
        { label: '99', text: 'bad' },
        'Test',
      );
      plugin.testFailUnknown(result, 'bad', { debug: false });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
