import { MessageDecoder } from '../MessageDecoder';
import { Label_16_N_Space } from './Label_16_N_Space';

describe('Label_16_N_Space', () => {
  let plugin: Label_16_N_Space;
  const message = { label: '16', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_16_N_Space(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-16-n-space');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['16'],
      preambles: ['N ', 'S '],
    });
  });
  test('decodes variant 1', () => {
    message.text = 'N 44.203,W 86.546,31965,6, 290';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-16-n-space');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.position.latitude).toBe(44.203);
    expect(decodeResult.raw.position.longitude).toBe(-86.546);
    expect(decodeResult.raw.altitude).toBe(31965);
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('44.203 N, 86.546 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('31965 feet');
  });

  test('decodes variant 2', () => {
    message.text = 'N 28.177/W 96.055';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.decoder.name).toBe('label-16-n-space');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.position.latitude).toBe(28.177);
    expect(decodeResult.raw.position.longitude).toBe(-96.055);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('28.177 N, 96.055 W');
  });

  test('decodes Label 16 variant 3', () => {
    message.text = 'N 44.988,W121.644,35940,6, 170';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-16-n-space');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.position.latitude).toBe(44.988);
    expect(decodeResult.raw.position.longitude).toBe(-121.644);
    expect(decodeResult.raw.altitude).toBe(35940);
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
    expect(decodeResult.formatted.items[0].code).toBe('POS');
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('44.988 N, 121.644 W');
    expect(decodeResult.formatted.items[1].type).toBe('altitude');
    expect(decodeResult.formatted.items[1].code).toBe('ALT');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('35940 feet');
  });

  test('decodes Label 16 variant <invalid>', () => {
    message.text = 'N Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-16-n-space');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
  });
});
