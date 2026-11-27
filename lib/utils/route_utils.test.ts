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

    test('leaves out coordinates that did not decode', () => {
      expect(
        RouteUtils.waypointToString({
          name: 'FIX',
          latitude: NaN,
          longitude: -12.575,
        }),
      ).toBe('FIX');
      expect(RouteUtils.getWaypoint('FIX,NABCDEW012345').latitude).toBeNaN();
      expect(
        RouteUtils.waypointToString(
          RouteUtils.getWaypoint('FIX,NABCDEW012345'),
        ),
      ).toBe('FIX');
    });
  });
});
