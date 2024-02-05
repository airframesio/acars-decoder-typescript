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
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-fpn');
  expect(decodeResult.formatted.description).toBe('Flight Plan');
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].label).toBe('Route Status');
  expect(decodeResult.formatted.items[0].value).toBe('Route Inactive');
  expect(decodeResult.formatted.items[1].label).toBe('Origin');
  expect(decodeResult.formatted.items[1].value).toBe('KEWR');
  expect(decodeResult.formatted.items[2].label).toBe('Destination');
  expect(decodeResult.formatted.items[2].value).toBe('KDFW');
  expect(decodeResult.formatted.items[3].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[3].value).toBe('VECTOR >> DISCO >> RIVET');
  expect(decodeResult.formatted.items[4].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[4].value).toBe('TACKE');
  expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[5].value).toBe('0xc8b5');
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
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-fpn');
  expect(decodeResult.raw.flight_number).toBe('AAL1956')
  expect(decodeResult.formatted.description).toBe('Flight Plan');
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].label).toBe('Route Status');
  expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
  expect(decodeResult.formatted.items[1].label).toBe('Origin');
  expect(decodeResult.formatted.items[1].value).toBe('KPHL');
  expect(decodeResult.formatted.items[2].label).toBe('Destination');
  expect(decodeResult.formatted.items[2].value).toBe('KPHX');
  expect(decodeResult.formatted.items[3].label).toBe('Runway');
  expect(decodeResult.formatted.items[3].value).toBe('27L(26O)');
  expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
  expect(decodeResult.formatted.items[4].value).toBe('0x293b');
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
