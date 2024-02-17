import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_FPN } from './Label_H1_FPN';

test('decodes Label H1 Preamble FPN landing', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FPN(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-fpn');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['FPN'],
  });

  const text = 'FPN/RI:DA:KEWR:AA:KDFW:CR:EWRDFW01(17L)..SAAME.J6.HVQ.Q68.LITTR..MEEOW..FEWWW:A:SEEVR4.FEWWW:F:VECTOR..DISCO..RIVET:AP:ILS 17L.RIVET:F:TACKEC8B5';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-h1-fpn');
  expect(decodeResult.formatted.description).toBe('Flight Plan');
  expect(decodeResult.formatted.items.length).toBe(9);
  expect(decodeResult.formatted.items[0].label).toBe('Route Status');
  expect(decodeResult.formatted.items[0].value).toBe('Route Inactive');
  expect(decodeResult.formatted.items[1].label).toBe('Origin');
  expect(decodeResult.formatted.items[1].value).toBe('KEWR');
  expect(decodeResult.formatted.items[2].label).toBe('Destination');
  expect(decodeResult.formatted.items[2].value).toBe('KDFW');
  expect(decodeResult.formatted.items[3].label).toBe('Company Route');
  expect(decodeResult.formatted.items[3].value).toBe('EWRDFW01(17L): >> SAAME > J6 > HVQ > Q68 > LITTR >> MEEOW >> FEWWW');
  expect(decodeResult.formatted.items[4].label).toBe('Arrival Procedure');
  expect(decodeResult.formatted.items[4].value).toBe('SEEVR4 starting at FEWWW');
  expect(decodeResult.formatted.items[5].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[5].value).toBe('VECTOR >> DISCO >> RIVET');
  expect(decodeResult.formatted.items[6].label).toBe('Approach Procedure');
  expect(decodeResult.formatted.items[6].value).toBe('ILS 17L starting at RIVET');
  expect(decodeResult.formatted.items[7].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[7].value).toBe('TACKE');
  expect(decodeResult.formatted.items[8].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[8].value).toBe('0xc8b5');
});
test('decodes Label H1 Preamble FPN full flight', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FPN(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-fpn');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['FPN'],
  });

  // https://app.airframes.io/messages/2161768398
  const text = 'FPN/FNAAL1956/RP:DA:KPHL:AA:KPHX:CR:PHLPHX61:R:27L(26O):D:PHL3:A:EAGUL6.ZUN:AP:ILS26..AIR,N40010W080490.J110.BOWRR..VLA,N39056W089097..STL,N38516W090289..GIBSN,N38430W092244..TYGER,N38410W094050..GCK,N37551W100435..DIXAN,N36169W105573..ZUN,N34579W109093293B';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-h1-fpn');
  expect(decodeResult.raw.flight_number).toBe('AAL1956');
  expect(decodeResult.raw.company_route.waypoints).toBeUndefined();
  expect(decodeResult.formatted.description).toBe('Flight Plan');
  expect(decodeResult.formatted.items.length).toBe(9);
  expect(decodeResult.formatted.items[0].label).toBe('Route Status');
  expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
  expect(decodeResult.formatted.items[1].label).toBe('Origin');
  expect(decodeResult.formatted.items[1].value).toBe('KPHL');
  expect(decodeResult.formatted.items[2].label).toBe('Destination');
  expect(decodeResult.formatted.items[2].value).toBe('KPHX');
  expect(decodeResult.formatted.items[3].label).toBe('Company Route');
  expect(decodeResult.formatted.items[3].value).toBe('PHLPHX61');
  expect(decodeResult.formatted.items[4].label).toBe('Runway');
  expect(decodeResult.formatted.items[4].value).toBe('27L(26O)');
  expect(decodeResult.formatted.items[5].label).toBe('Departure Procedure');
  expect(decodeResult.formatted.items[5].value).toBe('PHL3');
  expect(decodeResult.formatted.items[6].label).toBe('Arrival Procedure');
  expect(decodeResult.formatted.items[6].value).toBe('EAGUL6 starting at ZUN');
  expect(decodeResult.formatted.items[7].label).toBe('Approach Procedure');
  expect(decodeResult.formatted.items[7].value).toBe('ILS26: >> AIR(40.01 N, 80.49 W) > J110 > BOWRR >> VLA(39.056 N, 89.097 W) >> STL(38.516 N, 90.289 W) >> GIBSN(38.43 N, 92.244 W) >> TYGER(38.41 N, 94.05 W) >> GCK(37.551 N, 100.435 W) >> DIXAN(36.169 N, 105.573 W) >> ZUN(34.579 N, 109.093 W)');
  expect(decodeResult.formatted.items[8].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[8].value).toBe('0x293b');
});

