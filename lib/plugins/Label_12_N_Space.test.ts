import { MessageDecoder } from '../MessageDecoder';
import { Label_12_N_Space } from './Label_12_N_Space';

test('decodes Label 12 variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_12_N_Space(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-12-n-space');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['12'],
    preambles: ['N '],
  });

  const text = 'N 42.150,W121.187,39000,161859, 109,.C-GWSO,1742';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-12-n-space');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe(42.150);
  expect(decodeResult.raw.position.longitude).toBe(-121.187);
  expect(decodeResult.raw.flight_level).toBe(39000);
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('42.150 N, 121.187 W');
  expect(decodeResult.formatted.items[1].type).toBe('flight_level');
  expect(decodeResult.formatted.items[1].code).toBe('FL');
  expect(decodeResult.formatted.items[1].label).toBe('Flight Level');
  expect(decodeResult.formatted.items[1].value).toBe(39000);
});

test('decodes Label 12 variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_12_N_Space(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-12-n-space');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['12'],
    preambles: ['N '],
  });

  const text = 'N 28.371,W 80.458,38000,170546, 100,.C-GVWJ,1736';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-12-n-space');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe(28.371);
  expect(decodeResult.raw.position.longitude).toBe(-80.458);
  expect(decodeResult.raw.flight_level).toBe(38000);
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('28.371 N, 80.458 W');
  expect(decodeResult.formatted.items[1].type).toBe('flight_level');
  expect(decodeResult.formatted.items[1].code).toBe('FL');
  expect(decodeResult.formatted.items[1].label).toBe('Flight Level');
  expect(decodeResult.formatted.items[1].value).toBe(38000);
});

test('decodes Label 12 variant <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_12_N_Space(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-12-n-space');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['12'],
    preambles: ['N '],
  });

  const text = 'N Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-12-n-space');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
});
