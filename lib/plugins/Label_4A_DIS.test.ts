import { MessageDecoder } from '../MessageDecoder';
import { Label_4A_DIS } from './Label_4A_DIS';

describe('Label 4A preamble DIS', () => {
  let plugin: Label_4A_DIS;
  const message = {label: '4A', text: ''};
  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4A_DIS(decoder);
  });

test('matches Label 4A_DIS  qualifiers', () => {
  expect(plugin.decode).toBeDefined();
  expect(plugin.name).toBe('label-4a-dis');
  expect(plugin.qualifiers).toBeDefined();
  expect(plugin.qualifiers()).toEqual({
    labels: ['4A'],
    preambles: ['DIS'],
  });
});

test('decodes Label 4A_DIS', () => {
  // https://app.airframes.io/messages/3450166197
  message.text = 'DIS01,190009,WEN3140,@HOLD CNX';
  const decodeResult = plugin.decode(message);
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-4a-dis');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message).toBe(message);
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
test.skip('decodes Label 4A_DIS <invalid>', () => {
  message.text = '4A_DIS Bogus message';
  const decodeResult = plugin.decode(message);
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-4a-dis');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.formatted.items.length).toBe(0);
});
});