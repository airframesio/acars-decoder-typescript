import { DecodeResult, RawFields } from './DecoderPluginInterface';

describe('RawFields type', () => {
  test('known fields are accessible with correct types', () => {
    const raw: RawFields = {};

    // Position
    raw.position = { latitude: 33.87, longitude: -84.302 };
    expect(raw.position.latitude).toBe(33.87);
    expect(raw.position.longitude).toBe(-84.302);

    // Altitude
    raw.altitude = 35000;
    expect(raw.altitude).toBe(35000);

    // Airport codes
    raw.departure_icao = 'KATL';
    raw.arrival_icao = 'KJFK';
    expect(raw.departure_icao).toBe('KATL');
    expect(raw.arrival_icao).toBe('KJFK');

    // Times
    raw.message_timestamp = 86400;
    raw.eta_time = 43200;
    expect(raw.message_timestamp).toBe(86400);
    expect(raw.eta_time).toBe(43200);

    // Fuel
    raw.fuel_on_board = 50000;
    raw.fuel_remaining = 30000;
    expect(raw.fuel_on_board).toBe(50000);
    expect(raw.fuel_remaining).toBe(30000);
  });

  test('allows plugin-specific fields via index signature', () => {
    const raw: RawFields = {};

    // Custom fields from plugins (e.g., Label_SQ, Label_H1_ATIS)
    raw.network = 'A';
    raw.atis_code = 'B';
    raw.loadsheet = { some: 'data' };

    expect(raw.network).toBe('A');
    expect(raw.atis_code).toBe('B');
    expect(raw.loadsheet).toEqual({ some: 'data' });
  });

  test('works correctly within a DecodeResult', () => {
    const result: DecodeResult = {
      decoded: true,
      decoder: { name: 'test', type: 'pattern-match', decodeLevel: 'full' },
      formatted: { description: 'Test', items: [] },
      raw: {},
      remaining: {},
    };

    result.raw.position = { latitude: 40.0, longitude: -74.0 };
    result.raw.altitude = 10000;
    result.raw.departure_icao = 'KEWR';

    expect(result.raw.position).toEqual({ latitude: 40.0, longitude: -74.0 });
    expect(result.raw.altitude).toBe(10000);
    expect(result.raw.departure_icao).toBe('KEWR');
  });
});
