import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_Paren } from './Label_H1_Paren';

describe('Label H1 (messages)', () => {
  let plugin: Label_H1_Paren;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_Paren(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-paren');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1'],
      preambles: ['('],
    });
  });

  test('matches KLM', () => {
    message.text =
      '(POS-KLM296  -3911N07600W/234212 F250\r\nRMK/FUEL  37.0 M0.69)';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('KLM296');
    expect(decodeResult.raw.position.latitude).toBeCloseTo(39.183, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-76.0, 3);
    expect(decodeResult.raw.message_timestamp).toBe(85332);
    expect(decodeResult.raw.altitude).toBe(25000);
    expect(decodeResult.raw.fuel_on_board).toBe(37.0);
    expect(decodeResult.raw.mach).toBe(0.69);
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.remaining.text).toBe('RMK');
  });

  test('does not match if text does not start with (', () => {
    message.text = 'Invalid';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(false);
  });

  test('does not match if wrong format', () => {
    message.text = '(Invalid)';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(false);
  });
});
