import { DateTimeUtils } from './DateTimeUtils';

describe('DateTimeUtils.UTCDateTimeToString', () => {
  it('decodes a DDMMYY date with the ACARS 1-12 month convention', () => {
    // 15 February 2026, 12:30 UTC. The ACARS string is DDMMYY = "150226".
    const out = DateTimeUtils.UTCDateTimeToString('150226', '1230');
    expect(out).toContain('Feb');
    expect(out).toContain('15');
    expect(out).toContain('2026');
  });

  it('does not roll the month forward when the system date is later than the target month-end', () => {
    // Pin "now" to 31 March 2026 — a 31-day month. Encoding DDMMYY = 280226
    // (28 Feb 2026) used to roll forward to March because the order of
    // setUTC* calls applied "set day=28" to a Date already at the 31st.
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2026, 2, 31, 0, 0, 0)));
    try {
      const out = DateTimeUtils.UTCDateTimeToString('280226', '1230');
      expect(out).toContain('Feb');
      expect(out).toContain('28');
    } finally {
      jest.useRealTimers();
    }
  });

  it('handles a six-digit time with seconds', () => {
    const out = DateTimeUtils.UTCDateTimeToString('150226', '123045');
    expect(out).toContain('12:30:45');
  });
});
