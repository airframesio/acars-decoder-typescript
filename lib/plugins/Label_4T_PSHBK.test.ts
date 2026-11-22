import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_4T_PSHBK } from './Label_4T_PSHBK';

describe('Label 4T PSHBK', () => {
  let plugin: Label_4T_PSHBK;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4T_PSHBK(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4t-pshbk');
    expect(plugin.qualifiers()).toEqual({
      labels: ['4T'],
      preambles: ['PSHBK'],
    });
  });

  test('decodes pushback report', () => {
    const result = plugin.decode({
      label: '4T',
      text: 'PSHBK AC0281/21/22 YVR 0603Z/    Z/    Z/0605Z',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Pushback Report');
    expect(result.raw.flight_number).toBe('AC0281');
    expect(result.raw.departure_day).toBe(21);
    expect(result.raw.day).toBe(22);
    expect(result.raw.departure_iata).toBe('YVR');
    expect(result.raw.out_time).toBe(6 * 3600 + 3 * 60);
    expect(result.remaining.text).toBe('/    Z/    Z/0605Z');
  });

  test('does not decode an invalid time', () => {
    const result = plugin.decode({
      label: '4T',
      text: 'PSHBK AC0281/21/22 YVR 2603Z/    Z/    Z/0605Z',
    });

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
  });
});
