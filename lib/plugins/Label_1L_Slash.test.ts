import { MessageDecoder } from '../MessageDecoder';
import { Label_1L_Slash } from './Label_1L_Slash';

describe('Label_1L Slash', () => {
  let plugin: Label_1L_Slash;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_1L_Slash(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-1l-1-line');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['1L'],
      preambles: ['+', '-'],
    });
  });

  test('decodes variant 1', () => {
    const text = '+ 39.126/- 77.358/UTC 085208/FOB   8.2/ALT  3997/CAS  239/ETA 0903'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.position.latitude).toBe(39.126);
    expect(decodeResult.raw.position.longitude).toBe(-77.358);
    expect(decodeResult.raw.time_of_day).toBe(31928);
    expect(decodeResult.raw.fuel_on_board).toBe(8.2);
    expect(decodeResult.raw.altitude).toBe(3997);
    expect(decodeResult.raw.eta_time).toBe(32580);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('39.126 N, 77.358 W');
    expect(decodeResult.formatted.items[1].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[1].value).toBe('08:52:08');
    expect(decodeResult.formatted.items[2].label).toBe('Altitude');
    expect(decodeResult.formatted.items[2].value).toBe('3997 feet');
    expect(decodeResult.formatted.items[3].label).toBe('Fuel On Board');
    expect(decodeResult.formatted.items[3].value).toBe('8.2'); // tons?
    expect(decodeResult.formatted.items[4].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[4].value).toBe('09:03:00');
    expect(decodeResult.remaining.text).toBe('/CAS  239');
  });

  test('does not decode <invalid>', () => {

    const text = 'POS Bogus Message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-1l-1-line');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
  });
});