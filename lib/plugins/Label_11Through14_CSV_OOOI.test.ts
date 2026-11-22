import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_11Through14_CSV_OOOI } from './Label_11Through14_CSV_OOOI';

describe('Labels 11-14 CSV OOOI reports (Cathay Pacific)', () => {
  let plugin: Label_11Through14_CSV_OOOI;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_11Through14_CSV_OOOI(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-11-14-csv-oooi');
    expect(plugin.qualifiers()).toEqual({
      labels: ['11', '12', '13', '14'],
      preambles: ['OUT,V', 'ONE,V'],
    });
  });

  test('decodes label 11 OUT report', () => {
    const result = plugin.decode({
      label: '11',
      text: 'OUT,V02,CX 837 20261121 1,CYVR,VHHH,2044,2036,----, 1179',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Out of Gate Report');
    expect(result.raw.flight_number).toBe('CX837');
    expect(result.raw.departure_day).toBe(21);
    expect(result.raw.departure_icao).toBe('CYVR');
    expect(result.raw.arrival_icao).toBe('VHHH');
    expect(result.raw.out_time).toBe(20 * 3600 + 44 * 60);
    expect(result.remaining.text).toBe('V02,1,2036,----, 1179');
  });

  test('decodes label 13 ON report', () => {
    const result = plugin.decode({
      label: '13',
      text: 'ONE,V02,CX 105 20261122 1,VHHH,YMML,0124,   96',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Landing Report');
    expect(result.raw.flight_number).toBe('CX105');
    expect(result.raw.arrival_icao).toBe('YMML');
    expect(result.raw.on_time).toBe(1 * 3600 + 24 * 60);
  });

  test('does not decode an INC report', () => {
    const result = plugin.decode({
      label: '10',
      text: 'INC,V02,21NOV26,155615,-------,CX0140,YPPH,VHHH,00672',
    });

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
  });

  test('does not decode other event codes in the OUT layout', () => {
    for (const text of [
      'INC,V02,CX 140 20261122 1,YPPH,VHHH,1556',
      'ONA,V02,CX 105 20261122 1,VHHH,YMML,0124',
    ]) {
      const result = new MessageDecoder().decode({ label: '13', text });
      expect(result.decoder.name).not.toBe('label-11-14-csv-oooi');
      expect(result.raw.in_time).toBeUndefined();
      expect(result.raw.on_time).toBeUndefined();
    }
  });

  test('is used by the decoder', () => {
    const result = new MessageDecoder().decode({
      label: '13',
      text: 'ONE,V02,CX 105 20261122 1,VHHH,YMML,0124,   96',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-11-14-csv-oooi');
    expect(result.raw.on_time).toBe(1 * 3600 + 24 * 60);
  });
});
