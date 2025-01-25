import { MessageDecoder } from '../MessageDecoder';
import { Label_4A_Slash_01 } from './Label_4A_Slash_01';

test('matches Label 4A_Slash_01 qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_Slash_01(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-4a-slash-01');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['4A'],
    preambles: ['/01'],
  });
});

test('decodes Label 4A_Slash_01', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_Slash_01(decoder);

  // https://app.airframes.io/messages/3460403039
  const text = '/01-C';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a-slash-01');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe('C');
  expect(decodeResult.formatted.items.length).toBe(0);
});

// disabled because all messages should decode
xtest('decodes Label 4A_Slash_01 <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_Slash_01(decoder);

  const text = '4A_Slash_01 Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-4a-slash-01');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.formatted.items.length).toBe(0);
});
