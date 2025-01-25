import { MessageDecoder } from '../MessageDecoder';
import { Label_58 } from './Label_58';

describe('Label_58', () => {
    let plugin: Label_58;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_58(decoder);
    });

    test('matches qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-58');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
            labels: ['58'],
        });
    });

    test('decodes variant 1', () => {
        const text = 'OG0704/06/230942/N39.214/W76.106/22683/N/'
        const decodeResult = plugin.decode({ text: text });
        
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.raw.flight_number).toBe('OG0704');
        expect(decodeResult.raw.day).toBe(6);
        expect(decodeResult.raw.time_of_day).toBe(83382);
        expect(decodeResult.raw.position.latitude).toBe(39.214);
        expect(decodeResult.raw.position.longitude).toBe(-76.106);
        expect(decodeResult.raw.altitude).toBe(22683);
        expect(decodeResult.formatted.items.length).toBe(5);
        expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
        expect(decodeResult.formatted.items[0].value).toBe('OG0704');
        expect(decodeResult.formatted.items[1].label).toBe('Day of Month');
        expect(decodeResult.formatted.items[1].value).toBe('6');
        expect(decodeResult.formatted.items[2].label).toBe('Message Timestamp');
        expect(decodeResult.formatted.items[2].value).toBe('23:09:42');
        expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[3].value).toBe('39.214 N, 76.106 W');
        expect(decodeResult.formatted.items[4].label).toBe('Altitude');
        expect(decodeResult.formatted.items[4].value).toBe('22683 feet');
        expect(decodeResult.remaining.text).toBe('N/');
    });

    test('does not decode <invalid>', () => {

        const text = 'Bogus/message';
        const decodeResult = plugin.decode({ text: text });

        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-58');
        expect(decodeResult.formatted.description).toBe('Position Report');
        expect(decodeResult.message.text).toBe(text);
    });
});