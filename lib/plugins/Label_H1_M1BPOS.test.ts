import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_M1BPOS } from './Label_H1_M1BPOS';

test('decodes Label H1 Preamble #M1BPOS', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_M1BPOS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-m1bpos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['#M1BPOS'],
  });

  // https://app.airframes.io/messages/2366921571
  const text = '#M1BPOSN29510W098448,RW04,140407,188,TATAR,4,140445,ALISS,M12,246048,374K,282K,1223,133,KSAT,KELP,,70,151437,415,73/PR1223,222,240,133,,44,40,252074,M22,180,P0,P0/RI:DA:KSAT:AA:KELP..TATAR:D:ALISS6:F:ALISS..FST';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('none'); //should be partial
  expect(decodeResult.decoder.name).toBe('label-h1-m1bpos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].label).toBe('Position');
  expect(decodeResult.formatted.items[0].value).toBe('29.51 N, 98.448 W');
  expect(decodeResult.formatted.items[1].label).toBe('Route');
  expect(decodeResult.formatted.items[1].value).toBe('RW04 > TATAR > 4 > ALISS > M12 > KSAT > KELP > ?');
  expect(decodeResult.remaining.text).toBe('PR1223,222,240,133,,44,40,252074,M22,180,P0,P0');
});

test('decodes Label H1 Preamble #M1BPOS <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_M1BPOS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-m1bpos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['#M1BPOS'],
  });

  const text = '#M1BPOS Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true); // expect false?
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-h1-m1bpos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.formatted.items.length).toBe(1); // should be 0
  expect(decodeResult.formatted.items[0].label).toBe('Route');
  expect(decodeResult.formatted.items[0].value).toBe('');

});
