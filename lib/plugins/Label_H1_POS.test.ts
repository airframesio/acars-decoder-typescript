import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label_H1 POS', () => {

  let plugin: Label_H1;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });

  test('variant 1', () => {

    const text = 'POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.raw.position.latitude).toBe(43.52);
    expect(decodeResult.raw.position.longitude).toBe(-123.29);
    expect(decodeResult.raw.altitude).toBe(37000);
    expect(decodeResult.raw.outside_air_temperature).toBe(-48);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('43.520 N, 123.290 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('37000 feet');
    expect(decodeResult.formatted.items[2].type).toBe('aircraft_route');
    expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('EASON@21:57:54 > EBINY@22:06:01 > ELENN');
    expect(decodeResult.formatted.items[3].type).toBe('outside_air_temperature');
    expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-48 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x7a40');
  });

  test('variant 2', () => {

    const text = 'POSN45209W122550,PEGTY,220309,134,MINNE,220424,HISKU,M6,060013,269,366,355K,292K,730A5B';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.raw.position.latitude).toBe(45.348333333333336);
    expect(decodeResult.raw.position.longitude).toBe(-122.91666666666667);
    expect(decodeResult.raw.altitude).toBe(13400);
    expect(decodeResult.raw.outside_air_temperature).toBe(-6);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('45.348 N, 122.917 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('13400 feet');
    expect(decodeResult.formatted.items[2].type).toBe('aircraft_route');
    expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('PEGTY@22:03:09 > MINNE@22:04:24 > HISKU');
    expect(decodeResult.formatted.items[3].type).toBe('outside_air_temperature');
    expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-6 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x0a5b');
  });

  test('variant 3', () => {

    const text = 'POSN43030W122406,IBALL,220516,380,AARON,220816,MOXEE,M47,0047,86/TS220516,092122BF64';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.raw.position.latitude).toBe(43.05);
    expect(decodeResult.raw.position.longitude).toBe(-122.67666666666666);
    expect(decodeResult.raw.altitude).toBe(38000);
    expect(decodeResult.raw.outside_air_temperature).toBe(-47);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('43.050 N, 122.677 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('38000 feet');
    expect(decodeResult.formatted.items[2].type).toBe('aircraft_route');
    expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('IBALL@22:05:16 > AARON@22:08:16 > MOXEE');
    expect(decodeResult.formatted.items[3].type).toBe('outside_air_temperature');
    expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-47 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0xbf64');
  });

  test('variant 4', () => {

    const text = 'POSN33225W079428,SCOOB,232933,340,ENEME,235712,FETAL,M42,003051,15857F6';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.raw.position.latitude).toBe(33.375);
    expect(decodeResult.raw.position.longitude).toBe(-79.71333333333334);
    expect(decodeResult.raw.altitude).toBe(34000);
    expect(decodeResult.raw.outside_air_temperature).toBe(-42);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('33.375 N, 79.713 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('34000 feet');
    expect(decodeResult.formatted.items[2].type).toBe('aircraft_route');
    expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('SCOOB@23:29:33 > ENEME@23:57:12 > FETAL');
    expect(decodeResult.formatted.items[3].type).toBe('outside_air_temperature');
    expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-42 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x57f6');
  });


  test('variant 5', () => {

    // https://app.airframes.io/messages/2184441420
    const text = 'POSN38531W078000,CSN-01,112309,310,CYN-02,114151,ACK,M40,26067,22479226';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.raw.position.latitude).toBe(38.885);
    expect(decodeResult.raw.position.longitude).toBe(-78.000);
    expect(decodeResult.raw.altitude).toBe(31000);
    expect(decodeResult.raw.outside_air_temperature).toBe(-40);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.885 N, 78.000 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('31000 feet');
    expect(decodeResult.formatted.items[2].type).toBe('aircraft_route');
    expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('CSN-01@11:23:09 > CYN-02@11:41:51 > ACK');
    expect(decodeResult.formatted.items[3].type).toBe('outside_air_temperature');
    expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-40 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x9226');
  });

  test('variant 6', () => {

    // https://app.airframes.io/messages/2295027018
    const text = 'POS/RFSCOOB.KEMPR.ECG.OHPEA.TOMMZ.OXANA.ZZTOP.OMALA.WILYY.KANUX.GALVN.KASAR.LNHOM.SLUKA.FIPEK.PUYYA.PLING.KOLAO.JETSSF2FC';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Filed');
    expect(decodeResult.formatted.items[1].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[1].value).toBe('SCOOB > KEMPR > ECG > OHPEA > TOMMZ > OXANA > ZZTOP > OMALA > WILYY > KANUX > GALVN > KASAR > LNHOM > SLUKA > FIPEK > PUYYA > PLING > KOLAO > JETSS');
    expect(decodeResult.formatted.items[2].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[2].value).toBe('0xf2fc');

  });

  test('<invalid>', () => {

    const text = 'POS Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
  });

  test('#short variant', () => {

    // https://app.airframes.io/messages/2368445399
    const text = '#M1BPOSN37533W096476,ROKNE,185212,330,DOSOA,190059,BUM,M50,272100,1571541'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('37.888 N, 96.793 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('33000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('ROKNE@18:52:12 > DOSOA@19:00:59 > BUM');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-50 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x1541');

    expect(decodeResult.remaining.text).toBe('272100,157');
  });

  // broken for now as there is no checksum
  xtest('# long variant', () => {

    // https://app.airframes.io/messages/2366921571
    const text = '#M1BPOSN29510W098448,RW04,140407,188,TATAR,4,140445,ALISS,M12,246048,374K,282K,1223,133,KSAT,KELP,,70,151437,415,73/PR1223,222,240,133,,44,40,252074,M22,180,P0,P0/RI:DA:KSAT:AA:KELP..TATAR:D:ALISS6:F:ALISS..FST';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(10);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('29.510 N, 98.448 W');
    expect(decodeResult.formatted.items[1].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[1].value).toBe('04');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Groundspeed');
    expect(decodeResult.formatted.items[2].value).toBe('415');
    expect(decodeResult.formatted.items[3].label).toBe('Altitude');
    expect(decodeResult.formatted.items[3].value).toBe('24000 feet');
    expect(decodeResult.formatted.items[4].label).toBe('Route Status');
    expect(decodeResult.formatted.items[4].value).toBe('Route Inactive');
    expect(decodeResult.formatted.items[5].label).toBe('Origin');
    expect(decodeResult.formatted.items[5].value).toBe('KSAT');
    expect(decodeResult.formatted.items[6].label).toBe('Destination');
    expect(decodeResult.formatted.items[6].value).toBe('KELP..TATAR'); // FIXME- should be just kelp
    expect(decodeResult.formatted.items[7].label).toBe('Departure Procedure');
    expect(decodeResult.formatted.items[7].value).toBe('ALISS6');
    expect(decodeResult.formatted.items[8].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[8].value).toBe('ALISS >> FST');
    expect(decodeResult.formatted.items[9].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[9].value).toBe('TATAR@14:04:07 > ALISS@14:04:45 > ?'); // FIXME - ? should be FST
    expect(decodeResult.remaining.text).toBe('188,4,M12,246048,374K,282K,1223,133,,70,151437,73/PR1223,222,133,,44,40,252074,M22,180,P0');
  });

  test('#variant 7', () => {

    // https://app.airframes.io/messages/2434835903
    const text = 'F37AMCLL93#M1BPOS/ID746026,,/DC03032024,173207/MR1,/ET031846/PSN42579W108090,173207,320,WAIDE,031759,WEDAK,M49,267070,T468/CG264,110,360/FB742/VR324E17';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.message_timestamp).toBe(1709487127);
    expect(decodeResult.raw.mission_number).toBe('');
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('MCLL93');
    expect(decodeResult.formatted.items[1].label).toBe('Tail');
    expect(decodeResult.formatted.items[1].value).toBe('746026');
    expect(decodeResult.formatted.items[2].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[2].value).toBe('3');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('18:46:00');
    expect(decodeResult.formatted.items[4].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[4].value).toBe('42.965 N, 108.150 W');
    expect(decodeResult.formatted.items[5].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[5].value).toBe('WAIDE@17:32:07 > WEDAK@03:17:59 > ?');
    expect(decodeResult.formatted.items[6].label).toBe('Altitude');
    expect(decodeResult.formatted.items[6].value).toBe('32000 feet');
    expect(decodeResult.formatted.items[7].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[7].value).toBe('-49 degrees');
    expect(decodeResult.formatted.items[8].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[8].value).toBe('0x4e17');
    expect(decodeResult.remaining.text).toBe('F37A#M1B/MR1,,267070,T468/CG264,110,360/FB742/VR32');
  });

  test('variant 8', () => {

    // https://app.airframes.io/messages/2500335076
    const text = 'POS/TS080616,210324/DTMMGL,29O,64,103316/PR1754,231,350,189,,0,0,,M45,185,,,P16,P0,36000,,1565,250/RP:DA:MMTJ:AA:MMGL:R:27O:D:TUMA2B..SANFE.UT4..LMM:A:LONV1D:AP:ILSZ29.PLADE(29O)9D1C';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(12);
    expect(decodeResult.formatted.items[0].label).toBe('Destination');
    expect(decodeResult.formatted.items[0].value).toBe('MMGL');
    expect(decodeResult.formatted.items[1].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[1].value).toBe('29O');
    expect(decodeResult.formatted.items[2].label).toBe('Fuel On Board');
    expect(decodeResult.formatted.items[2].value).toBe('64');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('10:33:16');
    expect(decodeResult.formatted.items[4].label).toBe('Route Status');
    expect(decodeResult.formatted.items[4].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[5].label).toBe('Origin');
    expect(decodeResult.formatted.items[5].value).toBe('MMTJ');
    expect(decodeResult.formatted.items[6].label).toBe('Destination');
    expect(decodeResult.formatted.items[6].value).toBe('MMGL');
    expect(decodeResult.formatted.items[7].label).toBe('Departure Runway');
    expect(decodeResult.formatted.items[7].value).toBe('27O');
    expect(decodeResult.formatted.items[8].label).toBe('Departure Procedure');
    expect(decodeResult.formatted.items[8].value).toBe('TUMA2B: >> SANFE > UT4 >> LMM');
    expect(decodeResult.formatted.items[9].label).toBe('Arrival Procedure');
    expect(decodeResult.formatted.items[9].value).toBe('LONV1D');
    expect(decodeResult.formatted.items[10].label).toBe('Approach Procedure');
    expect(decodeResult.formatted.items[10].value).toBe('ILSZ29 starting at PLADE(29O)');
    expect(decodeResult.formatted.items[11].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[11].value).toBe('0x9d1c');
    expect(decodeResult.remaining.text).toBe('PR1754,231,350,189,,0,0,,M45,185,,,P16,P0,36000,,1565,250');
  });

  test('variant 1 with offset', () => {

    // https://app.airframes.io/messages/2500335076
    const text = 'POSN33204W114082,BLH176-0093,062056,330,SALOM180-0127,062211,KOFFA180-0148,M49,30628,3201251';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('33.340 N, 114.137 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('33000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('BLH[176° 9.3nm]@06:20:56 > SALOM[180° 12.7nm]@06:22:11 > KOFFA[180° 14.8nm]');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-49 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x1251');
    expect(decodeResult.remaining.text).toBe('30628,320');
  });

  test('variant 9', () => {

    // https://app.airframes.io/messages/3110992692
    const text = 'POSN39164W077259,FORKL,231828,51,THRET,231917,TOOPR,P16,1726,167,/TS231828,2807244841';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('39.273 N, 77.432 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('5100 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('FORKL@23:18:28 > THRET@23:19:17 > TOOPR');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('16 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x4841');
    expect(decodeResult.remaining.text).toBe('1726,167');
  });

  test('variant 10', () => {

    // https://app.airframes.io/messages/3393214562
    const text = 'POSN51194E004527,EH556,104241,174,CIV,105208,MEDIL,M20,290016,191/RP:DA:EHEH:AA:LEIB..CIV.N872.MEDIL.UN872.KOVIN.UM728.RESMI.UN857.DISAK..DIRMO..ETAMO..ADEKA..MOKDI..MEN..BADAM..KANIG..KENAS.N855.POS/PR1496,150,370,191,,55,10,248028,M47,30,P19,P0/FHCIV,105208,273K,3226,175,M41,252027,450,N,221,62.MEDIL,105411,267K,3439,172,M44,250028,459,N,203,15.PITHI,105533,259K,3584,170,M47,249028,456,N,203,10.LESDO,105859,252K,3700,167,M47,248028,456,N,203,25.KOVIN,110153,252K,3700,164,M47,248028,456,N,203,21.DUCRA,110705,252K,3700,160,M47,248028,456,N,213,37.RESMI,111101,251K,3700,156,M47,248028,455,N,213,28.DEKOD,111325,251K,3700,154,M47,248028,455,N,192,17.DISAK,111438,251K,3700,153,M47,248028,454,N,172,9.DIRMO,112306,251K,3700,145,M47,248028,454,N,178,63.ETAMO,112514,250K,3700,143,M47,248028,453,N,158,16.ADEKA,113339,250K,3700,136,M47,248028,454,N,147,64.MOKDI,114139,251K,3700,129,M47,248028,454,N,181,59.MEN,114429,251K,3700,127,M47,248028,454,N,181,21.BADAM,114843,251K,3700,123,M47,248028,454,N,179,31.KANIG,120154,250K,3700,111,M47,248028,453,N,185,97.KENAS,121800,250K,3700,98,M47,248028,453,N,177,119.POS,122257,250K,3018,96,M45,248023,395,N,182,34.LEIB,124503,150K,2,89,P15,000000,161,N,231,103/DTLEIB,,89,124503,7353B2';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(12);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('51.323 N, 4.878 E');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('17400 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('EH556@10:42:41 > CIV@10:52:08 > MEDIL');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-20 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Route Status');
    expect(decodeResult.formatted.items[4].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[5].label).toBe('Origin');
    expect(decodeResult.formatted.items[5].value).toBe('EHEH');
    expect(decodeResult.formatted.items[6].label).toBe('Destination');
    expect(decodeResult.formatted.items[6].value).toBe('LEIB..CIV.N872.MEDIL.UN872.KOVIN.UM728.RESMI.UN857.DISAK..DIRMO..ETAMO..ADEKA..MOKDI..MEN..BADAM..KANIG..KENAS.N855.POS');
    expect(decodeResult.formatted.items[7].label).toBe('Arrival Runway'); // FIXME should remove
    expect(decodeResult.formatted.items[7].value).toBe(''); // FIXME should remove
    expect(decodeResult.formatted.items[8].label).toBe('Fuel On Board');
    expect(decodeResult.formatted.items[8].value).toBe('89');
    expect(decodeResult.formatted.items[9].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[9].value).toBe('12:45:03');
    expect(decodeResult.formatted.items[10].label).toBe('Fuel Remaining');
    expect(decodeResult.formatted.items[10].value).toBe('73');
    expect(decodeResult.formatted.items[11].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[11].value).toBe('0x53b2');
    expect(decodeResult.remaining.text).toBe('290016,191/PR1496,150,370,191,,55,10,248028,M47,30,P19,P0/FHCIV,105208,273K,3226,175,M41,252027,450,N,221,62.MEDIL,105411,267K,3439,172,M44,250028,459,N,203,15.PITHI,105533,259K,3584,170,M47,249028,456,N,203,10.LESDO,105859,252K,3700,167,M47,248028,456,N,203,25.KOVIN,110153,252K,3700,164,M47,248028,456,N,203,21.DUCRA,110705,252K,3700,160,M47,248028,456,N,213,37.RESMI,111101,251K,3700,156,M47,248028,455,N,213,28.DEKOD,111325,251K,3700,154,M47,248028,455,N,192,17.DISAK,111438,251K,3700,153,M47,248028,454,N,172,9.DIRMO,112306,251K,3700,145,M47,248028,454,N,178,63.ETAMO,112514,250K,3700,143,M47,248028,453,N,158,16.ADEKA,113339,250K,3700,136,M47,248028,454,N,147,64.MOKDI,114139,251K,3700,129,M47,248028,454,N,181,59.MEN,114429,251K,3700,127,M47,248028,454,N,181,21.BADAM,114843,251K,3700,123,M47,248028,454,N,179,31.KANIG,120154,250K,3700,111,M47,248028,453,N,185,97.KENAS,121800,250K,3700,98,M47,248028,453,N,177,119.POS,122257,250K,3018,96,M45,248023,395,N,182,34.LEIB,124503,150K,2,89,P15,000000,161,N,231,103,LEIB,,89,124503,73');
  });

  test('does not decode /.POS', () => {
    // https://app.airframes.io/messages/2500488708
    const text = '/.POS/TS100316,210324/PSS35333W058220,,100316,250,S37131W059150,101916,S39387W060377,M23,27282,241,780,MANUAL,0,813E711';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown H1 Message');
  });

  test('decodes duplicate data', () => {
    const text = 'POSN39220W078258,MRB18,044034,340,EYT19,044427,COL20,M49,27369,436,813/PSN39220W078258,MRB18,044034,340,EYT19,044427,COL20,M49,27369,436,813,ECON CRZ,0,25140035'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');

    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('39.367 N, 78.430 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('34000 feet');
    expect(decodeResult.formatted.items[2].type).toBe('aircraft_route');
    expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('MRB18@04:40:34 > EYT19@04:44:27 > COL20');
    expect(decodeResult.formatted.items[3].type).toBe('outside_air_temperature');
    expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-49 degrees');
    // YAY DUPLICATES!
    expect(decodeResult.formatted.items[4].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[4].code).toBe('POS');
    expect(decodeResult.formatted.items[4].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[4].value).toBe('39.367 N, 78.430 W');
    expect(decodeResult.formatted.items[5].type).toBe('altitude');
    expect(decodeResult.formatted.items[5].code).toBe('ALT');
    expect(decodeResult.formatted.items[5].label).toBe('Altitude');
    expect(decodeResult.formatted.items[5].value).toBe('34000 feet');
    expect(decodeResult.formatted.items[6].type).toBe('aircraft_route');
    expect(decodeResult.formatted.items[6].code).toBe('ROUTE');
    expect(decodeResult.formatted.items[6].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[6].value).toBe('MRB18@04:40:34 > EYT19@04:44:27 > COL20');
    expect(decodeResult.formatted.items[7].type).toBe('outside_air_temperature');
    expect(decodeResult.formatted.items[7].code).toBe('OATEMP');
    expect(decodeResult.formatted.items[7].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[7].value).toBe('-49 degrees');
    // And then the end
    expect(decodeResult.formatted.items[8].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[8].value).toBe('0x0035');
    expect(decodeResult.remaining.text).toBe('27369,436,27369,436,813,ECON CRZ,0,2514');

  });


  test('decodes Label H1 Preamble #M1BPOS <invalid>', () => {

    const text = '#M1BPOS Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
