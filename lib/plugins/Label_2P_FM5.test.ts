import { MessageDecoder } from '../MessageDecoder';
import { Label_2P_FM5 } from './Label_2P_FM5';

describe('Label_2P Preamble FM5', () => {

  let plugin: Label_2P_FM5;
  const message = { label: '2P', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_2P_FM5(decoder);
  });

  test('variant 1', () => {
    // https://app.airframes.io/messages/4208768180
    message.text = 'FM5 EIDW,OMAA,113522,1540,+45.147, +23.384,35002,116.24,502 ,36900,ETD23N ,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Flight Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('EIDW');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('OMAA');
    expect(decodeResult.formatted.items[2].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[2].value).toBe('11:35:22');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('15:40:00');
    expect(decodeResult.formatted.items[4].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[4].value).toBe('45.147 N, 23.384 E');
    expect(decodeResult.formatted.items[5].label).toBe('Altitude');
    expect(decodeResult.formatted.items[5].value).toBe('35002 feet');
    expect(decodeResult.formatted.items[6].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[6].value).toBe('ETD23N');
    expect(decodeResult.remaining.text).toBe('116.24,502 ,36900,');
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
