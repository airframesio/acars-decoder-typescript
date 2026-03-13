import { decode } from 'node:punycode';
import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label 80 Preamble INR', () => {
  let plugin: Arinc702;
  const message = { label: '80', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes variant 1', () => {
    message.text =
      'INR/ID91511S,,/DC04032026,143534/MR19,/NR,,,,,,,,950,0/ET041505/FB983/VR32BF4C';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.tail).toBe('91511S');
    expect(decodeResult.raw.message_timestamp).toBe(1772634934);
    expect(decodeResult.raw.day).toBe(4);
    expect(decodeResult.raw.eta_time).toBe(54300);
    expect(decodeResult.raw.fuel_on_board).toBe(983);
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.raw.checksum).toBe(0xbf4c);
    expect(decodeResult.formatted.description).toBe('In-Range Report');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.remaining.text).toBe('MR19,/NR,,,,,,,,950,0');
  });
});
