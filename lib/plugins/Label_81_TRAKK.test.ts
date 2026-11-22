import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_81_TRAKK } from './Label_81_TRAKK';

// Production messages, 2026-11-22
describe('Label_81_TRAKK', () => {
  let plugin: Label_81_TRAKK;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_81_TRAKK(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-81-trakk');
    expect(plugin.qualifiers()).toEqual({
      labels: ['81'],
      preambles: ['TRAKK '],
    });
  });

  test('decodes a waypoint report', () => {
    const decodeResult = plugin.decode({
      label: '81',
      text: 'TRAKK 0627 FL370 FOB18.3\r\nAVERE 0645/HAR 0702\r\nETA 0754 EFOB 12.3\r\n',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.altitude).toBe(37000);
    expect(decodeResult.raw.fuel_on_board).toBe(18.3);
    expect(decodeResult.raw.eta_time).toBe(28440);
    expect(decodeResult.raw.fuel_remaining).toBe(12.3);
    expect(decodeResult.remaining.text).toBe('TRAKK 0627 AVERE 0645/HAR 0702');
  });

  test('does not decode other messages', () => {
    const decodeResult = plugin.decode({
      label: '81',
      text: 'TRAKK 0627 FL370 FOB18.3',
    });
    expect(decodeResult.decoded).toBe(false);
  });
});
