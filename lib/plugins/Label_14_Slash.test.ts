import { MessageDecoder } from '../MessageDecoder';
import { Label_14_Slash } from './Label_14_Slash';

describe('Label_14_Slash', () => {
  let plugin: Label_14_Slash;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_14_Slash(decoder);
  });

  test('matches Label 14 Preamble slash qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-14-slash');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['14'],
      preambles: ['/14'],
    });
  });

  test('decodes Label 14 Preamble /14 1-line', () => {
    const text = '/14 OFF EVENT      / KIAD KDEN 08 124438/TIME 1244'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('KIAD');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('KDEN');
    expect(decodeResult.formatted.items[2].label).toBe('Wheels Off Time');
    expect(decodeResult.formatted.items[2].value).toBe('12:44:38');
    expect(decodeResult.remaining.text).toBe('08');
  });

  test('decodes Label 14 Preamble /14 2-line', () => {
    const text = '/14 OFF EVENT      / KIAD EDDF 09 025055/TIME 0250' + '\r\n' +
      '/LOC +38.9603,-077.4595'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('KIAD');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('EDDF');
    expect(decodeResult.formatted.items[2].label).toBe('Wheels Off Time');
    expect(decodeResult.formatted.items[2].value).toBe('02:50:55');
    expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[3].value).toBe('38.960 N, 77.460 W');
    expect(decodeResult.remaining.text).toBe('09');
  });

  test('decodes Label 14 Preamble /14 3-line', () => {
    const text = '/14 OFF EVENT      / KIAD KATL 09 123630/TIME 1236' + '\r\n' +
      '/AU 08752167/AON 08716165/AIN 08717165/AOT 08744166' + '\r\n' +
      '/LOC N385618,W0772823'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('KIAD');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('KATL');
    expect(decodeResult.formatted.items[2].label).toBe('Wheels Off Time');
    expect(decodeResult.formatted.items[2].value).toBe('12:36:30');
    expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[3].value).toBe('38.938 N, 77.473 W');
    expect(decodeResult.remaining.text).toBe('09\r\n/AU 08752167/AON 08716165/AIN 08717165/AOT 08744166');
  });

  // Ignoring this test because the position is definteley invalid
  // The position is in the middle of the pacific ocean for a domestic flight
  // ADS-B confirms it took off from IAD at the correct time 
  // Despite all this, it shows that positions may be in decimal minutes instead of DMS when using NSEW instead of +/-
  // so i'm putting it here for reference
  xtest('decodes Label 14 Preamble /14 position invalid', () => {
    const text = '/14 OFF EVENT      / KIAD KSAT 10 122555/TIME 1225' + '\r\n' +
                 '/AU 55808910/AON 55729908/AIN 55731908/AOT 55804909' + '\r\n' +
                 '/LOC N169380,E1334348'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('KIAD');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('KSAT');
    expect(decodeResult.formatted.items[2].label).toBe('Wheels Off Time');
    expect(decodeResult.formatted.items[2].value).toBe('12:25:55');
    expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[3].value).toBe('17.572 N, 133.730 W');
    expect(decodeResult.remaining.text).toBe('10\r\n/AU 55808910/AON 55729908/AIN 55731908/AOT 55804909');
  });

  test('decodes Label 14 Preamble /14 <invalid>', () => {

    const text = '/14 Bogus Message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-14-slash');
    expect(decodeResult.formatted.description).toBe('Wheels Off Report');
    expect(decodeResult.message.text).toBe(text);
  });
});