import { decode } from 'punycode';
import { MessageDecoder } from '../MessageDecoder';
import { Label_44_OFF } from './Label_44_OFF';

describe('Label 44 OFF', () => {
  let plugin: Label_44_OFF;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_44_OFF(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-44-off');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['44'],
      preambles: ['00OFF01', '00OFF02', '00OFF03', 'OFF01', 'OFF02', 'OFF03'],
    });
  });

  test('decodes variant 1', () => {
    const text = 'OFF02,N39247W077226,KFDK,KSNA,1106,2124,0248,011.1'
    const decodeResult = plugin.decode({ text: text });
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.position.latitude).toBe(39.41166666666667);
    expect(decodeResult.raw.position.longitude).toBe(-77.37666666666667);
    expect(decodeResult.raw.departure_icao).toBe('KFDK');
    expect(decodeResult.raw.arrival_icao).toBe('KSNA');
    expect(decodeResult.raw.month).toBe(11);
    expect(decodeResult.raw.day).toBe(6);
    expect(decodeResult.raw.off_time).toBe(77040);
    expect(decodeResult.raw.eta_time).toBe(10080);
    expect(decodeResult.raw.fuel_remaining).toBe(11.1);
    expect(decodeResult.formatted.items.length).toBe(8);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('39.412 N, 77.377 W');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KFDK');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KSNA');
    expect(decodeResult.formatted.items[3].label).toBe('Month of Year');
    expect(decodeResult.formatted.items[3].value).toBe('11');
    expect(decodeResult.formatted.items[4].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[4].value).toBe('6');
    expect(decodeResult.formatted.items[5].label).toBe('Takeoff Time');
    expect(decodeResult.formatted.items[5].value).toBe('21:24:00');
    expect(decodeResult.formatted.items[6].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[6].value).toBe('02:48:00');
    expect(decodeResult.formatted.items[7].label).toBe('Fuel Remaining');
    expect(decodeResult.formatted.items[7].value).toBe('11.1');
  });

  test('does not decode invalid', () => {

    const text = '00OFF01 Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message.text).toBe(text);
  });
});
