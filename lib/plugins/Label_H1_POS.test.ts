import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_POS } from './Label_H1_POS';

test('matches Label H1 Preamble POS qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-pos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1', '4J'],
    preambles: ['POS', '#M1BPOS', '/.POS'],
  });
});
test('decodes Label H1 Preamble POS variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  const text = 'POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe(43.312);
  expect(decodeResult.raw.position.longitude).toBe(-123.174);
  expect(decodeResult.raw.altitude).toBe(37000);
  expect(decodeResult.raw.outside_air_temperature).toBe(-48);
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('43.312 N, 123.174 W');
  expect(decodeResult.formatted.items[1].type).toBe('altitude');
  expect(decodeResult.formatted.items[1].code).toBe('ALT');
  expect(decodeResult.formatted.items[1].label).toBe('Altitude');
  expect(decodeResult.formatted.items[1].value).toBe('37000 feet');
  expect(decodeResult.formatted.items[2].type).toBe('aircraft_route');
  expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[2].value).toBe('EASON@2022-09-21T21:57:54Z > EBINY@2022-09-21T22:06:01Z > ELENN');
  expect(decodeResult.formatted.items[3].type).toBe('outside_air_temperature');
  expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
  expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[3].value).toBe('-48');
  expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[4].value).toBe('0x7a40');
});

test('decodes Label H1 Preamble POS variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  const text = 'POSN45209W122550,PEGTY,220309,134,MINNE,220424,HISKU,M6,060013,269,366,355K,292K,730A5B';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe(45.209);
  expect(decodeResult.raw.position.longitude).toBe(-122.55);
  expect(decodeResult.raw.altitude).toBe(13400);
  expect(decodeResult.raw.groundspeed).toBe(366);
  expect(decodeResult.raw.outside_air_temperature).toBe(-6);
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('45.209 N, 122.550 W');
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
  expect(decodeResult.formatted.items[3].value).toBe('-6');
  expect(decodeResult.formatted.items[4].type).toBe('aircraft_groundspeed');
  expect(decodeResult.formatted.items[4].code).toBe('GSPD');
  expect(decodeResult.formatted.items[4].label).toBe('Aircraft Groundspeed');
  expect(decodeResult.formatted.items[4].value).toBe('366');
  expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[5].value).toBe('0x0a5b');
});

test('decodes Label H1 Preamble POS variant 3', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  const text = 'POSN43030W122406,IBALL,220516,380,AARON,220816,MOXEE,M47,0047,86/TS220516,092122BF64';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe(43.03);
  expect(decodeResult.raw.position.longitude).toBe(-122.406);
  expect(decodeResult.raw.altitude).toBe(38000);
  expect(decodeResult.raw.outside_air_temperature).toBe(-47);
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('43.030 N, 122.406 W');
  expect(decodeResult.formatted.items[1].type).toBe('altitude');
  expect(decodeResult.formatted.items[1].code).toBe('ALT');
  expect(decodeResult.formatted.items[1].label).toBe('Altitude');
  expect(decodeResult.formatted.items[1].value).toBe('38000 feet');
  expect(decodeResult.formatted.items[2].type).toBe('aircraft_route');
  expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[2].value).toBe('IBALL@2022-09-21T22:05:16Z > AARON@2022-09-21T22:08:16Z > MOXEE');
  expect(decodeResult.formatted.items[3].type).toBe('outside_air_temperature');
  expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
  expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[3].value).toBe('-47');
  expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[4].value).toBe('0xbf64');
});

test('decodes Label H1 Preamble POS variant 4', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  const text = 'POSN33225W079428,SCOOB,232933,340,ENEME,235712,FETAL,M42,003051,15857F6';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe(33.225);
  expect(decodeResult.raw.position.longitude).toBe(-79.428);
  expect(decodeResult.raw.altitude).toBe(34000);
  expect(decodeResult.raw.outside_air_temperature).toBe(-42);
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('33.225 N, 79.428 W');
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
  expect(decodeResult.formatted.items[3].value).toBe('-42');
  expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[4].value).toBe('0x57f6');
});


