import { MessageDecoder } from '../MessageDecoder';
import { Label_4N } from './Label_4N';


describe('Label 4N', () => {

  let plugin: Label_4N;
  const message = { label: '4N', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4N(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4n');
  });

  test('decodes Label 4N variant 1', () => {
    // https://globe.adsbexchange.com/?icao=A15027&showTrace=2024-09-23&timestamp=1727057017
    message.text = '22024N  MCI  JFK1\r\n0013  0072 N040586 W074421   230';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-4n');
    expect(decodeResult.formatted.description).toBe('Airline Defined');
    expect(decodeResult.raw.day).toBe('22');
    expect(decodeResult.remaining.text).toBe('02 0013  0072');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].code).toBe('ORG');
    expect(decodeResult.formatted.items[0].value).toBe('MCI');
    expect(decodeResult.formatted.items[1].code).toBe('DST');
    expect(decodeResult.formatted.items[1].value).toBe('JFK');
    expect(decodeResult.formatted.items[2].code).toBe('POS');
    expect(decodeResult.formatted.items[2].value).toBe('40.977 N, 74.702 W');
    expect(decodeResult.formatted.items[3].code).toBe('ALT');
    expect(decodeResult.formatted.items[3].value).toBe('23000 feet');
  });

  test('decodes variant 2B', () => {
    // https://app.airframes.io/messages/3421601874
    message.text = '285,B,69005074-507,10/12,+36.081,-094.810,35014,002.3,ELP,SDF,SDF,17R/,17L/,0,0,,,,,,0,0,0,0,1,,,,,247.0,014.2,261.2,421A';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-4n');
    expect(decodeResult.formatted.description).toBe('Airline Defined');
    expect(decodeResult.raw.date).toBe('10/12');
    expect(decodeResult.remaining.text).toBe('B,69005074-507,002.3,0,0,0,0,0,0,1,247.0,014.2,261.2');
    expect(decodeResult.formatted.items.length).toBe(8);
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].value).toBe('36.081 N, 94.810 W');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].value).toBe('35014 feet');
    expect(decodeResult.formatted.items[2].code).toBe('ORG');
    expect(decodeResult.formatted.items[2].value).toBe('ELP');
    expect(decodeResult.formatted.items[3].code).toBe('DST');
    expect(decodeResult.formatted.items[3].value).toBe('SDF');
    expect(decodeResult.formatted.items[4].code).toBe('ALT_DST');
    expect(decodeResult.formatted.items[4].value).toBe('SDF');
    expect(decodeResult.formatted.items[5].code).toBe('ARWY');
    expect(decodeResult.formatted.items[5].value).toBe('17R');
    expect(decodeResult.formatted.items[6].code).toBe('ALT_ARWY');
    expect(decodeResult.formatted.items[6].value).toBe('17L');
    expect(decodeResult.formatted.items[7].code).toBe('CHECKSUM');
    expect(decodeResult.formatted.items[7].value).toBe('0x421a');
  });

  test('decodes variant 2C', () => {
    // https://globe.adsbexchange.com/?icao=A3E08D&showTrace=2024-09-24&timestamp=1727181643
    message.text = '285,C,,09/24,,,,,EWR,PHL,PHL,09R/,/,0,0,,,,,,1,0,0,0,1,0,,0,0,198.5,014.5,213.0,9BCD';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-4n');
    expect(decodeResult.formatted.description).toBe('Airline Defined');
    expect(decodeResult.raw.date).toBe('09/24');
    expect(decodeResult.remaining.text).toBe('C,0,0,1,0,0,0,1,0,0,0,198.5,014.5,213.0');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].code).toBe('ORG');
    expect(decodeResult.formatted.items[0].value).toBe('EWR');
    expect(decodeResult.formatted.items[1].code).toBe('DST');
    expect(decodeResult.formatted.items[1].value).toBe('PHL');
    expect(decodeResult.formatted.items[2].code).toBe('ALT_DST');
    expect(decodeResult.formatted.items[2].value).toBe('PHL');
    expect(decodeResult.formatted.items[3].code).toBe('ARWY');
    expect(decodeResult.formatted.items[3].value).toBe('09R');
    expect(decodeResult.formatted.items[4].code).toBe('CHECKSUM');
    expect(decodeResult.formatted.items[4].value).toBe('0x9bcd');
  });

  test('does not decode <invalid>', () => {
    message.text = '4N Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-4n');
    expect(decodeResult.formatted.description).toBe('Airline Defined');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});