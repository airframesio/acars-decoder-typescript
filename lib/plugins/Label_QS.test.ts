import { MessageDecoder } from '../MessageDecoder';
import { Label_QS } from './Label_QS';

describe('Label QS', () => {
  let plugin: Label_QS;
  const message = { label: 'QS', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_QS(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-qs');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['QS'],
    });
  });

  test('decodes a typical IN report fully', () => {
    message.text = 'KJFKKBOS1015';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('IN Report');
    expect(result.raw.departure_icao).toBe('KJFK');
    expect(result.raw.arrival_icao).toBe('KBOS');
    expect(result.raw.in_time).toBe(10 * 3600 + 15 * 60);
    expect(result.remaining.text).toBeFalsy();
  });

  test('marks decode as partial when extra text remains', () => {
    message.text = 'KJFKKBOS1015 STATUS=OK';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.remaining.text).toBe(' STATUS=OK');
  });

  test('end-to-end via MessageDecoder routes by label', () => {
    const decoder = new MessageDecoder();
    const result = decoder.decode({ label: 'QS', text: 'KSFOKLAX2345' });
    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-qs');
    expect(result.raw.in_time).toBe(23 * 3600 + 45 * 60);
  });
});
