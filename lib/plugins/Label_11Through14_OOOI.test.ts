import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_11Through14_OOOI } from './Label_11Through14_OOOI';

describe('Labels 11-14 OOOI reports', () => {
  let plugin: Label_11Through14_OOOI;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_11Through14_OOOI(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-11-14-oooi');
    expect(plugin.qualifiers()).toEqual({
      labels: ['11', '12', '13', '14'],
      preambles: ['OUT01', 'OFF01', 'ONN01', 'INN01'],
    });
  });

  test('decodes label 11 OUT report', () => {
    // https://app.airframes.io/messages/8193180719
    const result = plugin.decode({
      label: '11',
      text: 'OUT01    ETH309/22220151HKJKHAAB\r\n0151 16510600',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Out of Gate Report');
    expect(result.raw.flight_number).toBe('ETH309');
    expect(result.raw.departure_day).toBe(22);
    expect(result.raw.day).toBe(22);
    expect(result.raw.departure_icao).toBe('HKJK');
    expect(result.raw.arrival_icao).toBe('HAAB');
    expect(result.raw.out_time).toBe(1 * 3600 + 51 * 60);
    expect(result.remaining.text).toBe('16510600');
  });

  test('decodes label 12 OFF report', () => {
    // https://app.airframes.io/messages/8191300924
    const result = plugin.decode({
      label: '12',
      text: 'OFF01    CSN654/21212021EGKKZHCC\r\n2021 5490936  98,4697.89,144230, 198788, 51.149,-   .18,093652,',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Takeoff Report');
    expect(result.raw.flight_number).toBe('CSN654');
    expect(result.raw.departure_icao).toBe('EGKK');
    expect(result.raw.arrival_icao).toBe('ZHCC');
    expect(result.raw.off_time).toBe(20 * 3600 + 21 * 60);
  });

  test('decodes label 13 ON report across midnight', () => {
    // https://app.airframes.io/messages/8192780027
    const result = plugin.decode({
      label: '13',
      text: 'ONN01   WJA2251/21220021MMPRCYYC\r\n00210167',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Landing Report');
    expect(result.raw.flight_number).toBe('WJA2251');
    expect(result.raw.departure_day).toBe(21);
    expect(result.raw.day).toBe(22);
    expect(result.raw.departure_icao).toBe('MMPR');
    expect(result.raw.arrival_icao).toBe('CYYC');
    expect(result.raw.on_time).toBe(21 * 60);
  });

  test('decodes label 14 IN report with left-aligned flight', () => {
    // https://app.airframes.io/messages/8186264630
    const result = plugin.decode({
      label: '14',
      text: 'INN01UAE179    /21211019OMDBEPWA\r\n1017 1761011',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('In Gate Report');
    expect(result.raw.flight_number).toBe('UAE179');
    expect(result.raw.departure_icao).toBe('OMDB');
    expect(result.raw.arrival_icao).toBe('EPWA');
    expect(result.raw.in_time).toBe(10 * 3600 + 17 * 60);
  });

  test('does not decode the short form', () => {
    const result = plugin.decode({ label: '13', text: 'ONN011317EGJB' });

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
  });

  test('does not decode an out-of-range time', () => {
    const result = plugin.decode({
      label: '11',
      text: 'OUT01    ETH309/22220151HKJKHAAB\r\n1260 16510600',
    });

    expect(result.decoded).toBe(false);
  });
});
