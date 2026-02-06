import { MessageDecoder } from '../MessageDecoder';
import { Label_16_TOD } from './Label_16_TOD';

describe('Label 16 Time of Day', () => {

  let plugin: Label_16_TOD;
  const message = {label: '16', text: ''};

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_16_TOD(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-16-tod');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['16'],
    });
  });

  test('decodes variant 1', () => {
    message.text = '005236,36787,0135,  97,N 38.364 W 75.226';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-16-tod');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[0].value).toBe('00:52:36');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('36787 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[2].value).toBe('01:35:00');
    expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[3].value).toBe('38.364 N, 75.226 W');
    expect(decodeResult.remaining.text).toBe('  97');
  });

  test('decodes variant 2', () => {
    // https://app.airframes.io/messages/4260590297
    message.text = '110112,36000,1206, 51,N 45.140 E 16.341/SXS7SL';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-16-tod');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[0].value).toBe('11:01:12');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('36000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[2].value).toBe('12:06:00');
    expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[3].value).toBe('45.140 N, 16.341 E');
    expect(decodeResult.formatted.items[4].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[4].value).toBe('SXS7SL');
    expect(decodeResult.remaining.text).toBe(' 51');
  });


  test('decodes no position', () => {
    // https://app.airframes.io/messages/4260590899
    message.text = '110122,,1206, 92,N . MMMM.MMM';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-16-tod');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[0].value).toBe('11:01:22');
    expect(decodeResult.formatted.items[1].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[1].value).toBe('12:06:00');
    expect(decodeResult.remaining.text).toBe(' 92');
  });

  test('decodes Label 16 variant <invalid>', () => {
    message.text = 'N Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-16-tod');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
  });
});