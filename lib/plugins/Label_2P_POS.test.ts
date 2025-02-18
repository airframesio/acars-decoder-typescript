import { MessageDecoder } from '../MessageDecoder';
import { Label_2P_POS } from './Label_2P_POS';

describe('Label_2P Preamble POS', () => {

  let plugin: Label_2P_POS;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_2P_POS(decoder);
  });

  test('variant 1', () => {
    // https://app.airframes.io/messages/4179262958
    const text = 'M80AMC4086POS/ID50007B,RCH4086,ABB02R70E037/DC10022025,051804/MR103,/ET090738/PSN56012W013273,051804,350,,,,,084081,/CG,,/FB0857/VR0322B89';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('MC4086');
    expect(decodeResult.formatted.items[1].label).toBe('Tail');
    expect(decodeResult.formatted.items[1].value).toBe('50007B');
    expect(decodeResult.formatted.items[2].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[2].value).toBe('RCH4086');
    expect(decodeResult.formatted.items[3].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[3].value).toBe('9');
    expect(decodeResult.formatted.items[4].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[4].value).toBe('07:38:00');
    expect(decodeResult.formatted.items[5].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[5].value).toBe('56.020 N, 13.455 W');
    expect(decodeResult.formatted.items[6].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[6].value).toBe('@05:18:04 >> ?'); // Yuck - maybe fix?
    expect(decodeResult.formatted.items[7].label).toBe('Altitude');
    expect(decodeResult.formatted.items[7].value).toBe('35000 feet');
    expect(decodeResult.formatted.items[8].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[8].value).toBe('0x2b89');
    expect(decodeResult.remaining.text).toBe('M80A/MR103,,084081,/CG,,/FB0857/VR032');
  });

  test('<invalid>', () => {

    const text = 'M01AFN1234POS Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown H1 Message');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
