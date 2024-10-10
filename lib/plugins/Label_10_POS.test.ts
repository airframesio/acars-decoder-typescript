import { MessageDecoder } from '../MessageDecoder';
import { Label_10_POS } from './Label_10_POS';

describe('Label_10_POS', () => {
    let plugin: Label_10_POS;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_10_POS(decoder);
    });

    test('matches Label 10 Preamble pos qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-10-pos');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
          labels: ['10'],
          preambles: ['POS'],
        });
      });

      test('decodes Label 10 Preamble POS variant 1', () => {
        const text = 'POS082150, N 3885,W 7841,---,308,26922,  51,22290, 529,  19,-225,6'
        const decodeResult = plugin.decode({ text: text });

        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(2);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('38.850 N, 78.410 W');
        expect(decodeResult.formatted.items[1].label).toBe('Altitude');
        expect(decodeResult.formatted.items[1].value).toBe('22290 feet');
        expect(decodeResult.remaining.text).toBe('POS082150,---,308,26922,  51, 529,  19,-225,6');
    });

    test('decodes Label 10 Preamble POS <invalid>', () => {
      
        const text = 'POS Bogus Message';
        const decodeResult = plugin.decode({ text: text });
      
        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-10-pos');
        expect(decodeResult.formatted.description).toBe('Position Report');
        expect(decodeResult.message.text).toBe(text);
      });
});