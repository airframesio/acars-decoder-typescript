import { MessageDecoder } from '../MessageDecoder';
import { Label_QP } from './Label_QP';

describe('Label QP', () => {
  let plugin: Label_QP;
  const message = { label: 'QP', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_QP(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-qp');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['QP'],
    });
  });

  test('decodes a typical OUT report fully', () => {
    message.text = 'KSFOKLAX1234';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('OUT Report');
    expect(result.raw.departure_icao).toBe('KSFO');
    expect(result.raw.arrival_icao).toBe('KLAX');
    // 12:34:00 since midnight
    expect(result.raw.out_time).toBe(12 * 3600 + 34 * 60);
    expect(result.remaining.text).toBeFalsy();
  });

  test('marks decode as partial when extra text remains', () => {
    message.text = 'KSFOKLAX1234EXTRA';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.remaining.text).toBe('EXTRA');
  });

  test('end-to-end via MessageDecoder routes by label', () => {
    const decoder = new MessageDecoder();
    const result = decoder.decode({ label: 'QP', text: 'KSFOKLAX0900' });
    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-qp');
    expect(result.raw.out_time).toBe(9 * 3600);
  });
});
