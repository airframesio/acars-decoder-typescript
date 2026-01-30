import { MessageDecoder } from '../MessageDecoder';
import { Label_4A_DOOR } from './Label_4A_DOOR';

test('matches Label 4A_DOOR qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_DOOR(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-4a-door');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['4A'],
    preambles: ['DOOR'],
  });
});

test('decodes Label 4A_DOOR', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_DOOR(decoder);

  // https://app.airframes.io/messages/3453841057
  const text = 'DOOR/FWDENTRY CLSD 1440';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-4a-door');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe(undefined);
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].code).toBe('DOOR');
  expect(decodeResult.formatted.items[0].value).toBe('FWDENTRY CLSD');
  expect(decodeResult.formatted.items[1].code).toBe('MSG_TOD');
  expect(decodeResult.formatted.items[1].value).toBe('14:40:00');
});

// disabled because all messages should decode
test.skip('decodes Label 4A_DOOR <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_DOOR(decoder);

  const text = '4A_DOOR Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-4a-door');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.formatted.items.length).toBe(0);
});