test('decodes Label H1 Preamble POS variant 5', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2184441420
  const text = 'POSN38531W078000,CSN-01,112309,310,CYN-02,114151,ACK,M40,26067,22479226';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe(38.531);
  expect(decodeResult.raw.position.longitude).toBe(-78.000);
  expect(decodeResult.raw.altitude).toBe(31000);
  expect(decodeResult.raw.outside_air_temperature).toBe(-40);
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('38.531 N, 78.000 W');
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
  expect(decodeResult.formatted.items[3].value).toBe('-40');
  expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[4].value).toBe('0x9226');
});

test('decodes Label H1 Preamble POS variant 6', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2295027018
  const text = 'POS/RFSCOOB.KEMPR.ECG.OHPEA.TOMMZ.OXANA.ZZTOP.OMALA.WILYY.KANUX.GALVN.KASAR.LNHOM.SLUKA.FIPEK.PUYYA.PLING.KOLAO.JETSSF2FC';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
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

test('decodes Label H1 Preamble POS <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  const text = 'POS Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
});

test('decodes Label H1 Preamble #M1BPOS short variant', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2368445399
  const text = '#M1BPOSN37533W096476,ROKNE,185212,330,DOSOA,190059,BUM,M50,272100,1571541'
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('37.533 N, 96.476 W');
  expect(decodeResult.formatted.items[1].label).toBe('Altitude');
  expect(decodeResult.formatted.items[1].value).toBe('33000 feet');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[2].value).toBe('ROKNE@18:52:12 > DOSOA@19:00:59 > BUM');
  expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[3].value).toBe('-50');
  expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[4].value).toBe('0x1541');

  expect(decodeResult.remaining.text).toBe(',272100,157');
});

test('decodes Label H1 Preamble #M1BPOS long variant', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2366921571
  const text = '#M1BPOSN29510W098448,RW04,140407,188,TATAR,4,140445,ALISS,M12,246048,374K,282K,1223,133,KSAT,KELP,,70,151437,415,73/PR1223,222,240,133,,44,40,252074,M22,180,P0,P0/RI:DA:KSAT:AA:KELP..TATAR:D:ALISS6:F:ALISS..FST';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
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
  expect(decodeResult.formatted.items[6].value).toBe('KELP..TATAR'); // should be just kelp
  expect(decodeResult.formatted.items[7].label).toBe('Departure Procedure');
  expect(decodeResult.formatted.items[7].value).toBe('ALISS6');
  expect(decodeResult.formatted.items[8].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[8].value).toBe('ALISS >> FST');
  expect(decodeResult.formatted.items[9].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[9].value).toBe('TATAR@14:04:07 > ALISS@14:04:45 > ?'); // ? should be FST
  expect(decodeResult.remaining.text).toBe(',188,4,M12,246048,374K,282K,1223,133,,70,151437,73/PR1223,222,133,,44,40,252074,M22,180,P0');
});

test('decodes Label H1 Preamble POS variant 7', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2434848463
  const text = 'POS/ID91459S,BANKR31,/DC03032024,142813/MR64,0/ET31539/PSN39277W077359,142800,240,N39300W077110,031430,N38560W077150,M28,27619,MT370/CG311,160,350/FB732/VR329071';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.raw.flight_number).toBe('BANKR31');
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].label).toBe('Tail');
  expect(decodeResult.formatted.items[0].value).toBe('91459S');
  expect(decodeResult.formatted.items[1].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[1].value).toBe('39.277 N, 77.359 W');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[2].value).toBe('(39.500 N, 77.183 W)@2024-03-03T14:28:00Z > (38.933 N, 77.250 W)@2024-03-03T03:14:30Z > ?');
  expect(decodeResult.formatted.items[3].label).toBe('Altitude');
  expect(decodeResult.formatted.items[3].value).toBe('24000 feet');
  expect(decodeResult.formatted.items[4].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[4].value).toBe('-28');
  expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[5].value).toBe('0x9071');
  expect(decodeResult.remaining.text).toBe(',142813/MR64,0,/ET31539,27619,MT370/CG311,160,350/FB732/VR32');
});

