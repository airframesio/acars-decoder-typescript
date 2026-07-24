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
    expect(
      decodeResult.raw.route?.waypoints.map((waypoint) => waypoint.name),
    ).toEqual(['KSEA', 'BTG', 'KPDX']);
    expect(decodeResult.formatted.items).toHaveLength(2);
    expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[1].label).toBe('Aircraft Route');
  });
});

describe('FlightPlanUtils.processFlightPlan company route', () => {
  const makeDecodeResult = (): DecodeResult => ({
    decoded: true,
    decoder: { name: 'test', type: 'pattern-match', decodeLevel: 'full' },
    formatted: { description: 'Test', items: [] },
    raw: {},
    remaining: {},
  });

  test('preserves full runway when closing paren is present', () => {
    const decodeResult = makeDecodeResult();

    FlightPlanUtils.processFlightPlan(decodeResult, [
      'RP',
      'CR',
      'ABC(RW26).WPT1.WPT2',
    ]);

    expect(decodeResult.raw.company_route.name).toBe('ABC');
    expect(decodeResult.raw.company_route.runway).toBe('RW26');
  });

  test('does not drop the last runway character when closing paren is missing', () => {
    const decodeResult = makeDecodeResult();

    // Malformed input: '(' without a matching ')' before the first '.'.
    FlightPlanUtils.processFlightPlan(decodeResult, [
      'RP',
      'CR',
      'ABC(RW26.WPT1.WPT2',
    ]);

    expect(decodeResult.raw.company_route.name).toBe('ABC');
    // Regression for issue: previously slice(4, -1) truncated to 'RW2'.
    expect(decodeResult.raw.company_route.runway).toBe('RW26');
  });
});
