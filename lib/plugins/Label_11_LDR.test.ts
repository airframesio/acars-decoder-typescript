import { MessageDecoder } from '../MessageDecoder';
import { Label_11_LDR } from './Label_11_LDR';

describe('Label 11 LDR landing data', () => {
  let plugin: Label_11_LDR;
  const message = { label: '11', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_11_LDR(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-11-ldr');
    expect(plugin.qualifiers()).toEqual({
      labels: ['11'],
      preambles: ['LDR01,'],
    });
  });

  test('decodes a card with two runways', () => {
    // https://app.airframes.io/messages/7911900305
    message.text =
      'LDR01,KSMF LANDING DATA,FLT     METAR-2253Z\n' +
      '1717    WIND       LDW\n' +
      'TIME    317/14G--  128.0\n' +
      '2340Z   OAT/DEW  35L    \n' +
      '        022/003  35R    \n' +
      '        QNH\n' +
      '        30.01\n' +
      'REMARKS\n' +
      'CK WING FROST IF FUEL\n' +
      'TEMP LESS THAN +5\n \n \n \n \n' +
      '35L                 8472\n' +
      'FLAPS 30                \n' +
      'VREF/VTGT        11H/08L\n' +
      ' 132/138 +6    AB2  1235\n' +
      'MRLW 129.2/S   AB3  2644\n' +
      ' LDW 128.0     ABM  4070\n \n' +
      '35R                 8605\n' +
      'FLAPS 30                \n' +
      'VREF/VTGT        11H/08L\n' +
      ' 132/138 +6    AB2  1370\n' +
      'MRLW 129.2/S   AB3  2777\n' +
      ' LDW 128.0     ABM  4203\n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Landing Data');
    expect(decodeResult.raw.landing_icao).toBe('KSMF');
    expect(decodeResult.raw.flight_number).toBe('1717');
    expect(decodeResult.raw.wind_direction).toBe(317);
    expect(decodeResult.raw.wind_speed).toBe(14);
    expect(decodeResult.raw.landing_weight).toBe(128000);
    expect(decodeResult.raw.message_timestamp).toBe(85200); // 23:40
    expect(decodeResult.raw.outside_air_temperature).toBe(22);
    expect(decodeResult.raw.dew_point).toBe(3);
    expect(decodeResult.raw.altimeter).toBe(30.01);
    expect(decodeResult.raw.landing_runways?.length).toBe(2);
    expect(decodeResult.raw.landing_runways?.[1]).toEqual({
      runway: '35R',
      length: 8605,
      flaps: 30,
      headwind: 11,
      crosswind: 8,
      crosswindSide: 'L',
      vref: 132,
      vtarget: 138,
      additive: 6,
      maxLandingWeight: '129.2/S',
      landingWeight: 128000,
      stoppingMargins: { AB2: 1370, AB3: 2777, ABM: 4203 },
    });
    expect(decodeResult.formatted.items.map((i) => [i.label, i.value])).toEqual(
      [
        ['Landing Airport', 'KSMF'],
        ['METAR Time', '22:53:00'],
        ['Flight Number', '1717'],
        ['Wind', '317 degrees at 14 knots'],
        ['Landing Weight', '128000 pounds'],
        ['Message Timestamp', '23:40:00'],
        ['Outside Air Temperature (C)', '22 degrees'],
        ['Dew Point (C)', '3 degrees'],
        ['Altimeter', '30.01 inHg'],
        ['Runways', '35L, 35R'],
        ['Remarks', 'CK WING FROST IF FUEL TEMP LESS THAN +5'],
        [
          'Runway Landing Data',
          '35L: 8472 feet, flaps 30, headwind 11 knots, crosswind 8 knots left, VREF 132 knots, VTGT 138 knots (+6), MRLW 129.2/S, LDW 128000 pounds, stopping margin AB2 1235 feet, AB3 2644 feet, ABM 4070 feet',
        ],
        [
          'Runway Landing Data',
          '35R: 8605 feet, flaps 30, headwind 11 knots, crosswind 8 knots left, VREF 132 knots, VTGT 138 knots (+6), MRLW 129.2/S, LDW 128000 pounds, stopping margin AB2 1370 feet, AB3 2777 feet, ABM 4203 feet',
        ],
      ],
    );
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('decodes gusts, a tailwind runway with no data and its note', () => {
    // https://app.airframes.io/messages/6296788294
    message.text =
      'LDR01,KBDL LANDING DATA,FLT     METAR-2351Z\r\n' +
      '2390    WIND       LDW\r\n' +
      'TIME    173/11G22  126.0\r\n' +
      '0019Z   OAT/DEW  24     \r\n' +
      '        002/-06  33     \r\n' +
      '        QNH\r\n' +
      '        29.91\r\n' +
      'REMARKS\r\n' +
      'CK WING FROST IF FUEL\r\n' +
      'TEMP LESS THAN -1\r\n \r\n \r\n \r\n \r\n' +
      '24                  9509\r\n' +
      'FLAPS 30                \r\n' +
      'VREF/VTGT        04H/10L\r\n' +
      ' 131/144 +13   AB2  1744\r\n' +
      'MRLW 129.2/S   AB3  3131\r\n' +
      ' LDW 126.0     ABM  4774\r\n \r\n' +
      '33                  6847\r\n' +
      'FLAPS --                \r\n' +
      'VREF/VTGT        20T/05L\r\n' +
      ' ---/---       AB2  ----\r\n' +
      'MRLW -----/-   AB3  ----\r\n' +
      ' LDW 126.0     ABM  ----\r\n' +
      '20KT TAILGUST >10 LIMIT\r\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.wind_gust).toBe(22);
    expect(decodeResult.raw.outside_air_temperature).toBe(2);
    expect(decodeResult.raw.dew_point).toBe(-6);
    expect(decodeResult.raw.landing_runways?.[1]).toEqual({
      runway: '33',
      length: 6847,
      headwind: -20,
      crosswind: 5,
      crosswindSide: 'L',
      landingWeight: 126000,
      stoppingMargins: {},
      notes: ['20KT TAILGUST >10 LIMIT'],
    });
    const items = decodeResult.formatted.items;
    expect(items.find((i) => i.label === 'Wind Gust')?.value).toBe('22 knots');
    expect(items[items.length - 2].value).toBe(
      '24: 9509 feet, flaps 30, headwind 4 knots, crosswind 10 knots left, VREF 131 knots, VTGT 144 knots (+13), MRLW 129.2/S, LDW 126000 pounds, stopping margin AB2 1744 feet, AB3 3131 feet, ABM 4774 feet',
    );
    expect(items[items.length - 1].value).toBe(
      '33: 6847 feet, tailwind 20 knots, crosswind 5 knots left, LDW 126000 pounds, 20KT TAILGUST >10 LIMIT',
    );
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('keeps a runway name with its suffix', () => {
    // https://app.airframes.io/messages/7905994932
    message.text =
      'LDR01,KMSY LANDING DATA,FLT     METAR-1953Z\n' +
      '1929    WIND       LDW\n' +
      'TIME    032/08G--  121.4\n' +
      '2001Z   OAT/DEW  11/AIB \n' +
      '        025/009\n' +
      '        QNH\n' +
      '        30.11\n' +
      'REMARKS\n' +
      'CK WING FROST IF FUEL\n' +
      'TEMP LESS THAN +5\n \n \n \n \n' +
      '11/AIB -E1804F      8047\n' +
      'FLAPS 30                \n' +
      'VREF/VTGT        02H/08L\n' +
      ' 132/137 +5    AB2   797\n' +
      'MRLW 151.5/S   AB3  2202\n' +
      ' LDW 121.4     ABM  3634\n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.wind_direction).toBe(32);
    expect(
      decodeResult.formatted.items.find((i) => i.label === 'Runways')?.value,
    ).toBe('11/AIB');
    expect(decodeResult.raw.landing_runways?.[0].runway).toBe('11/AIB -E1804F');
    expect(decodeResult.raw.landing_runways?.[0].variant).toBe(
      '1804 feet off the east end',
    );
    expect(decodeResult.raw.landing_runways?.[0].length).toBe(8047);
    expect(decodeResult.raw.landing_runways?.[0].stoppingMargins).toEqual({
      AB2: 797,
      AB3: 2202,
      ABM: 3634,
    });
    expect(
      decodeResult.formatted.items.find(
        (i) => i.label === 'Runway Landing Data',
      )?.value,
    ).toBe(
      '11/AIB -E1804F (1804 feet off the east end): 8047 feet, flaps 30, headwind 2 knots, crosswind 8 knots left, VREF 132 knots, VTGT 137 knots (+5), MRLW 151.5/S, LDW 121400 pounds, stopping margin AB2 797 feet, AB3 2202 feet, ABM 3634 feet',
    );
  });

  test('decodes the alternative runways offered for an unavailable runway', () => {
    // https://app.airframes.io/messages/7904009994
    message.text =
      'LDR01,KMSY LANDING DATA,FLT     METAR-1653Z\n4202    WIND       LDW\nTIME    062/08G--  118.8\n' +
      '1710Z   OAT/DEW\n        023/008\n        QNH\n        30.19\n' +
      'REMARKS\nRWY CURRENTLY UNAVAIL   \n--- ALTERNATIVE RWYS ---\n' +
      '11-E1804F         11/AIB\n29-E1804F         29/AIB\n \n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.remarks).toBe('RWY CURRENTLY UNAVAIL');
    expect(decodeResult.raw.alternative_runways).toEqual([
      {
        runway: '11/AIB',
        name: '11-E1804F',
        variant: '1804 feet off the east end',
      },
      {
        runway: '29/AIB',
        name: '29-E1804F',
        variant: '1804 feet off the east end',
      },
    ]);
    expect(
      decodeResult.formatted.items.find(
        (i) => i.label === 'Alternative Runways',
      )?.value,
    ).toBe(
      '11/AIB (1804 feet off the east end), 29/AIB (1804 feet off the east end)',
    );
    expect(decodeResult.raw.landing_runways).toBeUndefined();
  });

  test('decodes a plain list of alternative runways', () => {
    // https://app.airframes.io/messages/7837896986
    message.text =
      'LDR01,KMCO LANDING DATA,FLT     METAR-1053Z\n4872    WIND       LDW\nTIME    357/04G--  138.5\n' +
      '1130Z   OAT/DEW\n        022/022\n        QNH\n        30.06\n' +
      'REMARKS\nNO VALID RWYS REQUESTED \n--- ALTERNATIVE RWYS ---\n' +
      '18L                     \n36R                     \n35L                     \n' +
      '17R                     \n35R                     \n \n \n \n \n \n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.remarks).toBe('NO VALID RWYS REQUESTED');
    expect(
      decodeResult.formatted.items.find(
        (i) => i.label === 'Alternative Runways',
      )?.value,
    ).toBe('18L, 36R, 35L, 17R, 35R');
    expect(decodeResult.raw.alternative_runways?.[0]).toEqual({
      runway: '18L',
    });
  });

  test('decodes the first block of a card', () => {
    // https://app.airframes.io/messages/7909419361
    message.text =
      'LDR01,KOAK LANDING DATA,FLT     METAR-1553Z\n' +
      '1974    WIND       LDW\n' +
      'TIME    317/05G--  137.6\n' +
      '1646Z   OAT/DEW  30     \n' +
      '        015/012\n' +
      '        QNH\n' +
      '        30.08\n' +
      'REMARKS\n' +
      'CK WING FROST IF FUEL\n' +
      'TEMP LESS THAN +5\n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.landing_icao).toBe('KOAK');
    expect(decodeResult.raw.landing_weight).toBe(137600);
    expect(decodeResult.raw.landing_runways).toBeUndefined();
    expect(
      decodeResult.formatted.items.find((i) => i.label === 'Runways')?.value,
    ).toBe('30');
  });

  test('decodes a variable wind', () => {
    // https://app.airframes.io/messages/7909566304 (the first block only)
    message.text =
      'LDR01,KLAX LANDING DATA,FLT     METAR-1553Z\n' +
      '400     WIND       LDW\n' +
      'TIME    VRB/04G--  139.5\n' +
      '1700Z   OAT/DEW  24R    \n' +
      '        018/013  25L    \n' +
      '        QNH\n' +
      '        30.01\n' +
      'REMARKS\n' +
      'CK WING FROST IF FUEL\n' +
      'TEMP LESS THA';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.wind_direction).toBeUndefined();
    expect(decodeResult.raw.wind_speed).toBe(4);
    expect(
      decodeResult.formatted.items.find((i) => i.label === 'Wind')?.value,
    ).toBe('variable at 4 knots');
    expect(
      decodeResult.formatted.items.find((i) => i.label === 'Remarks')?.value,
    ).toBe('CK WING FROST IF FUEL TEMP LESS THA');
  });

  test('decodes a card with no METAR time', () => {
    // https://app.airframes.io/messages/7910092961
    message.text =
      'LDR01,KPHL LANDING DATA,FLT\n4879    WIND       LDW\nTIME    060/10G17  130.8\n' +
      '1748Z   OAT/DEW  09R    \n        016/002  09L    \n        QNH      27R    \n        30.37\n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n \n \n \n' +
      '09R                11902\nFLAPS 30                \nVREF/VTGT        08H/05L\n' +
      ' 139/151 +12   AB2  3921\nMRLW 146.3/S   AB3  5230\n LDW 130.8     ABM  6978\n \n' +
      '09L                 9453\nFLAPS 30                \nVREF/VTGT        08H/05L\n' +
      ' 139/151 +12   AB2  1479\nMRLW 146.3/S   AB3  2783\n LDW 130.8     ABM  4529\n \n' +
      '27R                 8864\nFLAPS --                \nVREF/VTGT        16T/05R\n' +
      ' ---/---       AB2  ----\nMRLW -----/-   AB3  ----\n LDW 130.8     ABM  ----\n' +
      '16KT TAILGUST >10 LIMIT\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.landing_icao).toBe('KPHL');
    expect(decodeResult.raw.metar_time).toBeUndefined();
    expect(
      decodeResult.formatted.items.find((i) => i.label === 'Runways')?.value,
    ).toBe('09R, 09L, 27R');
    expect(decodeResult.raw.landing_runways?.length).toBe(3);
  });

  test('decodes temperatures below zero', () => {
    // https://app.airframes.io/messages/5967756495
    message.text =
      'LDR01,KPVD LANDING DATA,FLT     METAR-1151Z\n1676    WIND       LDW\nTIME    004/04G--  112.5\n' +
      '1205Z   OAT/DEW  05     \n        -10/-17\n        QNH\n        30.24\n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN -12\n \n \n \n \n' +
      '05                  8693\nFLAPS 30                \nVREF/VTGT        02H/03L\n' +
      ' 129/134 +5    AB2  2233\nMRLW 146.3/S   AB3  3289\n LDW 112.5     ABM  4549\n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.outside_air_temperature).toBe(-10);
    expect(decodeResult.raw.dew_point).toBe(-17);
    expect(decodeResult.raw.altimeter).toBe(30.24);
  });

  test('decodes QNH in hectopascals', () => {
    // https://app.airframes.io/messages/7918030056
    message.text =
      'LDR01,MUHA LANDING DATA,FLT     METAR-1350Z\n3952    WIND       LDW\nTIME    026/09G--  140.6\n' +
      '1409Z   OAT/DEW  06     \n        023/019\n        QNH\n        1017 \n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n \n \n \n' +
      '06                 13123\nFLAPS 30                \nVREF/VTGT        07H/06L\n' +
      ' 143/148 +5    AB2  5119\nMRLW 151.5/S   AB3  6744\n LDW 140.6     ABM  8383\n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.altimeter).toBe(1017);
    expect(
      decodeResult.formatted.items.find((i) => i.label === 'Altimeter')?.value,
    ).toBe('1017 hPa');
    expect(decodeResult.raw.landing_runways?.[0].length).toBe(13123);
  });

  test('decodes a runway sent with notes instead of figures', () => {
    // https://app.airframes.io/messages/7551271590
    message.text =
      'LDR01,KLAS LANDING DATA,FLT     METAR-2256Z\n588     WIND       LDW\nTIME    199/15G25  149.0\n' +
      '2305Z   OAT/DEW  26L    \n        041/009  19R    \n        QNH\n        29.73\n' +
      'REMARKS\nRUN PERF/WB>BRK COOL\nFOR HOT BRAKE CAUTIONS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n \n' +
      '26L                10394\nFLAPS 30                \nVREF/VTGT        07H/13L\n' +
      ' 147/161 +14   AB2   301\nMRLW 151.5/S   AB3  2221\n LDW 149.0     ABM  4582\n \n' +
      '26L                10394\nMQTW 148.0 EXCEEDED\n \nGROUND COOLING REQUIRED\n \n' +
      'RUN PERF/WB>BRK COOL\nFOR HOT BRAKE CAUTIONS\n' +
      '19R                 8416\nFLAPS 30                \nVREF/VTGT        14H/02R\n' +
      ' 147/162 +15   AB2  ----\nMRLW 151.5/S   AB3   480\n LDW 149.0     ABM  2746\n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    const runways = decodeResult.raw.landing_runways!;
    expect(runways.map((r) => r.runway)).toEqual(['26L', '26L', '19R']);
    expect(runways[1]).toEqual({
      runway: '26L',
      length: 10394,
      stoppingMargins: {},
      notes: [
        'MQTW 148.0 EXCEEDED',
        'GROUND COOLING REQUIRED',
        'RUN PERF/WB>BRK COOL',
        'FOR HOT BRAKE CAUTIONS',
      ],
    });
    expect(runways[2].stoppingMargins).toEqual({ AB3: 480, ABM: 2746 });
    expect(runways[2].crosswindSide).toBe('R');
  });

  test('keeps a cut-off runway block as remaining', () => {
    // https://app.airframes.io/messages/7911900305, cut after the second runway's flaps line
    message.text =
      'LDR01,KSMF LANDING DATA,FLT     METAR-2253Z\n' +
      '1717    WIND       LDW\n' +
      'TIME    317/14G--  128.0\n' +
      '2340Z   OAT/DEW  35L    \n' +
      '        022/003  35R    \n' +
      '        QNH\n' +
      '        30.01\n' +
      'REMARKS\n' +
      'CK WING FROST IF FUEL\n' +
      'TEMP LESS THAN +5\n \n \n \n \n' +
      '35L                 8472\n' +
      'FLAPS 30                \n' +
      'VREF/VTGT        11H/08L\n' +
      ' 132/138 +6    AB2  1235\n' +
      'MRLW 129.2/S   AB3  2644\n' +
      ' LDW 128.0     ABM  4070\n \n' +
      '35R                 8605\n' +
      'FLAPS 30';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.landing_runways?.length).toBe(1);
    expect(decodeResult.remaining.text).toBe(
      '35R                 8605\nFLAPS 30',
    );
  });

  test('decodes an unavailable runway, sent with length 0', () => {
    // https://app.airframes.io/messages/7857750353
    message.text =
      'LDR01,KMDW LANDING DATA,FLT     METAR-2153Z\n329     WIND       LDW\nTIME    254/10G--  138.3\n' +
      '2244Z   OAT/DEW         \n        013/002  31R    \n        QNH\n        30.45\n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n \n \n \n' +
      '22                     0\nFLAPS --                \nVREF/VTGT        ---/---\n' +
      ' ---/---       AB2  ----\nMRLW -----/-   AB3  ----\n LDW 138.3     ABM  ----\n' +
      '/////INVALID RUNWAY/////\n' +
      '31R                 5826\nFLAPS 40                \nVREF/VTGT        04H/09L\n' +
      ' 136/141 +5    AB2  ----\nMRLW 146.3/S   AB3  ----\n LDW 138.3     ABM  1213\n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.remarks).toBe(
      'CK WING FROST IF FUEL TEMP LESS THAN +5',
    );
    const runways = decodeResult.raw.landing_runways!;
    expect(runways.map((r) => r.runway)).toEqual(['22', '31R']);
    expect(runways[0]).toEqual({
      runway: '22',
      length: 0,
      landingWeight: 138300,
      stoppingMargins: {},
      notes: ['/////INVALID RUNWAY/////'],
    });
    expect(runways[1].stoppingMargins).toEqual({ ABM: 1213 });
  });

  test('keeps an alternative runway cut off by the end of the block as remaining', () => {
    // https://app.airframes.io/messages/7904009664 (the first block only: the full card has
    // 11-E1804F where this one ends)
    message.text =
      'LDR01,KMSY LANDING DATA,FLT     METAR-1653Z\n4202    WIND       LDW\nTIME    062/08G--  118.8\n' +
      '1710Z   OAT/DEW\n        023/008\n        QNH\n        30.19\n' +
      'REMARKS\nRWY CURRENTLY UNAVAIL   \n--- ALTERNATIVE RWYS ---\n11';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.remarks).toBe('RWY CURRENTLY UNAVAIL');
    expect(decodeResult.raw.alternative_runways).toBeUndefined();
    expect(decodeResult.remaining.text).toBe('11');
  });

  test('keeps a runway heading cut off after the remarks', () => {
    // https://app.airframes.io/messages/7911900305, cut inside the first runway's heading
    message.text =
      'LDR01,KSMF LANDING DATA,FLT     METAR-2253Z\n1717    WIND       LDW\nTIME    317/14G--  128.0\n' +
      '2340Z   OAT/DEW  35L    \n        022/003  35R    \n        QNH\n        30.01\n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n \n \n \n35L';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.remarks).toBe(
      'CK WING FROST IF FUEL TEMP LESS THAN +5',
    );
    expect(decodeResult.remaining.text).toBe('35L');
  });

  test('keeps a runway heading cut off after a runway', () => {
    // https://app.airframes.io/messages/7911900305, cut inside the second runway's heading
    message.text =
      'LDR01,KSMF LANDING DATA,FLT     METAR-2253Z\n1717    WIND       LDW\nTIME    317/14G--  128.0\n' +
      '2340Z   OAT/DEW  35L    \n        022/003  35R    \n        QNH\n        30.01\n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n \n \n \n' +
      '35L                 8472\nFLAPS 30                \nVREF/VTGT        11H/08L\n' +
      ' 132/138 +6    AB2  1235\nMRLW 129.2/S   AB3  2644\n LDW 128.0     ABM  4070\n \n' +
      '35R                 86';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.landing_runways?.length).toBe(1);
    expect(decodeResult.raw.landing_runways?.[0].notes).toBeUndefined();
    expect(decodeResult.remaining.text).toBe('35R                 86');
  });

  test('keeps a runway cut off in its FLAPS line', () => {
    // https://app.airframes.io/messages/7911900305, cut inside the second runway's FLAPS line
    message.text =
      'LDR01,KSMF LANDING DATA,FLT     METAR-2253Z\n1717    WIND       LDW\nTIME    317/14G--  128.0\n' +
      '2340Z   OAT/DEW  35L    \n        022/003  35R    \n        QNH\n        30.01\n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n \n \n \n' +
      '35L                 8472\nFLAPS 30                \nVREF/VTGT        11H/08L\n' +
      ' 132/138 +6    AB2  1235\nMRLW 129.2/S   AB3  2644\n LDW 128.0     ABM  4070\n \n' +
      '35R                 8605\nFLAPS 3';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.landing_runways?.length).toBe(1);
    expect(decodeResult.remaining.text).toBe(
      '35R                 8605\nFLAPS 3',
    );
  });

  test('keeps a runway cut off inside the word FLAPS', () => {
    // https://app.airframes.io/messages/7911900305, cut inside the second runway's FLAPS line
    message.text =
      'LDR01,KSMF LANDING DATA,FLT     METAR-2253Z\n1717    WIND       LDW\nTIME    317/14G--  128.0\n' +
      '2340Z   OAT/DEW  35L    \n        022/003  35R    \n        QNH\n        30.01\n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n \n \n \n' +
      '35L                 8472\nFLAPS 30                \nVREF/VTGT        11H/08L\n' +
      ' 132/138 +6    AB2  1235\nMRLW 129.2/S   AB3  2644\n LDW 128.0     ABM  4070\n \n' +
      '35R                 8605\nFLAP';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.landing_runways?.length).toBe(1);
    expect(decodeResult.remaining.text).toBe('35R                 8605\nFLAP');
  });

  test('marks a card cut off inside its header as partial', () => {
    // https://app.airframes.io/messages/7909419361, the first three lines
    message.text =
      'LDR01,KOAK LANDING DATA,FLT     METAR-1553Z\n' +
      '1974    WIND       LDW\n' +
      'TIME    317/05G--  137.6\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.landing_weight).toBe(137600);
  });

  test('keeps times out of range as remaining', () => {
    // https://app.airframes.io/messages/7909419361 with the METAR time 25:60 and the card time 24:75
    message.text =
      'LDR01,KOAK LANDING DATA,FLT     METAR-2560Z\n' +
      '1974    WIND       LDW\n' +
      'TIME    317/05G--  137.6\n' +
      '2475Z   OAT/DEW  30     \n' +
      '        015/012\n        QNH\n        30.08\n' +
      'REMARKS\nCK WING FROST IF FUEL\nTEMP LESS THAN +5\n \n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.landing_icao).toBe('KOAK');
    expect(decodeResult.raw.metar_time).toBeUndefined();
    expect(decodeResult.raw.message_timestamp).toBeUndefined();
    expect(decodeResult.remaining.text).toBe('METAR-2560Z\n2475Z');
  });

  test('is chosen by the message decoder', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: '11',
      text:
        'LDR01,KOAK LANDING DATA,FLT     METAR-1553Z\r\n' +
        '1974    WIND       LDW\r\n' +
        'TIME    317/05G--  137.6\r\n',
    });
    expect(decodeResult.decoder.name).toBe('label-11-ldr');
    expect(decodeResult.raw.landing_icao).toBe('KOAK');
  });

  test('does not decode a bad header', () => {
    message.text = 'LDR01,Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.remaining.text).toBe('LDR01,Bogus message');
  });
});
