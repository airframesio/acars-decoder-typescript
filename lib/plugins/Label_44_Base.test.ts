import { MessageDecoder } from '../MessageDecoder';
import { DecodeResult, Options } from '../DecoderPluginInterface';
import { Label_44_Base } from './Label_44_Base';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Concrete test subclass of Label_44_Base for testing the shared logic.
 */
class TestLabel44Plugin extends Label_44_Base {
  name = 'test-label-44';
  get description() {
    return 'Test Report';
  }
  get minFields() {
    return 7;
  }

  qualifiers() {
    return {
      labels: ['44'],
      preambles: ['TEST01'],
    };
  }

  decodeEventFields(
    result: DecodeResult,
    data: string[],
    options: Options,
  ): void {
    ResultFormatter.on(result, DateTimeUtils.convertHHMMSSToTod(data[5]));
    this.parseFuel(result, data[6]);
    this.addRemainingFields(result, data, 7);
  }
}

describe('Label_44_Base', () => {
  let plugin: TestLabel44Plugin;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new TestLabel44Plugin(decoder);
  });

  test('decodes valid message with shared fields', () => {
    const message = {
      label: '44',
      text: 'TEST01,N33522W084181,KCLT,KPDK,1106,004023,5.2',
    };
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.decoder.name).toBe('test-label-44');
    expect(result.formatted.description).toBe('Test Report');

    // Common fields parsed by base
    expect(result.raw.position).toBeDefined();
    expect(result.raw.position!.latitude).toBeCloseTo(33.87, 2);
    expect(result.raw.position!.longitude).toBeCloseTo(-84.302, 2);
    expect(result.raw.departure_icao).toBe('KCLT');
    expect(result.raw.arrival_icao).toBe('KPDK');
    expect(result.raw.month).toBe(11);
    expect(result.raw.day).toBe(6);

    // Subclass-specific fields
    expect(result.raw.on_time).toBe(2423);
    expect(result.raw.fuel_remaining).toBe(5.2);
  });

  test('fails on too few fields', () => {
    const message = {
      label: '44',
      text: 'TEST01,N33522W084181,KCLT',
    };
    const result = plugin.decode(message);

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
    expect(result.remaining.text).toBe(message.text);
  });

  test('handles extra fields via addRemainingFields', () => {
    const message = {
      label: '44',
      text: 'TEST01,N33522W084181,KCLT,KPDK,1106,004023,5.2,extra1,extra2',
    };
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    // Extra fields should be in remaining text
    expect(result.remaining.text).toBe('extra1,extra2');
  });

  test('handles invalid fuel gracefully', () => {
    const message = {
      label: '44',
      text: 'TEST01,N33522W084181,KCLT,KPDK,1106,004023,---.-',
    };
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.raw.fuel_remaining).toBeUndefined();
  });

  test('debug logging works via base class', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const message = {
      label: '44',
      text: 'TEST01,N33522W084181,KCLT,KPDK,1106,004023,5.2',
    };
    plugin.decode(message, { debug: true });

    expect(spy).toHaveBeenCalledWith(
      '[test-label-44]',
      'Test Report: fields',
      expect.any(Array),
    );
    spy.mockRestore();
  });

  test('debug logging is silent when disabled', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const message = {
      label: '44',
      text: 'TEST01,N33522W084181,KCLT,KPDK,1106,004023,5.2',
    };
    plugin.decode(message, { debug: false });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
