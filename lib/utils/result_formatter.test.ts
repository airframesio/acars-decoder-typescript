import { DecodeResult } from '../DecoderPluginInterface';
import { ResultFormatter } from './result_formatter';

function makeDecodeResult(): DecodeResult {
  return {
    decoded: true,
    decoder: { name: 'test', type: 'pattern-match', decodeLevel: 'full' },
    formatted: { description: 'Test', items: [] },
    raw: {},
    remaining: {},
  };
}

describe('ResultFormatter.checksum', () => {
  test('formats 16-bit checksum with 4-hex-digit padding', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0x1234);
    expect(dr.raw.checksum).toBe(0x1234);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.type).toBe('message_checksum');
    expect(item.value).toBe('0x1234');
  });

  test('pads small values to at least 4 hex digits', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0x003b);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0x003b');
  });

  test('preserves full hex for 20-bit checksum (no truncation)', () => {
    // 0xaff5c is 5 hex digits — old code truncated to 0xff5c
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0xaff5c);
    expect(dr.raw.checksum).toBe(0xaff5c);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0xaff5c');
  });

  test('preserves full hex for 24-bit checksum (no truncation)', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0x123456);
    expect(dr.raw.checksum).toBe(0x123456);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0x123456');
  });

  test('displays large 32-bit CRC without sign artifacts', () => {
    // 0xDEADBEEF has the top bit set; pass the signed int32 representation
    // (-559038737) to actually exercise the >>> 0 unsigned coercion path.
    const dr = makeDecodeResult();
    const signedChecksum = -559038737; // int32 representation of 0xdeadbeef
    ResultFormatter.checksum(dr, signedChecksum);
    expect(dr.raw.checksum).toBe(signedChecksum);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0xdeadbeef');
  });

  test('pads 12-bit value to 4 digits', () => {
    const dr = makeDecodeResult();
    ResultFormatter.checksum(dr, 0xabc);
    const item = dr.formatted.items[dr.formatted.items.length - 1];
    expect(item.value).toBe('0x0abc');
  });
});

describe('ResultFormatter timestamp family NaN guards', () => {
  // Malformed time fields (e.g. convertHHMMSSToTod('ABCD') -> NaN) must not
  // abort the whole decode via timestampToString's RangeError (issue #498).
  const cases: Array<[string, (dr: DecodeResult) => void, string]> = [
    [
      'timestamp',
      (dr) => ResultFormatter.timestamp(dr, NaN),
      'message_timestamp',
    ],
    ['eta', (dr) => ResultFormatter.eta(dr, NaN), 'eta_time'],
    ['out', (dr) => ResultFormatter.out(dr, NaN), 'out_time'],
    ['off', (dr) => ResultFormatter.off(dr, NaN), 'off_time'],
    ['on', (dr) => ResultFormatter.on(dr, NaN), 'on_time'],
    ['in', (dr) => ResultFormatter.in(dr, NaN), 'in_time'],
    [
      'engineStart',
      (dr) => ResultFormatter.engineStart(dr, NaN),
      'engine_start_time',
    ],
    [
      'engineStop',
      (dr) => ResultFormatter.engineStop(dr, NaN),
      'engine_stop_time',
    ],
  ];

  test.each(cases)(
    '%s skips NaN instead of throwing',
    (_name, invoke, rawKey) => {
      const dr = makeDecodeResult();
      expect(() => invoke(dr)).not.toThrow();
      expect(dr.formatted.items.length).toBe(0);
      expect((dr.raw as Record<string, unknown>)[rawKey]).toBeUndefined();
    },
  );

  test('eta still formats a valid time-of-day', () => {
    const dr = makeDecodeResult();
    ResultFormatter.eta(dr, 7680);
    expect(dr.raw.eta_time).toBe(7680);
    expect(dr.formatted.items[0].value).toBe('02:08:00');
  });
});

