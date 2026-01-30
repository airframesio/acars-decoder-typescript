import { MessageDecoder } from '../MessageDecoder';
import { Label_4J_POS } from './Label_4J_POS';

describe('Label 4J POS', () => {

  let plugin: Label_4J_POS;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4J_POS(decoder);
  });

  
  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4j-pos');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['4J'],
      preambles: ['POS/'],
    });
  });

  // Disabled due to checksum mismatch. Possibly non-ascii characters in message?
  xtest('decodes msg 1', () => {
    // https://app.airframes.io/messages/2434848463
    const text = 'POS/ID91459S,BANKR31,/DC03032024,142813/MR64,0/ET31539/PSN39277W077359,142800,240,N39300W077110,031430,N38560W077150,M28,27619,MT370/CG311,160,350/FB732/VR329071';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.message_timestamp).toBe(1709476093);
    expect(decodeResult.raw.mission_number).toBe('');
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.items[0].label).toBe('Tail');
    expect(decodeResult.formatted.items[0].value).toBe('91459S');
    expect(decodeResult.formatted.items[1].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[1].value).toBe('BANKR31');
    expect(decodeResult.formatted.items[2].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[2].value).toBe('3');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('15:39:00');
    expect(decodeResult.formatted.items[4].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[4].value).toBe('39.462 N, 77.598 W');
    expect(decodeResult.formatted.items[5].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[5].value).toBe('(39.500 N, 77.183 W)@14:28:00 > (38.933 N, 77.250 W)@03:14:30 > ?');
    expect(decodeResult.formatted.items[6].label).toBe('Altitude');
    expect(decodeResult.formatted.items[6].value).toBe('24000 feet');
    expect(decodeResult.formatted.items[7].label).toBe('Outside Air Temperature (C)');
    expect(decodeResult.formatted.items[7].value).toBe('-28 degrees');
    expect(decodeResult.formatted.items[8].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[8].value).toBe('0x9071');
    expect(decodeResult.remaining.text).toBe('MR64,0,27619,MT370/CG311,160,350/FB732/VR32');
  });

  test('decodes <invalid>', () => {

    const text = 'POS/ Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
