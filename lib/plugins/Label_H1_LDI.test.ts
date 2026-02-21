import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label H1 LDI', () => {
  let plugin: Label_H1;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });

  test('decodes variant 2', () => {
    message.text =
      'LDI/RW27R,,,,,M160,1676,,,,202003,2,,,,P8,137147150,0,,M160,,146149150,P48,2,2.27L,,,,,M160,1676,,,,202003,2,,,,P8,137147150,0,,M160,,147150151,P52,2,2.35O,,,,,M160,1676,,,,202003,2,,,,P8,127133138,0,,,,,,3:KPHL,H1007,1036,1036,1036/CG225/SN69EAE8';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('KPHL');
    expect(decodeResult.raw.departure_runway).toBe('27R');
    expect(decodeResult.raw.center_of_gravity).toBe(22.5);
    expect(decodeResult.raw.checksum).toBe(0xeae8);
    expect(decodeResult.formatted.description).toBe(
      'Load Distribution Information',
    );
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.remaining.text).toBe(
      ',,,,M160,1676,,,,202003,2,,,,P8,137147150,0,,M160,,146149150,P48,2,2.27L,,,,,M160,1676,,,,202003,2,,,,P8,137147150,0,,M160,,147150151,P52,2,2.35O,,,,,M160,1676,,,,202003,2,,,,P8,127133138,0,,,,,,3,H1007,1036,1036,1036',
    );
  });

  test('decodes variant 1', () => {
    message.text =
      'LDI/RW16L,,,,,,1552,,P4,D7,164008,1,1,0,,P60,155159161:,,800,800,800/CG2356485';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_runway).toBe('16L');
    expect(decodeResult.raw.center_of_gravity).toBe(23.5);
    expect(decodeResult.raw.checksum).toBe(0x6485);
    expect(decodeResult.formatted.description).toBe(
      'Load Distribution Information',
    );
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.remaining.text).toBe(
      ',,,,,1552,,P4,D7,164008,1,1,0,,P60,155159161.,,800,800,800',
    );
  });

  test('decodes response', () => {
    message.text = 'RESLDI/AK,7151B9';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x51b9);
    expect(decodeResult.formatted.description).toBe(
      'Response for Load Distribution Information',
    );
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBe('AK,71');
  });

  test('decodes request', () => {
    message.text = '#MDREQLDI57CC';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.checksum).toBe(0x57cc);
    expect(decodeResult.formatted.description).toBe(
      'Request for Load Distribution Information',
    );
    expect(decodeResult.formatted.items.length).toBe(1);
  });
});
