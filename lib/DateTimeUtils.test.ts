import { DateTimeUtils } from './DateTimeUtils';

describe('DateTimeUtils', () => {
  test('UTCToString returns a UTC HH:MM:SS string', () => {
    expect(DateTimeUtils.UTCToString('1530')).toBe('15:30:00');
  });

  test('UTCDateTimeToString supports both HHMM and HHMMSS', () => {
    expect(DateTimeUtils.UTCDateTimeToString('010124', '1530')).toContain(
      '15:30:00 GMT',
    );
    expect(DateTimeUtils.UTCDateTimeToString('010124', '153045')).toContain(
      '15:30:45 GMT',
    );
  });
});
