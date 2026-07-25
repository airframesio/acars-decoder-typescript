import { DecodeResult } from '../DecoderPluginInterface';
import { ResultFormatter } from './result_formatter';

function makeDecodeResult(): DecodeResult {
  return {
    decoded: true,
    decoder: { name: 'test', type: 'pattern-match', decodeLevel: 'full' },
    formatted: { description: 'Test', items: [] },
    raw: {},
    remaining: {},
  };
}

describe('ResultFormatter.checksum', () => {
  test('formats 16-bit checksum with 4-hex-digit padding', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0x1234);
    expect(dr.raw.checksum).toBe(0x1234);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.type).toBe('message_checksum');
    expect(item.value).toBe('0x1234');
  });

  test('pads small values to at least 4 hex digits', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0x003b);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0x003b');
  });

  test('preserves full hex for 20-bit checksum (no truncation)', () => {
    // 0xaff5c is 5 hex digits — old code truncated to 0xff5c
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0xaff5c);
    expect(dr.raw.checksum).toBe(0xaff5c);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0xaff5c');
  });

  test('preserves full hex for 32-bit checksum (no truncation)', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0x123456);
    expect(dr.raw.checksum).toBe(0x123456);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0x123456');
  });

  test('displays large 32-bit CRC without sign artifacts', () => {
    // 0xDEADBEEF has the top bit set; toString(16) on a signed int would
    // produce a negative string. >>> 0 coerces to unsigned first.
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0xdeadbeef);
    expect(dr.raw.checksum).toBe(0xdeadbeef);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0xdeadbeef');
  });

  test('pads 12-bit value to 4 digits', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0xabc);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0x0abc');
  });
});