test('decodes Label H1 Preamble FPN in-flight', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FPN(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-fpn');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['FPN'],
  });

  // https://app.airframes.io/messages/2161761202
  const text = 'FPN/FNUAL1187/RP:DA:KSFO:AA:KPHX:F:KAYEX,N36292W120569..LOSHN,N35509W120000..BOILE,N34253W118016..BLH,N33358W114457DDFB';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-h1-fpn');
  expect(decodeResult.raw.flight_number).toBe('UAL1187')
  expect(decodeResult.formatted.description).toBe('Flight Plan');
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].label).toBe('Route Status');
  expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
  expect(decodeResult.formatted.items[1].label).toBe('Origin');
  expect(decodeResult.formatted.items[1].value).toBe('KSFO');
  expect(decodeResult.formatted.items[2].label).toBe('Destination');
  expect(decodeResult.formatted.items[2].value).toBe('KPHX');
  expect(decodeResult.formatted.items[3].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[3].value).toBe('KAYEX(36.292 N, 120.569 W) >> LOSHN(35.509 N, 120 W) >> BOILE(34.253 N, 118.016 W) >> BLH(33.358 N, 114.457 W)');
  expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[4].value).toBe('0xddfb');
});


test('decodes Label H1 Preamble FPN with WS', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FPN(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-fpn');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['FPN'],
  });

  // https://app.airframes.io/messages/2372685289
  const text = 'FPN/TS140017,021724/RP:DA:EHAM:AA:KMSP..N55064W000477..N55163W001141..ERAKA..N60000W020000..N61000W030000:WS:N61000W030000,370..N61000W040000..N60000W050000..URTAK:WS:URTAK,380..LAKES:WS:LAKES,400..N57000W070000..N54300W080000..N49000W090000..DLH..COLDD:A:BAINY3:AP:ILS30L(30L)/PR4356,344,360,1060,,,13,,,30,,,P50,M40,36090,,3296,292/DTKMSP,30L,172,215117156D';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-fpn');
  expect(decodeResult.raw.message_timestamp).toBe(1708178417);
  expect(decodeResult.formatted.description).toBe('Flight Plan');
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].label).toBe('Route Status');
  expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
  expect(decodeResult.formatted.items[1].label).toBe('Origin');
  expect(decodeResult.formatted.items[1].value).toBe('EHAM');
  expect(decodeResult.formatted.items[2].label).toBe('Destination');
  expect(decodeResult.formatted.items[2].value).toBe('KMSP..N55064W000477..N55163W001141..ERAKA..N60000W020000..N61000W030000'); // FIXME - just 'KMSP'
  expect(decodeResult.formatted.items[3].label).toBe('Arrival Procedure');
  expect(decodeResult.formatted.items[3].value).toBe('BAINY3');
  expect(decodeResult.formatted.items[4].label).toBe('Approach Procedure');
  expect(decodeResult.formatted.items[4].value).toBe('ILS30L(30L)/PR4356,344,360,1060,,,13,,,30,,,P50,M40,36090,,3296,292/DTKMSP,30L,172,215117'); //FIXME - just 'ILS30L'
  expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[5].value).toBe('0x156d');
  expect(decodeResult.remaining.text).toBe(':WS:N61000W030000,370..N61000W040000..N60000W050000..URTAK:WS:URTAK,380..LAKES:WS:LAKES,400..N57000W070000..N54300W080000..N49000W090000..DLH..COLDD');
});

test('decodes Label H1 Preamble FPN with SN', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FPN(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-fpn');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['FPN'],
  });

  // https://app.airframes.io/messages/2372685289
  const text = 'FPN/TS155631,170224/SN155631/RP:DA:PHNL:AA:KASE:D:MKK5.KOLEA:F:KOLEA,N22354W155133..CLUTS,N23002W154393.R465.CINNY,N36109W124456..OAL,N38002W117462.J58.ILC,N38150W114237..EYELO,N38455W110469..SAKES,N38500W110163.J80.DBL,N39264W106537F5E1'
   const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-h1-fpn');
  expect(decodeResult.raw.message_timestamp).toBe(Number.NaN); // DDMMYY instead of MMDDYY - need to figure out how to determine
  expect(decodeResult.raw.serial_number).toBe('155631');
  expect(decodeResult.formatted.description).toBe('Flight Plan');
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].label).toBe('Route Status');
  expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
  expect(decodeResult.formatted.items[1].label).toBe('Origin');
  expect(decodeResult.formatted.items[1].value).toBe('PHNL');
  expect(decodeResult.formatted.items[2].label).toBe('Destination');
  expect(decodeResult.formatted.items[2].value).toBe('KASE');
  expect(decodeResult.formatted.items[3].label).toBe('Departure Procedure');
  expect(decodeResult.formatted.items[3].value).toBe('MKK5 starting at KOLEA');
  expect(decodeResult.formatted.items[4].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[4].value).toBe('KOLEA(22.354 N, 155.133 W) >> CLUTS(23.002 N, 154.393 W) > R465 > CINNY(36.109 N, 124.456 W) >> OAL(38.002 N, 117.462 W) > J58 > ILC(38.15 N, 114.237 W) >> EYELO(38.455 N, 110.469 W) >> SAKES(38.5 N, 110.163 W) > J80 > DBL(39.264 N, 106.537 W)');
  expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[5].value).toBe('0xf5e1');
});

test('decodes Label H1 Preamble FPN <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FPN(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-fpn');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['FPN'],
  });

  const text = 'FPN Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-h1-fpn');
  expect(decodeResult.formatted.description).toBe('Flight Plan');
  expect(decodeResult.message.text).toBe(text);
});