describe('ResultFormatter numeric formatters NaN guards', () => {
  // Non-numeric ACARS fields ('---', '***', whitespace) become NaN via
  // Number()/parseInt(); these must disappear from formatted.items rather
  // than surfacing as literal "NaN" strings (issue #494).
  const cases: Array<[string, (dr: DecodeResult) => void, string]> = [
    ['heading', (dr) => ResultFormatter.heading(dr, NaN), 'heading'],
    [
      'groundspeed',
      (dr) => ResultFormatter.groundspeed(dr, NaN),
      'groundspeed',
    ],
    ['airspeed', (dr) => ResultFormatter.airspeed(dr, NaN), 'airspeed'],
    ['mach', (dr) => ResultFormatter.mach(dr, NaN), 'mach'],
    ['day', (dr) => ResultFormatter.day(dr, NaN), 'day'],
    ['month', (dr) => ResultFormatter.month(dr, NaN), 'month'],
    [
      'departureDay',
      (dr) => ResultFormatter.departureDay(dr, NaN),
      'departure_day',
    ],
    ['arrivalDay', (dr) => ResultFormatter.arrivalDay(dr, NaN), 'arrival_day'],
  ];

  test.each(cases)(
    '%s skips NaN instead of pushing a "NaN" item',
    (_name, invoke, rawKey) => {
      const dr = makeDecodeResult();
      invoke(dr);
      expect(dr.formatted.items.length).toBe(0);
      expect((dr.raw as Record<string, unknown>)[rawKey]).toBeUndefined();
    },
  );

  test('heading still formats a valid value', () => {
    const dr = makeDecodeResult();
    ResultFormatter.heading(dr, 270);
    expect(dr.raw.heading).toBe(270);
    expect(dr.formatted.items[0].value).toBe('270');
  });

  test('groundspeed still formats a valid value', () => {
    const dr = makeDecodeResult();
    ResultFormatter.groundspeed(dr, 420);
    expect(dr.raw.groundspeed).toBe(420);
    expect(dr.formatted.items[0].value).toBe('420 knots');
  });

  test('mach still formats a valid value', () => {
    const dr = makeDecodeResult();
    ResultFormatter.mach(dr, 0.84);
    expect(dr.raw.mach).toBe(0.84);
    expect(dr.formatted.items[0].value).toBe('0.84 mach');
  });

  test('day still formats a valid value', () => {
    const dr = makeDecodeResult();
    ResultFormatter.day(dr, 12);
    expect(dr.raw.day).toBe(12);
    expect(dr.formatted.items[0].value).toBe('12');
  });
});

const makeResult = (): DecodeResult => ({
  decoded: false,
  decoder: { name: 'test', type: 'pattern-match', decodeLevel: 'none' },
  formatted: { description: '', items: [] },
  raw: {},
  remaining: {},
});

describe('#541 — NaN guards for desiredAltitude and version', () => {
  describe('desiredAltitude', () => {
    it('skips non-numeric desired altitude', () => {
      const result = makeResult();
      ResultFormatter.desiredAltitude(result, NaN);
      expect(
        (result.raw as Record<string, unknown>).desired_alt,
      ).toBeUndefined();
      expect(
        result.formatted.items.some((i) => i.type === 'desired_altitude'),
      ).toBe(false);
    });

    it('still formats a valid desired altitude', () => {
      const result = makeResult();
      ResultFormatter.desiredAltitude(result, 34000);
      expect(result.formatted.items).toContainEqual(
        expect.objectContaining({ type: 'desired_altitude', value: '34000' }),
      );
    });
  });

  describe('version', () => {
    it('skips non-numeric message version', () => {
      const result = makeResult();
      ResultFormatter.version(result, NaN);
      expect((result.raw as Record<string, unknown>).version).toBeUndefined();
      expect(result.formatted.items.some((i) => i.type === 'version')).toBe(
        false,
      );
    });

    it('still formats a valid version', () => {
      const result = makeResult();
      ResultFormatter.version(result, 2.0);
      expect(result.formatted.items).toContainEqual(
        expect.objectContaining({ type: 'version', value: 'v2.0' }),
      );
    });
  });
});

describe('ResultFormatter speed, track, wind, weight and gate', () => {
  test('indicatedAirspeed', () => {
    const dr = makeDecodeResult();
    ResultFormatter.indicatedAirspeed(dr, 252);
    expect(dr.raw.indicated_airspeed).toBe(252);
    expect(dr.formatted.items).toEqual([
      {
        type: 'indicated_airspeed',
        code: 'IAS',
        label: 'Indicated Airspeed',
        value: '252 knots',
      },
    ]);
  });

  test('track', () => {
    const dr = makeDecodeResult();
    ResultFormatter.track(dr, 259);
    expect(dr.raw.track).toBe(259);
    expect(dr.formatted.items).toEqual([
      { type: 'track', code: 'TRK', label: 'Track', value: '259 degrees' },
    ]);
  });

  test('wind with direction and speed', () => {
    const dr = makeDecodeResult();
    ResultFormatter.wind(dr, 274, 60);
    expect(dr.raw.wind_direction).toBe(274);
    expect(dr.raw.wind_speed).toBe(60);
    expect(dr.formatted.items).toEqual([
      {
        type: 'wind',
        code: 'WIND',
        label: 'Wind',
        value: '274 degrees at 60 knots',
      },
    ]);
  });

  test('wind with only one of direction and speed', () => {
    const dr = makeDecodeResult();
    ResultFormatter.wind(dr, undefined, 60);
    expect(dr.raw.wind_direction).toBeUndefined();
    expect(dr.raw.wind_speed).toBe(60);
    expect(dr.formatted.items[0].label).toBe('Wind Speed');
    expect(dr.formatted.items[0].value).toBe('60 knots');

    const dr2 = makeDecodeResult();
    ResultFormatter.wind(dr2, 274, undefined);
    expect(dr2.raw.wind_direction).toBe(274);
    expect(dr2.formatted.items[0].label).toBe('Wind Direction');
    expect(dr2.formatted.items[0].value).toBe('274 degrees');

    const dr3 = makeDecodeResult();
    ResultFormatter.wind(dr3, undefined, undefined);
    expect(dr3.formatted.items.length).toBe(0);
  });

  test('grossWeight', () => {
    const dr = makeDecodeResult();
    ResultFormatter.grossWeight(dr, 142080);
    expect(dr.raw.gross_weight).toBe(142080);
    expect(dr.formatted.items).toEqual([
      {
        type: 'gross_weight',
        code: 'GWT',
        label: 'Gross Weight',
        value: '142080 pounds',
      },
    ]);
  });

  test('arrivalGate', () => {
    const dr = makeDecodeResult();
    ResultFormatter.arrivalGate(dr, 'B12');
    expect(dr.raw.arrival_gate).toBe('B12');
    expect(dr.formatted.items).toEqual([
      { type: 'gate', code: 'AGATE', label: 'Arrival Gate', value: 'B12' },
    ]);
  });
});

