import { describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';

// Military (AMC-format) OOOI reports seen on Airframes, 2026-11-19 to 2026-11-21
describe('Label_H1 OOI', () => {
  const decoder = new MessageDecoder();

  test('off event (label 80)', () => {
    const result = decoder.decode({
      label: '80',
      text: 'OOI/ID76027S,KECK43,8VZ095L6S324/DC21112026,011458/MR4,/OF210114/CG229,110,360/FB794/VR321B31',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('OOOI Event Report');
    expect(result.raw.flight_number).toBe('KECK43');
    expect(result.raw.mission?.prefix).toBe('8VZ');
    expect(result.raw.day).toBe(21);
    expect(result.raw.off_time).toBe(4440); // 01:14
    expect(result.raw.fuel_on_board).toBe(794);
  });

  test('out event', () => {
    const result = decoder.decode({
      label: 'H1',
      text: 'F82AMCFAMC#M2BOOI/ID80057A,RCH4527,JAM7868P2324/DC20112026,175106/MR1,/OT201751,201735,1539/CG346,,/FB1539/VR32A3EE',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.raw.out_time).toBe(64260); // 17:51
    expect(result.raw.out_fuel).toBe(1539);
    // the second time in /OT is not decoded
    expect(result.remaining.text).toContain('201735');
  });

  test('invalid off time is not decoded', () => {
    const result = decoder.decode({
      label: '80',
      text: 'OOI/ID76027S,KECK43,8VZ095L6S324/DC21112026,011458/MR4,/OF219914/CG229,110,360/FB794/VR329EB5',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.off_time).toBeUndefined();
    expect(result.remaining.text).toContain('OF219914');
  });
});

describe('Label_H1 OOI on and in events', () => {
  const decoder = new MessageDecoder();

  test('on event', () => {
    const result = decoder.decode({
      label: 'H1',
      text: 'OOI/ID66015S,RAMEN95,CPZ595L5P323/DC19112026,192310/MR8,/ON191923/CG254,112,360/FB990/VR32F49A',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.day).toBe(19);
    expect(result.raw.on_time).toBe(69780); // 19:23
    expect(result.raw.fuel_on_board).toBe(990);
  });

  test('in event with an empty /FB', () => {
    const result = decoder.decode({
      label: 'H1',
      text: 'OOI/ID50005B,RCH2151,PBC03810C314/DC16112026,121054/MR152,/IN161210,16/CG,,/FB/VR032AE97',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.raw.in_time).toBe(43800); // 12:10
    expect(result.raw.fuel_on_board).toBeUndefined();
    // the second /IN value is not known
    expect(result.remaining.text).toBe('16');
  });

  test('invalid on time is not decoded', () => {
    const result = decoder.decode({
      label: 'H1',
      text: 'OOI/ID66015S,RAMEN95,CPZ595L5P323/DC19112026,192310/MR8,/ON192523/CG254,112,360/FB990/VR320DAC',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.on_time).toBeUndefined();
    expect(result.remaining.text).toContain('ON192523');
  });
});
