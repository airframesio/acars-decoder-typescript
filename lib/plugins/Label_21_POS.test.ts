import { MessageDecoder } from '../MessageDecoder';
import { Label_21_POS } from './Label_21_POS';

describe('Label_21_POS', () => {
    let plugin: Label_21_POS;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_21_POS(decoder);
    });

    test('matches Label 21 Preamble POS qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-21-pos');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
          labels: ['21'],
          preambles: ['POS'],
        });
      });
    

    test('decodes Label 21 Preamble POS valid', () => {
        const text = 'POSN 39.841W 75.790, 220,184218,17222,22051,  34,- 4,204748,KTPA'
        const decodeResult = plugin.decode({ text: text });
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(4);
        expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
        expect(decodeResult.formatted.items[0].code).toBe('POS');
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('39.840 N, 75.790 W');
        expect(decodeResult.formatted.items[1].type).toBe('altitude');
        expect(decodeResult.formatted.items[1].code).toBe('ALT');
        expect(decodeResult.formatted.items[1].label).toBe('Altitude');
        expect(decodeResult.formatted.items[1].value).toBe('17222 feet');
        expect(decodeResult.formatted.items[2].type).toBe('outside_air_temperature');
        expect(decodeResult.formatted.items[2].code).toBe('OATEMP');
        expect(decodeResult.formatted.items[2].label).toBe('Outside Air Temperature (C)');
        expect(decodeResult.formatted.items[2].value).toBe('4');
        expect(decodeResult.formatted.items[3].type).toBe('destination');
        expect(decodeResult.formatted.items[3].code).toBe('DST');
        expect(decodeResult.formatted.items[3].label).toBe('Destination');
        expect(decodeResult.formatted.items[3].value).toBe('KTPA');
        expect(decodeResult.raw.remaining).toBe(' 220,184218,22051,  34,204748');
    });

    test('decodes Label 21 Preamble POS <invalid>', () => {
      
        const text = 'POS Bogus message';
        const decodeResult = plugin.decode({ text: text });
        console.log(JSON.stringify(decodeResult, null, 2));
      
        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-21-pos');
        expect(decodeResult.formatted.description).toBe('Position Report');
        expect(decodeResult.message.text).toBe(text);
      });
});