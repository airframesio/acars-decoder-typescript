import { DecodeResult } from '../DecoderPluginInterface';
import { FlightPlanUtils } from './flight_plan_utils';

describe('FlightPlanUtils.parseHeader', () => {
  test('keeps RP as route_status while parsing embedded route content', () => {
    const decodeResult: DecodeResult = {
      decoded: true,
      decoder: { name: 'test', type: 'pattern-match', decodeLevel: 'full' },
      formatted: { description: 'Test', items: [] },
      raw: {},
      remaining: {},
    };

    const allKnownFields = FlightPlanUtils.parseHeader(
      decodeResult,
      'RPKSEA.BTG.KPDX',
    );

    expect(allKnownFields).toBe(true);
    expect(decodeResult.raw.route_status).toBe('RP');
    expect(decodeResult.raw.route?.waypoints.map((waypoint) => waypoint.name)).toEqual(
      ['KSEA', 'BTG', 'KPDX'],
    );
    expect(decodeResult.formatted.items).toHaveLength(2);
    expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[1].label).toBe('Aircraft Route');
  });
});
