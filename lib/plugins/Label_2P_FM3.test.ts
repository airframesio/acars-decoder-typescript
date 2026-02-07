import { MessageDecoder } from '../MessageDecoder';
import { Label_2P_FM3 } from './Label_2P_FM3';

describe('Label 2P Preamble FM3', () => {
  let plugin: Label_2P_FM3;
  const message = { label: '2P', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_2P_FM3(decoder);
  });

  test('variant 1', () => {
    // https://app.airframes.io/messages/4209002765
    message.text = 'FM3 1217,1312,+ 43.77,- 70.18, 39981, 426, 25';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Flight Report');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[0].value).toBe('12:17:00');
    expect(decodeResult.formatted.items[1].label).toBe(
      'Estimated Time of Arrival',
    );
    expect(decodeResult.formatted.items[1].value).toBe('13:12:00');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[2].value).toBe('43.770 N, 70.180 W');
    expect(decodeResult.formatted.items[3].label).toBe('Altitude');
    expect(decodeResult.formatted.items[3].value).toBe('39981 feet');
    expect(decodeResult.remaining.text).toBe(' 426, 25');
  });

  test('variant 2', () => {
    // https://app.airframes.io/messages/4209000440
    message.text = 'M40AEY093CFM3 1216,1454,+057.31,-075.58, 38002, 469, 23';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Flight Report');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('EY093C');
    expect(decodeResult.formatted.items[1].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[1].value).toBe('12:16:00');
    expect(decodeResult.formatted.items[2].label).toBe(
      'Estimated Time of Arrival',
    );
    expect(decodeResult.formatted.items[2].value).toBe('14:54:00');
    expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[3].value).toBe('57.310 N, 75.580 W');
    expect(decodeResult.formatted.items[4].label).toBe('Altitude');
    expect(decodeResult.formatted.items[4].value).toBe('38002 feet');
    expect(decodeResult.remaining.text).toBe('M40A, 469, 23');
  });

  test('variant 3', () => {
    // https://app.airframes.io/messages/4217295798
    message.text = 'FM3 133818,1607,N 45.206,E 17.726,34030, 440,98';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Flight Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[0].value).toBe('13:38:18');
    expect(decodeResult.formatted.items[1].label).toBe(
      'Estimated Time of Arrival',
    );
    expect(decodeResult.formatted.items[1].value).toBe('16:07:00');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[2].value).toBe('45.206 N, 17.726 E');
    expect(decodeResult.formatted.items[3].label).toBe('Altitude');
    expect(decodeResult.formatted.items[3].value).toBe('34030 feet');
    expect(decodeResult.remaining.text).toBe(' 440,98');
  });

  test('<invalid>', () => {
    message.text = 'FM4 Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Flight Report');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
