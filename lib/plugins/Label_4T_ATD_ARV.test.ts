import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_4T_ATD_ARV } from './Label_4T_ATD_ARV';

describe('Label 4T ATD/ARV', () => {
  let plugin: Label_4T_ATD_ARV;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4T_ATD_ARV(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4t-atd-arv');
    expect(plugin.qualifiers()).toEqual({
      labels: ['4T'],
      preambles: ['ATD', 'ARV'],
    });
  });

  test('decodes a departure report as the OUT time', () => {
    // Sent with 'PSHBK AC0128/22/22 YVR 0740Z/----Z/----Z/0746Z'.
    const result = plugin.decode({
      label: '4T',
      text: 'ATD AC0128/22/22 YVR 0740Z',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('Departure Report');
    expect(result.raw.flight_number).toBe('AC0128');
    expect(result.raw.departure_day).toBe(22);
    expect(result.raw.day).toBe(22);
    expect(result.raw.departure_iata).toBe('YVR');
    expect(result.raw.out_time).toBe(7 * 3600 + 40 * 60);
  });

  test('decodes an arrival report as the ON time', () => {
    const result = plugin.decode({
      label: '4T',
      text: 'ARV AC0856/21/22 LHR 0823Z',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Arrival Report');
    expect(result.raw.arrival_iata).toBe('LHR');
    expect(result.raw.on_time).toBe(8 * 3600 + 23 * 60);
    expect(result.raw.out_time).toBeUndefined();
  });

  test('does not decode an invalid day or time', () => {
    expect(
      plugin.decode({ label: '4T', text: 'ATD AC0128/22/99 YVR 0740Z' })
        .decoded,
    ).toBe(false);
    expect(
      plugin.decode({ label: '4T', text: 'ARV AC0856/21/22 LHR 2575Z' })
        .decoded,
    ).toBe(false);
  });

  test('decodes from MessageDecoder', () => {
    const decoder = new MessageDecoder();
    const result = decoder.decode({
      label: '4T',
      text: 'ARV AC7015/21/22 BFI 0842Z',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-4t-atd-arv');
    expect(result.raw.on_time).toBe(8 * 3600 + 42 * 60);
  });
});
