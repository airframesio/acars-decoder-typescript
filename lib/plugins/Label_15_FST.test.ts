import { MessageDecoder } from '../MessageDecoder';
import { Label_15_FST } from './Label_15_FST';

describe('Label_15_FST', () => {
    let plugin: Label_15_FST;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_15_FST(decoder);
    });

    test('matches Label 15 Preamble FST qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-15-fst');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
          labels: ['15'],
          preambles: ['FST01'],
        });
      });
    

      test('decodes Label 15 Preamble FST valid', () => {
        const text = 'FST01EGKKKMCON373488W0756927380 156 495 M53C 4427422721045313002518521710'
        const decodeResult = plugin.decode({ text: text });

        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(3);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('37.349 N, 75.692 W');
        expect(decodeResult.formatted.items[1].label).toBe('Origin');
        expect(decodeResult.formatted.items[1].value).toBe('EGKK');
        expect(decodeResult.formatted.items[2].label).toBe('Destination');
        expect(decodeResult.formatted.items[2].value).toBe('KMCO');
        expect(decodeResult.remaining.text).toBe('7380 156 495 M53C 4427422721045313002518521710');
    });

    test('decodes Label 15 Preamble FST <invalid>', () => {
      
        const text = 'INI Bogus message';
        const decodeResult = plugin.decode({ text: text });
      
        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-15-fst');
        expect(decodeResult.formatted.description).toBe('Position Report');
        expect(decodeResult.message.text).toBe(text);
      });
});