import { describe, expect, test } from '@jest/globals';
import { RouteUtils } from './route_utils';

describe('RouteUtils', () => {
  describe('waypointToString', () => {
    test('keeps coordinates on the equator or prime meridian', () => {
      expect(
        RouteUtils.waypointToString({
          name: 'EQX',
          latitude: 0,
          longitude: -77,
        }),
      ).toBe('EQX(0.000 N, 77.000 W)');
      expect(
        RouteUtils.waypointToString({
          name: 'PRM',
          latitude: 38.5,
          longitude: 0,
        }),
      ).toBe('PRM(38.500 N, 0.000 E)');
      expect(
        RouteUtils.waypointToString({
          name: 'NULL',
          latitude: 0,
          longitude: 0,
        }),
      ).toBe('NULL(0.000 N, 0.000 E)');
    });
  });
});
