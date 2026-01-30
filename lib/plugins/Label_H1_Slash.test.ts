=import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_Slash } from './Label_H1_Slash';

describe('Label H1 /', () => {
  let plugin: Label_H1_Slash;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_Slash(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-slash');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1'],
      preambles: ['/'],
    });
  });

  test('decodes variant 1', () => {
    // https://app.airframes.io/messages/2500488708
    const text = '/.POS/TS100316,210324/PSS35333W058220,,100316,250,S37131W059150,101916,S39387W060377,M23,27282,241,780,MANUAL,0,813E711';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.message_timestamp).toBe(1711015396);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('35.555 S, 58.367 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('25000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('@10:03:16 > (37.218 S, 59.250 W)@10:19:16 > (39.645 S, 60.628 W)');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-23 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0xe711');
    expect(decodeResult.remaining.text).toBe('27282,241,780,MANUAL,0,813');
  });

  test('decodes variant 2', () => {
    const text = '/HDQDLUA.POSN38332W080082,RONZZ,135753,320,LEVII,140454,WISTA,M45,20967,194/GAHDQDLUA/CA/TS135753,1411240721';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.message_timestamp).toBe(1731592673);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.553 N, 80.137 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('32000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('RONZZ@13:57:53 > LEVII@14:04:54 > WISTA');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-45 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x0721');
    expect(decodeResult.remaining.text).toBe('HDQDLUA,20967,194/GAHDQDLUA/CA');
  });

  test('decodes variant 3', () => {
    const text = '/.POS/TS140122,141124N38321W078003,,140122,450,,140122,,M56,24739,127,8306763';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.message_timestamp).toBe(1731592882);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.535 N, 78.005 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('45000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe('@14:01:22 > @14:01:22 > ?');
    expect(decodeResult.formatted.items[3].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[3].value).toBe('-56 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x6763');
    expect(decodeResult.remaining.text).toBe('24739,127');
  });

  test('does not decode invalid', () => {

    const text = '/.POS Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message.text).toBe(text);
  });
});