describe('ResultFormatter.raw', () => {
  test('writes a named field and its item', () => {
    const dr = makeDecodeResult();
    ResultFormatter.raw(
      dr,
      'taxi_start_time',
      'TAXI',
      'Taxi Start Time',
      '12:10:00',
    );
    expect(dr.raw.taxi_start_time).toBe('12:10:00');
    expect(dr.formatted.items).toEqual([
      {
        type: 'taxi_start_time',
        code: 'TAXI',
        label: 'Taxi Start Time',
        value: '12:10:00',
      },
    ]);
  });

  test('can store a different value in raw than it shows', () => {
    const dr = makeDecodeResult();
    ResultFormatter.raw(
      dr,
      'report_interval',
      'RPTINT',
      'Position Report Interval',
      '5 minutes',
      5,
    );
    expect(dr.raw.report_interval).toBe(5);
    expect(dr.formatted.items[0].value).toBe('5 minutes');
  });
});

describe('ResultFormatter landing data and track points', () => {
  test('landingAirport', () => {
    const dr = makeDecodeResult();
    ResultFormatter.landingAirport(dr, 'KAMA');
    expect(dr.raw.landing_icao).toBe('KAMA');
    expect(dr.formatted.items).toEqual([
      { type: 'icao', code: 'LAND', label: 'Landing Airport', value: 'KAMA' },
    ]);
  });

  test('trackPoint adds each point to raw.track_points', () => {
    const dr = makeDecodeResult();
    const point = {
      latitude: 36.36167,
      longitude: -121.595,
      day: 4,
      time: 84480,
      altitude: 23951,
      temperature: -22.5,
      windDirection: 187,
      windSpeed: 45,
      phase: 'Descent',
    };
    ResultFormatter.trackPoint(dr, point);
    ResultFormatter.trackPoint(dr, { ...point, altitude: 22146 });
    expect(dr.raw.track_points).toEqual([point, { ...point, altitude: 22146 }]);
    expect(dr.formatted.items[0]).toEqual({
      type: 'track_point',
      code: 'TRKPT',
      label: 'Track Point',
      value:
        '36.362 N, 121.595 W at 23:28:00, 23951 feet, -22.5 C, wind 187 degrees at 45 knots, Descent',
    });
    expect(dr.formatted.items.length).toBe(2);
  });

  test('runwayLandingData shows only the parts sent', () => {
    const dr = makeDecodeResult();
    ResultFormatter.runwayLandingData(dr, {
      runway: '35L',
      length: 8472,
      flaps: 30,
      headwind: 11,
      crosswind: 8,
      crosswindSide: 'L',
      vref: 132,
      vtarget: 138,
      additive: 6,
      maxLandingWeight: '129.2/S',
      landingWeight: 128000,
      stoppingMargins: { AB2: 1235, AB3: 2644, ABM: 4070 },
    });
    ResultFormatter.runwayLandingData(dr, {
      runway: '33',
      length: 6847,
      headwind: -20,
      crosswind: 5,
      crosswindSide: 'L',
      landingWeight: 126000,
      stoppingMargins: {},
      notes: ['20KT TAILGUST >10 LIMIT'],
    });
    expect(dr.raw.landing_runways?.length).toBe(2);
    expect(dr.formatted.items[0]).toEqual({
      type: 'runway_landing_data',
      code: 'RWYLDG',
      label: 'Runway Landing Data',
      value:
        '35L: 8472 feet, flaps 30, headwind 11 knots, crosswind 8 knots left, VREF 132 knots, VTGT 138 knots (+6), MRLW 129.2/S, LDW 128000 pounds, stopping margin AB2 1235 feet, AB3 2644 feet, ABM 4070 feet',
    });
    expect(dr.formatted.items[1].value).toBe(
      '33: 6847 feet, tailwind 20 knots, crosswind 5 knots left, LDW 126000 pounds, 20KT TAILGUST >10 LIMIT',
    );
  });
});

describe('ResultFormatter.variableWind', () => {
  test('shows a variable wind with its speed', () => {
    const dr = makeDecodeResult();
    ResultFormatter.variableWind(dr, 4);
    expect(dr.raw.wind_speed).toBe(4);
    expect(dr.raw.wind_direction).toBeUndefined();
    expect(dr.raw.wind_variable).toBe(true);
    expect(dr.formatted.items).toEqual([
      {
        type: 'wind',
        code: 'WIND',
        label: 'Wind',
        value: 'variable at 4 knots',
      },
    ]);
  });
});
