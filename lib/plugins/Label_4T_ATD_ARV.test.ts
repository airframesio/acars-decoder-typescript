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
      preambles: ['ATD', 'ARV', 'EAA'],
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

  test('decodes an updated arrival estimate (EAA) as the ETA', () => {
    // About 20 minutes out; ARV came at 0823.
    const result = plugin.decode({
      label: '4T',
      text: 'EAA AC0856/21/22 LHR 0831Z',
    });
    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('Arrival Estimate');
    expect(result.raw.flight_number).toBe('AC0856');
    expect(result.raw.arrival_iata).toBe('LHR');
    expect(result.raw.eta_time).toBe(8 * 3600 + 31 * 60);
    expect(result.raw.on_time).toBeUndefined();
  });

  test('leaves ETA to the 4T ETA plugin', () => {
    expect(
      plugin.decode({ label: '4T', text: 'ETA AC0842/21/22 FRA 1010Z' })
        .decoded,
    ).toBe(false);
    const result = new MessageDecoder().decode({
      label: '4T',
      text: 'ETA AC0842/21/22 FRA 1010Z',
    });
    expect(result.decoder.name).toBe('label-4t-eta');
    expect(result.raw.eta_time).toBe(10 * 3600 + 10 * 60);
  });

  test('does not decode an impossible estimate', () => {
    expect(
      plugin.decode({ label: '4T', text: 'EAA AC0404/21/21 YUL 2510Z' })
        .decoded,
    ).toBe(false);
  });
});
