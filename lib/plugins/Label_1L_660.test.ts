import { MessageDecoder } from '../MessageDecoder';
import { Label_1L_660 } from './Label_1L_660';

describe('Label_1L 660', () => {
    let plugin: Label_1L_660;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_1L_660(decoder);
    });

    test('matches qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-1l-660');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
          labels: ['1L'],
          preambles: ['000000660'],
        });
      });

      test('decodes  variant 1', () => {
        // https://app.airframes.io/messages/3492135103
        const text = '000000660N50442E005566,100444359SOG-06 ,,--- 21-,83617441'
        const decodeResult = plugin.decode({ text: text });

        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.raw.position.latitude).toBe(50.736666666666665);
        expect(decodeResult.raw.position.longitude).toBe(5.943333333333333);
        expect(decodeResult.raw.time_of_day).toBe(36284);
        expect(decodeResult.raw.altitude).toBe(35900);
        expect(decodeResult.formatted.items.length).toBe(4);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('50.737 N, 5.943 E');
        expect(decodeResult.formatted.items[1].label).toBe('Message Timestamp');
        expect(decodeResult.formatted.items[1].value).toBe('10:04:44');
        expect(decodeResult.formatted.items[2].label).toBe('Altitude');
        expect(decodeResult.formatted.items[2].value).toBe('35900 feet');
        expect(decodeResult.formatted.items[3].label).toBe('Aircraft Route');
        expect(decodeResult.formatted.items[3].value).toBe('SOG-06');
        expect(decodeResult.remaining.text).toBe(',--- 21-,83617441');
    });

    test('does not decode <invalid>', () => {
      
        const text = 'POS Bogus Message';
        const decodeResult = plugin.decode({ text: text });
      
        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-1l-660');
        expect(decodeResult.formatted.description).toBe('Position Report');
        expect(decodeResult.message.text).toBe(text);
      });
});