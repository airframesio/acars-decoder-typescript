import { MessageDecoder } from '../MessageDecoder';
import { Label_16_N } from './Label_16_N';

test('decodes Label 16 variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_16_N(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-16-n');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['16'],
    preambles: ['N '],
  });

  const text = 'N 44.203,W 86.546,31965,6, 290';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-16-n');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.latitude_direction).toBe('N');
  expect(decodeResult.raw.latitude).toBe(44.203);
  expect(decodeResult.raw.longitude_direction).toBe('W');
  expect(decodeResult.raw.longitude).toBe(86.546);
  expect(decodeResult.raw.flight_level).toBe(31965);
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('44.203 N, 86.546 W');
  expect(decodeResult.formatted.items[1].type).toBe('flight_level');
  expect(decodeResult.formatted.items[1].code).toBe('FL');
  expect(decodeResult.formatted.items[1].label).toBe('Flight Level');
  expect(decodeResult.formatted.items[1].value).toBe(31965);
});

test('decodes Label 16 variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_16_N(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-16-n');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['16'],
    preambles: ['N '],
  });

  const text = 'N 28.177/W 96.055';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-16-n');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.latitude_direction).toBe('N');
  expect(decodeResult.raw.latitude).toBe(28.177);
  expect(decodeResult.raw.longitude_direction).toBe('W');
  expect(decodeResult.raw.longitude).toBe(96.055);
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('28.177 N, 96.055 W');
});

test('decodes Label 16 variant 3', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_16_N(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-16-n');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['16'],
    preambles: ['N '],
  });

  const text = 'N 44.988,W121.644,35940,6, 170';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-16-n');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.latitude_direction).toBe('N');
  expect(decodeResult.raw.latitude).toBe(44.988);
  expect(decodeResult.raw.longitude_direction).toBe('W');
  expect(decodeResult.raw.longitude).toBe(121.644);
  expect(decodeResult.raw.flight_level).toBe(35940);
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('44.988 N, 121.644 W');
  expect(decodeResult.formatted.items[1].type).toBe('flight_level');
  expect(decodeResult.formatted.items[1].code).toBe('FL');
  expect(decodeResult.formatted.items[1].label).toBe('Flight Level');
  expect(decodeResult.formatted.items[1].value).toBe(35940);
});

test('decodes Label 16 variant <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_16_N(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-16-n');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['16'],
    preambles: ['N '],
  });

  const text = 'N Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-16-n');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
});
