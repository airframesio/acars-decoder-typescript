import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label_H1 PER', () => {
  let plugin: Arinc702;
  const message = { label: 'H1', text: '' };
  const item = (result: ReturnType<Arinc702['decode']>, label: string) =>
    result.formatted.items.find((i) => i.label === label)?.value;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes short variant (12 fields)', () => {
    message.text = 'PER/PR1337,262,320,222,,60,24,275103,M53,180,P52,P02917';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x2917);
    expect(decodeResult.raw.gross_weight).toBe(133700);
    expect(decodeResult.raw.center_of_gravity).toBe(26.2);
    expect(decodeResult.raw.cruise_altitude).toBe(32000);
    expect(decodeResult.raw.cost_index).toBe(60);
    expect(decodeResult.raw.taxi_fuel).toBe(240);
    expect(decodeResult.raw.cruise_wind_direction).toBe(275);
    expect(decodeResult.raw.cruise_wind_speed).toBe(103);
    expect(decodeResult.raw.cruise_temperature).toBe(-53);
    expect(decodeResult.raw.transition_altitude).toBe(18000);
    expect(decodeResult.raw.assumed_temperature).toBe(52);
    expect(decodeResult.raw.derate).toBe(0);
    expect(item(decodeResult, 'Gross Weight')).toBe('133700 pounds');
    expect(item(decodeResult, 'Centre of Gravity')).toBe('26.2 % MAC');
    expect(item(decodeResult, 'Cruise Altitude')).toBe('32000 feet');
    expect(item(decodeResult, 'Cost Index')).toBe('60');
    expect(item(decodeResult, 'Taxi Fuel')).toBe('240 pounds');
    expect(item(decodeResult, 'Cruise Wind')).toBe('275 degrees at 103 knots');
    expect(item(decodeResult, 'Cruise Temperature (C)')).toBe('-53 degrees');
    expect(item(decodeResult, 'Transition Altitude')).toBe('18000 feet');
    expect(item(decodeResult, 'Assumed Temperature')).toBe('52 degrees');
    expect(item(decodeResult, 'Derate (probable)')).toBe('0');
    expect(item(decodeResult, 'Message Checksum')).toBeDefined();
    expect(decodeResult.remaining.text).toBe('222');
  });

  test('decodes long variant (18 fields)', () => {
    message.text =
      'PER/PR1218,276,340,134,,0,68,,M56,180,,,P30,P0,33936,,1084,284388D';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x388d);
    expect(decodeResult.raw.gross_weight).toBe(121800);
    expect(decodeResult.raw.center_of_gravity).toBe(27.6);
    expect(decodeResult.raw.cruise_altitude).toBe(34000);
    expect(decodeResult.raw.cost_index).toBe(0);
    expect(decodeResult.raw.taxi_fuel).toBe(680);
    expect(decodeResult.raw.cruise_temperature).toBe(-56);
    expect(decodeResult.raw.transition_altitude).toBe(18000);
    expect(decodeResult.raw.assumed_temperature).toBe(30);
    expect(decodeResult.raw.derate).toBe(0);
    expect(decodeResult.raw.block_fuel).toBe(33936);
    expect(decodeResult.raw.zero_fuel_weight).toBe(108400);
    expect(decodeResult.raw.zero_fuel_cg).toBe(28.4);
    expect(item(decodeResult, 'Cost Index')).toBe('0');
    expect(item(decodeResult, 'Taxi Fuel')).toBe('680 pounds');
    expect(item(decodeResult, 'Assumed Temperature')).toBe('30 degrees');
    expect(item(decodeResult, 'Block Fuel')).toBe('33936 pounds');
    expect(item(decodeResult, 'Zero Fuel Weight')).toBe('108400 pounds');
    expect(item(decodeResult, 'Zero Fuel CG')).toBe('28.4 % MAC');
    expect(decodeResult.remaining.text).toBe('134');
  });

  test('decodes 19-field layout', () => {
    message.text = 'PER/PR3367,280,400,168,,119,300,,,180,P13,P0,,,,,,,M25F07D';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0xf07d);
    expect(decodeResult.raw.gross_weight).toBe(336700);
    expect(decodeResult.raw.center_of_gravity).toBe(28.0);
    expect(decodeResult.raw.cruise_altitude).toBe(40000);
    expect(decodeResult.raw.cost_index).toBe(119);
    expect(decodeResult.raw.taxi_fuel).toBe(3000);
    expect(decodeResult.raw.transition_altitude).toBe(18000);
    expect(decodeResult.raw.assumed_temperature).toBe(13);
    expect(decodeResult.raw.derate).toBe(0);
    expect(decodeResult.raw.cruise_temperature).toBe(-25);
    expect(item(decodeResult, 'Assumed Temperature')).toBe('13 degrees');
    expect(item(decodeResult, 'Cruise Temperature (C)')).toBe('-25 degrees');
    expect(decodeResult.remaining.text).toBe('168');
  });

  test('leaves implausible or malformed values in remaining', () => {
    // 18-field layout. The CG is four digits (not 0.1 % MAC), the taxi fuel
    // is 10,010 lb (over the 10,000 lb bound), the assumed temperature is
    // 101 C, and the derate is -101 %.
    message.text =
      'PER/PR1218,1000,340,134,,0,1001,,M56,180,,,P101,M101,33936,,1084,284D851';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.center_of_gravity).toBeUndefined();
    expect(decodeResult.raw.taxi_fuel).toBeUndefined();
    expect(decodeResult.raw.assumed_temperature).toBeUndefined();
    expect(decodeResult.raw.derate).toBeUndefined();
    expect(decodeResult.remaining.text).toContain('1000');
    expect(decodeResult.remaining.text).toContain('1001');
    expect(decodeResult.remaining.text).toContain('P101');
    expect(decodeResult.remaining.text).toContain('M101');
  });

  test('decodes the boundary values it accepts', () => {
    message.text =
      'PER/PR1218,999,340,134,,0,1000,,M56,180,,,P100,M100,33936,,1084,284D3C5';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.center_of_gravity).toBe(99.9);
    expect(decodeResult.raw.taxi_fuel).toBe(10000);
    expect(decodeResult.raw.assumed_temperature).toBe(100);
    expect(decodeResult.raw.derate).toBe(-100);
  });

  test('leaves an undocumented field count in remaining', () => {
    // 13 fields: only 11, 12, 18 and 19 have documented positions.
    message.text =
      'PER/PR1337,262,320,222,,60,24,275103,M53,180,P52,P0,999C4E3';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.checksum).toBe(0xc4e3);
    expect(decodeResult.raw.gross_weight).toBeUndefined();
    expect(decodeResult.raw.cruise_altitude).toBeUndefined();
    expect(decodeResult.raw.transition_altitude).toBeUndefined();
    expect(decodeResult.remaining.text).toContain(
      '1337,262,320,222,,60,24,275103,M53,180,P52,P0,999',
    );
  });

  test('does not decode invalid message', () => {
    message.text = 'PER Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message).toBe(message);
  });
});
