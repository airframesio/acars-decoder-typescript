import { DateTimeUtils } from './DateTimeUtils';

describe('DateTimeUtils', () => {
  describe('convertHHMMSSToTod', () => {
    test('converts HHMMSS to seconds since midnight', () => {
      expect(DateTimeUtils.convertHHMMSSToTod('000000')).toBe(0);
      expect(DateTimeUtils.convertHHMMSSToTod('010000')).toBe(3600);
      expect(DateTimeUtils.convertHHMMSSToTod('001000')).toBe(600);
      expect(DateTimeUtils.convertHHMMSSToTod('000030')).toBe(30);
      expect(DateTimeUtils.convertHHMMSSToTod('235959')).toBe(86399);
      expect(DateTimeUtils.convertHHMMSSToTod('120000')).toBe(43200);
    });

    test('converts HHMM (4-digit) by appending 00 seconds', () => {
      expect(DateTimeUtils.convertHHMMSSToTod('0000')).toBe(0);
      expect(DateTimeUtils.convertHHMMSSToTod('0100')).toBe(3600);
      expect(DateTimeUtils.convertHHMMSSToTod('1230')).toBe(45000);
      expect(DateTimeUtils.convertHHMMSSToTod('2359')).toBe(86340);
    });

    test('handles combined hours, minutes and seconds', () => {
      // 01:30:45 = 3600 + 1800 + 45 = 5445
      expect(DateTimeUtils.convertHHMMSSToTod('013045')).toBe(5445);
    });
  });

  describe('convertDayTimeToTod', () => {
    test('converts DDHHMMSS to seconds', () => {
      // Day 01, 00:00:00
      expect(DateTimeUtils.convertDayTimeToTod('01000000')).toBe(86400);
      // Day 00, 01:00:00
      expect(DateTimeUtils.convertDayTimeToTod('00010000')).toBe(3600);
      // Day 02, 12:30:15 = 2*86400 + 12*3600 + 30*60 + 15
      expect(DateTimeUtils.convertDayTimeToTod('02123015')).toBe(
        2 * 86400 + 12 * 3600 + 30 * 60 + 15,
      );
    });
  });

  describe('convertDateTimeToEpoch', () => {
    test('converts DDMMYY date and HHMMSS time to epoch seconds', () => {
      // 01 Jan 2020, 00:00:00 UTC
      const epoch = DateTimeUtils.convertDateTimeToEpoch(
        '000000',
        '010120',
      );
      const date = new Date(epoch * 1000);
      expect(date.getUTCFullYear()).toBe(2020);
      expect(date.getUTCMonth()).toBe(0); // January
      expect(date.getUTCDate()).toBe(1);
      expect(date.getUTCHours()).toBe(0);
    });

    test('converts DDMMYYYY date and HHMMSS time to epoch seconds', () => {
      const epoch = DateTimeUtils.convertDateTimeToEpoch(
        '120000',
        '15062023',
      );
      const date = new Date(epoch * 1000);
      expect(date.getUTCFullYear()).toBe(2023);
      expect(date.getUTCMonth()).toBe(5); // June
      expect(date.getUTCDate()).toBe(15);
      expect(date.getUTCHours()).toBe(12);
    });
  });

  describe('timestampToString', () => {
    test('formats time-only (< 86400s) as HH:MM:SS', () => {
      expect(DateTimeUtils.timestampToString(0)).toBe('00:00:00');
      expect(DateTimeUtils.timestampToString(3661)).toBe('01:01:01');
      expect(DateTimeUtils.timestampToString(43200)).toBe('12:00:00');
    });

    test('formats day-time (< 2678400s) with YYYY-MM- prefix', () => {
      // 86400 = 1 day => should produce a day-time string
      const result = DateTimeUtils.timestampToString(86400);
      expect(result).toMatch(/^YYYY-MM-/);
    });

    test('formats full epoch timestamps as ISO-8601', () => {
      // 2023-01-01T00:00:00Z in epoch = 1672531200
      const result = DateTimeUtils.timestampToString(1672531200);
      expect(result).toBe('2023-01-01T00:00:00Z');
    });
  });

  describe('UTCToString', () => {
    test('parses HHMM string into a time string', () => {
      const result = DateTimeUtils.UTCToString('1230');
      // Should contain 12 and 30 in some format
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('UTCDateTimeToString', () => {
    test('parses DDMMYY date and HHMM time', () => {
      const result = DateTimeUtils.UTCDateTimeToString('010120', '1230');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('parses DDMMYY date and HHMMSS time', () => {
      const result = DateTimeUtils.UTCDateTimeToString('010120', '123045');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('handles 4-digit date (DDMM) without year', () => {
      const result = DateTimeUtils.UTCDateTimeToString('0101', '1230');
      expect(result).toBeDefined();
    });
  });
});
