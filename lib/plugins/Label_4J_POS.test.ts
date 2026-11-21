import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label 4J POS', () => {
  let plugin: Arinc702;
  const message = { label: '4J', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes inmarsat', () => {
    // https://app.airframes.io/messages/2434848463
    message.text =
      'POS/ID91459S,BANKR31,/DC03032024,142813/MR64,0/ET31539/PSN39277W077359,142800,240,N39300W077110,031430,N38560W077150,M28,27619,MT370/CG311,160,350/FB732/VR329071';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    // Raw field checks
    expect(decodeResult.raw.message_timestamp).toBe(1709476093);
    expect(decodeResult.raw.sequence_number).toBe(64);
    expect(decodeResult.raw.sequence_response).toBe(0);
    expect(decodeResult.raw.tail).toBe('91459S');
    expect(decodeResult.raw.flight_number).toBe('BANKR31');
    expect(decodeResult.raw.mission_number).toBe('');
    expect(decodeResult.raw.day).toBe(3);
    expect(decodeResult.raw.eta_time).toBe(56340);
    expect(decodeResult.raw.position.latitude).toBeCloseTo(39.462, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-77.598, 3);
    expect(decodeResult.raw.altitude).toBe(24000);
    expect(decodeResult.raw.route.waypoints.length).toBe(3);
    expect(decodeResult.raw.outside_air_temperature).toBe(-28);
    expect(decodeResult.raw.center_of_gravity).toBe(31.1);
    expect(decodeResult.raw.cg_lower_limit).toBe(16);
    expect(decodeResult.raw.cg_upper_limit).toBe(35);
    expect(decodeResult.raw.fuel_on_board).toBe(732);
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.wind_direction).toBe(276);
    expect(decodeResult.raw.wind_speed).toBe(19);
    expect(decodeResult.raw.airspeed).toBe(370);
    expect(decodeResult.formatted.items.length).toBe(18);
    expect(decodeResult.remaining.text).toBe('');
  });

  test('decodes <invalid>', () => {
    message.text = 'POS/ Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});

// Military (AMC-format) POS reports seen on Airframes, 2026-11-19 to 2026-11-21
describe('Label 4J military POS', () => {
  const decoder = new MessageDecoder();

  test('without callsign or mission (southern hemisphere)', () => {
    const result = decoder.decode({
      label: '4J',
      text: 'POS/IDA97464,TROJ05,/DC19112026,231643/MR14,/ET200003/PSS30525E152131,231643,210,VEG01,192334,VONDO,M15,263020,T223/CG,,/FB308/VR327DD5',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.mission_number).toBe('');
    expect(result.raw.mission).toBeUndefined();
    expect(result.raw.position?.latitude).toBeLessThan(0);
    expect(result.raw.wind_direction).toBe(263);
    expect(result.raw.wind_speed).toBe(20);
    expect(result.raw.airspeed).toBe(223);
  });

  test('MT speed and 4 digit wind', () => {
    const result = decoder.decode({
      label: '4J',
      text: 'POS/ID23571S,,/DC19112026,234005/MR56,/ET192342/PSN64458W147121,234000,25,RW14,192342,EIL,P9,1138,MT150/CG271,180,350/FB332/VR323709',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.wind_direction).toBe(113);
    expect(result.raw.wind_speed).toBe(8);
    expect(result.raw.airspeed).toBe(150);
    expect(result.raw.mach).toBeUndefined();
  });
});
