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

    test('decodes short variant missing ???', () => {
        const text = '(2N39413W 73354--- 66349-43(Z'
        const decodeResult = plugin.decode({ text: text });
        
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(3);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('39.688 N, 73.590 W');
        expect(decodeResult.formatted.items[1].label).toBe('Altitude');
        expect(decodeResult.formatted.items[1].value).toBe('34900 feet');
        expect(decodeResult.formatted.items[2].label).toBe('Outside Air Temperature (C)');
        expect(decodeResult.formatted.items[2].value).toBe('-43 degrees');
        expect(decodeResult.remaining.text).toBe('--- 66');
    });

    test('decodes short variant all fields', () => {
        const text = '(2N40492W 77179248 99380-53(Z'
        const decodeResult = plugin.decode({ text: text });
        
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(3);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('40.820 N, 77.298 W');
        expect(decodeResult.formatted.items[1].label).toBe('Altitude');
        expect(decodeResult.formatted.items[1].value).toBe('38000 feet');
        expect(decodeResult.formatted.items[2].label).toBe('Outside Air Temperature (C)');
        expect(decodeResult.formatted.items[2].value).toBe('-53 degrees');
        expect(decodeResult.remaining.text).toBe('248 99');
    });
    
    test('decodes short variant missing alt', () => {
        const text = '(2N39269W 77374--- 42---- 5(Z'
        const decodeResult = plugin.decode({ text: text });
        
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(2);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('39.448 N, 77.623 W');
        expect(decodeResult.formatted.items[1].label).toBe('Outside Air Temperature (C)');
        expect(decodeResult.formatted.items[1].value).toBe('-5 degrees');
        expect(decodeResult.remaining.text).toBe('--- 42');
    });
    
    test('decodes long variant', () => {
        const text = '(2N39018W 77284OFF11112418101313--------(Z'
        const decodeResult = plugin.decode({ text: text });
        
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(1);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('39.030 N, 77.473 W');
        expect(decodeResult.remaining.text).toBe('OFF11112418101313--------');
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