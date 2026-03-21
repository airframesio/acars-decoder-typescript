import { DecodeResult } from '../DecoderPluginInterface';
import { ResultFormatter } from './result_formatter';

function makeResult(): DecodeResult {
  return {
    decoded: false,
    decoder: { name: 'test', type: 'pattern-match', decodeLevel: 'none' },
    formatted: { description: 'Test', items: [] },
    raw: {},
    remaining: {},
  };
}

describe('ResultFormatter', () => {
  describe('position', () => {
    test('adds position to result', () => {
      const result = makeResult();
      ResultFormatter.position(result, { latitude: 38.5, longitude: -121.3 });
      expect(result.raw.position).toEqual({
        latitude: 38.5,
        longitude: -121.3,
      });
      expect(result.formatted.items).toHaveLength(1);
      expect(result.formatted.items[0].code).toBe('POS');
    });

    test('skips NaN coordinates', () => {
      const result = makeResult();
      ResultFormatter.position(result, { latitude: NaN, longitude: -121.3 });
      expect(result.raw.position).toBeUndefined();
      expect(result.formatted.items).toHaveLength(0);
    });

    test('skips undefined value', () => {
      const result = makeResult();
      ResultFormatter.position(result, undefined);
      expect(result.raw.position).toBeUndefined();
      expect(result.formatted.items).toHaveLength(0);
    });
  });

  describe('altitude', () => {
    test('adds altitude to result', () => {
      const result = makeResult();
      ResultFormatter.altitude(result, 35000);
      expect(result.raw.altitude).toBe(35000);
      expect(result.formatted.items[0].value).toBe('35000 feet');
    });

    test('skips NaN altitude', () => {
      const result = makeResult();
      ResultFormatter.altitude(result, NaN);
      expect(result.raw.altitude).toBeUndefined();
      expect(result.formatted.items).toHaveLength(0);
    });
  });

  describe('flightNumber', () => {
    test('adds flight number to result', () => {
      const result = makeResult();
      ResultFormatter.flightNumber(result, 'UA123');
      expect(result.raw.flight_number).toBe('UA123');
      expect(result.formatted.items[0].code).toBe('FLIGHT');
    });

    test('skips empty flight number', () => {
      const result = makeResult();
      ResultFormatter.flightNumber(result, '');
      expect(result.raw.flight_number).toBeUndefined();
      expect(result.formatted.items).toHaveLength(0);
    });
  });

  describe('airports', () => {
    test('adds departure airport as ICAO', () => {
      const result = makeResult();
      ResultFormatter.departureAirport(result, 'KSFO');
      expect(result.raw.departure_icao).toBe('KSFO');
      expect(result.formatted.items[0].code).toBe('ORG');
    });

    test('adds departure airport as IATA', () => {
      const result = makeResult();
      ResultFormatter.departureAirport(result, 'SFO', 'IATA');
      expect(result.raw.departure_iata).toBe('SFO');
    });

    test('adds arrival airport as ICAO', () => {
      const result = makeResult();
      ResultFormatter.arrivalAirport(result, 'KLAX');
      expect(result.raw.arrival_icao).toBe('KLAX');
      expect(result.formatted.items[0].code).toBe('DST');
    });

    test('adds arrival airport as IATA', () => {
      const result = makeResult();
      ResultFormatter.arrivalAirport(result, 'LAX', 'IATA');
      expect(result.raw.arrival_iata).toBe('LAX');
    });

    test('adds alternate airport', () => {
      const result = makeResult();
      ResultFormatter.alternateAirport(result, 'KOAK');
      expect(result.raw.alternate_icao).toBe('KOAK');
      expect(result.formatted.items[0].code).toBe('ALT_DST');
    });
  });

  describe('runways', () => {
    test('adds departure runway', () => {
      const result = makeResult();
      ResultFormatter.departureRunway(result, '28L');
      expect(result.raw.departure_runway).toBe('28L');
    });

    test('adds arrival runway', () => {
      const result = makeResult();
      ResultFormatter.arrivalRunway(result, '10R');
      expect(result.raw.arrival_runway).toBe('10R');
    });

    test('adds alternate runway', () => {
      const result = makeResult();
      ResultFormatter.alternateRunway(result, '09');
      expect(result.raw.alternate_runway).toBe('09');
    });
  });

  describe('fuel', () => {
    test('adds current fuel', () => {
      const result = makeResult();
      ResultFormatter.currentFuel(result, 45000);
      expect(result.raw.fuel_on_board).toBe(45000);
    });

    test('adds burned fuel', () => {
      const result = makeResult();
      ResultFormatter.burnedFuel(result, 12000);
      expect(result.raw.fuel_burned).toBe(12000);
    });

    test('adds remaining fuel', () => {
      const result = makeResult();
      ResultFormatter.remainingFuel(result, 33000);
      expect(result.raw.fuel_remaining).toBe(33000);
    });

    test('adds OOOI fuel values', () => {
      const result = makeResult();
      ResultFormatter.outFuel(result, 50000);
      ResultFormatter.offFuel(result, 49000);
      ResultFormatter.onFuel(result, 38000);
      ResultFormatter.inFuel(result, 37500);
      expect(result.raw.out_fuel).toBe(50000);
      expect(result.raw.off_fuel).toBe(49000);
      expect(result.raw.on_fuel).toBe(38000);
      expect(result.raw.in_fuel).toBe(37500);
      expect(result.formatted.items).toHaveLength(4);
    });
  });

  describe('speed', () => {
    test('adds groundspeed', () => {
      const result = makeResult();
      ResultFormatter.groundspeed(result, 450);
      expect(result.raw.groundspeed).toBe(450);
      expect(result.formatted.items[0].value).toBe('450 knots');
    });

    test('adds airspeed', () => {
      const result = makeResult();
      ResultFormatter.airspeed(result, 480);
      expect(result.raw.airspeed).toBe(480);
    });

    test('adds mach', () => {
      const result = makeResult();
      ResultFormatter.mach(result, 0.82);
      expect(result.raw.mach).toBe(0.82);
    });
  });

  describe('temperature', () => {
    test('adds temperature with M prefix (negative)', () => {
      const result = makeResult();
      ResultFormatter.temperature(result, 'M45');
      expect(result.raw.outside_air_temperature).toBe(-45);
    });

    test('adds temperature with P prefix (positive)', () => {
      const result = makeResult();
      ResultFormatter.temperature(result, 'P15');
      expect(result.raw.outside_air_temperature).toBe(15);
    });

    test('skips empty temperature', () => {
      const result = makeResult();
      ResultFormatter.temperature(result, '');
      expect(result.raw.outside_air_temperature).toBeUndefined();
      expect(result.formatted.items).toHaveLength(0);
    });

    test('adds total air temperature', () => {
      const result = makeResult();
      ResultFormatter.totalAirTemp(result, 'M20');
      expect(result.raw.total_air_temperature).toBe(-20);
    });
  });

  describe('times', () => {
    test('adds OOOI times', () => {
      const result = makeResult();
      ResultFormatter.out(result, 3600);
      ResultFormatter.off(result, 4200);
      ResultFormatter.on(result, 10800);
      ResultFormatter.in(result, 11400);
      expect(result.raw.out_time).toBe(3600);
      expect(result.raw.off_time).toBe(4200);
      expect(result.raw.on_time).toBe(10800);
      expect(result.raw.in_time).toBe(11400);
    });

    test('adds ETA', () => {
      const result = makeResult();
      ResultFormatter.eta(result, 54000);
      expect(result.raw.eta_time).toBe(54000);
      expect(result.formatted.items[0].code).toBe('ETA');
    });

    test('adds timestamp', () => {
      const result = makeResult();
      ResultFormatter.timestamp(result, 43200);
      expect(result.raw.message_timestamp).toBe(43200);
    });
  });

  describe('unknown', () => {
    test('sets remaining text', () => {
      const result = makeResult();
      ResultFormatter.unknown(result, 'leftover data');
      expect(result.remaining.text).toBe('leftover data');
    });

    test('appends to existing remaining text with separator', () => {
      const result = makeResult();
      ResultFormatter.unknown(result, 'part1');
      ResultFormatter.unknown(result, 'part2');
      expect(result.remaining.text).toBe('part1,part2');
    });

    test('uses custom separator', () => {
      const result = makeResult();
      ResultFormatter.unknown(result, 'part1');
      ResultFormatter.unknown(result, 'part2', '/');
      expect(result.remaining.text).toBe('part1/part2');
    });
  });

  describe('unknownArr', () => {
    test('joins array and appends to remaining', () => {
      const result = makeResult();
      ResultFormatter.unknownArr(result, ['a', 'b', 'c']);
      expect(result.remaining.text).toBe('a,b,c');
    });
  });

  describe('misc fields', () => {
    test('adds heading', () => {
      const result = makeResult();
      ResultFormatter.heading(result, 270);
      expect(result.raw.heading).toBe(270);
    });

    test('adds tail', () => {
      const result = makeResult();
      ResultFormatter.tail(result, 'N12345');
      expect(result.raw.tail).toBe('N12345');
    });

    test('adds callsign', () => {
      const result = makeResult();
      ResultFormatter.callsign(result, 'UAL123');
      expect(result.raw.callsign).toBe('UAL123');
    });

    test('adds text', () => {
      const result = makeResult();
      ResultFormatter.text(result, 'FREE TEXT MSG');
      expect(result.raw.text).toBe('FREE TEXT MSG');
    });

    test('adds day and month', () => {
      const result = makeResult();
      ResultFormatter.day(result, 15);
      ResultFormatter.month(result, 6);
      expect(result.raw.day).toBe(15);
      expect(result.raw.month).toBe(6);
    });

    test('adds checksum', () => {
      const result = makeResult();
      ResultFormatter.checksum(result, 0xabcd);
      expect(result.raw.checksum).toBe(0xabcd);
      expect(result.formatted.items[0].value).toBe('0xabcd');
    });

    test('adds version', () => {
      const result = makeResult();
      ResultFormatter.version(result, 2);
      expect(result.raw.version).toBe(2);
      expect(result.formatted.items[0].value).toBe('v2.0');
    });

    test('adds center of gravity variants', () => {
      const result = makeResult();
      ResultFormatter.cg(result, 25.5, 'center');
      ResultFormatter.cg(result, 20.0, 'lower');
      ResultFormatter.cg(result, 30.0, 'upper');
      expect(result.raw.center_of_gravity).toBe(25.5);
      expect(result.raw.cg_lower_limit).toBe(20.0);
      expect(result.raw.cg_upper_limit).toBe(30.0);
    });
  });
});
