import { MessageDecoder } from '../MessageDecoder';
import { Label_2P_FM4 } from './Label_2P_FM4';

describe('Label_2P Preamble FM4', () => {
  let plugin: Label_2P_FM4;
  const message = { label: '2P', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_2P_FM4(decoder);
  });

  test('variant 1', () => {
    // https://app.airframes.io/messages/4206449201
    message.text =
      'FM4KIAD,OMAA,140256,1448, 39.43,- 75.62,23228,328,  43.5, 72500';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Flight Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(8);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('KIAD');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('OMAA');
    expect(decodeResult.formatted.items[2].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[2].value).toBe('14');
    expect(decodeResult.formatted.items[3].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[3].value).toBe('02:56:00');
    expect(decodeResult.formatted.items[4].label).toBe(
      'Estimated Time of Arrival',
    );
    expect(decodeResult.formatted.items[4].value).toBe('14:48:00');
    expect(decodeResult.formatted.items[5].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[5].value).toBe('39.430 N, 75.620 W');
    expect(decodeResult.formatted.items[6].label).toBe('Altitude');
    expect(decodeResult.formatted.items[6].value).toBe('23228 feet');
    expect(decodeResult.formatted.items[7].label).toBe('Heading');
    expect(decodeResult.formatted.items[7].value).toBe('328');
    expect(decodeResult.remaining.text).toBe('  43.5, 72500');
  });

  test('variant 2', () => {
    // https://app.airframes.io/messages/4209103135
    message.text =
      'M58AEY0801FM4RJAA,OMAA,141234,2105, 38.92, 115.44,34099,296,-105.5, 52800';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Flight Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('EY0801');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('RJAA');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('OMAA');
    expect(decodeResult.formatted.items[3].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[3].value).toBe('14');
    expect(decodeResult.formatted.items[4].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[4].value).toBe('12:34:00');
    expect(decodeResult.formatted.items[5].label).toBe(
      'Estimated Time of Arrival',
    );
    expect(decodeResult.formatted.items[5].value).toBe('21:05:00');
    expect(decodeResult.formatted.items[6].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[6].value).toBe('38.920 N, 115.440 E');
    expect(decodeResult.formatted.items[7].label).toBe('Altitude');
    expect(decodeResult.formatted.items[7].value).toBe('34099 feet');
    expect(decodeResult.formatted.items[8].label).toBe('Heading');
    expect(decodeResult.formatted.items[8].value).toBe('296');
    expect(decodeResult.remaining.text).toBe('M58A,-105.5, 52800');
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
