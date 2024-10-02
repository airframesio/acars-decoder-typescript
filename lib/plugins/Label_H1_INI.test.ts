import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_INI } from './Label_H1_INI';

describe('Label_H1_INI', () => {
    let plugin: Label_H1_INI;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_H1_INI(decoder);
    });

    test('matches Label H1 Preamble INI qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-h1-ini');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
          labels: ['H1'],
          preambles: ['INI', '- #MDINI'],
        });
      });
    

      test('decodes Label H1 Preamble INI valid', () => {
        // https://app.airframes.io/messages/3401344857
        const text = 'INI/ID70045B,RCH2050,AJM363201271/MR2,000/AFKDOV,KBHM/TD271115,131545EE'
        const decodeResult = plugin.decode({ text: text });

        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.raw.flight_number).toBe('RCH2050');
        expect(decodeResult.formatted.items.length).toBe(4);
        expect(decodeResult.formatted.items[0].label).toBe('Tail');
        expect(decodeResult.formatted.items[0].value).toBe('70045B');
        expect(decodeResult.formatted.items[1].label).toBe('Origin');
        expect(decodeResult.formatted.items[1].value).toBe('KDOV');
        expect(decodeResult.formatted.items[2].label).toBe('Destination');
        expect(decodeResult.formatted.items[2].value).toBe('KBHM');
        expect(decodeResult.formatted.items[3].label).toBe('Message Checksum');
        expect(decodeResult.formatted.items[3].value).toBe('0x45ee');
        expect(decodeResult.remaining.text).toBe(',AJM363201271/MR2,000/TD271115,1315');
    });
    
    test('decodes Label H1 Preamble - #MDINI valid', () => {
      // https://app.airframes.io/messages/3400583424
      const text = '- #MDINI/ID99206A,RCH206,AAM7029H1275/MR0,0/AFKSUU,KBUR/TD011535,1535EE66'
      const decodeResult = plugin.decode({ text: text });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.flight_number).toBe('RCH206');
      expect(decodeResult.formatted.items.length).toBe(4);
      expect(decodeResult.formatted.items[0].label).toBe('Tail');
      expect(decodeResult.formatted.items[0].value).toBe('99206A');
      expect(decodeResult.formatted.items[1].label).toBe('Origin');
      expect(decodeResult.formatted.items[1].value).toBe('KSUU');
      expect(decodeResult.formatted.items[2].label).toBe('Destination');
      expect(decodeResult.formatted.items[2].value).toBe('KBUR');
      expect(decodeResult.formatted.items[3].label).toBe('Message Checksum');
      expect(decodeResult.formatted.items[3].value).toBe('0xee66');
      expect(decodeResult.remaining.text).toBe('- #MDI,AAM7029H1275/MR0,0/TD011535,1535'); // should start with-#MD, (no I)
  });

    test('decodes Label H1 Preamble POS <invalid>', () => {
      
        const text = 'INI Bogus message';
        const decodeResult = plugin.decode({ text: text });
      
        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-h1-ini');
        expect(decodeResult.formatted.description).toBe('??? Report');
        expect(decodeResult.message.text).toBe(text);
      });
});