test('decodes Label H1 Preamble #M1BPOS variant 7', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2434835903
  const text = 'F37AMCLL93#M1BPOS/ID746026,,/DC03032024,173207/MR1,/ET031846/PSN42579W108090,173207,320,WAIDE,031759,WEDAK,M49,267070,T468/CG264,110,360/FB742/VR324E17';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.raw.flight_number).toBe('');
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].label).toBe('Tail');
  expect(decodeResult.formatted.items[0].value).toBe('746026');
  expect(decodeResult.formatted.items[1].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[1].value).toBe('42.579 N, 108.090 W');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[2].value).toBe('WAIDE@2024-03-03T17:32:07Z > WEDAK@2024-03-03T03:17:59Z > ?');
  expect(decodeResult.formatted.items[3].label).toBe('Altitude');
  expect(decodeResult.formatted.items[3].value).toBe('32000 feet');
  expect(decodeResult.formatted.items[4].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[4].value).toBe('-49');
  expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[5].value).toBe('0x4e17');
  expect(decodeResult.remaining.text).toBe('F37#M1B,173207/MR1,,/ET031846,267070,T468/CG264,110,360/FB742/VR32');
});

test('decodes Label H1 Preamble POS variant 8', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2500335076
  const text = 'POS/TS080616,210324/DTMMGL,29O,64,103316/PR1754,231,350,189,,0,0,,M45,185,,,P16,P0,36000,,1565,250/RP:DA:MMTJ:AA:MMGL:R:27O:D:TUMA2B..SANFE.UT4..LMM:A:LONV1D:AP:ILSZ29.PLADE(29O)9D1C';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.formatted.items.length).toBe(11);
  expect(decodeResult.formatted.items[0].label).toBe('Destination');
  expect(decodeResult.formatted.items[0].value).toBe('MMGL');
  expect(decodeResult.formatted.items[1].label).toBe('Arrival Runway');
  expect(decodeResult.formatted.items[1].value).toBe('29O');
  expect(decodeResult.formatted.items[2].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[2].value).toBe('-45');
  expect(decodeResult.formatted.items[3].label).toBe('Route Status');
  expect(decodeResult.formatted.items[3].value).toBe('Route Planned');
  expect(decodeResult.formatted.items[4].label).toBe('Origin');
  expect(decodeResult.formatted.items[4].value).toBe('MMTJ');
  expect(decodeResult.formatted.items[5].label).toBe('Destination');
  expect(decodeResult.formatted.items[5].value).toBe('MMGL');
  expect(decodeResult.formatted.items[6].label).toBe('Departure Runway');
  expect(decodeResult.formatted.items[6].value).toBe('27O');
  expect(decodeResult.formatted.items[7].label).toBe('Departure Procedure');
  expect(decodeResult.formatted.items[7].value).toBe('TUMA2B: >> SANFE > UT4 >> LMM');
  expect(decodeResult.formatted.items[8].label).toBe('Arrival Procedure');
  expect(decodeResult.formatted.items[8].value).toBe('LONV1D');
  expect(decodeResult.formatted.items[9].label).toBe('Approach Procedure');
  expect(decodeResult.formatted.items[9].value).toBe('ILSZ29 starting at PLADE(29O)');
  expect(decodeResult.formatted.items[10].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[10].value).toBe('0x9d1c');
  expect(decodeResult.remaining.text).toBe(',64,103316/PR1754,231,350,189,,0,0,,185,,,P16,P0,36000,,1565');
});

