import { MessageDecoder } from '../MessageDecoder';
import { Label_15 } from './Label_15';

describe('Label_15', () => {
    let plugin: Label_15;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_15(decoder);
    });

    test('matches Label 15s qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-15');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
            labels: ['15'],
            preambles: ['(2'],
        });
    });

    test('decodes variant 1', () => {
        const text = '(2N39413W 73354--- 66349-43(Z'
        const decodeResult = plugin.decode({ text: text });
        
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(2);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('39.688 N, 73.590 W');
        expect(decodeResult.formatted.items[1].label).toBe('Altitude');
        expect(decodeResult.formatted.items[1].value).toBe('34900 feet');
        expect(decodeResult.remaining.text).toBe('--- 66-43');
    });

    test('decodes variant 2', () => {
        const text = '(2N40492W 77179248 99380-53(Z'
        const decodeResult = plugin.decode({ text: text });
        
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(2);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('40.820 N, 77.298 W');
        expect(decodeResult.formatted.items[1].label).toBe('Altitude');
        expect(decodeResult.formatted.items[1].value).toBe('38000 feet');
        expect(decodeResult.remaining.text).toBe('248 99-53');
    });

    test('does not decode Label 15 <invalid>', () => {

        const text = '(2 Bogus message';
        const decodeResult = plugin.decode({ text: text });

        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-15');
        expect(decodeResult.formatted.description).toBe('Position Report');
        expect(decodeResult.message.text).toBe(text);
    });
});