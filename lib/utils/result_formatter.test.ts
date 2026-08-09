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

  test('preserves full hex for 24-bit checksum (no truncation)', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0x123456);
    expect(dr.raw.checksum).toBe(0x123456);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0x123456');
  });

  test('displays large 32-bit CRC without sign artifacts', () => {
    // 0xDEADBEEF has the top bit set; pass the signed int32 representation
    // (-559038737) to actually exercise the >>> 0 unsigned coercion path.
    const dr = makeDecodeResult();
    const signedChecksum = -559038737; // int32 representation of 0xdeadbeef
    ResultFormatter.checksum(dr, signedChecksum);
    expect(dr.raw.checksum).toBe(signedChecksum);
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

describe('ResultFormatter timestamp family NaN guards', () => {
  // Malformed time fields (e.g. convertHHMMSSToTod('ABCD') -> NaN) must not
  // abort the whole decode via timestampToString's RangeError (issue #498).
  const cases: Array<[string, (dr: DecodeResult) => void, string]> = [
    ['timestamp', (dr) => ResultFormatter.timestamp(dr, NaN), 'message_timestamp'],
    ['eta', (dr) => ResultFormatter.eta(dr, NaN), 'eta_time'],
    ['out', (dr) => ResultFormatter.out(dr, NaN), 'out_time'],
    ['off', (dr) => ResultFormatter.off(dr, NaN), 'off_time'],
    ['on', (dr) => ResultFormatter.on(dr, NaN), 'on_time'],
    ['in', (dr) => ResultFormatter.in(dr, NaN), 'in_time'],
    ['engineStart', (dr) => ResultFormatter.engineStart(dr, NaN), 'engine_start_time'],
    ['engineStop', (dr) => ResultFormatter.engineStop(dr, NaN), 'engine_stop_time'],
  ];

  test.each(cases)(
    '%s skips NaN instead of throwing',
    (_name, invoke, rawKey) => {
      const dr = makeDecodeResult();
      expect(() => invoke(dr)).not.toThrow();
      expect(dr.formatted.items.length).toBe(0);
      expect((dr.raw as Record<string, unknown>)[rawKey]).toBeUndefined();
    },
  );

  test('eta still formats a valid time-of-day', () => {
    const dr = makeDecodeResult();
    ResultFormatter.eta(dr, 7680);
    expect(dr.raw.eta_time).toBe(7680);
    expect(dr.formatted.items[0].value).toBe('02:08:00');
  });
});
