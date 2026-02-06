import { MessageDecoder } from '../MessageDecoder';
import { Label_4A_Slash_01 } from './Label_4A_Slash_01';

describe('Label 4A preamble /01', () => {
  let plugin: Label_4A_Slash_01;
  const message = {label: '4A', text: ''};

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4A_Slash_01(decoder);
  });

test('matches qualifiers', () => {
  expect(plugin.decode).toBeDefined();
  expect(plugin.name).toBe('label-4a-slash-01');
  expect(plugin.qualifiers).toBeDefined();
  expect(plugin.qualifiers()).toEqual({
    labels: ['4A'],
    preambles: ['/01'],
  });
});

test('decodes Label 4A_Slash_01', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_Slash_01(decoder);

  // https://app.airframes.io/messages/3460403039
  message.text = '/01-C';
  const decodeResult = decoderPlugin.decode(message);
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a-slash-01');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message).toBe(message);
  expect(decodeResult.remaining.text).toBe('C');
  expect(decodeResult.formatted.items.length).toBe(0);
});

// disabled because all messages should decode
test.skip('decodes Label 4A_Slash_01 <invalid>', () => {
  message.text = '4A_Slash_01 Bogus message';
  const decodeResult = plugin.decode(message);
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-4a-slash-01');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.formatted.items.length).toBe(0);
});
});