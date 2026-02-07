import { MessageDecoder } from '../MessageDecoder';
import { Label_10_LDR } from './Label_10_LDR';

describe('Label_10_LDR', () => {
  let plugin: Label_10_LDR;
  const message = { label: '10', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_10_LDR(decoder);
  });

  test('matches Label 10 Preamble ldr qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-10-ldr');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['10'],
      preambles: ['LDR'],
    });
  });

  test('decodes Label 10 Preamble LDR variant 1', () => {
    message.text =
      'LDR01,189,C,SWA-2600-016,0,N 38.151,W 76.623,37003, 10.2,KATL,KLGA,KLGA,22/,/,/,0,0,,,,,,,0,0,0,00,,135.1,08.6,143.7,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.151 N, 76.623 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('37003 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('KATL');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('KLGA');
    expect(decodeResult.formatted.items[4].label).toBe('Alternate Destination');
    expect(decodeResult.formatted.items[4].value).toBe('KLGA');
    expect(decodeResult.formatted.items[5].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[5].value).toBe('22');
    expect(decodeResult.remaining.text).toBe(
      'LDR01,189,C,SWA-2600-016,0,0,0,,,,,,,0,0,0,00,,135.1,08.6,143.7,,,',
    );
  });

  test('decodes Label 10 Preamble LDR variant 2', () => {
    message.text =
      'LDR01,189,C,SWA-2600-016,0,N 37.873,W 79.541,30998, 16.6,KBNA,KBOS,KBOS,27/,33L/,22L/,0,1,,,,,,,0,0,0,00,,131.2,11.4,142.6,,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('37.873 N, 79.541 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('30998 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('KBNA');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('KBOS');
    expect(decodeResult.formatted.items[4].label).toBe('Alternate Destination');
    expect(decodeResult.formatted.items[4].value).toBe('KBOS');
    expect(decodeResult.formatted.items[5].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[5].value).toBe('27');
    expect(decodeResult.formatted.items[6].label).toBe('Alternate Runway');
    expect(decodeResult.formatted.items[6].value).toBe('33L,22L');
    expect(decodeResult.remaining.text).toBe(
      'LDR01,189,C,SWA-2600-016,0,0,1,,,,,,,0,0,0,00,,131.2,11.4,142.6,,,',
    );
  });

  test('decodes Label 10 Preamble LDR <invalid>', () => {
    message.text = 'LDR Bogus Message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-10-ldr');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
  });
});
