import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_A02 } from './Label_H1_A02';

describe('Label H1 A02', () => {
  let plugin: Label_H1_A02;
  const message = { label: 'H1', text: '' };
  const item = (result: ReturnType<Label_H1_A02['decode']>, label: string) =>
    result.formatted.items.find((i) => i.label === label)?.value;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_A02(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-a02');
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1'],
      preambles: ['A02/A'],
    });
  });

  test('decodes a CFM report without a unit configuration', () => {
    // A319 N757UW, KORD-KDCA
    message.text =
      'A02/A31902,1,1/CCN757UW,OCT30,014329,KORD,KDCA,2769/C106,80038,5000,XX,0010,0,0100,XX,X/CEN340,36996,244,758,1163,270,C83014/CNN336,36986,244,757,1163,270/EC779584,01027,14266,00639,73,22,11/EE575632,01027,04948,00639,73/N10796,0796,0900,5609,0217,XXXXX/N20796,0796,0899,5665,0218,XXXXX/S1XXXXX,0463,1040,3913,XXXX,030,N00/S2XXXXX,0470,1019,3846,XXXX,033,N00/T1099,100,025,35,055,04626,0224/T2099,099,018,36,061,04596,0156/V104,06,041,215,01,01,00004/V209,05,158,251,04,00,00000/V308,04,148,270,0614/V410,05,261,084,0613/V5XX,XX,XXX,XXX,XXXX/V6XX,XX,XXX,XXX,XXXX/V7041,082,00081,22222222222111/V8038,097,00081,22222222222111/X100362,N003,0025,0002,N0006,N013/X200425,N005,0023,0002,N0007,N013/X30000,0005,0000,N007,N007,0001,N000/X4N000,N001,N001,N001,0000,0000/X5N000,N001,N000,0000,0000,0000/X61386,W0822,N410,073,289,0169,XXXX/X71386,W0822,N410,073,289,0150,XXXX,/';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe(
      'Cruise Performance Report',
    );
    expect(decodeResult.remaining.text).toBeUndefined();
    expect(decodeResult.raw.aircraft_type).toBe('A319');
    expect(decodeResult.raw.tail).toBe('N757UW');
    expect(decodeResult.raw.departure_icao).toBe('KORD');
    expect(decodeResult.raw.arrival_icao).toBe('KDCA');
    expect(decodeResult.raw.flight_number).toBe('2769');
    expect(item(decodeResult, 'Report Time')).toBe('01:43:29');
    expect(item(decodeResult, 'Unit Configuration')).toBe(
      'XX (units not sent)',
    );
    // settled scaling
    expect(item(decodeResult, 'Total Air Temperature')).toBe(
      '-34.0 C / -33.6 C',
    );
    expect(decodeResult.raw.altitude).toBe(36996);
    expect(decodeResult.raw.mach).toBe(0.758);
    expect(decodeResult.raw.n1).toEqual([79.6, 79.6]);
    expect(decodeResult.raw.egt).toEqual([560.9, 566.5]);
    expect(decodeResult.raw.descent_n1).toEqual([61.4, 61.3]);
    expect(item(decodeResult, 'Climb N1')).toBe(
      'not available / not available',
    );
    expect(decodeResult.raw.wing_fuel).toEqual([362, 425]);
    expect(decodeResult.raw.true_heading).toEqual([138.6, 138.6]);
    expect(decodeResult.raw.position).toEqual({
      latitude: 41,
      longitude: -82.2,
    });
    expect(decodeResult.raw.wind_direction).toEqual([289, 289]);
    expect(decodeResult.raw.fuel_temperature).toEqual([16.9, 15]);
    // open scaling: shown as sent
    expect(item(decodeResult, 'T25 Compressor Temperature (unscaled)')).toBe(
      '0463 / 0470',
    );
    expect(
      item(decodeResult, 'P3 Compressor Discharge Pressure (unscaled)'),
    ).toBe('1040 / 1019');
    expect(item(decodeResult, 'Right Aileron (unscaled)')).toBe('N007');
    // no unit configuration, so no units
    expect(
      item(
        decodeResult,
        'Gross Weight (unscaled, unit configuration not sent)',
      ),
    ).toBe('1163 / 1163');
    expect(
      item(decodeResult, 'Fuel Flow (unscaled, unit configuration not sent)'),
    ).toBe('0217 / 0218');
  });

  test('decodes gross weight and fuel flow in kilograms', () => {
    // A320 PR-MHA, SBPA-SABE, unit configuration 42
    message.text =
      'A02/A32002,1,1/CCPR-MHA,APR08,110749,SBPA,SABE,8128/C106,76801,5000,42,0010,0,0100,42,X/CEN164,35997,251,759,6159,354,C31030/CNN157,36015,251,761,6159,354/EC569922,03033,02737,01980,73,14,07/EE643262,03033,02555,01980,73/N10851,0852,0943,6362,1200,XXXXX/N20852,0852,0945,6782,1252,XXXXX/S1XXXXX,0745,1191,4435,XXXX,022,000/S2XXXXX,0766,1204,4540,XXXX,025,N00/T1098,100,026,41,071,04871,XXXX/T2097,099,019,42,100,04885,XXXX/V104,00,116,176,03,00,00000/V205,04,155,164,07,02,00000/V3XX,XX,XXX,XXX,XXXX/V4XX,XX,XXX,XXX,XXXX/V5XX,XX,XXX,XXX,XXXX/V6XX,XX,XXX,XXX,XXXX/V7042,089,00061,22222222222111/V8042,088,00061,22222222222111/X102235,N000,0024,0004,N0003,0006/X202340,N003,0024,0004,N0003,0006/X30003,0010,N008,N005,N003,0005,0000/X4N000,0000,N001,0000,0000,0000/X50000,0000,N001,0000,0000,0000/X62327,W0563,S327,047,271,0131,0810/X72328,W0563,S327,049,270,0135,0804/';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(item(decodeResult, 'Unit Configuration')).toBe('42 (kilograms)');
    expect(decodeResult.raw.gross_weight).toBe(61590);
    expect(item(decodeResult, 'Gross Weight')).toBe('61590 kg / 61590 kg');
    expect(decodeResult.raw.fuel_flow).toEqual([1200, 1252]);
    expect(decodeResult.raw.position).toEqual({
      latitude: -32.7,
      longitude: -56.3,
    });
  });

  test('decodes an IAE report, with its engine blocks as sent', () => {
    // A320 N668AW, KPIT-KORD, unit configuration 11
    message.text =
      'A02/A32002,1,1/CCN668AW,OCT29,211548,KPIT,KORD,0969/C106,19938,5000,11,0010,0,0100,11,X/CE0044,19989,299,649,1262,327,I21024/CN0050,19999,300,650,1262,327/EC010565,01620,01006,73,30,30/EE012075,01620,01006,73/N11097,1097,3899,0721,0847,0303,11937/N21097,1097,3932,0720,0846,0304,11900/S117270,0650,1559,4077,09931,058/S217247,0653,1553,4037,09904,057/T1069,080,00,025,46,131,08975,0049/T2067,080,00,020,43,182,08984,0046/V103D04,00208,08000,248,108,N089/V203D04,00208,08000,241,108,N129/V3000,000,016/V4011,000,230/X100234,0000,0011,0001,N0014,N001/X200255,0002,0009,0001,N0013,N001/X30002,0009,N007,N008,N003,0003,0000/X4N000,0000,0000,0000,0000,0000/X5N001,N001,0000,0000,0000,0000/X62556,W0863,N426,045,274,0033,0831/X72556,W0863,N426,046,273,0026,0649,/';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(item(decodeResult, 'Total Air Temperature')).toBe('4.4 C / 5.0 C');
    expect(decodeResult.raw.gross_weight).toBe(126200);
    expect(decodeResult.raw.n1).toBeUndefined();
    expect(item(decodeResult, 'N1 (IAE layout, unscaled)')).toBe(
      '1097,1097,3899,0721,0847,0303,11937',
    );
    expect(item(decodeResult, 'V3 (IAE layout, unscaled)')).toBe('000,000,016');
    expect(decodeResult.raw.true_heading).toEqual([255.6, 255.6]);
  });

  test('decodes a report sent with line breaks', () => {
    // A320 EI-DEF, EIDW-LFPG: '-' for minus and for not available
    message.text =
      'A02/A32002,1,6/CCEI-DEF,SEP02,074303,EIDW,LFPG,0522/\nC106,76801,5000,45,0010,0,0100,45,X/\nCE-170,33002,277,781,5913,347,C31I84/\nCN-171,33018,277,782,5912,347/\nEC697779,15955,04185,09152,73,25,17/\nEE577229,24500,15094,14976,73/\nN10827,0827,0933,6220,1285,-----/\nN20827,0827,0932,6229,1262,-----/\nS1-----,0718,1320,4275,----,035,004/\nS2-----,0717,1296,4323,----,035,000/\nT1100,101,026,44,081,05749,0090/\nT2100,101,018,42,095,05841,0104/\nV104,10,168,264,02,01,00000/\nV206,02,006,022,02,00,00000/\nV309,07,253,247,0621/\nV403,04,012,129,0621/\nV502,00,244,241,0931/\nV601,01,225,313,0930/\nV7041,089,00081,22222222222811/\nV8042,090,00061,22222222222G11/\nX101609,-001,0013,0003,-----,----/\nX201780,-001,0013,0003,-----,----/\nX30006,0015,-010,-007,-002,0009,0000/\nX40000,0000,0000,-004,0000,0000/\nX50000,-004,0000,0000,0000,0000/\nX61446,W0024,N527,097,296,0171,0800/\nX71447,W0024,N527,098,296,0167,0806/\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(item(decodeResult, 'Page')).toBe('1 of 6');
    expect(item(decodeResult, 'Total Air Temperature')).toBe(
      '-17.0 C / -17.1 C',
    );
    expect(item(decodeResult, 'PS13 Static Pressure (unscaled)')).toBe(
      'not available / not available',
    );
    expect(decodeResult.raw.climb_n1).toEqual([93.1, 93]);
    expect(decodeResult.raw.fuel_flow).toEqual([1285, 1262]);
  });

  test('decodes the first block of a report on its own', () => {
    // the copy sent before the rest: the cut block stays undecoded
    message.text =
      'A02/A32102,1,1/CCN157UW,OCT18,210148,MMSD,KORD,2636/C106,76801,5000,11,0010,0,0100,11,X/CEN088,33000,270,764,1783,297,C72041/CNN090,33022,271,766,1783,297/EC779867,03259,04451,01353,73,06,02/EE779833,03259,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.gross_weight).toBe(178300);
    expect(decodeResult.raw.engine_serial).toBe('779867');
    expect(decodeResult.remaining.text).toBe('EE779833,03259,');
  });

  test('is picked by the message decoder', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: 'H1',
      text: 'A02/A32102,1,1/CCN157UW,OCT18,210148,MMSD,KORD,2636/C106,76801,5000,11,0010,0,0100,11,X/',
    });
    expect(decodeResult.decoder.name).toBe('label-h1-a02');
  });

  test('does not decode another report', () => {
    message.text = 'A02/B12345,1,1/CCN157UW,OCT18,210148,MMSD,KORD,2636/';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });
});
