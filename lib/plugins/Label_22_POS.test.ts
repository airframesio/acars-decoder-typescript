import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_22_POS } from './Label_22_POS';

describe('Label 22', () => {
  let plugin: Label_22_POS;
  const message = { label: '22', text: '' };

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
    message.text =
      'N 370824W 760010,-------,194936,30418, ,      , ,M 42,27335  42, 107,';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    // 370824 = 37°08'24", 760010 = 76°00'10" (DDMMSS, not a fraction)
    expect(decodeResult.raw.position.latitude).toBeCloseTo(37.14, 6);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-76.002778, 5);
    expect(decodeResult.raw.message_timestamp).toBe(71376);
    expect(decodeResult.raw.altitude).toBe(30418);
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('37.140 N, 76.003 W');
    expect(decodeResult.formatted.items[1].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[1].value).toBe('19:49:36');
    expect(decodeResult.formatted.items[2].label).toBe('Altitude');
    expect(decodeResult.formatted.items[2].value).toBe('30418 feet');
    expect(decodeResult.remaining.text).toBe(
      '-------, ,      , ,M 42,27335  42, 107,',
    );
  });

  test('decodes a real DDMMSS position', () => {
    // N391FR / F91690, 2026-10-26 14:07:06Z. The same aircraft sent the
    // position twice that second, packed here and in decimal on label 21:
    // https://app.airframes.io/messages/7933456355 (label 22, DDMMSS)
    // https://app.airframes.io/messages/7933455757 (label 21, 39.694W 75.344)
    message.text =
      'N 394138W 752038,-------,140706,11549, ,      , ,M  1,31175  14,  79,';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.position.latitude).toBeCloseTo(39.693889, 5);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-75.343889, 5);
    expect(decodeResult.raw.altitude).toBe(11549);
    expect(decodeResult.formatted.items[0].value).toBe('39.694 N, 75.344 W');
  });

  test('does not decode invalid', () => {
    message.text = 'POS Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message).toBe(message);
  });
});
