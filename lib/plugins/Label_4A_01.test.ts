import { MessageDecoder } from '../MessageDecoder';
import { Label_4A_01 } from './Label_4A_01';

test('matches Label 4A_01  qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_01(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-4a-01');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['4A'],
    preambles: ['01'],
  });
});

test('decodes Label 4A_01', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_01(decoder);

  // https://app.airframes.io/messages/3450562911
  const text = '01DCAP VIR41R/190203EGLLKSFO\r\n+ 1418158.0+ 24.8';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a-01');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe('158.0');
  expect(decodeResult.formatted.items.length).toBe(7);
  expect(decodeResult.formatted.items[0].code).toBe('STATE_CHANGE');
  expect(decodeResult.formatted.items[0].value).toBe('Descent -> Approach');
  expect(decodeResult.formatted.items[1].code).toBe('CALLSIGN');
  expect(decodeResult.formatted.items[1].value).toBe('VIR41R');
  expect(decodeResult.formatted.items[2].code).toBe('MSG_TOD');
  expect(decodeResult.formatted.items[2].value).toBe('19:02:03');
  expect(decodeResult.formatted.items[3].code).toBe('ORG');
  expect(decodeResult.formatted.items[3].value).toBe('EGLL');
  expect(decodeResult.formatted.items[4].code).toBe('DST');
  expect(decodeResult.formatted.items[4].value).toBe('KSFO');
  expect(decodeResult.formatted.items[5].code).toBe('ALT');
  expect(decodeResult.formatted.items[5].value).toBe("1418 feet");
  expect(decodeResult.formatted.items[6].code).toBe('OATEMP');
  expect(decodeResult.formatted.items[6].value).toBe('24.8 degrees');
});

// disabled because all messages should decode
xtest('decodes Label 4A_01 <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A_01(decoder);

  const text = '4A_01 Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-4a-01');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.formatted.items.length).toBe(0);
});
