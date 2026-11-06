import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label_H1 PER', () => {
  let plugin: Arinc702;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes short variant', () => {
    message.text = 'PER/PR1337,262,320,222,,60,24,275103,M53,180,P52,P02917';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x2917);
    expect(decodeResult.raw.gross_weight).toBe(133700);
    expect(decodeResult.raw.cruise_altitude).toBe(32000);
    expect(decodeResult.raw.cruise_temperature).toBe(-53);
    expect(decodeResult.raw.transition_altitude).toBe(18000);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Gross Weight');
    expect(decodeResult.formatted.items[0].value).toBe('133700 pounds');
    expect(decodeResult.formatted.items[1].label).toBe('Cruise Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('32000 feet');
    expect(decodeResult.formatted.items[2].label).toBe(
      'Cruise Temperature (C)',
    );
    expect(decodeResult.formatted.items[2].value).toBe('-53 degrees');
    expect(decodeResult.formatted.items[3].label).toBe('Transition Altitude');
    expect(decodeResult.formatted.items[3].value).toBe('18000 feet');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.remaining.text).toBe('262,222,,60,24,275103,P52,P0');
  });

  test('long variant', () => {
    message.text =
      'PER/PR1218,276,340,134,,0,68,,M56,180,,,P30,P0,33936,,1084,284388D';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x388d);
    expect(decodeResult.raw.gross_weight).toBe(121800);
    expect(decodeResult.raw.cruise_altitude).toBe(34000);
    expect(decodeResult.raw.cruise_temperature).toBe(-56);
    expect(decodeResult.raw.transition_altitude).toBe(18000);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[1].label).toBe('Cruise Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('34000 feet');
    expect(decodeResult.formatted.items[2].label).toBe(
      'Cruise Temperature (C)',
    );
    expect(decodeResult.formatted.items[2].value).toBe('-56 degrees');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.remaining.text).toBe(
      '276,134,,0,68,,,,P30,P0,33936,,1084,284',
    );
  });

  test('does not decode invalid message', () => {
    message.text = 'PER Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message).toBe(message);
  });
});
