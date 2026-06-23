import {
  getEmergencySquawkInfo,
  isEmergencySquawk,
  formatEmergencySquawk,
} from './emergency_squawk';

describe('emergency squawk helpers', () => {
  test('recognizes 7500', () => {
    expect(isEmergencySquawk(7500)).toBe(true);
    expect(getEmergencySquawkInfo(7500)).toEqual({
      code: 7500,
      meaning: 'Unlawful interference / hijacking',
    });
    expect(formatEmergencySquawk(7500)).toBe(
      '7500: Unlawful interference / hijacking',
    );
  });

  test('recognizes 7600', () => {
    expect(isEmergencySquawk(7600)).toBe(true);
    expect(getEmergencySquawkInfo(7600)).toEqual({
      code: 7600,
      meaning: 'Radio communication failure',
    });
    expect(formatEmergencySquawk(7600)).toBe(
      '7600: Radio communication failure',
    );
  });

  test('recognizes 7700', () => {
    expect(isEmergencySquawk(7700)).toBe(true);
    expect(getEmergencySquawkInfo(7700)).toEqual({
      code: 7700,
      meaning: 'General emergency',
    });
    expect(formatEmergencySquawk(7700)).toBe('7700: General emergency');
  });

  test('rejects unknown codes', () => {
    expect(isEmergencySquawk(1234)).toBe(false);
    expect(getEmergencySquawkInfo(1234)).toBeNull();
    expect(formatEmergencySquawk(1234)).toBe('Unknown squawk code: 1234');
  });
});