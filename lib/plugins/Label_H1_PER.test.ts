import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label_H1 PER', () => {

  let plugin: Label_H1;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });


  test('decodes short variant', () => {
    const text = 'PER/PR1337,262,320,222,,60,24,275103,M53,180,P52,P02917'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x2917);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBe('PR1337,262,320,222,,60,24,275103,M53,180,P52,P0');
  });

  test('long variant', () => {
    const text = 'PER/PR1218,276,340,134,,0,68,,M56,180,,,P30,P0,33936,,1084,284388D'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x388d);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBe('PR1218,276,340,134,,0,68,,M56,180,,,P30,P0,33936,,1084,284');
  });

  test('does not decode invalid message', () => {

    const text = 'PER Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message.text).toBe(text);
  });
});
