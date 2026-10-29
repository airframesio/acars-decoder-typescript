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
    expect(decodeResult.raw.indicated_airspeed).toBe(252);
    expect(decodeResult.raw.airspeed).toBe(460);
    expect(decodeResult.raw.mach).toBe(0.797);
    expect(decodeResult.raw.fuel_on_board).toBe(15400);
    expect(decodeResult.raw.eta_time).toBe(20 * 3600 + 22 * 60);
    expect(decodeResult.raw.track).toBe(259);
    expect(decodeResult.raw.wind_direction).toBe(274);
    expect(decodeResult.raw.wind_speed).toBe(60);
    expect(decodeResult.raw.outside_air_temperature).toBe(-53);
    expect(decodeResult.raw.gross_weight).toBe(142080);
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
    expect(decodeResult.raw.gross_weight).toBe(134440);
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
    expect(decodeResult.raw.month).toBe(10);
    expect(decodeResult.raw.day).toBe(19);
    expect(decodeResult.raw.message_timestamp).toBe(3 * 3600 + 37 * 60 + 18);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.remaining.text).toBeUndefined();
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
    expect(decodeResult.raw.message_timestamp).toBe(4 * 3600 + 49 * 60);
    // B (most likely the parking brake) is not established, so it stays unread.
    expect(decodeResult.remaining.text).toBe('B0');
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
    expect(decodeResult.raw.wind_speed).toBe(60);
    expect(decodeResult.raw.wind_direction).toBeUndefined();
  });

  test('keeps the wind direction when the wind speed is a placeholder', () => {
    // KMCI,KLAS,N 38.523,W100.807,37999,252,460,.797,15.4,2022,259,274,***,-53,142080
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/8LY:I8KXJHHYLH6K86MMMKI:IKN HKY6M6KJ:YNKIHIIKI:MKI6NK***K9:8KJNIHLH';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.wind_direction).toBe(274);
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

  test('decodes POS02 position report with its send time', () => {
    // PHOG,PHNL,N 21.015,W157.673,7578,250,285,.433, 7.7,1624,043,084,013,  9,121200,161925
    message.text =
      '036S954\n6GS(K6GOHKOX4BJ5B0KFB0MJCMLKM0M7K405K470KJ LLKXMJMKBC4 K5 LK57 K5BLKXXDKB4B455KBCBD40';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.departure_icao).toBe('PHOG');
    expect(decodeResult.raw.arrival_icao).toBe('PHNL');
    expect(decodeResult.raw.position).toEqual({
      latitude: 21.015,
      longitude: -157.673,
    });
    expect(decodeResult.raw.altitude).toBe(7578);
    expect(decodeResult.raw.gross_weight).toBe(121200);
    expect(decodeResult.raw.message_timestamp).toBe(16 * 3600 + 19 * 60 + 25);
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('decodes the send time of a 16-field POS01', () => {
    // KMCI,KLAS,N 38.523,W100.807,37999,252,460,.797,15.4,2022,259,274,060,-53,142080,043032
    message.text =
      '09BP-HJ\nA,EVKA(D-KO/8LY:I8KXJHHYLH6K86MMMKI:IKN HKY6M6KJ:YNKIHIIKI:MKI6NKH HK9:8KJNIHLHKHN8H8I';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.message_timestamp).toBe(4 * 3600 + 30 * 60 + 32);
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('decodes INR04 in-range report times', () => {
    // KDAL,KHOU,1830,1817,12.3,N 30.123,W 95.456 (ETA, then the report time)
    message.text = '02N96C:\n,FB.H, TPH3RJCH3R30H3Y)JH9GJC)3YJH5G/4):4D';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.eta_time).toBe(18 * 3600 + 30 * 60);
    expect(decodeResult.raw.message_timestamp).toBe(18 * 3600 + 17 * 60);
    expect(decodeResult.raw.fuel_on_board).toBe(12300);
    expect(decodeResult.raw.position).toEqual({
      latitude: 30.123,
      longitude: -95.456,
    });
  });

  test('decodes OUT03 out time and front door close', () => {
    // KDAL,KHOU,1205,23.4,23.1,1204 (the second fuel figure is not established)
    message.text = '063XYKH\n7- 6O7:3XOJIKFOIHMGOIHMJOJIKG';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.out_time).toBe(12 * 3600 + 5 * 60);
    expect(decodeResult.raw.front_door_closed_time).toBe('12:04:00');
    expect(decodeResult.raw.fuel_on_board).toBe(23400);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.remaining.text).toBe('23.1');
  });

  test('decodes TXI02 taxi start time', () => {
    // KDAL,KHOU,1210,23.3
    message.text = '07UW4),\n5M0QZ5O7:ZG,G)Z,H(H';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.taxi_start_time).toBe('12:10:00');
    expect(decodeResult.raw.fuel_on_board).toBe(23300);
  });

  test('decodes INN03 in time and front door open', () => {
    // KHOU,KDAL,1305,1307,12.1,O,C,C,O (the four door flags are not established)
    message.text = '08N77R:\nOT1VGO)H6G :R9G :R4G A0 G1GXGXG1';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.in_time).toBe(13 * 3600 + 5 * 60);
    expect(decodeResult.raw.front_door_open_time).toBe('13:07:00');
    expect(decodeResult.raw.fuel_on_board).toBe(12100);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.remaining.text).toBe('O,C,C,O');
  });

  test('decodes FLI01 initialization time', () => {
    // KDAL,KHOU,1130,23.9,N 32.847,W 96.851
    message.text = '05/2MCZ\nN.I2AN0PSAZZ CAD B,A3V DBGE)ATV,FBG(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.message_timestamp).toBe(11 * 3600 + 30 * 60);
    expect(decodeResult.raw.fuel_on_board).toBe(23900);
  });

  test('decodes RTG05 return to gate times', () => {
    // KDAL,    ,1201,1208,1209,23.4,O,C,C,C (out, in, report time)
    message.text = '0382(50\nVTEHKXXXXKB45BKB457KB45DK4LJ KSKQKQKQ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.out_time).toBe(12 * 3600 + 1 * 60);
    expect(decodeResult.raw.in_time).toBe(12 * 3600 + 8 * 60);
    expect(decodeResult.raw.message_timestamp).toBe(12 * 3600 + 9 * 60);
    expect(decodeResult.raw.fuel_on_board).toBe(23400);
    expect(decodeResult.remaining.text).toBe('O,C,C,C');
  });

  test('decodes TAR02, whose header ends in a comma', () => {
    // TAR02,KBOS,KMDW,060,221249,N 42.366,W 70.988
    message.text = '056I5CDAN-PRANO.TACFCADDZDE,A3VEDB FFATV)CB,GG';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.preamble).toBe('TAR02');
    expect(decodeResult.raw.text).toBe(
      'KBOS,KMDW,060,221249,N 42.366,W 70.988',
    );
  });

  test('does not decode a header line longer than 8 characters', () => {
    // POS01 followed by 26103042 on the first line: the shape of another airline's DDHHMM stamp.
    message.text = '014F63NO-N3P37O\n)LAEZ)DF8';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });

  test('does not decode a type name Southwest does not send', () => {
    // YYY41|KDAL,KHOU: another airline's text can decode to a name of the same shape.
    message.text = '019997N\n)LAEZ)DF8';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });

  test('decodes PRM01 as text', () => {
    // 1234567,KDAL,KHOU| (made-up number)
    message.text = '0368N5B\nB4L 0CMKVTEHKVGS/\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.text).toBe('1234567,KDAL,KHOU\n');
  });

  test('decodes crew free text as sent', () => {
    // KDAL,KHOU|CA 12345 ON BOARD| (made-up number)
    message.text = '04QE638\nS6OB2S,C0\nPOH 8L4ZHCTH(COU6\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.text).toBe('CA 12345 ON BOARD\n');
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
