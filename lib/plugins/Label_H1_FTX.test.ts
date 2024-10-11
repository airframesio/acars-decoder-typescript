import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_FTX } from './Label_H1_FTX';

describe('Label_H1_FTX', () => {
    let plugin: Label_H1_FTX;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_H1_FTX(decoder);
    });

    test('matches Label H1 Preamble FTX qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-h1-ftx');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
          labels: ['H1'],
          preambles: ['FTX', '- #MDFTX'],
        });
      });


      test('decodes Label H1 Preamble FTX valid', () => {
        // https://app.airframes.io/messages/3402014738
        const text = 'FTX/ID23544S,HIFI21,7VZ007B1S276/MR2,/FXFYI .. TAF KSUX 021720Z 0218 0318 20017G28KT P6SM SKC FM022200 22012G18KT P6SM SKC .. PUTS YOUR CXWIND AT 26KT ON RWY 13 .. REDUCES TO 18KT AT 22Z4FEF'
        const decodeResult = plugin.decode({ text: text });
        
        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.raw.flight_number).toBe('HIFI21');
        expect(decodeResult.raw.mission_number).toBe('7VZ007B1S276');
        expect(decodeResult.formatted.items.length).toBe(3);
        expect(decodeResult.formatted.items[0].label).toBe('Tail');
        expect(decodeResult.formatted.items[0].value).toBe('23544S');
        expect(decodeResult.formatted.items[1].label).toBe('Free Text');
        expect(decodeResult.formatted.items[1].value).toBe('FYI .. TAF KSUX 021720Z 0218 0318 20017G28KT P6SM SKC FM022200 22012G18KT P6SM SKC .. PUTS YOUR CXWIND AT 26KT ON RWY 13 .. REDUCES TO 18KT AT 22Z');
        expect(decodeResult.formatted.items[2].label).toBe('Message Checksum');
        expect(decodeResult.formatted.items[2].value).toBe('0x4fef');
        expect(decodeResult.remaining.text).toBe('/MR2,');
    });

    test('decodes Label H1 Preamble - #MDFTX valid', () => {
      // https://app.airframes.io/messages/3400555283
      const text = '- #MDFTX/ID77170A,RCH836,ABZ01G6XH273/MR2,/FXIRAN IS LAUNCHING MISSILES TOWARDS ISRAEL. YOUR FLIGHT PATH IS CURRENTLY NORTH OF PROJECTED MISSILE TRACKS. EXERCIZE EXTREME CAUTION.4A99'
      const decodeResult = plugin.decode({ text: text });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.flight_number).toBe('RCH836');
      expect(decodeResult.raw.mission_number).toBe('ABZ01G6XH273');
      expect(decodeResult.formatted.items.length).toBe(3);
      expect(decodeResult.formatted.items[0].label).toBe('Tail');
      expect(decodeResult.formatted.items[0].value).toBe('77170A');
      expect(decodeResult.formatted.items[1].label).toBe('Free Text');
      expect(decodeResult.formatted.items[1].value).toBe('IRAN IS LAUNCHING MISSILES TOWARDS ISRAEL. YOUR FLIGHT PATH IS CURRENTLY NORTH OF PROJECTED MISSILE TRACKS. EXERCIZE EXTREME CAUTION.');
      expect(decodeResult.formatted.items[2].label).toBe('Message Checksum');
      expect(decodeResult.formatted.items[2].value).toBe('0x4a99');
      expect(decodeResult.remaining.text).toBe('- #MDF/MR2,'); // FIXME - should be `- #MD/`
  });

    test('decodes Label H1 Preamble POS <invalid>', () => {

        const text = 'FTX Bogus message';
        const decodeResult = plugin.decode({ text: text });

        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-h1-ftx');
        expect(decodeResult.formatted.description).toBe('Free Text');
        expect(decodeResult.message.text).toBe(text);
      });
});