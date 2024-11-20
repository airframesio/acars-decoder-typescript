import { MessageDecoder } from '../MessageDecoder';
import { Label_4T_ETA } from './Label_4T_ETA';

describe('Label 4T ETA', () => {

  let plugin: Label_4T_ETA;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4T_ETA(decoder);
  });

  
  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4t-eta');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['4T'],
      preambles: ['ETA'],
    });
  });

  
  test('decodes msg 1', () => {
    const text = 'ETA AC7221/13/14 YYZ 0902Z';

    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('ETA Report');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('AC7221');
    expect(decodeResult.formatted.items[1].label).toBe('Departure Day');
    expect(decodeResult.formatted.items[1].value).toBe('13');
    expect(decodeResult.formatted.items[2].label).toBe('Arrival Day');
    expect(decodeResult.formatted.items[2].value).toBe('14');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('YYZ');
    expect(decodeResult.formatted.items[4].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[4].value).toBe('09:02:00');
  });


  test('decodes <invalid>', () => {

    const text = 'ETA Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('ETA Report');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
