import { MessageDecoder } from '../MessageDecoder';
import { Label_16_POSA1 } from './Label_16_POSA1';

describe('Label 16 POSA1', () => {
  let plugin: Label_16_POSA1;
  const message = { label: '16', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_16_POSA1(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-16-posa1');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['16'],
      preambles: ['POSA1'],
    });
  });
  test('decodes variant 1', () => {
    message.text =
      'POSA1N37358W 77279,GEARS  ,221626,370,BBOBO  ,222053,,-61,139,1174,829';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-16-posa1');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('37.358 N, 77.279 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('37000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe(
      'GEARS@22:16:26 > BBOBO@22:20:53',
    );
    expect(decodeResult.remaining.text).toBe(',-61,139,1174,829');
  });

  test('decodes redacted', () => {
    message.text =
      'POSA1N38843W 78790,RONZZ  ,005159,390,RAMAY  ,010055,,*****,*****, 744,   0';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-16-posa1');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.843 N, 78.790 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('39000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[2].value).toBe(
      'RONZZ@00:51:59 > RAMAY@01:00:55',
    );
    expect(decodeResult.remaining.text).toBe(',*****,*****, 744,   0');
  });

  test('decodes Label 16 variant <invalid>', () => {
    message.text = 'N Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-16-posa1');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
  });
});
