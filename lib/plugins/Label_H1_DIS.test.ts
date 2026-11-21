import { describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';

// Military (AMC-format) DIS report seen on Airframes, 2026-11-21
describe('Label_H1 DIS', () => {
  const decoder = new MessageDecoder();

  test('with lat/lon', () => {
    const result = decoder.decode({
      label: 'H1',
      text: 'DIS/ID38031S,RCH564,8JZ42NG3S325/DC21112026,174417/MR20,/LLN50525E011102/DR0/FB1147/VR32F6B2',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('DIS Report');
    expect(result.raw.position?.latitude).toBeCloseTo(50.875, 3);
    expect(result.raw.position?.longitude).toBeCloseTo(11.17, 3);
    expect(result.raw.fuel_on_board).toBe(1147);
    expect(result.remaining.text).toContain('DR0');
  });
});
