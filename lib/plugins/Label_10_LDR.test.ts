import { MessageDecoder } from '../MessageDecoder';
import { Label_10_LDR } from './Label_10_LDR';

describe('Label_10_LDR', () => {
  let plugin: Label_10_LDR;
  const message = { label: '10', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_10_LDR(decoder);
  });

  test('matches Label 10 Preamble ldr qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-10-ldr');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['10'],
      preambles: ['LDR'],
    });
  });

  test('decodes Label 10 Preamble LDR variant 1', () => {
    message.text =
      'LDR01,189,C,SWA-2600-016,0,N 38.151,W 76.623,37003, 10.2,KATL,KLGA,KLGA,22/,/,/,0,0,,,,,,,0,0,0,00,,135.1,08.6,143.7,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Landing Data Request');
    expect(decodeResult.formatted.items.map((i) => [i.label, i.value])).toEqual(
      [
        ['Airline ID', '189 (Southwest)'],
        ['Request Layout', 'C'],
        ['Software Version', 'SWA-2600-016'],
        ['Aircraft Position', '38.151 N, 76.623 W'],
        ['Altitude', '37003 feet'],
        ['Fuel On Board', '10200'],
        ['Origin', 'KATL'],
        ['Destination', 'KLGA'],
        ['Landing Airport', 'KLGA'],
        ['Arrival Runway', '22'],
        ['Landing Flaps', '30'],
        ['Zero Fuel Weight', '135100 pounds'],
        ['Landing Fuel', '8600 pounds'],
        ['Landing Weight', '143700 pounds'],
      ],
    );
    expect(decodeResult.raw.fuel_on_board).toBe(10200);
    expect(decodeResult.raw.zero_fuel_weight).toBe(135100);
    expect(decodeResult.raw.landing_fuel).toBe(8600);
    expect(decodeResult.raw.landing_weight).toBe(143700);
    expect(decodeResult.raw.landing_flaps).toBe(30);
    // a field that is always 0
    expect(decodeResult.remaining.text).toBe('0');
  });

  test('decodes Label 10 Preamble LDR variant 2', () => {
    message.text =
      'LDR01,189,C,SWA-2600-016,0,N 37.873,W 79.541,30998, 16.6,KBNA,KBOS,KBOS,27/,33L/,22L/,0,1,,,,,,,0,0,0,00,,131.2,11.4,142.6,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.map((i) => [i.label, i.value])).toEqual(
      [
        ['Airline ID', '189 (Southwest)'],
        ['Request Layout', 'C'],
        ['Software Version', 'SWA-2600-016'],
        ['Aircraft Position', '37.873 N, 79.541 W'],
        ['Altitude', '30998 feet'],
        ['Fuel On Board', '16600'],
        ['Origin', 'KBNA'],
        ['Destination', 'KBOS'],
        ['Landing Airport', 'KBOS'],
        ['Arrival Runway', '27'],
        ['Alternate Runway', '33L,22L'],
        ['Landing Flaps', '40'],
        ['Zero Fuel Weight', '131200 pounds'],
        ['Landing Fuel', '11400 pounds'],
        ['Landing Weight', '142600 pounds'],
      ],
    );
    expect(decodeResult.remaining.text).toBe('0');
  });

  test('decodes the airport weather the crew entered', () => {
    // https://app.airframes.io/messages/7921227262
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 32.482,W 99.294,34022,  8.7,KDAL,KMAF,KMAF,16R/,/,/,0,0,130,16,26,022,014,3014,0,0,0,00,,108.1,06.8,114.9,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.map((i) => [i.label, i.value])).toEqual(
      [
        ['Airline ID', '189 (Southwest)'],
        ['Request Layout', 'D'],
        ['Software Version', 'SWA-2600-019'],
        ['Aircraft Position', '32.482 N, 99.294 W'],
        ['Altitude', '34022 feet'],
        ['Fuel On Board', '8700'],
        ['Origin', 'KDAL'],
        ['Destination', 'KMAF'],
        ['Landing Airport', 'KMAF'],
        ['Arrival Runway', '16R'],
        ['Landing Flaps', '30'],
        ['Wind', '130 degrees at 16 knots'],
        ['Wind Gust', '26 knots'],
        ['Outside Air Temperature (C)', '22 degrees'],
        ['Dew Point (C)', '14 degrees'],
        ['Altimeter', '30.14 inHg'],
        ['Zero Fuel Weight', '108100 pounds'],
        ['Landing Fuel', '6800 pounds'],
        ['Landing Weight', '114900 pounds'],
      ],
    );
    expect(decodeResult.raw.altimeter).toBe(30.14);
    expect(decodeResult.remaining.text).toBe('0');
  });

  test('decodes the runway condition, flaps 40 and engine anti-ice', () => {
    // https://app.airframes.io/messages/6407345743
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 41.349,W 89.968,27495,  9.8,KSMF,KMDW,KMDW,4R/,31R/,13L/,1,1,,,,,,,1,0,0,00,,114.9,09.1,124.0,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.formatted.items.map((i) => [i.label, i.value])).toEqual(
      [
        ['Airline ID', '189 (Southwest)'],
        ['Request Layout', 'D'],
        ['Software Version', 'SWA-2600-019'],
        ['Aircraft Position', '41.349 N, 89.968 W'],
        ['Altitude', '27495 feet'],
        ['Fuel On Board', '9800'],
        ['Origin', 'KSMF'],
        ['Destination', 'KMDW'],
        ['Landing Airport', 'KMDW'],
        ['Arrival Runway', '4R'],
        ['Alternate Runway', '31R,13L'],
        ['Runway Condition Code', '5 (good)'],
        ['Landing Flaps', '40'],
        ['Anti-Ice', 'engine'],
        ['Zero Fuel Weight', '114900 pounds'],
        ['Landing Fuel', '9100 pounds'],
        ['Landing Weight', '124000 pounds'],
      ],
    );
    expect(decodeResult.raw.runway_condition_code).toBe(5);
    expect(decodeResult.raw.landing_flaps).toBe(40);
    expect(decodeResult.raw.anti_ice).toBe(1);
    expect(decodeResult.remaining.text).toBe('0');
  });

  test('decodes a worse runway condition and en route icing', () => {
    // https://app.airframes.io/messages/6162609004
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 44.370,W 97.209,39002, 13.2,KSEA,KMDW,KMDW,31R/,/,/,3,1,,,,,,,1,1,0,00,,110.9,07.9,118.8,,,';
    const decodeResult = plugin.decode(message);

    const items = decodeResult.formatted.items.map((i) => [i.label, i.value]);
    expect(items).toContainEqual(['Runway Condition Code', '3 (medium)']);
    expect(items).toContainEqual(['En Route Icing', 'yes']);
    expect(decodeResult.raw.enroute_icing).toBe(true);
  });

  test('decodes runway condition code 2', () => {
    // https://app.airframes.io/messages/7584363300
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 28.871,W 97.010,34108,  9.1,KPHX,KHOU,KHOU,13R/,/,/,4,1,,,,,,,0,0,0,00,,126.8,08.7,135.5,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.runway_condition_code).toBe(2);
    expect(
      decodeResult.formatted.items.find(
        (i) => i.label === 'Runway Condition Code',
      )?.value,
    ).toBe('2 (medium to poor)');
  });

  test('decodes an HGS approach', () => {
    // https://app.airframes.io/messages/7921050129
    message.text =
      'LDR01,189,D,ENG-2600-20E,0,N 27.399,W 83.606,36483, 11.7,KHOU,KFLL,KFLL,10L/,10R/,/,0,0,,,,,,,0,0,1,00,,127.1,10.2,137.3,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.hgs_approach).toBe(true);
    expect(
      decodeResult.formatted.items.find((i) => i.label === 'HGS Approach')
        ?.value,
    ).toBe('yes');
    expect(decodeResult.remaining.text).toBe('0');
  });

  test('decodes flaps 15 and shows the non-normal configuration code as sent', () => {
    // https://app.airframes.io/messages/6141148494
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 41.640,W 88.093,4817,  9.2,KTUS,KMDW,KMDW,31R/,/,/,1,2,,,,,,,0,0,0,6 ,,117.3,09.5,126.8,,,';
    const decodeResult = plugin.decode(message);

    const items = decodeResult.formatted.items.map((i) => [i.label, i.value]);
    expect(items).toContainEqual(['Landing Flaps', '15']);
    expect(items).toContainEqual(['Non-Normal Configuration', '6']);
    expect(decodeResult.raw.landing_flaps).toBe(15);
    expect(decodeResult.raw.non_normal_configuration).toBe(6);
    expect(decodeResult.remaining.text).toBe('0');
  });

  test('shows anti-ice setting 2 as sent', () => {
    // https://app.airframes.io/messages/5949482386
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 42.246,W 81.960,27174, 14.3,KLAS,KROC,KROC,22/,  4/,/,1,0,,,,,,,2,1,0,00,,113.8,12.3,126.1,,,';
    const decodeResult = plugin.decode(message);

    expect(
      decodeResult.formatted.items.find((i) => i.label === 'Anti-Ice')?.value,
    ).toBe('2');
    expect(decodeResult.raw.anti_ice).toBe(2);
  });

  test('decodes the missed approach climb gradient and altitude', () => {
    // https://app.airframes.io/messages/7921345499
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 34.751,W116.923,20233, 10.2,KPHX,KBUR,KBUR,8/, 15/,/,0,1,,,,,,,0,0,0,00,,105.3,09.3,114.6,340,2500,';
    const decodeResult = plugin.decode(message);

    const items = decodeResult.formatted.items.map((i) => [i.label, i.value]);
    expect(items.slice(-2)).toEqual([
      ['Missed Approach Climb Gradient', '340 feet per nautical mile'],
      ['Missed Approach Altitude', '2500 feet'],
    ]);
    expect(decodeResult.raw.missed_approach_gradient).toBe(340);
    expect(decodeResult.raw.missed_approach_altitude).toBe(2500);
    expect(decodeResult.remaining.text).toBe('0');
  });

  test('treats a missed approach gradient of dashes as none', () => {
    // https://app.airframes.io/messages/7921489770
    message.text =
      'LDR01,189,C,SWA-2600-013,0,N 34.693,W117.416,25003, 13.2,KBUR,KLAS,KLAS,1L/,26L/,/,0,0,,,,,,,0,0,0,00,, 96.4,11.6,108.0,----.,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.missed_approach_gradient).toBeUndefined();
    expect(decodeResult.raw.missed_approach_altitude).toBeUndefined();
    expect(decodeResult.remaining.text).toBe('0');
  });

  test('decodes a divert, where the landing airport is not the destination', () => {
    // https://app.airframes.io/messages/6578341950 (runway 22 is at KAMA, not KDAL)
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 34.403,W 99.617,33022, 11.0,KSMF,KDAL,KAMA,22/,/,/,0,0,,,,,,,0,0,0,00,,115.6,09.9,125.5,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.departure_icao).toBe('KSMF');
    expect(decodeResult.raw.arrival_icao).toBe('KDAL');
    expect(decodeResult.raw.landing_icao).toBe('KAMA');
    expect(decodeResult.raw.arrival_runway).toBe('22');
    expect(decodeResult.raw.landing_weight).toBe(125500);
  });

  test('keeps a runway suffix with the runway', () => {
    // https://app.airframes.io/messages/7921358729 (the card names the runway 11/AIB too)
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 32.416,W 95.941,37000, 12.2,KLAS,KMSY,KMSY,11/AIB,/,/,0,0,,,,,,,0,0,0,00,,131.3,09.5,140.8,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.arrival_runway).toBe('11/AIB');
  });

  test('leaves out a position and altitude the request does not have', () => {
    // https://app.airframes.io/messages/7920148994
    message.text =
      'LDR01,189,D,SWA-2600-019,0,----.---,----.---,,  8.2,KLAS,KHOU,KHOU,13R/,/,/,0,0,,,,,,,0,0,0,00,,129.2,06.0,135.2,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.position).toBeUndefined();
    expect(decodeResult.raw.altitude).toBeUndefined();
    expect(decodeResult.raw.landing_weight).toBe(135200);
  });

  test('leaves out blank fuel and weights', () => {
    // https://app.airframes.io/messages/6578341950 with fuel and the three weights blanked
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 34.403,W 99.617,33022,,KSMF,KDAL,KAMA,22/,/,/,0,0,,,,,,,0,0,0,00,,,,,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.fuel_on_board).toBeUndefined();
    expect(decodeResult.raw.zero_fuel_weight).toBeUndefined();
    expect(decodeResult.raw.landing_fuel).toBeUndefined();
    expect(decodeResult.raw.landing_weight).toBeUndefined();
    expect(
      decodeResult.formatted.items.filter((i) =>
        /pounds|^0$|NaN/.test(i.value),
      ),
    ).toEqual([]);
  });

  test('treats weather fields of spaces as not entered', () => {
    // https://app.airframes.io/messages/7921227262 with the six weather fields as spaces
    message.text =
      'LDR01,189,D,SWA-2600-019,0,N 32.482,W 99.294,34022,  8.7,KDAL,KMAF,KMAF,16R/,/,/,0,0, , , , , , ,0,0,0,00,,108.1,06.8,114.9,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.wind_direction).toBeUndefined();
    expect(decodeResult.raw.wind_speed).toBeUndefined();
    expect(decodeResult.raw.wind_gust).toBeUndefined();
    expect(decodeResult.raw.outside_air_temperature).toBeUndefined();
    expect(decodeResult.raw.dew_point).toBeUndefined();
    expect(decodeResult.raw.altimeter).toBeUndefined();
  });

  test('decodes Label 10 Preamble LDR <invalid>', () => {
    message.text = 'LDR Bogus Message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-10-ldr');
    expect(decodeResult.formatted.description).toBe('Landing Data Request');
    expect(decodeResult.message).toBe(message);
  });
});
