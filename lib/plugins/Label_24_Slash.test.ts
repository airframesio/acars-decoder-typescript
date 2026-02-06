import { MessageDecoder } from '../MessageDecoder';
import { Label_24_Slash } from './Label_24_Slash';

describe('Label_24_Slash', () => {
  let plugin: Label_24_Slash;
  const message = {label: '24', text: ''};

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_24_Slash(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-24-slash');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['24'],
      preambles: ['/'],
    });
  });


  test('valid', () => {
    // https://app.airframes.io/messages/3439806391
    message.text = '/241710/1021/04WM/34962/N53.13/E001.33/3374/1056/';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.message_timestamp).toBe(1729160460);
    expect(decodeResult.raw.flight_number).toBe('04WM');
    expect(decodeResult.raw.altitude).toBe(34962);
    expect(decodeResult.raw.position.latitude).toBe(53.13);
    expect(decodeResult.raw.position.longitude).toBe(1.33);
    expect(decodeResult.raw.eta_time).toBe(39360);
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('04WM');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('34962 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[2].value).toBe('53.130 N, 1.330 E');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('10:56:00');

    expect(decodeResult.remaining.text).toBe('3374');
  });

  test('does not decode invalid', () => {

    message.text = '/ Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message).toBe(message);
  });
});
