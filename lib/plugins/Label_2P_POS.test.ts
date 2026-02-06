import { MessageDecoder } from '../MessageDecoder';
import { Label_2P_POS } from './Label_2P_POS';

describe('Label_2P Preamble POS', () => {

  let plugin: Label_2P_POS;
  const message = { label: '2P', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_2P_POS(decoder);
  });

  test('variant 1', () => {
    // https://app.airframes.io/messages/4179262958
    message.text = 'M80AMC4086POS/ID50007B,RCH4086,ABB02R70E037/DC10022025,051804/MR103,/ET090738/PSN56012W013273,051804,350,,,,,084081,/CG,,/FB0857/VR0322B89';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.flight_number).toBe('RCH4086');
    expect(decodeResult.raw.tail).toBe('50007B');
    expect(decodeResult.raw.mission_number).toBe('ABB02R70E037');
    expect(decodeResult.raw.day).toBe(9);
    expect(decodeResult.raw.eta_time).toBe(27480);
    expect(decodeResult.raw.position.latitude).toBe(56.02);
    expect(decodeResult.raw.position.longitude).toBe(-13.455);
    expect(decodeResult.raw.route.waypoints.length).toBe(3);
    expect(decodeResult.raw.route.waypoints[0].time).toBe(19084);
    expect(decodeResult.raw.route.waypoints[2].name).toBe('?');
    expect(decodeResult.raw.altitude).toBe(35000);
    expect(decodeResult.raw.fuel_on_board).toBe(857);
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.raw.checksum).toBe(0x2b89);
    expect(decodeResult.formatted.items.length).toBe(10);
    expect(decodeResult.remaining.text).toBe('M80/MR103,,084081,');
  });

  test('<invalid>', () => {

    message.text = 'M01AFN1234POS Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
