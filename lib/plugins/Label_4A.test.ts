import { MessageDecoder } from '../MessageDecoder';
import { Label_4A } from './Label_4A';

test('matches Label 4A qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-4a');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['4A'],
  });
});

test('decodes Label 4A', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  // https://app.airframes.io/messages/3461807403
  const text = 'N45129W093113MSP/07 ,204436123VECTORS,,P04,268044858,46904221';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe('268044858,46904221');
  expect(decodeResult.formatted.items.length).toBe(4);
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].value).toBe('45.129 N, 93.113 W');
  expect(decodeResult.formatted.items[1].code).toBe('ALT');
  expect(decodeResult.formatted.items[1].value).toBe('12300 feet');
  expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[2].value).toBe('MSP/07 > VECTORS');
  expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
  expect(decodeResult.formatted.items[3].value).toBe('4');
});

// disabled because all messages should decode
test('decodes Label 4A <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  const text = '4A Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-4a');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.formatted.items.length).toBe(0);
});
