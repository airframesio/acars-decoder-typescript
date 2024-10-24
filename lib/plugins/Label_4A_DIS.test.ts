import { MessageDecoder } from '../MessageDecoder';
import { Label_4A_DIS } from './Label_4A_DIS';

test('matches Label 4A_DIS  qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_DIS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-4a-dis');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['4A'],
    preambles: ['DIS'],
  });
});

test('decodes Label 4A_DIS', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_DIS(decoder);

  // https://app.airframes.io/messages/3450166197
  const text = 'DIS01,190009,WEN3140,@HOLD CNX';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-4a-dis');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe(undefined);
  expect(decodeResult.formatted.items.length).toBe(3);
  expect(decodeResult.formatted.items[0].code).toBe('MSG_TOD');
  expect(decodeResult.formatted.items[0].value).toBe('00:09:00');
  expect(decodeResult.formatted.items[1].code).toBe('CALLSIGN');
  expect(decodeResult.formatted.items[1].value).toBe('WEN3140');
  expect(decodeResult.formatted.items[2].code).toBe('FREE_TEXT');
  expect(decodeResult.formatted.items[2].value).toBe('@HOLD CNX');
});

// disabled because all messages should decode
xtest('decodes Label 4A_DIS <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_DIS(decoder);

  const text = '4A_DIS Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-4a-dis');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.formatted.items.length).toBe(0);
});
