import { CoordinateUtils } from './coordinate_utils';

describe('CoordinateUtils', () => {
  describe('decodeStringCoordinates', () => {
    test('decodes N/W coordinates without space', () => {
      // N12345W123456 => lat = 12.345, lon = -123.456
      const result = CoordinateUtils.decodeStringCoordinates('N12345W123456');
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(12.345);
      expect(result!.longitude).toBeCloseTo(-123.456);
    });

    test('decodes S/E coordinates without space', () => {
      const result = CoordinateUtils.decodeStringCoordinates('S34567E098765');
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(-34.567);
      expect(result!.longitude).toBeCloseTo(98.765);
    });

    test('decodes coordinates with space separator', () => {
      const result = CoordinateUtils.decodeStringCoordinates('N12345 W123456');
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(12.345);
      expect(result!.longitude).toBeCloseTo(-123.456);
    });

    test('returns undefined for invalid direction chars', () => {
      const result = CoordinateUtils.decodeStringCoordinates('X12345Y123456');
      expect(result).toBeUndefined();
    });
  });

  describe('decodeStringCoordinatesDecimalMinutes', () => {
    test('decodes N/W coordinates in decimal minutes format', () => {
      // N38338W121179 => lat_deg=38, lat_min=33.8, lon_deg=121, lon_min=17.9
      const result =
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes('N38338W121179');
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(38 + 33.8 / 60);
      expect(result!.longitude).toBeCloseTo(-(121 + 17.9 / 60));
    });

    test('decodes S/E coordinates in decimal minutes format', () => {
      const result =
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes('S33520E151100');
      expect(result).toBeDefined();
      expect(result!.latitude).toBeLessThan(0);
      expect(result!.longitude).toBeGreaterThan(0);
    });

    test('decodes coordinates with space separator', () => {
      const result =
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
          'N38338 W121179',
        );
      expect(result).toBeDefined();
      expect(result!.latitude).toBeCloseTo(38 + 33.8 / 60);
    });

    test('returns undefined for invalid direction chars', () => {
      const result =
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes('X38338Y121179');
      expect(result).toBeUndefined();
    });
  });

  describe('coordinateString', () => {
    test('formats positive lat/lon as N/E', () => {
      const result = CoordinateUtils.coordinateString({
        latitude: 38.563,
        longitude: 121.298,
      });
      expect(result).toBe('38.563 N, 121.298 E');
    });

    test('formats negative lat/lon as S/W', () => {
      const result = CoordinateUtils.coordinateString({
        latitude: -33.867,
        longitude: -151.183,
      });
      expect(result).toBe('33.867 S, 151.183 W');
    });

    test('formats zero coordinates', () => {
      const result = CoordinateUtils.coordinateString({
        latitude: 0,
        longitude: 0,
      });
      // 0 is not > 0, so implementation uses S/W
      expect(result).toBe('0.000 S, 0.000 W');
    });
  });

  describe('getDirection', () => {
    test('returns 1 for North', () => {
      expect(CoordinateUtils.getDirection('N')).toBe(1);
    });

    test('returns 1 for East', () => {
      expect(CoordinateUtils.getDirection('E')).toBe(1);
    });

    test('returns -1 for South', () => {
      expect(CoordinateUtils.getDirection('S')).toBe(-1);
    });

    test('returns -1 for West', () => {
      expect(CoordinateUtils.getDirection('W')).toBe(-1);
    });

    test('returns NaN for unknown direction', () => {
      expect(CoordinateUtils.getDirection('X')).toBeNaN();
    });
  });

  describe('dmsToDecimalDegrees', () => {
    test('converts degrees, minutes, seconds to decimal degrees', () => {
      // 45° 30' 0" = 45.5
      expect(CoordinateUtils.dmsToDecimalDegrees(45, 30, 0)).toBeCloseTo(45.5);
    });

    test('converts with seconds', () => {
      // 45° 30' 36" = 45 + 0.5 + 0.01 = 45.51
      expect(CoordinateUtils.dmsToDecimalDegrees(45, 30, 36)).toBeCloseTo(
        45.51,
      );
    });

    test('handles zero values', () => {
      expect(CoordinateUtils.dmsToDecimalDegrees(0, 0, 0)).toBe(0);
    });

    test('handles degrees only', () => {
      expect(CoordinateUtils.dmsToDecimalDegrees(90, 0, 0)).toBe(90);
    });
  });
});
