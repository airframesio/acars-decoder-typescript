import { describe, expect, test } from '@jest/globals';
import { parseWind } from './arinc_702_helper';

describe('parseWind', () => {
  test('6-digit DDDSSS', () => {
    expect(parseWind('272100')).toEqual({ direction: 272, speed: 100 });
    expect(parseWind('060013')).toEqual({ direction: 60, speed: 13 });
  });

  test('5-digit with a dropped leading zero', () => {
    expect(parseWind('02216')).toEqual({ direction: 22, speed: 16 });
    expect(parseWind('26067')).toEqual({ direction: 260, speed: 67 });
  });

  test('boundaries', () => {
    expect(parseWind('000000')).toEqual({ direction: 0, speed: 0 });
    expect(parseWind('360200')).toEqual({ direction: 360, speed: 200 });
    expect(parseWind('361000')).toBeUndefined();
    expect(parseWind('120250')).toBeUndefined();
  });

  test('4-digit values are ambiguous and rejected', () => {
    expect(parseWind('1726')).toBeUndefined();
    expect(parseWind('1883')).toBeUndefined();
  });

  test('malformed values are rejected', () => {
    expect(parseWind('')).toBeUndefined();
    expect(parseWind('123')).toBeUndefined();
    expect(parseWind('ABCDE')).toBeUndefined();
    expect(parseWind('1234567')).toBeUndefined();
  });
});
