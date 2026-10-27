import { MessageDecoder } from '../MessageDecoder';
import { Label_37_SWA } from './Label_37_SWA';

describe('Label_37_SWA', () => {
  let plugin: Label_37_SWA;
  const message = { label: '37', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_37_SWA(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-37-swa');
    expect(plugin.qualifiers()).toEqual({
      labels: ['37'],
      preambles: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
    });
  });

  test('decodes POS01 position report', () => {
    // KMCI,KLAS,N 38.523,W100.807,37999,252,460,.797,15.4,2022,259,274,060,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/8LY:I8KXJHHYLH6K86MMMKI:IKN HKY6M6KJ:YNKIHIIKI:MKI6NKH HK9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.departure_icao).toBe('KMCI');
    expect(decodeResult.raw.arrival_icao).toBe('KLAS');
    expect(decodeResult.raw.position).toEqual({
      latitude: 38.523,
      longitude: -100.807,
    });
    expect(decodeResult.raw.altitude).toBe(37999);
    expect(decodeResult.raw.indicated_airspeed).toBe('252 knots');
    expect(decodeResult.raw.airspeed).toBe(460);
    expect(decodeResult.raw.mach).toBe(0.797);
    expect(decodeResult.raw.fuel_on_board).toBe(15400);
    expect(decodeResult.raw.eta_time).toBe(20 * 3600 + 22 * 60);
    expect(decodeResult.raw.track).toBe('259 degrees');
    expect(decodeResult.raw.wind).toBe('274 degrees at 60 knots');
    expect(decodeResult.raw.outside_air_temperature).toBe(-53);
    expect(decodeResult.raw.gross_weight).toBe('142080 pounds');
    expect(decodeResult.formatted.items.length).toBe(13);
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('decodes FHD04 frequency handoff report', () => {
    // ...,-20,OFF,X,134440,   1,210150,130450,00000
    message.text =
      '05/0.CE\nNOJMANO.TA3VECBG, ATVG,B)CCADZCC AD,GAEC,ABFFCAV)BFADZDGACFDADGCAC(EAXDCAP//A8AZ EEECAVVVZADZCZ(CAZ CE(CACCCCC';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.formatted.description).toBe('Frequency Handoff Report');
    expect(decodeResult.raw.departure_icao).toBe('KMCI');
    expect(decodeResult.raw.arrival_icao).toBe('KMDW');
    expect(decodeResult.raw.altitude).toBe(21003);
    expect(decodeResult.raw.event).toBe('OFF');
    expect(decodeResult.raw.gross_weight).toBe('134440 pounds');
    expect(decodeResult.raw.frequency).toBe('130.450 MHz');
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.remaining.text).toBe('   1,210150,00000');
  });

  test('decodes CLB02 climb report', () => {
    // KMCO,KBDL,N 28.855,|W 81.289|17.3,1445
    message.text = '04PB(38\nS-PC2S(6B2TH85Y5ZZ2\nFH5 Y85:\n MYL2 44Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Climb Report');
    expect(decodeResult.raw.position).toEqual({
      latitude: 28.855,
      longitude: -81.289,
    });
    expect(decodeResult.raw.fuel_on_board).toBe(17300);
    expect(decodeResult.raw.eta_time).toBe(14 * 3600 + 45 * 60);
  });

  test('decodes ETA03 ETA report', () => {
    // KMDW,KLGA,0104,13.3,N 41.404,W 79.888
    message.text = '08JLHR:\nO()2GO6ZHGR RWG :0:G7FW 0WRWG2F450SSS';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('ETA Report');
    expect(decodeResult.raw.departure_icao).toBe('KMDW');
    expect(decodeResult.raw.arrival_icao).toBe('KLGA');
    expect(decodeResult.raw.eta_time).toBe(3600 + 4 * 60);
    expect(decodeResult.raw.fuel_on_board).toBe(13300);
    expect(decodeResult.raw.position).toEqual({
      latitude: 41.404,
      longitude: -79.888,
    });
  });

  test('decodes TDM01 door report', () => {
    // KPDX,KLAS,N 45.588,W122.586|L2,O,1019,033718
    message.text = '01GL.3N\n)4L:Z)EA6Z0I71M1,,ZHNOOM1,-\nEOZFZN3NUZ3PPSN,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.formatted.description).toBe('Door Report');
    expect(decodeResult.raw.door_event).toEqual({
      door: 'L2 (aft entry)',
      state: 'open',
    });
    expect(decodeResult.remaining.text).toBe('1019,033718');
  });

  test('decodes FCM01 engine and fuel state', () => {
    // L1,R1,A1,B0,115,0449
    message.text = '07N16)G\nQGZTGZ0GZL)ZGGIZ)--K';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.formatted.description).toBe('Engine and Fuel State');
    expect(decodeResult.raw.left_engine).toBe('running');
    expect(decodeResult.raw.right_engine).toBe('running');
    expect(decodeResult.raw.apu).toBe('running');
    expect(decodeResult.raw.fuel_on_board).toBe(11500);
    expect(decodeResult.remaining.text).toBe('B0,0449');
  });

  test('decodes MXR03 maintenance report, nothing to report', () => {
    // KBWI,2226,0|
    message.text = '01.:/3P\n)JH(ZOOO-Z3\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Maintenance Report');
    expect(decodeResult.raw.arrival_icao).toBe('KBWI');
    expect(decodeResult.raw.eta_time).toBe(22 * 3600 + 26 * 60);
    expect(decodeResult.raw.maintenance_code).toBe('0 (Nothing to report)');
    expect(decodeResult.raw.text).toBeUndefined();
  });

  test('decodes FTD02 crew free text', () => {
    // KATL,KDEN|JUST GOT CLEARED BACK IN|
    message.text = '01WGL3O\n)AGEZ)LC0\nT86GIKFGIBECA/CLIJAB)I(0\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Free Text to Dispatch');
    expect(decodeResult.raw.departure_icao).toBe('KATL');
    expect(decodeResult.raw.arrival_icao).toBe('KDEN');
    expect(decodeResult.raw.text).toBe('JUST GOT CLEARED BACK IN\n');
  });

  test('decodes VXR02 voice call request', () => {
    message.text = '01 :/3O\nLAE';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Voice Call Request');
    expect(decodeResult.raw.station_iata).toBe('DAL');
  });

  test('shows text only when a character is unread', () => {
    message.text = '01 :/3O\n6g';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.text).toBe('S¤');
    expect(decodeResult.raw.station_iata).toBeUndefined();
  });

  test('keeps the wind speed when the wind direction is a placeholder', () => {
    // KMCI,KLAS,N 38.523,W100.807,37999,252,460,.797,15.4,2022,259,***,060,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/8LY:I8KXJHHYLH6K86MMMKI:IKN HKY6M6KJ:YNKIHIIKI:MK***KH HK9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.wind).toBeUndefined();
    expect(decodeResult.raw.wind_speed).toBe('60 knots');
    expect(decodeResult.raw.wind_direction).toBeUndefined();
  });

  test('keeps the wind direction when the wind speed is a placeholder', () => {
    // KMCI,KLAS,N 38.523,W100.807,37999,252,460,.797,15.4,2022,259,274,***,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/8LY:I8KXJHHYLH6K86MMMKI:IKN HKY6M6KJ:YNKIHIIKI:MKI6NK***K9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.wind).toBeUndefined();
    expect(decodeResult.raw.wind_direction).toBe('274 degrees');
    expect(decodeResult.raw.wind_speed).toBeUndefined();
  });

  test('keeps a latitude whose longitude is missing', () => {
    // KMCI,KLAS,N 38.523,,37999,252,460,.797,15.4,2022,259,274,060,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/8LY:I8KK86MMMKI:IKN HKY6M6KJ:YNKIHIIKI:MKI6NKH HK9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.position).toBeUndefined();
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.remaining.text).toBe('N 38.523');
  });

  test('consumes position placeholders without a position', () => {
    // KMCI,KLAS,----.---,----.---,37999,252,460,.797,15.4,2022,259,274,060,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-K9999Y999K9999Y999K86MMMKI:IKN HKY6M6KJ:YNKIHIIKI:MKI6NKH HK9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.position).toBeUndefined();
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('keeps an out-of-range position out of the decoded fields', () => {
    // KMCI,KLAS,N 91.001,W181.001,37999,252,460,.797,15.4,2022,259,274,060,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/MJYHHJKXJLJYHHJK86MMMKI:IKN HKY6M6KJ:YNKIHIIKI:MKI6NKH HK9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.position).toBeUndefined();
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.remaining.text).toBe('N 91.001,W181.001');
  });

  test('keeps an out-of-range ETA out of the decoded fields', () => {
    // KMCI,KLAS,N 38.523,W100.807,37999,252,460,.797,15.4,2460,259,274,060,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/8LY:I8KXJHHYLH6K86MMMKI:IKN HKY6M6KJ:YNKIN HKI:MKI6NKH HK9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.eta_time).toBeUndefined();
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.remaining.text).toBe('2460');
  });

  test('keeps an out-of-range MXR03 ETA out of the decoded fields', () => {
    // KBWI,2460,0|
    message.text = '01.:/3P\n)JH(ZO7-3Z3\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.arrival_icao).toBe('KBWI');
    expect(decodeResult.raw.eta_time).toBeUndefined();
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.remaining.text).toBe('2460');
  });

  test('shows MXR03 text only when its header fails the layout', () => {
    // KBWI,2226,7| (report codes are 0-3)
    message.text = '01.:/3P\n)JH(ZOOO-ZS\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.maintenance_code).toBeUndefined();
    expect(decodeResult.raw.text).toBe('KBWI,2226,7\n');
  });

  test('shows text only when a known type breaks its layout', () => {
    // KMCI,KLAS,N 38.523,W100.807,3799X,252,460,.797,15.4,2022,259,274,060,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/8LY:I8KXJHHYLH6K86MM4KI:IKN HKY6M6KJ:YNKIHIIKI:MKI6NKH HK9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.position).toBeUndefined();
    expect(decodeResult.raw.altitude).toBeUndefined();
    expect(decodeResult.raw.text).toBe(
      'KMCI,KLAS,N 38.523,W100.807,3799X,252,460,.797,15.4,2022,259,274,060,-53,142080',
    );
  });

  test('does not decode a body outside the SWA layout', () => {
    message.text = '01ABCDE';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.remaining.text).toBe('01ABCDE');
  });

  test('is chosen by MessageDecoder for label 37', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: '37',
      text: '08JLHR:\nO()2GO6ZHGR RWG :0:G7FW 0WRWG2F450SSS',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.name).toBe('label-37-swa');
  });
});
