import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label H1 Preamble RES', () => {
  let plugin: Arinc702;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes PWI', () => {
    message.text = 'RESPWI/AC,5B/TS140956,070226/DI140953,140956,140956128C';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x128c);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBe('AC,5B/DI140953,140956,140956');
  });

  test('decodes POS', () => {
    message.text = 'RESPOS/AK,0711909';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x1909);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBe('AK,071');
  });
});
