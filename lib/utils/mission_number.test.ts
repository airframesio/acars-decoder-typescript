import { describe, expect, test } from '@jest/globals';
import { MissionNumberUtils } from './mission_number';

describe('MissionNumberUtils', () => {
  test('parses a mission number', () => {
    expect(MissionNumberUtils.parse('PMZM107QP021')).toEqual({
      value: 'PMZM107QP021',
      prefix: 'PMZ',
      basic: 'M107',
      suffix: 'QP',
      day_of_year: 21,
    });
  });

  test('rejects values that are not mission numbers', () => {
    expect(MissionNumberUtils.parse('')).toBeNull();
    expect(MissionNumberUtils.parse(undefined)).toBeNull();
    expect(MissionNumberUtils.parse('ZZZ123456789')).toBeNull(); // placeholder
    expect(MissionNumberUtils.parse('COLLINSAM123')).toBeNull(); // placeholder
    expect(MissionNumberUtils.parse('AAM1257013')).toBeNull(); // too short
    expect(MissionNumberUtils.parse('AAM125701400')).toBeNull(); // day 400
  });

  test('resolves the operating date nearest the reference', () => {
    const mission = MissionNumberUtils.parse('AAM125701320')!;
    expect(
      MissionNumberUtils.operatingDate(
        mission,
        new Date('2026-11-21T20:00:00Z'),
      ),
    ).toBe('2026-11-16');
    const january = MissionNumberUtils.parse('AAM125701003')!;
    expect(
      MissionNumberUtils.operatingDate(
        january,
        new Date('2026-12-30T00:00:00Z'),
      ),
    ).toBe('2027-01-03');
    const lateDec = MissionNumberUtils.parse('AAM125701364')!;
    expect(
      MissionNumberUtils.operatingDate(
        lateDec,
        new Date('2027-01-02T00:00:00Z'),
      ),
    ).toBe('2026-12-30');
  });

  test('day 366 resolves to the nearest leap year', () => {
    const mission = MissionNumberUtils.parse('AAM125701366')!;
    expect(
      MissionNumberUtils.operatingDate(
        mission,
        new Date('2026-06-01T00:00:00Z'),
      ),
    ).toBe('2024-12-31');
  });
});
