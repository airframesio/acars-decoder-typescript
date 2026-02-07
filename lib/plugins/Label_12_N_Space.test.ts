import { MessageDecoder } from '../MessageDecoder';
import { Label_12_N_Space } from './Label_12_N_Space';

describe('Label_12_N_Space', () => {
  let plugin: Label_12_N_Space;
  const message = { label: '12', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_12_N_Space(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-12-n-space');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['12'],
      preambles: ['N ', 'S '],
    });
  });

  test('decodes variant 1', () => {
    message.text = 'N 42.150,W121.187,39000,161859, 109,.C-GWSO,1742';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-12-n-space');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.position.latitude).toBe(42.15);
    expect(decodeResult.raw.position.longitude).toBe(-121.187);
    expect(decodeResult.raw.altitude).toBe(39000);
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('42.150 N, 121.187 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('39000 feet');
  });

  test('decodes variant 2', () => {
    message.text = 'N 28.371,W 80.458,38000,170546, 100,.C-GVWJ,1736';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-12-n-space');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.position.latitude).toBe(28.371);
    expect(decodeResult.raw.position.longitude).toBe(-80.458);
    expect(decodeResult.raw.altitude).toBe(38000);
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('28.371 N, 80.458 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('38000 feet');
  });

  test('does not decode <invalid>', () => {
    message.text = 'N Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-12-n-space');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
  });
});
