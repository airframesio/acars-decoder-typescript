import { DateTimeUtils } from './DateTimeUtils';

describe('DateTimeUtils.UTCDateTimeToString', () => {
  it('decodes a DDMMYY date with the ACARS 1-12 month convention', () => {
    // ACARS "150226" = day 15, month 02 (Feb), year 26 -> 15 Feb 2026
    const out = DateTimeUtils.UTCDateTimeToString('150226', '1230');
    expect(out).toContain('Feb');
    expect(out).toContain('15');
    expect(out).toContain('2026');
  });

  it('parses DDMMYY = 280226 as 28 Feb 2026, not a later month', () => {
    // ACARS month 02 must map to JS month 1 (February). Before the fix,
    // passing the raw digit 2 to setUTCMonth produced March. Assert the
    // returned UTC string matches the canonical Date.UTC value directly.
    const out = DateTimeUtils.UTCDateTimeToString('280226', '1230');
    const expected = new Date(Date.UTC(2026, 1, 28, 12, 30, 0)).toUTCString();
    expect(out).toBe(expected);
  });

  it('handles a six-digit time with seconds', () => {
    const out = DateTimeUtils.UTCDateTimeToString('150226', '123045');
    expect(out).toContain('12:30:45');
  });
});

describe('DateTimeUtils.timestampToString', () => {
  it('returns an empty string for NaN instead of throwing RangeError', () => {
    // new Date(NaN).toISOString() throws "Invalid time value". A malformed
    // time field (e.g. convertHHMMSSToTod("ABCD")) must not abort the decode.
    expect(() => DateTimeUtils.timestampToString(NaN)).not.toThrow();
    expect(DateTimeUtils.timestampToString(NaN)).toBe('');
  });

  it('still formats a valid time-of-day', () => {
    expect(DateTimeUtils.timestampToString(4980)).toBe('01:23:00');
    expect(DateTimeUtils.timestampToString(86399)).toBe('23:59:59');
  });

  it('formats a full timestamp with its date', () => {
    expect(DateTimeUtils.timestampToString(1704164645)).toBe(
      '2024-01-02T03:04:05Z',
    );
  });
});

describe('DateTimeUtils.convertDayTimeToTod', () => {
  it.each([
    ['01000000', 'YYYY-MM-01T00:00:00'],
    ['15123456', 'YYYY-MM-15T12:34:56'],
    ['31235959', 'YYYY-MM-31T23:59:59'],
  ])('keeps the day of month when formatting %s', (time, expected) => {
    expect(
      DateTimeUtils.timestampToString(DateTimeUtils.convertDayTimeToTod(time)),
    ).toBe(expected);
  });
});
