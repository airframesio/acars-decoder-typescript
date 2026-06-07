import { MessageDecoder } from '../MessageDecoder';
import { Label_ColonComma } from './Label_ColonComma';

describe('Label :;', () => {
  let plugin: Label_ColonComma;
  const message = { label: ':;', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_ColonComma(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-colon-comma');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({ labels: [':;'] });
  });

  test('decodes a frequency change in kHz to MHz', () => {
    // 131550 kHz -> 131.55 MHz
    message.text = '131550';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe(
      'Aircraft Transceiver Frequency Change',
    );
    expect(result.raw.frequency).toBe(131.55);
    expect(result.formatted.items).toHaveLength(1);
    expect(result.formatted.items[0]).toEqual({
      type: 'frequency',
      label: 'Frequency',
      value: '131.55 MHz',
      code: 'FREQ',
    });
  });

  test('end-to-end via MessageDecoder routes by label', () => {
    const decoder = new MessageDecoder();
    const result = decoder.decode({ label: ':;', text: '129125' });
    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-colon-comma');
    expect(result.raw.frequency).toBe(129.125);
  });
});