test('decodes Label H1 Preamble POS variant 1 with offset', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2500335076
  const text = 'POSN33204W114082,BLH176-0093,062056,330,SALOM180-0127,062211,KOFFA180-0148,M49,30628,3201251';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('33.204 N, 114.082 W');
  expect(decodeResult.formatted.items[1].label).toBe('Altitude');
  expect(decodeResult.formatted.items[1].value).toBe('33000 feet');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[2].value).toBe('BLH[176° 9.3nm]@06:20:56 > SALOM[180° 12.7nm]@06:22:11 > KOFFA[180° 14.8nm]');
  expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[3].value).toBe('-49');
  expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[4].value).toBe('0x1251');
  expect(decodeResult.remaining.text).toBe(',30628,320');
});

test('decodes Label H1 Preamble POS variant 9', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/3110992692
  const text = 'POSN39164W077259,FORKL,231828,51,THRET,231917,TOOPR,P16,1726,167,/TS231828,2807244841';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.formatted.items.length).toBe(4);
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('39.164 N, 77.259 W');
  expect(decodeResult.formatted.items[1].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[1].value).toBe('FORKL@2024-07-28T23:18:28Z > THRET@2024-07-28T23:19:17Z > TOOPR');
  expect(decodeResult.formatted.items[2].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[2].value).toBe('16');
  expect(decodeResult.formatted.items[3].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[3].value).toBe('0x4841');
  expect(decodeResult.remaining.text).toBe(',51,1726,167,/TS231828');
});

test('decodes Label H1 Preamble /.POS variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/2500488708
  const text = '/.POS/TS100316,210324/PSS35333W058220,,100316,250,S37131W059150,101916,S39387W060377,M23,27282,241,780,MANUAL,0,813E711';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.raw.message_timestamp).toBe(1711015396);
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('35.333 S, 58.220 W');
  expect(decodeResult.formatted.items[1].label).toBe('Altitude');
  expect(decodeResult.formatted.items[1].value).toBe('25000 feet');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[2].value).toBe('@10:03:16 > (37.218 S, 59.250 W)@10:19:16 > (39.645 S, 60.628 W)');
  expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[3].value).toBe('-23');
  expect(decodeResult.formatted.items[4].label).toBe('Aircraft Groundspeed');
  expect(decodeResult.formatted.items[4].value).toBe('780');
  expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[5].value).toBe('0xe711');
  expect(decodeResult.remaining.text).toBe('/.POS,27282,241,MANUAL,0,813');
});

test('decodes Label 4J Preamble POS variant 7', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  // https://app.airframes.io/messages/3157551384
  const text = 'POS/ID91517S,WIDE21,7PZWTCP21222/DC09082024,140706/MR238,2/ET91456/PSN37375W077368,140700,300,JAXSN,091417,LOOEY,M26,21329,M080T490/CG293,160,350/FB583/VR32C696';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.raw.flight_number).toBe('WIDE21');
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].label).toBe('Tail');
  expect(decodeResult.formatted.items[0].value).toBe('91517S');
  expect(decodeResult.formatted.items[1].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[1].value).toBe('37.375 N, 77.368 W');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[2].value).toBe('JAXSN@14:07:00 > LOOEY@09:14:17 > ?');
  expect(decodeResult.formatted.items[3].label).toBe('Altitude');
  expect(decodeResult.formatted.items[3].value).toBe('30000 feet');
  expect(decodeResult.formatted.items[4].label).toBe('Outside Air Temperature (C)');
  expect(decodeResult.formatted.items[4].value).toBe('-26');
  expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[5].value).toBe('0xc696');
  expect(decodeResult.remaining.text).toBe(',7PZWTCP21222/DC09082024,140706/MR238,2,/ET91456,21329,M080T490/CG293,160,350/FB583/VR32');
});

test('decodes Label H1 Preamble #M1BPOS <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  const text = '#M1BPOS Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.formatted.items.length).toBe(0);
});
