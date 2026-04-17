import { MessageDecoder } from '../MessageDecoder';
import { Label_QR } from './Label_QR';

describe('Label QR', () => {
  let plugin: Label_QR;
  const message = { label: 'QR', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_QR(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-qr');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['QR'],
    });
  });

  test('decodes a typical ON report fully', () => {
    message.text = 'EGLLEDDF2030';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('ON Report');
    expect(result.raw.departure_icao).toBe('EGLL');
    expect(result.raw.arrival_icao).toBe('EDDF');
    expect(result.raw.on_time).toBe(20 * 3600 + 30 * 60);
    expect(result.remaining.text).toBeFalsy();
  });

  test('marks decode as partial when extra text remains', () => {
    message.text = 'EGLLEDDF2030/X';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.remaining.text).toBe('/X');
  });

  test('end-to-end via MessageDecoder routes by label', () => {
    const decoder = new MessageDecoder();
    const result = decoder.decode({ label: 'QR', text: 'KJFKKBOS0000' });
    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-qr');
    expect(result.raw.on_time).toBe(0);
  });
});
