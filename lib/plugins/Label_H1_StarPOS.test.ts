import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_StarPOS } from './Label_H1_StarPOS';

describe('Label H1 *POS', () => {

  let plugin: Label_H1_StarPOS;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_StarPOS(decoder);
  });

  test('decodes variant 1', () => {

    const text = '*POS10300950N3954W07759363312045802M5230175';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.raw.day).toBe(30);
    expect(decodeResult.raw.month).toBe(10);
    expect(decodeResult.raw.time_of_day).toBe(35400);
    expect(decodeResult.raw.position.latitude).toBe(39.900000);
    expect(decodeResult.raw.position.longitude).toBe(-77.98333333333333);
    expect(decodeResult.raw.altitude).toBe(36331);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Month of Year');
    expect(decodeResult.formatted.items[0].value).toBe('10');
    expect(decodeResult.formatted.items[1].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[1].value).toBe('30');
    expect(decodeResult.formatted.items[2].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[2].value).toBe('09:50:00');
    expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[3].value).toBe('39.900 N, 77.983 W');
    expect(decodeResult.formatted.items[4].label).toBe('Altitude');
    expect(decodeResult.formatted.items[4].value).toBe('36331 feet');
    
    expect(decodeResult.remaining.text).toBe('2045802M5230175');
  });


  test('does not decode <invalid>', () => {

    const text = '*POS Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
