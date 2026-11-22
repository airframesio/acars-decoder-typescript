import { beforeEach, describe, expect, test } from '@jest/globals';
import { CoordinateUtils } from './coordinate_utils';

describe('CoordinateUtils', () => {
  describe('decodeStringCoordinates', () => {
    test('decodes positive (N, E) coordinates without separator', () => {
      // N12345 = 12.345°, E123456 = 123.456°
      const result = CoordinateUtils.decodeStringCoordinates('N12345E123456');
      expect(result).toEqual({ latitude: 12.345, longitude: 123.456 });
    });

    test('decodes negative (S, W) coordinates without separator', () => {
      const result = CoordinateUtils.decodeStringCoordinates('S33456W077123');
      expect(result).toEqual({ latitude: -33.456, longitude: -77.123 });
    });

    test('decodes coordinates with a space separator', () => {
      const result = CoordinateUtils.decodeStringCoordinates('N12345 W023456');
      expect(result).toEqual({ latitude: 12.345, longitude: -23.456 });
    });

    test('returns undefined for invalid latitude prefix', () => {
      expect(
        CoordinateUtils.decodeStringCoordinates('X12345E123456'),
      ).toBeUndefined();
    });

    test('returns undefined for invalid longitude prefix', () => {
      expect(
        CoordinateUtils.decodeStringCoordinates('N12345X123456'),
      ).toBeUndefined();
    });
  });

  describe('decodeStringCoordinatesDecimalMinutes', () => {
    test('decodes degrees + decimal minutes (no separator)', () => {
      // N38241 = 38° 24.1' = 38.401666...° N
      // W081357 = 81° 35.7' = 81.595° W
      const result =
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes('N38241W081357');
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(38.40166666666667, 10);
      expect(result!.longitude).toBeCloseTo(-81.595, 10);
    });

    test('decodes degrees + decimal minutes (with space separator)', () => {
      const result =
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes('S38241 E081357');
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(-38.40166666666667, 10);
      expect(result!.longitude).toBeCloseTo(81.595, 10);
    });

    test('returns undefined for invalid prefixes', () => {
      expect(
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes('Z38241E081357'),
      ).toBeUndefined();
      expect(
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes('N38241Z081357'),
      ).toBeUndefined();
    });
  });

  describe('coordinateString', () => {
    test('formats positive coordinates as N/E', () => {
      expect(
        CoordinateUtils.coordinateString({
          latitude: 12.345,
          longitude: 67.89,
        }),
      ).toBe('12.345 N, 67.890 E');
    });

    test('formats negative coordinates as S/W with absolute values', () => {
      expect(
        CoordinateUtils.coordinateString({
          latitude: -12.345,
          longitude: -67.89,
        }),
      ).toBe('12.345 S, 67.890 W');
    });

    test('formats zero coordinates as N/E', () => {
      expect(
        CoordinateUtils.coordinateString({
          latitude: 0,
          longitude: 0,
        }),
      ).toBe('0.000 N, 0.000 E');
    });
  });

  describe('getDirection', () => {
    test('N and E return +1', () => {
      expect(CoordinateUtils.getDirection('N')).toBe(1);
      expect(CoordinateUtils.getDirection('E')).toBe(1);
    });

    test('S and W return -1', () => {
      expect(CoordinateUtils.getDirection('S')).toBe(-1);
      expect(CoordinateUtils.getDirection('W')).toBe(-1);
    });

    test('unknown directions return NaN', () => {
      expect(CoordinateUtils.getDirection('X')).toBeNaN();
    });
  });

  describe('decodeStringCoordinatesDegreesMinutesSeconds', () => {
    test('decodes packed DDMMSS / DDDMMSS coordinates', () => {
      // 394138 = 39° 41' 38", 0752038 = 75° 20' 38"
      const result =
        CoordinateUtils.decodeStringCoordinatesDegreesMinutesSeconds(
          'N394138W0752038',
        );
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(39.69388888888889, 10);
      expect(result!.longitude).toBeCloseTo(-75.34388888888889, 10);
    });

    test('accepts whitespace after each hemisphere letter', () => {
      const result =
        CoordinateUtils.decodeStringCoordinatesDegreesMinutesSeconds(
          'N 394138W 752038',
        );
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(39.69388888888889, 10);
      expect(result!.longitude).toBeCloseTo(-75.34388888888889, 10);
    });

    test('decodes S / E hemispheres', () => {
      // 035335 = 3° 53' 35", 0752038 = 75° 20' 38"
      const result =
        CoordinateUtils.decodeStringCoordinatesDegreesMinutesSeconds(
          'S035335E0752038',
        );
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(-3.8930555555555555, 10);
      expect(result!.longitude).toBeCloseTo(75.34388888888889, 10);
    });

    test('returns undefined for impossible minutes or seconds', () => {
      expect(
        CoordinateUtils.decodeStringCoordinatesDegreesMinutesSeconds(
          'N396038W0752038',
        ),
      ).toBeUndefined();
      expect(
        CoordinateUtils.decodeStringCoordinatesDegreesMinutesSeconds(
          'N394160W0752038',
        ),
      ).toBeUndefined();
    });

    test('returns undefined for out-of-range or malformed fields', () => {
      expect(
        CoordinateUtils.decodeStringCoordinatesDegreesMinutesSeconds(
          'N910000W0752038',
        ),
      ).toBeUndefined();
      expect(
        CoordinateUtils.decodeStringCoordinatesDegreesMinutesSeconds(
          'N39413W0752038',
        ),
      ).toBeUndefined();
      expect(
        CoordinateUtils.decodeStringCoordinatesDegreesMinutesSeconds(
          'N394138W07520A8',
        ),
      ).toBeUndefined();
    });
  });

  describe('dmsToDecimalDegrees', () => {
    test('converts DMS to decimal degrees', () => {
      // 12° 30' 36" = 12 + 30/60 + 36/3600 = 12.51
      expect(CoordinateUtils.dmsToDecimalDegrees(12, 30, 36)).toBeCloseTo(
        12.51,
        10,
      );
    });
  });
});
