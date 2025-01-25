import { MessageDecoder } from '../MessageDecoder';
import { Label_22_POS } from './Label_22_POS';

describe('Label 22', () => {
  let plugin: Label_22_POS;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_22_POS(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-22-pos');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['22'],
      preambles: ['N', 'S'],
    });
  });

  test('decodes valid', () => {
    const text = 'N 370824W 760010,-------,194936,30418, ,      , ,M 42,27335  42, 107,'
    const decodeResult = plugin.decode({ text: text });
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.position.latitude).toBe(37.0824);
    expect(decodeResult.raw.position.longitude).toBe(-76.001);
    expect(decodeResult.raw.time_of_day).toBe(71376);
    expect(decodeResult.raw.altitude).toBe(30418);
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('37.082 N, 76.001 W');
    expect(decodeResult.formatted.items[1].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[1].value).toBe('19:49:36');
    expect(decodeResult.formatted.items[2].label).toBe('Altitude');
    expect(decodeResult.formatted.items[2].value).toBe('30418 feet');
    expect(decodeResult.remaining.text).toBe('-------, ,      , ,M 42,27335  42, 107,');
  });

  test('does not decode invalid', () => {

    const text = 'POS Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message.text).toBe(text);
  });
});
