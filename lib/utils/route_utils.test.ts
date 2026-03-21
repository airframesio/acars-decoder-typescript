import { RouteUtils } from './route_utils';
import { Route } from '../types/route';
import { Waypoint } from '../types/waypoint';

describe('RouteUtils', () => {
  describe('formatFlightState', () => {
    test('formats known flight states', () => {
      expect(RouteUtils.formatFlightState('TO')).toBe('Takeoff');
      expect(RouteUtils.formatFlightState('IC')).toBe('Initial Climb');
      expect(RouteUtils.formatFlightState('CL')).toBe('Climb');
      expect(RouteUtils.formatFlightState('ER')).toBe('En Route');
      expect(RouteUtils.formatFlightState('DC')).toBe('Descent');
      expect(RouteUtils.formatFlightState('AP')).toBe('Approach');
    });

    test('returns Unknown for unrecognized states', () => {
      expect(RouteUtils.formatFlightState('XX')).toBe('Unknown XX');
      expect(RouteUtils.formatFlightState('')).toBe('Unknown ');
    });
  });

  describe('routeToString', () => {
    test('formats route with name only', () => {
      const route: Route = { name: 'STAR1' };
      expect(RouteUtils.routeToString(route)).toBe('STAR1');
    });

    test('formats route with name and runway', () => {
      const route: Route = { name: 'STAR1', runway: '27L' };
      expect(RouteUtils.routeToString(route)).toBe('STAR1(27L)');
    });

    test('formats route with name and single waypoint', () => {
      const route: Route = {
        name: 'STAR1',
        waypoints: [{ name: 'ALPHA' }],
      };
      expect(RouteUtils.routeToString(route)).toBe('STAR1 starting at ALPHA');
    });

    test('formats route with name and multiple waypoints', () => {
      const route: Route = {
        name: 'STAR1',
        waypoints: [{ name: 'ALPHA' }, { name: 'BRAVO' }, { name: 'CHARLIE' }],
      };
      expect(RouteUtils.routeToString(route)).toBe(
        'STAR1: ALPHA > BRAVO > CHARLIE',
      );
    });

    test('formats route with waypoints only (no name)', () => {
      const route: Route = {
        waypoints: [{ name: 'ALPHA' }, { name: 'BRAVO' }],
      };
      expect(RouteUtils.routeToString(route)).toBe('ALPHA > BRAVO');
    });

    test('formats empty route', () => {
      const route: Route = {};
      expect(RouteUtils.routeToString(route)).toBe('');
    });
  });

  describe('waypointToString', () => {
    test('formats waypoint with name only', () => {
      expect(RouteUtils.waypointToString({ name: 'ALPHA' })).toBe('ALPHA');
    });

    test('formats waypoint with coordinates', () => {
      const wp: Waypoint = {
        name: 'ALPHA',
        latitude: 38.563,
        longitude: -121.298,
      };
      const result = RouteUtils.waypointToString(wp);
      expect(result).toContain('ALPHA');
      expect(result).toContain('38.563');
    });

    test('formats waypoint with offset', () => {
      const wp: Waypoint = {
        name: 'ALPHA',
        offset: { bearing: 180, distance: 5.2 },
      };
      expect(RouteUtils.waypointToString(wp)).toBe('ALPHA[180° 5.2nm]');
    });

    test('formats waypoint with time', () => {
      const wp: Waypoint = { name: 'ALPHA', time: 3600 };
      const result = RouteUtils.waypointToString(wp);
      expect(result).toContain('ALPHA');
      expect(result).toContain('@');
    });
  });

  describe('getWaypoint', () => {
    test('parses waypoint with bearing-distance offset', () => {
      const wp = RouteUtils.getWaypoint('ALPHA180-0520');
      expect(wp.name).toBe('ALPHA');
      expect(wp.offset).toBeDefined();
      expect(wp.offset!.bearing).toBe(180);
      expect(wp.offset!.distance).toBe(52);
    });

    test('parses named waypoint with coordinates', () => {
      const wp = RouteUtils.getWaypoint('ALPHA,N38338W121179');
      expect(wp.name).toBe('ALPHA');
      expect(wp.latitude).toBeDefined();
      expect(wp.longitude).toBeDefined();
    });

    test('parses coordinate-only string (13 chars)', () => {
      const wp = RouteUtils.getWaypoint('N38338W121179');
      expect(wp.latitude).toBeDefined();
      expect(wp.longitude).toBeDefined();
    });

    test('returns plain name for unrecognized format', () => {
      const wp = RouteUtils.getWaypoint('BRAVO');
      expect(wp.name).toBe('BRAVO');
      expect(wp.latitude).toBeUndefined();
      expect(wp.offset).toBeUndefined();
    });
  });
});
