import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_POS } from './Label_H1_POS';

test('decodes Label H1 Preamble POS variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-pos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['POS'],
  });

  const text = 'POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.latitude_direction).toBe('N');
  expect(decodeResult.raw.latitude).toBe(43.312);
  expect(decodeResult.raw.longitude_direction).toBe('W');
  expect(decodeResult.raw.longitude).toBe(123.174);
  expect(decodeResult.formatted.items.length).toBe(3);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('43.312 N, 123.174 W');
  expect(decodeResult.formatted.items[1].type).toBe('aircraft_route');
  expect(decodeResult.formatted.items[1].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[1].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[1].value).toBe('EASON > EBINY > ELENN');
  expect(decodeResult.formatted.items[2].type).toBe('aircraft_timestamp');
  expect(decodeResult.formatted.items[2].code).toBe('TIMESTAMP');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Timestamp');
  expect(decodeResult.formatted.items[2].value).toBe('Sun, 09 Oct 2022 21:57:54 GMT');
});

test('decodes Label H1 Preamble POS variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-pos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['POS'],
  });

  const text = 'POSN45209W122550,PEGTY,220309,134,MINNE,220424,HISKU,M6,060013,269,366,355K,292K,730A5B';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.latitude_direction).toBe('N');
  expect(decodeResult.raw.latitude).toBe(45.209);
  expect(decodeResult.raw.longitude_direction).toBe('W');
  expect(decodeResult.raw.longitude).toBe(122.55);
  expect(decodeResult.raw.groundspeed).toBe(366);
  expect(decodeResult.formatted.items.length).toBe(3);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('45.209 N, 122.55 W');
  expect(decodeResult.formatted.items[1].type).toBe('aircraft_route');
  expect(decodeResult.formatted.items[1].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[1].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[1].value).toBe('PEGTY > MINNE > HISKU');
  expect(decodeResult.formatted.items[2].type).toBe('aircraft_groundspeed');
  expect(decodeResult.formatted.items[2].code).toBe('GSPD');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Groundspeed');
  expect(decodeResult.formatted.items[2].value).toBe('366');
});

test('decodes Label H1 Preamble POS variant 3', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-pos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['POS'],
  });

  const text = 'POSN43030W122406,IBALL,220516,380,AARON,220816,MOXEE,M47,0047,86/TS220516,092122BF64';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.latitude_direction).toBe('N');
  expect(decodeResult.raw.latitude).toBe(43.03);
  expect(decodeResult.raw.longitude_direction).toBe('W');
  expect(decodeResult.raw.longitude).toBe(122.406);
  expect(decodeResult.formatted.items.length).toBe(3);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('43.03 N, 122.406 W');
  expect(decodeResult.formatted.items[1].type).toBe('aircraft_route');
  expect(decodeResult.formatted.items[1].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[1].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[1].value).toBe('IBALL > AARON > MOXEE');
  expect(decodeResult.formatted.items[2].type).toBe('aircraft_timestamp');
  expect(decodeResult.formatted.items[2].code).toBe('TIMESTAMP');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Timestamp');
  expect(decodeResult.formatted.items[2].value).toBe('Sun, 09 Oct 2022 22:05:16 GMT');
});

test('decodes Label H1 Preamble POS variant 4', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-pos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['POS'],
  });

  const text = 'POSN33225W079428,SCOOB,232933,340,ENEME,235712,FETAL,M42,003051,15857F6';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.latitude_direction).toBe('N');
  expect(decodeResult.raw.latitude).toBe(33.225);
  expect(decodeResult.raw.longitude_direction).toBe('W');
  expect(decodeResult.raw.longitude).toBe(79.428);
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('33.225 N, 79.428 W');
  expect(decodeResult.formatted.items[1].type).toBe('aircraft_route');
  expect(decodeResult.formatted.items[1].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[1].label).toBe('Aircraft Route');
  expect(decodeResult.formatted.items[1].value).toBe('SCOOB > ENEME > FETAL');
});

test('decodes Label H1 Preamble POS <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_POS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-pos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['POS'],
  });

  const text = 'POS Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-h1-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
});
