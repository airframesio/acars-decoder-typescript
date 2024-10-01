import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_PWI } from './Label_H1_PWI';

describe('Label_H1_PWI', () => {
    let plugin: Label_H1_PWI;

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_H1_PWI(decoder);
    });

    test('matches Label H1 Preamble PWI qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-h1-pwi');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
          labels: ['H1'],
          preambles: ['PWI'],
        });
      });
    

    test('decodes Label H1 Preamble PWI valid', () => {
        const text = 'PWI/WD390,COLZI,258070.AWYAT,252071.IPTAY,250065.CHOPZ,244069.MGMRY,234065.CATLN,230060/WD340,COLZI,256073,340M41.AWYAT,252070,340M41.IPTAY,244059,340M41.CHOPZ,240059,340M41.MGMRY,232056,340M41.CATLN,218053,340M40/WD300,COLZI,256065.AWYAT,254062.IPTAY,250051.CHOPZ,248050.MGMRY,232044.CATLN,222047/WD240,COLZI,260045.AWYAT,258048.IPTAY,254043.CHOPZ,256041.MGMRY,238035.CATLN,226034/DD300214059.240214040.180236024.100250018:,,,,/CB300246040.240246017.180226015.1002100080338'
        const decodeResult = plugin.decode({ text: text });

        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(25);
        expect(decodeResult.formatted.items[0].type).toBe('wind_data');
        expect(decodeResult.formatted.items[0].code).toBe('WIND');
        expect(decodeResult.formatted.items[0].label).toBe('Wind Data');
        expect(decodeResult.formatted.items[0].value).toBe('COLZI at FL390: 258° at 70kt');
        expect(decodeResult.formatted.items[1].type).toBe('wind_data');
        expect(decodeResult.formatted.items[1].code).toBe('WIND');
        expect(decodeResult.formatted.items[1].label).toBe('Wind Data');
        expect(decodeResult.formatted.items[1].value).toBe('AWYAT at FL390: 252° at 71kt');
        expect(decodeResult.formatted.items[24].label).toBe('Checksum');
        expect(decodeResult.formatted.items[24].value).toBe('0x0338');
    });

    test('decodes Label H1 Preamble POS <invalid>', () => {
      
        const text = 'PWI Bogus message';
        const decodeResult = plugin.decode({ text: text });
      
        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-h1-pwi');
        expect(decodeResult.formatted.description).toBe('Weather Report');
        expect(decodeResult.message.text).toBe(text);
      });
});