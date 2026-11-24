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
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.checksum).toBe(0x2917);
    expect(decodeResult.raw.gross_weight).toBe(133700);
    expect(decodeResult.raw.center_of_gravity).toBe(26.2);
    expect(decodeResult.raw.cruise_altitude).toBe(32000);
    expect(decodeResult.raw.reserve_fuel).toBe(6000);
    expect(decodeResult.raw.cost_index).toBe(24);
    expect(decodeResult.raw.cruise_wind_direction).toBe(275);
    expect(decodeResult.raw.cruise_wind_speed).toBe(103);
    expect(decodeResult.raw.cruise_temperature).toBe(-53);
    expect(decodeResult.raw.transition_altitude).toBe(18000);
    expect(decodeResult.raw.assumed_temperature).toBe(52);
    expect(decodeResult.raw.derate).toBe(0);
    expect(decodeResult.raw.fuel_remaining).toBe(22200);
    expect(item(decodeResult, 'Gross Weight')).toBe('133700 pounds');
    expect(item(decodeResult, 'Centre of Gravity')).toBe('26.2 % MAC');
    expect(item(decodeResult, 'Cruise Altitude')).toBe('32000 feet');
    expect(item(decodeResult, 'Reserve Fuel')).toBe('6000 pounds');
    expect(item(decodeResult, 'Cost Index')).toBe('24');
    expect(item(decodeResult, 'Cruise Wind')).toBe('275 degrees at 103 knots');
    expect(item(decodeResult, 'Cruise Temperature (C)')).toBe('-53 degrees');
    expect(item(decodeResult, 'Transition Altitude')).toBe('18000 feet');
    expect(item(decodeResult, 'Assumed Temperature')).toBe('52 degrees');
    expect(item(decodeResult, 'Derate (probable)')).toBe('0');
    expect(item(decodeResult, 'Message Checksum')).toBeDefined();
    expect(decodeResult.remaining.text).toBe('');
  });

  test('decodes long variant (18 fields)', () => {
    message.text =
      'PER/PR1218,276,340,134,,0,68,,M56,180,,,P30,P0,33936,,1084,284388D';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.checksum).toBe(0x388d);
    expect(decodeResult.raw.gross_weight).toBe(121800);
    expect(decodeResult.raw.center_of_gravity).toBe(27.6);
    expect(decodeResult.raw.cruise_altitude).toBe(34000);
    expect(decodeResult.raw.reserve_fuel).toBe(0);
    expect(decodeResult.raw.cost_index).toBe(68);
    expect(decodeResult.raw.taxi_fuel).toBeUndefined();
    expect(decodeResult.raw.cruise_temperature).toBe(-56);
    expect(decodeResult.raw.transition_altitude).toBe(18000);
    expect(decodeResult.raw.assumed_temperature).toBe(30);
    expect(decodeResult.raw.derate).toBe(0);
    expect(decodeResult.raw.block_fuel).toBe(33936);
    expect(decodeResult.raw.zero_fuel_weight).toBe(108400);
    expect(decodeResult.raw.zero_fuel_cg).toBe(28.4);
    expect(item(decodeResult, 'Reserve Fuel')).toBe('0 pounds');
    expect(item(decodeResult, 'Cost Index')).toBe('68');
    expect(item(decodeResult, 'Assumed Temperature')).toBe('30 degrees');
    expect(item(decodeResult, 'Block Fuel')).toBe('33936 pounds');
    expect(item(decodeResult, 'Zero Fuel Weight')).toBe('108400 pounds');
    expect(item(decodeResult, 'Zero Fuel CG')).toBe('28.4 % MAC');
    expect(decodeResult.raw.plan_or_block_fuel).toBeUndefined();
    expect(decodeResult.raw.fuel_remaining).toBe(13400);
    expect(decodeResult.remaining.text).toBe('');
  });

  test('decodes idx4 as plan or block fuel (ARINC 702A-5 Att. 7)', () => {
    // 12-field layout with idx4 filled (214): PLAN OR BLOCK FUEL, element 5
    // of the PR downlink (ARINC Characteristic 702A-5, Attachment 7 §7). The
    // unit is not documented, so the raw number is kept without a unit
    // assertion.
    message.text = 'PER/PR1337,262,320,222,214,60,24,275103,M53,180,P52,P0DC3D';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.checksum).toBe(0xdc3d);
    expect(decodeResult.raw.plan_or_block_fuel).toBe(214);
    expect(item(decodeResult, 'Plan or Block Fuel (unit per AOC host)')).toBe(
      '214',
    );
    expect(decodeResult.raw.fuel_remaining).toBe(22200);
    expect(decodeResult.remaining.text).toBe('');
  });

  test('decodes 19-field layout', () => {
    message.text = 'PER/PR3367,280,400,168,,119,300,,,180,P13,P0,,,,,,,M25F07D';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.checksum).toBe(0xf07d);
    expect(decodeResult.raw.gross_weight).toBe(336700);
    expect(decodeResult.raw.center_of_gravity).toBe(28.0);
    expect(decodeResult.raw.cruise_altitude).toBe(40000);
    expect(decodeResult.raw.reserve_fuel).toBe(11900);
    expect(decodeResult.raw.cost_index).toBe(300);
    expect(decodeResult.raw.transition_altitude).toBe(18000);
    expect(decodeResult.raw.assumed_temperature).toBe(13);
    expect(decodeResult.raw.derate).toBe(0);
    expect(decodeResult.raw.cruise_temperature).toBe(-25);
    expect(item(decodeResult, 'Assumed Temperature')).toBe('13 degrees');
    expect(item(decodeResult, 'Cruise Temperature (C)')).toBe('-25 degrees');
    expect(decodeResult.raw.fuel_remaining).toBe(16800);
    expect(decodeResult.remaining.text).toBe('');
  });

  test('leaves implausible or malformed values in remaining', () => {
    // 18-field layout. The CG is four digits (not 0.1 % MAC), the cost index
    // is 1001 (over the 3-digit bound), the taxi fuel is 36,200 lb (over the
    // 36,100 lb bound), the assumed temperature is 101 C, and the derate is
    // -101 %.
    message.text =
      'PER/PR1218,1000,340,134,,0,1001,,M56,180,,,P101,M101,33936,362,1084,2845ACA';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.center_of_gravity).toBeUndefined();
    expect(decodeResult.raw.cost_index).toBeUndefined();
    expect(decodeResult.raw.taxi_fuel).toBeUndefined();
    expect(decodeResult.raw.assumed_temperature).toBeUndefined();
    expect(decodeResult.raw.derate).toBeUndefined();
    expect(decodeResult.remaining.text).toContain('1000');
    expect(decodeResult.remaining.text).toContain('1001');
    expect(decodeResult.remaining.text).toContain('362');
    expect(decodeResult.remaining.text).toContain('P101');
    expect(decodeResult.remaining.text).toContain('M101');
  });

  test('decodes the boundary values it accepts', () => {
    message.text =
      'PER/PR1218,999,340,134,,0,999,,M56,180,,,P100,M100,33936,361,1084,2845070';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.center_of_gravity).toBe(99.9);
    expect(decodeResult.raw.cost_index).toBe(999);
    expect(decodeResult.raw.taxi_fuel).toBe(36100);
    expect(decodeResult.raw.assumed_temperature).toBe(100);
    expect(decodeResult.raw.derate).toBe(-100);
  });

  test('decodes idx15 as taxi fuel in the 18-field layout (ARINC 702A-5 Att. 7)', () => {
    // idx15 = 45 -> 4,500 lb taxi fuel (NTSB DCA10IA001 NW188: idx15 = 5,
    // 34 min of taxi-out at ~13 lb/min ~ 450 lb).
    message.text =
      'PER/PR1472,312,350,241,,0,45,,M54,180,,,P80,P0,36090,5,1231,334D999';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.reserve_fuel).toBe(0);
    expect(decodeResult.raw.cost_index).toBe(45);
    expect(decodeResult.raw.taxi_fuel).toBe(500);
    expect(decodeResult.raw.block_fuel).toBe(36090);
    expect(decodeResult.raw.zero_fuel_weight).toBe(123100);
    expect(decodeResult.raw.zero_fuel_cg).toBe(33.4);
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
